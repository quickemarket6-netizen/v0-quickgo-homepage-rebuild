import { Skeleton } from "@/components/ui/skeleton"

// Skeleton de liste réutilisable — reproduit la forme d'une ligne (icône +
// deux lignes de texte) pendant le chargement, au lieu d'un spinner centré.
// Le skeleton laisse deviner la structure à venir : perçu comme plus rapide
// (pattern Amazon/Shopify).
export function ListSkeleton({ rows = 5, className = "" }: { rows?: number; className?: string }) {
  return (
    <div className={`space-y-3 ${className}`} aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-4 rounded-2xl border border-border/40 bg-card/40">
          <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <Skeleton className="h-3 w-10 shrink-0" />
        </div>
      ))}
    </div>
  )
}
