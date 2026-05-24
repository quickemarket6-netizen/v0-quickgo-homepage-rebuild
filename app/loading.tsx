export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full border-4 border-quickgo-blue/20" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-quickgo-blue animate-spin" />
          <div className="absolute inset-2 rounded-full bg-gradient-to-br from-quickgo-blue to-quickgo-cyan flex items-center justify-center">
            <span className="text-white font-bold text-2xl">Q</span>
          </div>
        </div>
        <p className="text-white font-medium">Chargement...</p>
        <p className="text-sm text-muted-foreground mt-1">QuickGo prépare votre expérience</p>
      </div>
    </div>
  )
}
