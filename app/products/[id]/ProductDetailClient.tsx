"use client";

import { useCart } from "@/components/CartContext";

export default function ProductDetailClient({ product }: { product: any }) {
  const { addItem, items } = useCart();

  const stock: number = Number(product.stock ?? 0);
  const existingInCart = items.find((i) => i.id === product.id);
  const existingQty = existingInCart?.quantity ?? 0;
  const maxReached = stock > 0 && existingQty >= stock;
  const isOutOfStock = stock <= 0;

  const handleAddToCart = () => {
    if (isOutOfStock) return;

    if (maxReached) {
      alert(
        "Hai già aggiunto il numero massimo di pezzi disponibili per questo prodotto."
      );
      return;
    }

    addItem(
      {
        id: product.id,
        name: product.name,
        price: Number(product.price),
        image_url: product.image_url,
        stock
      },
      1
    );
  };

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="aspect-square w-full overflow-hidden rounded-xl bg-slate-100">
        {product.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
            Nessuna immagine
          </div>
        )}
      </div>
      <div className="backdrop-blur-md bg-white/60 rounded-2xl border border-white/60 shadow-lg p-5">
        <h1 className="text-xl font-semibold">{product.name}</h1>
        <div className="mt-2 text-lg font-semibold">
          € {Number(product.price).toFixed(2)}
        </div>

        {/* Feedback stock */}
        <div className="mt-2 text-sm">
          {isOutOfStock ? (
            <span className="text-red-500 font-medium">Esaurito</span>
          ) : stock === 1 ? (
            <span className="text-amber-500 font-medium">
              Ultimo disponibile
            </span>
          ) : (
            <span className="text-slate-500">
              Disponibili:{" "}
              <span className="font-medium">{stock}</span>
            </span>
          )}
        </div>

        <p className="mt-4 text-sm text-slate-600">{product.description}</p>

        <button
          onClick={handleAddToCart}
          disabled={isOutOfStock || maxReached}
          className={`mt-6 rounded-lg px-4 py-2 text-sm font-medium text-white transition 
            ${
              isOutOfStock || maxReached
                ? "bg-slate-400 cursor-not-allowed"
                : "bg-slate-900 hover:bg-slate-800"
            }`}
        >
          {isOutOfStock
            ? "Non disponibile"
            : maxReached
            ? "Stock massimo raggiunto"
            : "Aggiungi al carrello"}
        </button>
      </div>
    </div>
  );
}
