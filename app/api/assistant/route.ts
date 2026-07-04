import { convertToModelMessages, streamText, UIMessage, tool } from 'ai'
import { z } from 'zod'
import { isFuguModel, fuguModel } from '@/lib/ai/fugu'
import { guardAIRequest } from '@/lib/ai/guard'
import type { SupabaseClient } from '@supabase/supabase-js'

export const maxDuration = 30

// Build the toolset bound to the current request's Supabase client + user.
// Everything queries real data — no mocks.
function buildTools(supabase: SupabaseClient, userId: string | null) {
  return {
    searchProducts: tool({
      description: 'Rechercher des produits réels sur le marketplace QuickGo',
      inputSchema: z.object({
        query: z.string().describe('Termes de recherche du produit'),
        category: z.string().nullable().describe('Filtre de catégorie optionnel'),
      }),
      execute: async ({ query, category }) => {
        let q = supabase
          .from('products')
          .select('id, name, price, images, category, vendor:vendors(name)')
          .eq('is_available', true)
          .ilike('name', `%${query}%`)
          .limit(6)

        if (category) q = q.eq('category', category)

        const { data, error } = await q
        if (error) return { error: "Impossible de rechercher les produits pour le moment." }
        if (!data || data.length === 0) {
          return { results: [], message: `Aucun produit trouvé pour « ${query} ».` }
        }

        return {
          results: data.map((p) => ({
            id: p.id,
            name: p.name,
            price: p.price,
            currency: 'FCFA',
            image: (p.images as string[] | null)?.[0] ?? null,
            vendor: (p.vendor as { name?: string } | null)?.name ?? 'Vendeur QuickGo',
            url: `/marketplace/product/${p.id}`,
          })),
        }
      },
    }),

    getDeliveryPrice: tool({
      description: "Obtenir les tarifs de livraison réels configurés par QuickGo",
      inputSchema: z.object({
        zone: z.string().nullable().describe('Zone ou quartier de livraison (optionnel)'),
      }),
      execute: async () => {
        const { data, error } = await supabase
          .from('delivery_rates')
          .select('name, amount, conditions')
          .eq('is_active', true)
          .order('priority', { ascending: true })
          .limit(10)

        if (error) return { error: "Impossible de récupérer les tarifs de livraison." }
        if (!data || data.length === 0) {
          return { message: "Aucun tarif de livraison n'est configuré pour le moment. Contactez le support." }
        }

        const rates = data.map((r) => ({
          name: r.name,
          price: r.amount,
          currency: 'FCFA',
          conditions: r.conditions ?? {},
        }))
        const cheapest = rates.reduce((min, r) => (r.price < min.price ? r : min), rates[0])

        return {
          rates,
          starting_from: cheapest.price,
          currency: 'FCFA',
          note: "Le tarif final dépend de la zone, du poids et du type de colis.",
        }
      },
    }),

    getOrderStatus: tool({
      description: "Obtenir le statut réel d'une commande de l'utilisateur connecté",
      inputSchema: z.object({
        orderId: z.string().nullable().describe("Identifiant ou numéro de commande (optionnel : sinon la dernière commande)"),
      }),
      execute: async ({ orderId }) => {
        if (!userId) {
          return { error: "Vous devez être connecté pour suivre une commande." }
        }

        let q = supabase
          .from('orders')
          .select('id, order_number, status, total_amount, estimated_delivery_time, created_at, vendor:vendors(name)')
          .eq('customer_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)

        if (orderId) {
          // Match either the UUID or the human order_number
          q = supabase
            .from('orders')
            .select('id, order_number, status, total_amount, estimated_delivery_time, created_at, vendor:vendors(name)')
            .eq('customer_id', userId)
            .or(`order_number.eq.${orderId},id.eq.${orderId}`)
            .limit(1)
        }

        const { data, error } = await q
        if (error) return { error: "Impossible de récupérer la commande." }
        const order = data?.[0]
        if (!order) {
          return { message: orderId ? `Aucune commande trouvée pour « ${orderId} ».` : "Vous n'avez pas encore de commande." }
        }

        const statusLabels: Record<string, string> = {
          pending: 'En attente de confirmation',
          confirmed: 'Confirmée',
          preparing: 'En préparation',
          ready: 'Prête',
          delivering: 'En cours de livraison',
          delivered: 'Livrée',
          cancelled: 'Annulée',
        }

        return {
          order_number: order.order_number,
          status: statusLabels[order.status] ?? order.status,
          total: order.total_amount,
          currency: 'FCFA',
          vendor: (order.vendor as { name?: string } | null)?.name ?? null,
          estimated_delivery: order.estimated_delivery_time ?? null,
          url: `/tracking?order=${order.id}`,
        }
      },
    }),

    contactSupport: tool({
      description: "Obtenir les informations de contact du support QuickGo",
      inputSchema: z.object({
        topic: z.string().describe('Sujet de la demande de support'),
      }),
      execute: async ({ topic }) => ({
        topic,
        whatsapp: '+237 690 773 615',
        email: 'support@quickgo.cm',
        phone: '+237 6 95 55 55 55',
        hours: '24/7',
        message: `Pour toute question concernant « ${topic} », notre équipe est disponible 24/7.`,
      }),
    }),
  }
}

export async function POST(req: Request) {
  const { messages, model = 'openai/gpt-4o-mini' }: { messages: UIMessage[], model?: string } = await req.json()

  const guard = await guardAIRequest(model)
  if (!guard.ok) return guard.response

  const resolvedModel = isFuguModel(model) ? fuguModel(model) : model

  const { supabase, user } = guard
  const tools = buildTools(supabase, user.id)

  const result = streamText({
    model: resolvedModel,
    system: `Tu es QuickGo Assistant, l'assistant virtuel intelligent de QuickGo, la super application de livraison au Cameroun.

Tu peux aider les utilisateurs avec:
- Rechercher des produits réels sur le marketplace (outil searchProducts)
- Communiquer les tarifs de livraison configurés (outil getDeliveryPrice)
- Suivre leurs commandes (outil getOrderStatus — nécessite d'être connecté)
- Repondre aux questions sur les services QuickGo
- Mettre en contact avec le support (outil contactSupport)

Utilise TOUJOURS les outils pour obtenir des informations réelles — n'invente jamais de produits, de prix ou de statuts de commande.
Si un outil ne renvoie aucun résultat, dis-le honnêtement et propose une alternative.

Tu es amical, professionnel et tu reponds toujours en francais.
Tu utilises le franc CFA (FCFA) comme devise.
Tu connais bien les villes du Cameroun: Yaounde, Douala, Bafoussam, etc.

Si tu ne peux pas aider directement, dirige vers le support WhatsApp: +237 690 773 615`,
    messages: await convertToModelMessages(messages),
    tools,
    abortSignal: req.signal,
  })

  return result.toUIMessageStreamResponse()
}
