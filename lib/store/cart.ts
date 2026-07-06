import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface CartItem {
  // Identifiant local unique : product_id pour un produit simple,
  // `${product_id}::${variant_id}` pour une variante (un même produit peut
  // être au panier en plusieurs variantes).
  id: string
  cartItemDbId?: string  // DB UUID from cart_items.id, for API mutations
  name: string
  price: number
  quantity: number
  image?: string
  vendorId?: string
  vendorName?: string
  // Variante choisie (taille, contenance…)
  variantId?: string
  variantLabel?: string
  // extended / legacy fields
  productId?: string
  brand?: string
  color?: string
  vendor?: string
  originalPrice?: number
}

// Résout l'id produit réel d'une ligne de panier (les lignes avec variante
// portent un id composite local).
export function cartItemProductId(item: Pick<CartItem, "id" | "productId">): string {
  return item.productId ?? item.id.split("::")[0]
}

interface CartState {
  items: CartItem[]
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  setItems: (items: CartItem[]) => void
  patchItem: (id: string, patch: Partial<CartItem>) => void
  getTotal: () => number
  getTotalPrice: () => number
  getItemCount: () => number
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) =>
        set((state) => {
          const existingItem = state.items.find((i) => i.id === item.id)
          if (existingItem) {
            return {
              items: state.items.map((i) =>
                i.id === item.id
                  ? { ...i, quantity: i.quantity + 1 }
                  : i
              ),
            }
          }
          return {
            items: [...state.items, { ...item, quantity: 1 }],
          }
        }),

      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        })),

      updateQuantity: (id, quantity) =>
        set((state) => ({
          items: quantity > 0
            ? state.items.map((i) =>
                i.id === id ? { ...i, quantity } : i
              )
            : state.items.filter((i) => i.id !== id),
        })),

      clearCart: () => set({ items: [] }),

      setItems: (items) => set({ items }),

      patchItem: (id, patch) =>
        set((state) => ({
          items: state.items.map((i) => i.id === id ? { ...i, ...patch } : i),
        })),

      getTotalPrice: () => {
        const state = get()
        return state.items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        )
      },

      getTotal: () => {
        const state = get()
        return state.items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        )
      },

      getItemCount: () => {
        const state = get()
        return state.items.reduce((count, item) => count + item.quantity, 0)
      },
    }),
    {
      name: "quickgo-cart",
    }
  )
)
