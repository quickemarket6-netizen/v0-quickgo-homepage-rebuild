"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import {
  FolderTree, Plus, Edit2, Trash2, RefreshCw, Save,
  X, CheckCircle2, EyeOff, Eye, ArrowUpDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { AdminSidebar } from "@/app/admin/_components/AdminSidebar"

interface Category {
  id: string
  name: string
  slug: string
  icon: string | null
  color: string | null
  image_url?: string | null
  is_active: boolean
  sort_order: number
  created_at?: string
}

const EMPTY: Omit<Category, "id" | "created_at"> = {
  name: "", slug: "", icon: "", color: "#a3e635", is_active: true, sort_order: 0,
}

// A few suggested emoji icons for quick selection
const ICON_SUGGESTIONS = ["🛒", "🍔", "💊", "🥖", "📦", "🍹", "👕", "📱", "🏠", "🎁", "🛵", "🧴"]

function slugPreview(input: string) {
  return input
    .normalize("NFD")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

const inputCls = "w-full bg-[#0a0a0f] border border-[#1e1e2e] text-white placeholder:text-[#6b6b8a] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#a3e635]/30 focus:border-[#a3e635]"

function CategoryFormModal({
  category, onClose, onSaved,
}: {
  category: Partial<Category> | null
  onClose: () => void
  onSaved: () => void
}) {
  const isNew = !category?.id
  const [form, setForm] = useState<Omit<Category, "id" | "created_at">>({
    name:       category?.name       ?? EMPTY.name,
    slug:       category?.slug       ?? EMPTY.slug,
    icon:       category?.icon       ?? EMPTY.icon,
    color:      category?.color      ?? EMPTY.color,
    is_active:  category?.is_active  ?? EMPTY.is_active,
    sort_order: category?.sort_order ?? EMPTY.sort_order,
  })
  // Track whether the slug was manually edited so we don't overwrite it
  const [slugTouched, setSlugTouched] = useState(!isNew)
  const [loading, setLoading] = useState(false)

  const effectiveSlug = slugTouched ? form.slug : slugPreview(form.name)

  async function handleSave() {
    if (!form.name.trim()) { toast.error("Le nom est requis"); return }
    setLoading(true)
    try {
      const url    = isNew ? "/api/admin/categories" : `/api/admin/categories/${category!.id}`
      const method = isNew ? "POST" : "PATCH"
      const payload = { ...form, slug: effectiveSlug }
      const res  = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Erreur")
      toast.success(isNew ? "Catégorie créée" : "Catégorie mise à jour")
      onSaved(); onClose()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Erreur serveur")
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 16 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="bg-[#16161f] border border-[#1e1e2e] rounded-2xl shadow-2xl w-full max-w-lg"
      >
        <div className="p-6 border-b border-[#1e1e2e] flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">
            {isNew ? "Nouvelle catégorie" : "Modifier la catégorie"}
          </h2>
          <button onClick={onClose} aria-label="Fermer" className="text-[#6b6b8a] hover:text-white p-1 rounded-lg hover:bg-[#1e1e2e] transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="text-sm font-medium text-white mb-1.5 block">
              Nom <span className="text-red-400">*</span>
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Ex: Restaurants"
              className={inputCls}
            />
          </div>

          {/* Slug */}
          <div>
            <label className="text-sm font-medium text-white mb-1.5 block">Slug (URL)</label>
            <input
              value={effectiveSlug}
              onChange={(e) => { setSlugTouched(true); setForm((f) => ({ ...f, slug: e.target.value })) }}
              placeholder="auto-généré depuis le nom"
              className={inputCls}
            />
            <p className="text-xs text-[#6b6b8a] mt-1">/marketplace/shops?cat=<b className="text-white">{effectiveSlug || "…"}</b></p>
          </div>

          {/* Icon + Color */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-white mb-1.5 block">Icône (emoji)</label>
              <input
                value={form.icon ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
                placeholder="🛒"
                maxLength={4}
                className={inputCls}
              />
              <div className="flex flex-wrap gap-1 mt-2">
                {ICON_SUGGESTIONS.map((emo) => (
                  <button
                    key={emo}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, icon: emo }))}
                    className="w-7 h-7 rounded-lg bg-[#0a0a0f] border border-[#1e1e2e] hover:border-[#a3e635] text-base flex items-center justify-center transition-colors"
                  >
                    {emo}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-white mb-1.5 block">Couleur</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={form.color ?? "#a3e635"}
                  onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                  className="w-10 h-10 rounded-lg bg-transparent border border-[#1e1e2e] cursor-pointer"
                />
                <input
                  value={form.color ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))}
                  placeholder="#a3e635"
                  className={inputCls}
                />
              </div>
            </div>
          </div>

          {/* Sort order + active */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-white mb-1.5 block">Ordre d&apos;affichage</label>
              <input
                type="number" min={0}
                value={form.sort_order}
                onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))}
                className={inputCls}
              />
              <p className="text-xs text-[#6b6b8a] mt-1">Plus petit = affiché en premier</p>
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-white mb-1.5">Statut</label>
              <label className="flex items-center gap-2 cursor-pointer pt-2.5">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                  className="rounded accent-[#a3e635]"
                />
                <span className="text-sm text-[#6b6b8a]">Catégorie active</span>
              </label>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-[#1e1e2e] flex gap-3">
          <Button variant="outline" onClick={onClose}
            className="flex-1 border-[#1e1e2e] bg-transparent text-white hover:bg-[#1e1e2e]">
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={loading}
            className="flex-1 bg-[#a3e635] hover:bg-[#92cc2e] text-black font-semibold gap-2">
            {loading ? <RefreshCw size={15} className="animate-spin" /> : <Save size={15} />}
            {isNew ? "Créer la catégorie" : "Enregistrer"}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading]       = useState(true)
  const [editCat, setEditCat]       = useState<Partial<Category> | null>(null)
  const [showModal, setShowModal]   = useState(false)
  const [deleting, setDeleting]     = useState<string | null>(null)

  const fetchCategories = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/categories")
      if (res.ok) setCategories(await res.json())
      else toast.error("Erreur de chargement")
    } catch { toast.error("Erreur réseau") }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchCategories() }, [fetchCategories])

  async function toggleActive(cat: Category) {
    try {
      const res = await fetch(`/api/admin/categories/${cat.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !cat.is_active }),
      })
      if (!res.ok) throw new Error()
      setCategories((prev) => prev.map((c) => c.id === cat.id ? { ...c, is_active: !c.is_active } : c))
      toast.success(cat.is_active ? "Catégorie désactivée" : "Catégorie activée")
    } catch { toast.error("Erreur de mise à jour") }
  }

  async function deleteCategory(id: string) {
    if (!confirm("Supprimer cette catégorie ? Cette action est irréversible.")) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      setCategories((prev) => prev.filter((c) => c.id !== id))
      toast.success("Catégorie supprimée")
    } catch { toast.error("Erreur de suppression") }
    finally { setDeleting(null) }
  }

  function openCreate() {
    const nextOrder = categories.length ? Math.max(...categories.map((c) => c.sort_order)) + 1 : 0
    setEditCat({ ...EMPTY, sort_order: nextOrder })
    setShowModal(true)
  }
  function openEdit(cat: Category) { setEditCat(cat); setShowModal(true) }
  function closeModal() { setShowModal(false); setEditCat(null) }

  const activeCount   = categories.filter((c) => c.is_active).length
  const inactiveCount = categories.length - activeCount

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex">
      <AdminSidebar />

      <div className="flex-1 flex flex-col text-white">
        <motion.header initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-[#1e1e2e] px-8 py-4 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h1 className="text-xl font-bold text-white">Catégories</h1>
            <p className="text-sm text-[#6b6b8a]">
              {categories.length} catégorie{categories.length > 1 ? "s" : ""} · {activeCount} active{activeCount > 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={fetchCategories}
              className="gap-2 border-[#1e1e2e] bg-transparent text-white hover:bg-[#1e1e2e]">
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              Actualiser
            </Button>
            <Button size="sm" onClick={openCreate}
              className="gap-2 bg-[#a3e635] hover:bg-[#92cc2e] text-black font-semibold">
              <Plus size={14} />
              Nouvelle catégorie
            </Button>
          </div>
        </motion.header>

        <main className="flex-1 p-8 space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Catégories actives",   value: activeCount,        icon: CheckCircle2, color: "text-green-400",  bg: "bg-green-500/20" },
              { label: "Catégories inactives", value: inactiveCount,      icon: EyeOff,       color: "text-[#6b6b8a]", bg: "bg-[#1e1e2e]"    },
              { label: "Total",                value: categories.length,  icon: ArrowUpDown,  color: "text-[#a3e635]",  bg: "bg-[#a3e635]/20" },
            ].map((c, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -3 }}
                className="bg-[#16161f] rounded-2xl p-5 border border-[#1e1e2e] flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl ${c.bg} flex items-center justify-center shrink-0`}>
                  <c.icon size={20} className={c.color} />
                </div>
                <div>
                  <p className="text-xs text-[#6b6b8a]">{c.label}</p>
                  <p className="text-2xl font-bold text-white">{c.value}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* List */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="bg-[#16161f] rounded-2xl border border-[#1e1e2e] overflow-hidden">
            <div className="px-6 py-4 border-b border-[#1e1e2e] flex items-center gap-2">
              <FolderTree size={18} className="text-[#a3e635]" />
              <h2 className="font-semibold text-white">Toutes les catégories</h2>
            </div>

            {loading ? (
              <div className="p-12 flex items-center justify-center">
                <RefreshCw className="animate-spin text-[#a3e635]" size={28} />
              </div>
            ) : categories.length === 0 ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }} className="p-12 text-center">
                <FolderTree className="mx-auto text-[#1e1e2e] mb-3" size={40} />
                <p className="text-[#6b6b8a] font-medium">Aucune catégorie</p>
                <p className="text-sm text-[#6b6b8a]/60 mt-1">Créez votre première catégorie de produits</p>
                <Button onClick={openCreate} className="mt-4 gap-2 bg-[#a3e635] hover:bg-[#92cc2e] text-black font-semibold">
                  <Plus size={14} /> Créer une catégorie
                </Button>
              </motion.div>
            ) : (
              <div className="divide-y divide-[#1e1e2e]">
                <AnimatePresence mode="popLayout" initial={false}>
                {[...categories].sort((a, b) => a.sort_order - b.sort_order).map((cat, i) => (
                  <motion.div
                    key={cat.id}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 24, transition: { duration: 0.2 } }}
                    transition={{ delay: Math.min(i * 0.03, 0.4) }}
                    className={`flex items-center gap-4 px-6 py-4 hover:bg-[#1e1e2e]/40 transition-colors ${!cat.is_active ? "opacity-50" : ""}`}
                  >
                    {/* Order */}
                    <div className="w-8 h-8 rounded-lg bg-[#1e1e2e] flex items-center justify-center text-xs font-bold text-[#6b6b8a] shrink-0">
                      {cat.sort_order}
                    </div>

                    {/* Icon swatch — vignette image si présente, sinon emoji */}
                    {cat.image_url ? (
                      <div className="relative w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-[#1e1e2e]">
                        <Image src={cat.image_url} alt={cat.name} fill className="object-cover" sizes="40px" />
                      </div>
                    ) : (
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                        style={{ backgroundColor: (cat.color ?? "#a3e635") + "22", border: `1px solid ${(cat.color ?? "#a3e635")}44` }}
                      >
                        {cat.icon || "📦"}
                      </div>
                    )}

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-white truncate">{cat.name}</p>
                        {!cat.is_active && (
                          <span className="bg-[#1e1e2e] text-[#6b6b8a] text-xs px-2 py-0.5 rounded-full">Inactive</span>
                        )}
                      </div>
                      <p className="text-xs text-[#6b6b8a] mt-0.5 font-mono">{cat.slug}</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <button
                        onClick={() => toggleActive(cat)}
                        title={cat.is_active ? "Désactiver" : "Activer"}
                        aria-label={cat.is_active ? "Désactiver" : "Activer"}
                        className={`p-2 rounded-lg transition-colors ${
                          cat.is_active
                            ? "text-green-400 hover:bg-green-500/10"
                            : "text-[#6b6b8a] hover:bg-[#1e1e2e]"
                        }`}
                      >
                        {cat.is_active ? <Eye size={16} /> : <EyeOff size={16} />}
                      </button>
                      <button
                        onClick={() => openEdit(cat)}
                        aria-label="Modifier"
                        className="p-2 rounded-lg text-[#a3e635] hover:bg-[#a3e635]/10 transition-colors"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => deleteCategory(cat.id)}
                        disabled={deleting === cat.id}
                        aria-label="Supprimer"
                        className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                      >
                        {deleting === cat.id
                          ? <RefreshCw size={16} className="animate-spin" />
                          : <Trash2 size={16} />}
                      </button>
                    </div>
                  </motion.div>
                ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        </main>
      </div>

      <AnimatePresence>
        {showModal && (
          <CategoryFormModal category={editCat} onClose={closeModal} onSaved={fetchCategories} />
        )}
      </AnimatePresence>
    </div>
  )
}
