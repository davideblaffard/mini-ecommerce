"use client";

import { useCart } from "@/components/CartContext";
import Link from "next/link";

export default function CartPage() {
  const { items, total, updateQuantity, removeItem } = useCart();

  return (
    <div>
      <h1 className="text-2xl font-semibold">Carrello</h1>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">
          Il carrello è vuoto.{" "}
          <Link href="/" className="underline">
            Vai ai prodotti
          </Link>
          .
        </p>
      ) : (
        <div className="mt-6 grid gap-6 md:grid-cols-[2fr,1fr]">
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-xl border bg-white p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="h-16 w-16 overflow-hidden rounded-lg bg-slate-100">
                    {item.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{item.name}</div>
                    <div className="text-xs text-slate-500">
                      € {item.price.toFixed(2)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) =>
                      updateQuantity(item.id, Number(e.target.value))
                    }
                    className="w-16 rounded border px-2 py-1 text-sm"
                  />
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Rimuovi
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-xl border bg-white p-4">
            <div className="flex items-center justify-between text-sm">
              <span>Totale</span>
              <span className="font-semibold">
                € {total.toFixed(2)}
              </span>
            </div>
            <Link
              href="/checkout"
              className="mt-4 block rounded-lg bg-slate-900 px-4 py-2 text-center text-sm font-medium text-white hover:bg-slate-800"
            >
              Vai al checkout
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
