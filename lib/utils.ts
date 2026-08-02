import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Neutralise une saisie utilisateur destinée à un filtre PostgREST.
 *
 * Deux dangers distincts :
 *  - la virgule et les parenthèses sont la syntaxe de `.or()` : les laisser
 *    passer permet d'injecter des conditions arbitraires dans le filtre ;
 *  - `%`, `_` et `\` sont les jokers d'ILIKE : non échappés, une recherche
 *    "100%" devient un motif au lieu d'un littéral.
 */
export function escapeFilter(input: string) {
  return input
    .replace(/[,()]/g, " ")
    .replace(/[%_\\]/g, (c) => `\\${c}`)
    .trim()
}
