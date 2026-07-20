import { createClient } from "@/lib/supabase/server"
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
  await supabase
    .from("profiles")
    .update({ full_name: `${firstName} ${lastName}`.trim(), phone, role: "vendor" })
    .eq("id", user.id)

  // Un utilisateur ne possède qu'une seule boutique (contrainte owner_id
  // UNIQUE) : si une ligne existe déjà pour cet owner_id, on met à jour son
  // slug existant plutôt que d'en générer un nouveau à chaque soumission.
  const { data: existing } = await supabase
    .from("vendors")
    .select("slug")
    .eq("owner_id", user.id)
    .maybeSingle()

  const baseSlug = existing?.slug ?? (slugify(businessName) || "boutique")
  const vendorPayload = {
    owner_id:    user.id,
    name:        businessName,
    description: description ?? null,
    category:    category ?? null,
    address:     address ?? null,
    city:        city ?? "yaounde",
    phone:       phone ?? null,
    email:       body.email ?? user.email,
    tax_id:      taxId ?? null,
    logo_url:    logoUrl ?? null,
    status:      "pending",
  }

  let vendor: { id: string } | null = null
  let vErr: { message: string; code?: string } | null = null

  // slug UNIQUE : en cas de collision (deux boutiques au même nom), on
  // retente une fois avec un court suffixe aléatoire.
  for (const slug of [baseSlug, `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`]) {
    const res = await supabase
      .from("vendors")
      .upsert({ ...vendorPayload, slug }, { onConflict: "owner_id" })
      .select("id")
      .single()
    vendor = res.data
    vErr = res.error
    if (!vErr || vErr.code !== "23505") break
  }

  if (vErr) return NextResponse.json({ error: vErr.message }, { status: 500 })

  // KYC document URLs go to user metadata (no dedicated columns on vendors)
  if (idCardUrl || businessLicenseUrl) {
    await supabase.auth.updateUser({
      data: {
        vendor_documents: {
          id_card: idCardUrl ?? null,
          business_license: businessLicenseUrl ?? null,
          submitted_at: new Date().toISOString(),
        },
      },
    })
  }

  // Compte de retrait — best effort : une nouvelle boutique n'a encore aucun
  // compte enregistré, donc un simple insert (pas d'upsert nécessaire). Ne
  // bloque jamais la création de la boutique si ça échoue (ex. le
  // sélecteur générique "Mobile Money" du formulaire ne précise pas
  // Orange/MTN, requis par la contrainte CHECK de payout_method — à
  // affiner côté formulaire si les retraits doivent être fiabilisés).
  if (vendor && paymentMethod) {
    await supabase
      .from("vendor_payout_accounts")
      .insert({
        vendor_id:     vendor.id,
        payout_method: paymentMethod === "bank" ? "bank_transfer" : paymentMethod,
        phone_number:  paymentMethod === "mobile_money" ? mobileNumber : (accountNumber ?? bankName ?? ""),
        account_name:  `${firstName} ${lastName}`.trim(),
        is_default:    true,
      })
  }

  return NextResponse.json({ success: true, vendor_id: vendor?.id ?? null })
}
