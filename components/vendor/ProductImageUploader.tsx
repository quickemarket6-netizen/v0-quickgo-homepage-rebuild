"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { ImagePlus, X, Loader2, Star } from "lucide-react"

const MAX_IMAGES = 5

// Upload d'images produit : sélection depuis l'appareil (téléphone/PC),
// envoi vers /api/vendor/products/upload, aperçus réordonnables (la première
// image est l'image principale).
export function ProductImageUploader({
  images,
  onChange,
}: {
  images: string[]
  onChange: (images: string[]) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(0)   // nb d'uploads en cours
  const [error, setError] = useState<string | null>(null)

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setError(null)
    const room = MAX_IMAGES - images.length
    const toUpload = Array.from(files).slice(0, room)
    if (toUpload.length === 0) {
      setError(`Maximum ${MAX_IMAGES} images.`)
      return
    }

    setUploading((n) => n + toUpload.length)
    const uploaded: string[] = []
    for (const file of toUpload) {
      try {
        const form = new FormData()
        form.append("file", file)
        const res = await fetch("/api/vendor/products/upload", { method: "POST", body: form })
        const data = await res.json().catch(() => ({}))
        if (res.ok && data.url) uploaded.push(data.url)
        else setError(data.error ?? "Échec de l'envoi d'une image.")
      } catch {
        setError("Erreur réseau pendant l'envoi.")
      } finally {
        setUploading((n) => n - 1)
      }
    }
    if (uploaded.length > 0) onChange([...images, ...uploaded])
  }

  const remove = (idx: number) => onChange(images.filter((_, i) => i !== idx))
  const makePrimary = (idx: number) => {
    if (idx === 0) return
    const next = [...images]
    const [img] = next.splice(idx, 1)
    onChange([img, ...next])
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
        {images.map((url, i) => (
          <div key={url} className="relative aspect-square rounded-xl overflow-hidden border border-white/10 bg-white/5 group">
            <Image src={url} alt={`Image ${i + 1}`} fill className="object-cover" sizes="120px" />
            {i === 0 && (
              <span className="absolute bottom-1 left-1 flex items-center gap-0.5 bg-[#a3e635] text-black text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                <Star className="w-2.5 h-2.5 fill-current" /> Principale
              </span>
            )}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
              {i !== 0 && (
                <button type="button" onClick={() => makePrimary(i)}
                  title="Définir comme image principale"
                  className="p-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white">
                  <Star className="w-3.5 h-3.5" />
                </button>
              )}
              <button type="button" onClick={() => remove(i)}
                title="Retirer"
                className="p-1.5 rounded-full bg-red-500/80 hover:bg-red-500 text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}

        {images.length + uploading < MAX_IMAGES && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="aspect-square rounded-xl border-2 border-dashed border-white/15 hover:border-[#a3e635]/50
              flex flex-col items-center justify-center gap-1.5 text-white/40 hover:text-[#a3e635] transition-colors"
          >
            <ImagePlus className="w-5 h-5" />
            <span className="text-[10px] font-medium">Ajouter</span>
          </button>
        )}

        {Array.from({ length: uploading }).map((_, i) => (
          <div key={`up-${i}`} className="aspect-square rounded-xl border border-white/10 bg-white/5 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-[#a3e635]" />
          </div>
        ))}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => { handleFiles(e.target.files); e.target.value = "" }}
      />

      <p className="text-xs text-white/30">
        JPG, PNG ou WebP, 5 Mo max. — jusqu&apos;à {MAX_IMAGES} images, la première est affichée sur le marketplace.
      </p>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}
