"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useMemo
} from "react";

export type CartItem = {
  id: number;
  name: string;
  price: number;
  image_url?: string | null;
  quantity: number;
  stock?: number; // stock disponibile al momento dell'aggiunta
};

type CartContextType = {
  items: CartItem[];
  cartCount: number;
  total: number;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextType | undefined>(undefined);
const STORAGE_KEY = "mini_ecommerce_cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: CartItem[] = JSON.parse(raw);
        setItems(parsed);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = (
    item: Omit<CartItem, "quantity">,
    quantity: number = 1
  ) => {
    setItems((prev) => {
      const existing = prev.find((p) => p.id === item.id);
      const stock = item.stock ?? existing?.stock;

      // Se conosciamo lo stock, limitiamo la quantità massima
      if (stock !== undefined && stock !== null) {
        const existingQty = existing?.quantity ?? 0;
        const desired = existingQty + quantity;
        const clamped = Math.min(stock, desired);

        // se non possiamo aggiungere altro, lasciamo tutto com'è
        if (clamped === existingQty) {
          return prev;
        }

        if (existing) {
          return prev.map((p) =>
            p.id === item.id ? { ...p, quantity: clamped, stock } : p
          );
        }

        return [...prev, { ...item, quantity: clamped, stock }];
      }

      // fallback: nessuna info stock → comportamento classico
      if (existing) {
        return prev.map((p) =>
          p.id === item.id ? { ...p, quantity: p.quantity + quantity } : p
        );
      }
      return [...prev, { ...item, quantity, stock }];
    });
  };

  const removeItem = (id: number) => {
    setItems((prev) => prev.filter((p) => p.id !== id));
  };

  const updateQuantity = (id: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }

    setItems((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        let q = quantity;
        if (p.stock !== undefined && p.stock !== null) {
          q = Math.min(q, p.stock);
        }
        return { ...p, quantity: q };
      })
    );
  };

  const clearCart = () => setItems([]);

  const { cartCount, total } = useMemo(() => {
    const count = items.reduce((acc, i) => acc + i.quantity, 0);
    const tot = items.reduce((acc, i) => acc + i.price * i.quantity, 0);
    return { cartCount: count, total: tot };
  }, [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        cartCount,
        total,
        addItem,
        removeItem,
        updateQuantity,
        clearCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
