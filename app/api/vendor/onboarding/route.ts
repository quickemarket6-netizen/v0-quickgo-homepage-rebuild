import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

// "Caté Gorie" -> "cate-gorie" (voir app/api/admin/categories/route.ts)
function slugify(input: string) {
  return input
    .normalize("NFD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

// POST /api/vendor/onboarding — create vendor account from wizard form
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  // Client service role (bypasse RLS) pour les écritures vendeur : la création
  // d'une boutique déclenche un trigger DB (on_vendor_created_wallet) qui insère
  // dans vendor_wallets — table sans policy INSERT côté vendeur. Sous le rôle
  // "authenticated" ce trigger échoue ("new row violates row-level security
  // policy for table vendor_wallets"). Le rôle service_role a bypassrls, donc
  // le trigger passe. On garde `supabase` (session utilisateur) pour lire
  // l'identité, et on écrit via `db`.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "Stockage non configuré" }, { status: 500 })
  }
  const db = createServiceClient(supabaseUrl, serviceKey)

  const body = await req.json() as {
    firstName: string
    lastName: string
    email?: string
    phone: string
    businessName: string
    businessType?: string
    category?: string
    description?: string
    address: string
    city?: string
    taxId?: string
    paymentMethod: string
    mobileNumber?: string
    bankName?: string
    accountNumber?: string
    logoUrl?: string
    idCardUrl?: string
    businessLicenseUrl?: string
  }

  const {
    firstName, lastName, phone,
    businessName, category, description, address, city,
    taxId,
    paymentMethod, mobileNumber, bankName, accountNumber,
    logoUrl, idCardUrl, businessLicenseUrl,
  } = body

  // Update user profile
  await db
    .from("profiles")
    .update({ full_name: `${firstName} ${lastName}`.trim(), phone, role: "vendor" })
    .eq("id", user.id)

  // Un utilisateur ne possède qu'une seule boutique. On vérifie l'existence
  // explicitement (plutôt qu'un upsert+onConflict) : ça évite de dépendre
  // d'une contrainte UNIQUE sur vendors.user_id dont on ne peut pas garantir
  // la présence.
  const { data: existing } = await db
    .from("vendors")
    .select("id, slug")
    .eq("user_id", user.id)
    .maybeSingle()

  // category_id (UUID) est une FK vers `categories` — le formulaire envoie un
  // libellé libre ("Electronique", "Mode"…), donc correspondance approchée
  // par nom. Si rien ne correspond, category_id reste null plutôt que de
  // deviner.
  let categoryId: string | null = null
  if (category) {
    const { data: cat } = await db
      .from("categories")
      .select("id")
      .ilike("name", `%${category}%`)
      .limit(1)
      .maybeSingle()
    categoryId = cat?.id ?? null
  }

  const baseSlug = existing?.slug ?? (slugify(businessName) || "boutique")
  const vendorPayload = {
    user_id:     user.id,
    name:        businessName,
    description: description ?? null,
    category_id: categoryId,
    address:     address ?? null,
    city:        city ?? "yaounde",
    phone:       phone ?? null,
    email:       body.email ?? user.email,
    logo_url:    logoUrl ?? null,
  }

  let vendor: { id: string } | null = null
  let vErr: { message: string; code?: string } | null = null

  if (existing) {
    // Resoumission (ex. après une erreur) : on met à jour les infos, sans
    // toucher status/is_verified — sinon un vendeur déjà approuvé qui
    // repasse par ce formulaire se ferait repasser "inactive" par erreur.
    const res = await db
      .from("vendors")
      .update(vendorPayload)
      .eq("id", existing.id)
      .select("id")
      .single()
    vendor = res.data
    vErr = res.error
  } else {
    // vendors_status_check n'autorise que active/inactive/suspended (pas de
    // "pending") : une nouvelle boutique démarre "inactive" + non vérifiée.
    // L'admin (app/admin/vendors) l'approuve (active/is_verified=true) ou
    // la rejette (suspended).
    const newVendorPayload = { ...vendorPayload, status: "inactive", is_verified: false }
    // slug UNIQUE : en cas de collision (deux boutiques au même nom), on
    // retente une fois avec un court suffixe aléatoire.
    for (const slug of [baseSlug, `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`]) {
      const res = await db
        .from("vendors")
        .insert({ ...newVendorPayload, slug })
        .select("id")
        .single()
      vendor = res.data
      vErr = res.error
      if (!vErr || vErr.code !== "23505") break
    }
  }

  if (vErr) return NextResponse.json({ error: vErr.message }, { status: 500 })

  // Documents KYC + numéro fiscal : pas de colonnes dédiées sur `vendors`,
  // tout part dans les métadonnées utilisateur.
  if (taxId || idCardUrl || businessLicenseUrl) {
    await supabase.auth.updateUser({
      data: {
        vendor_documents: {
          tax_id: taxId ?? null,
          id_card: idCardUrl ?? null,
          business_license: businessLicenseUrl ?? null,
          submitted_at: new Date().toISOString(),
        },
      },
    })
  }

  // Compte de retrait — best effort : une nouvelle boutique n'a encore aucun
  // compte enregistré, donc un simple insert (pas d'upsert nécessaire). Ne
  // bloque jamais la création de la boutique si ça échoue.
  //
  // payout_method a une contrainte CHECK (orange_money | mtn_momo |
  // bank_transfer) : le formulaire envoie "mobile_money" (générique, sans
  // distinguer Orange/MTN) ou "bank". On mappe vers une valeur valide —
  // faute de précision Orange/MTN, on retient orange_money par défaut pour le
  // Mobile Money (le vendeur pourra corriger dans ses réglages boutique).
  if (vendor && paymentMethod) {
    const payoutMethod =
      paymentMethod === "bank" ? "bank_transfer"
      : paymentMethod === "mobile_money" ? "orange_money"
      : paymentMethod
    await db
      .from("vendor_payout_accounts")
      .insert({
        vendor_id:     vendor.id,
        payout_method: payoutMethod,
        phone_number:  paymentMethod === "mobile_money" ? mobileNumber : (accountNumber ?? bankName ?? ""),
        account_name:  `${firstName} ${lastName}`.trim(),
        is_default:    true,
      })
  }

  return NextResponse.json({ success: true, vendor_id: vendor?.id ?? null })
}
