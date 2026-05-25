import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: settings, error } = await supabase
      .from("admin_settings")
      .select("key, value, category")
      .in("category", ["general", "contact"])
    
    if (error) throw error
    
    // Convert to key-value object
    const settingsObject = settings?.reduce((acc, item) => {
      acc[item.key] = item.value
      return acc
    }, {} as Record<string, string>) || {}
    
    return NextResponse.json({ data: settingsObject })
  } catch (error) {
    console.error("Error fetching settings:", error)
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    )
  }
}
