"use client"

import { useState } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"

/**
 * Fournisseur react-query.
 *
 * La dépendance était installée mais jamais câblée : toutes les pages
 * chargeaient leurs données par `useEffect(() => { fetchX() }, [])`, ce qui
 * pose un setState dans un effet (91 avertissements react-hooks) et refait un
 * appel réseau à chaque montage, sans cache ni déduplication.
 *
 * Le client est créé dans un état local plutôt qu'au niveau module : sur le
 * rendu serveur, un client partagé entre requêtes ferait fuiter le cache d'un
 * utilisateur vers un autre.
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  )

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
