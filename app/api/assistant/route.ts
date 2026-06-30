import { convertToModelMessages, streamText, UIMessage, tool } from 'ai'
import { z } from 'zod'
import { isFuguModel, fuguModel } from '@/lib/ai/fugu'

export const maxDuration = 30

// Tools for the assistant
const quickGoTools = {
  searchProducts: tool({
    description: 'Search for products on QuickGo marketplace',
    inputSchema: z.object({ 
      query: z.string().describe('Search query for products'),
      category: z.string().nullable().describe('Optional category filter')
    }),
    execute: async ({ query }) => {
      // Return mock data for demo (real implementation would use Supabase)
      return [
        { id: '1', name: `${query} - Produit populaire`, price: 5000, vendor: 'QuickGo Market' },
        { id: '2', name: `${query} premium`, price: 12000, vendor: 'Super Marche' },
        { id: '3', name: `${query} eco`, price: 3500, vendor: 'Boutique Locale' },
      ]
    }
  }),
  
  getDeliveryPrice: tool({
    description: 'Calculate delivery price between two locations',
    inputSchema: z.object({
      pickupLocation: z.string().describe('Pickup address'),
      deliveryLocation: z.string().describe('Delivery address'),
      vehicleType: z.enum(['moto', 'voiture', 'camionnette', 'camion']).describe('Type of vehicle')
    }),
    execute: async ({ pickupLocation, deliveryLocation, vehicleType }) => {
      // Simulate distance calculation and pricing
      const basePrices: Record<string, number> = {
        moto: 1000,
        voiture: 2000,
        camionnette: 3500,
        camion: 7000
      }
      
      const basePrice = basePrices[vehicleType] || 1500
      const estimatedDistance = Math.random() * 15 + 2 // 2-17 km
      const pricePerKm = vehicleType === 'moto' ? 100 : vehicleType === 'voiture' ? 150 : 200
      
      return {
        pickup: pickupLocation,
        delivery: deliveryLocation,
        vehicle: vehicleType,
        distance: `${estimatedDistance.toFixed(1)} km`,
        price: Math.round(basePrice + (estimatedDistance * pricePerKm)),
        currency: 'FCFA',
        estimatedTime: `${Math.round(estimatedDistance * 3 + 10)} min`
      }
    }
  }),
  
  getOrderStatus: tool({
    description: 'Get the status of an order by order ID',
    inputSchema: z.object({
      orderId: z.string().describe('Order ID to check')
    }),
    execute: async ({ orderId }) => {
      // Return mock data for demo
      return {
        id: orderId,
        status: 'En cours de livraison',
        total: 15000,
        estimatedDelivery: '30-45 min',
        driver: 'Jean M.'
      }
    }
  }),
  
  contactSupport: tool({
    description: 'Get support contact information',
    inputSchema: z.object({
      topic: z.string().describe('Topic of the support request')
    }),
    execute: async ({ topic }) => {
      return {
        topic,
        whatsapp: '+237 690 773 615',
        email: 'support@quickgo.cm',
        phone: '+237 6 95 55 55 55',
        hours: '24/7',
        message: `Pour toute question concernant "${topic}", notre equipe est disponible 24/7.`
      }
    }
  })
}

export async function POST(req: Request) {
  const { messages, model = 'openai/gpt-4o-mini' }: { messages: UIMessage[], model?: string } = await req.json()

  const resolvedModel = isFuguModel(model) ? fuguModel(model) : model

  const result = streamText({
    model: resolvedModel,
    system: `Tu es QuickGo Assistant, l'assistant virtuel intelligent de QuickGo, la super application de livraison au Cameroun.

Tu peux aider les utilisateurs avec:
- Rechercher des produits sur le marketplace
- Calculer les prix de livraison
- Suivre leurs commandes
- Repondre aux questions sur les services QuickGo
- Mettre en contact avec le support

Tu es amical, professionnel et tu reponds toujours en francais.
Tu utilises le franc CFA (FCFA) comme devise.
Tu connais bien les villes du Cameroun: Yaounde, Douala, Bafoussam, etc.

Si tu ne peux pas aider directement, dirige vers le support WhatsApp: +237 690 773 615`,
    messages: await convertToModelMessages(messages),
    tools: quickGoTools,
    abortSignal: req.signal,
  })

  return result.toUIMessageStreamResponse()
}
