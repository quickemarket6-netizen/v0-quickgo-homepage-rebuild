# Système de motion QuickGo

Source de vérité unique des animations, pour que toute l'app ait la même
« signature » de mouvement (comme Airbnb / Shopify) au lieu de durées choisies
au cas par cas.

- **TS / Framer Motion** : `lib/motion.ts`
- **CSS (transitions & keyframes non-Framer)** : variables dans `app/globals.css`
  (`--dur-fast|base|slow|slower`, `--ease-out`)

## L'échelle

| Token | Durée | Usage |
|-------|-------|-------|
| `fast`   | 0.15 s | micro-interactions : tap, hover, toggle |
| `base`   | 0.25 s | UI courante, transitions de page |
| `slow`   | 0.45 s | entrées, révélations |
| `slower` | 0.7 s  | révélations à grande échelle (hero) |

Courbes : `EASE.out` (`cubic-bezier(0.22, 1, 0.36, 1)`, la courbe par défaut),
`EASE.inOut` (boucles d'ambiance), `EASE.linear` (rotations).

Springs : `spring.soft` (UI), `spring.snappy` (interactions), `spring.bouncy`
(accents ludiques : badge panier…).

Les ambiances de fond (orbes 6-13 s) ne sont pas des interactions et restent
hors de cette échelle.

## Usage

```tsx
import { transition, spring, fadeUp, fade, stagger, DUR, EASE } from "@/lib/motion"

// Entrée standard
<motion.div {...fadeUp()} transition={transition("slow")} />

// Liste échelonnée (délai borné)
{items.map((it, i) => (
  <motion.div key={it.id} {...fadeUp()} transition={{ ...transition("base"), delay: stagger(i) }} />
))}

// Accent ressort
<motion.span animate={{ scale: 1 }} transition={spring.bouncy} />
```

En CSS :

```css
.x { transition: background-color var(--dur-fast) var(--ease-out); }
```

## Déjà migré (implémentations de référence)

`app/template.tsx` (transition de page), `components/marketplace/EmptyState.tsx`
(entrée), badge panier animé de `app/marketplace/page.tsx`, `.animate-orb`
(globals.css).

## Adoption

Le reste du code utilise encore des durées littérales (`duration: 0.45`…) : les
migrer **au fil de l'eau** quand un composant est retravaillé, plutôt qu'un
find/replace massif — même valeurs, moins de risque de régression visuelle. La
règle : plus aucune nouvelle durée littérale, on prend un token.

Accessibilité : `MotionProvider` (`reducedMotion="user"`) + la règle
`prefers-reduced-motion` de `globals.css` neutralisent tout automatiquement.
