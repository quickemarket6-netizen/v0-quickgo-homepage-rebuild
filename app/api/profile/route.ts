import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 })
  }
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()
  
  const { data: addresses } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", user.id)
    .order("is_default", { ascending: false })
  
  return NextResponse.json({
    ...profile,
    email: user.email,
    addresses
  })
}

export async function PUT(request: Request) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 })
  }
  
  const body = await request.json()
  const { full_name, phone, avatar_url } = body
  
  const { data, error } = await supabase
    .from("profiles")
    .update({ 
      full_name, 
      phone, 
      avatar_url,
      updated_at: new Date().toISOString()
    })
    .eq("id", user.id)
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}
