import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

const BUCKET = "vendor-documents"
const MAX_SIZE = 5 * 1024 * 1024 // 5MB

const ALLOWED_KINDS: Record<string, string[]> = {
  id_card:          ["image/png", "image/jpeg", "application/pdf"],
  business_license: ["image/png", "image/jpeg", "application/pdf"],
  logo:             ["image/png", "image/jpeg", "image/webp"],
}

const EXT_BY_MIME: Record<string, string> = {
  "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "application/pdf": "pdf",
}

// POST /api/vendor/onboarding/upload — multipart { file, kind }
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "Stockage non configuré" }, { status: 500 })
  }

  const form = await req.formData()
  const file = form.get("file")
  const kind = String(form.get("kind") ?? "")

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Fichier requis" }, { status: 400 })
  }
  const allowedMimes = ALLOWED_KINDS[kind]
  if (!allowedMimes) {
    return NextResponse.json({ error: "Type de document invalide" }, { status: 400 })
  }
  if (!allowedMimes.includes(file.type)) {
    return NextResponse.json({ error: "Format non supporté (PNG, JPG ou PDF)" }, { status: 400 })
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Fichier trop volumineux (max. 5 Mo)" }, { status: 400 })
  }

  const service = createServiceClient(supabaseUrl, serviceKey)
  const ext = EXT_BY_MIME[file.type]
  const path = `${user.id}/${kind}-${Date.now()}.${ext}`
  const bytes = Buffer.from(await file.arrayBuffer())

  let { error: uploadErr } = await service.storage.from(BUCKET)
    .upload(path, bytes, { contentType: file.type, upsert: true })

  // Create the bucket on first use, then retry once
  if (uploadErr && /bucket.*not.*found/i.test(uploadErr.message)) {
    await service.storage.createBucket(BUCKET, { public: true, fileSizeLimit: MAX_SIZE })
    const retry = await service.storage.from(BUCKET)
      .upload(path, bytes, { contentType: file.type, upsert: true })
    uploadErr = retry.error
  }
  if (uploadErr) {
    return NextResponse.json({ error: `Échec de l'envoi : ${uploadErr.message}` }, { status: 500 })
  }

  const { data: pub } = service.storage.from(BUCKET).getPublicUrl(path)
  return NextResponse.json({ success: true, url: pub.publicUrl, kind })
}
