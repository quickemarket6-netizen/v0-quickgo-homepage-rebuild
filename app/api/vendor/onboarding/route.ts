import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

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

  // Upsert vendor record
  const { data: vendor, error: vErr } = await supabase
    .from("vendors")
    .upsert(
      {
        user_id:     user.id,
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
      },
      { onConflict: "user_id" },
    )
    .select("id")
    .single()

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

  // Save payout account
  if (vendor && paymentMethod) {
    await supabase
      .from("vendor_payout_accounts")
      .upsert(
        {
          vendor_id:      vendor.id,
          method:         paymentMethod,
          account_number: paymentMethod === "mobile_money" ? mobileNumber : accountNumber,
          bank_name:      paymentMethod === "bank" ? bankName : null,
          account_name:   `${firstName} ${lastName}`.trim(),
          is_default:     true,
          is_verified:    false,
        },
        { onConflict: "vendor_id,method" },
      )
  }

  return NextResponse.json({ success: true, vendor_id: vendor?.id ?? null })
}
