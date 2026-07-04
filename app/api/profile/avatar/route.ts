import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { NextRequest, NextResponse } from "next/server"

const BUCKET = "avatars"
const MAX_SIZE = 3 * 1024 * 1024 // 3MB
const ALLOWED_MIMES = ["image/png", "image/jpeg", "image/webp"]
const EXT_BY_MIME: Record<string, string> = {
  "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp",
}

// POST /api/profile/avatar — multipart { file }
// Uploads the current user's avatar to a public bucket and persists the URL
// on their profile. Returns the public URL.
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

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Fichier requis" }, { status: 400 })
  }
  if (!ALLOWED_MIMES.includes(file.type)) {
    return NextResponse.json({ error: "Format non supporté (PNG, JPG ou WEBP)" }, { status: 400 })
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Image trop volumineuse (max. 3 Mo)" }, { status: 400 })
  }

  const service = createServiceClient(supabaseUrl, serviceKey)
  const ext = EXT_BY_MIME[file.type]
  const path = `${user.id}/avatar-${Date.now()}.${ext}`
  const bytes = Buffer.from(await file.arrayBuffer())

  let { error: uploadErr } = await service.storage.from(BUCKET)
    .upload(path, bytes, { contentType: file.type, upsert: true })

  // Create the bucket on first use (public — avatars are shown across the app)
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
  const avatarUrl = pub.publicUrl

  // Persist on the profile
  const { error: updateErr } = await supabase
    .from("profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", user.id)

  if (updateErr) {
    return NextResponse.json({ error: "Image envoyée mais profil non mis à jour" }, { status: 500 })
  }

  return NextResponse.json({ success: true, url: avatarUrl })
}
