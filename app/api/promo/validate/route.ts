import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const supabase = await createClient()
  
  const { code, subtotal } = await request.json()
  
  const { data: promo, error } = await supabase
    .from("promo_codes")
    .select("*")
    .eq("code", code.toUpperCase())
    .eq("is_active", true)
    .single()
  
  if (error || !promo) {
    return NextResponse.json({ error: "Code promo invalide" }, { status: 400 })
  }
  
  // Check if promo is still valid
  if (promo.valid_until && new Date(promo.valid_until) < new Date()) {
    return NextResponse.json({ error: "Code promo expire" }, { status: 400 })
  }
  
  // Check max uses
  if (promo.max_uses && promo.current_uses >= promo.max_uses) {
    return NextResponse.json({ error: "Code promo epuise" }, { status: 400 })
  }
  
  // Check minimum order amount
  if (subtotal < promo.min_order_amount) {
    return NextResponse.json({ 
      error: `Commande minimum de ${promo.min_order_amount} CFA requise` 
    }, { status: 400 })
  }
  
  // Calculate discount
  let discount = 0
  if (promo.discount_type === "percentage") {
    discount = Math.round((subtotal * promo.discount_value) / 100)
  } else {
    discount = promo.discount_value
  }
  
  return NextResponse.json({
    valid: true,
    code: promo.code,
    discount,
    discount_type: promo.discount_type,
    discount_value: promo.discount_value,
    description: promo.description
  })
}
