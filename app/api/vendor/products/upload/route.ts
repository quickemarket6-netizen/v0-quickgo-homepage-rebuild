import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"
import { randomUUID } from "crypto"

const BUCKET = "product-images"
const MAX_SIZE = 5 * 1024 * 1024 // 5 Mo

const ALLOWED_MIMES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
}

// POST /api/vendor/products/upload — multipart { file }
// Upload d'une image produit vers un bucket PUBLIC (affichée sur le
// marketplace). Retourne l'URL publique à stocker dans products.images.
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const { data: vendor } = await supabase
    .from("vendors")
    .select("id")
    .eq("owner_id", user.id)
    .single()
  if (!vendor) return NextResponse.json({ error: "Vendeur introuvable" }, { status: 403 })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "Stockage non configuré (SUPABASE_SERVICE_ROLE_KEY)" }, { status: 500 })
  }

  const form = await req.formData()
  const file = form.get("file")
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Fichier requis" }, { status: 400 })
  }
  const ext = ALLOWED_MIMES[file.type]
  if (!ext) {
    return NextResponse.json({ error: "Format non supporté (JPG, PNG ou WebP)" }, { status: 400 })
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Image trop volumineuse (max. 5 Mo)" }, { status: 400 })
  }

  const service = createServiceClient(supabaseUrl, serviceKey)
  const path = `${vendor.id}/${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`
  const bytes = Buffer.from(await file.arrayBuffer())

  let { error: uploadErr } = await service.storage.from(BUCKET)
    .upload(path, bytes, { contentType: file.type, cacheControl: "31536000" })

  // Bucket créé au premier usage — PUBLIC : ces images sont servies au marketplace
  if (uploadErr && /bucket.*not.*found/i.test(uploadErr.message)) {
    await service.storage.createBucket(BUCKET, { public: true, fileSizeLimit: MAX_SIZE })
    const retry = await service.storage.from(BUCKET)
      .upload(path, bytes, { contentType: file.type, cacheControl: "31536000" })
    uploadErr = retry.error
  }
  if (uploadErr) {
    return NextResponse.json({ error: `Échec de l'envoi : ${uploadErr.message}` }, { status: 500 })
  }

  const { data: pub } = service.storage.from(BUCKET).getPublicUrl(path)
  return NextResponse.json({ success: true, url: pub.publicUrl })
}
