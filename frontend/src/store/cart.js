// frontend/src/store/cart.js
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const toCents = (x) => Math.round(Number(x) * 100);

export const useCart = create()(
  persist(
    (set, get) => ({
      email: "",
      // items: [{ product_id, title, unit_price_cents, quantity }]
      items: [],

      // --- setters básicos ---
      setEmail: (email) => set({ email }),

      addItem: (p, qty = 1) =>
        set((s) => {
          const items = [...s.items];
          const idx = items.findIndex((i) => i.product_id === p.id);
          const unit_price_cents =
            p.unit_price_cents ?? toCents(p.unit_price ?? p.price ?? 0);

          if (idx >= 0) {
            const nextQty = clamp(items[idx].quantity + qty, 1, 99);
            items[idx] = { ...items[idx], quantity: nextQty };
          } else {
            items.push({
              product_id: p.id,
              title: p.title,
              unit_price_cents,
              quantity: clamp(qty, 1, 99),
            });
          }
          return { items };
        }),

      removeItem: (product_id) =>
        set((s) => ({
          items: s.items.filter((i) => i.product_id !== product_id),
        })),

      clear: () => set({ items: [], email: "" }),

      // --- helpers de cantidad ---
      inc: (product_id, step = 1) =>
        set((s) => {
          const items = [...s.items];
          const idx = items.findIndex((i) => i.product_id === product_id);
          if (idx === -1) return {};
          const nextQty = clamp(items[idx].quantity + step, 1, 99);
          items[idx] = { ...items[idx], quantity: nextQty };
          return { items };
        }),

      dec: (product_id, step = 1) =>
        set((s) => {
          const items = [...s.items];
          const idx = items.findIndex((i) => i.product_id === product_id);
          if (idx === -1) return {};
          const nextQty = clamp(items[idx].quantity - step, 0, 99);
          if (nextQty === 0) {
            items.splice(idx, 1);
          } else {
            items[idx] = { ...items[idx], quantity: nextQty };
          }
          return { items };
        }),

      setQty: (product_id, qty) =>
        set((s) => {
          const items = [...s.items];
          const idx = items.findIndex((i) => i.product_id === product_id);
          if (idx === -1) return {};
          const q = clamp(Number(qty) || 0, 0, 99);
          if (q === 0) items.splice(idx, 1);
          else items[idx] = { ...items[idx], quantity: q };
          return { items };
        }),

      // --- derivados (como funciones, no estado serializado) ---
      count: () => get().items.reduce((a, i) => a + i.quantity, 0),

      subtotalCents: () =>
        get().items.reduce((a, i) => a + i.unit_price_cents * i.quantity, 0),
    }),
    {
      name: "cart-v1",
      storage: createJSONStorage(() => localStorage),
      // opcional: sólo persiste email+items
      partialize: (s) => ({ email: s.email, items: s.items }),
    }
  )
);
