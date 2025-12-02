"use client";

import { useCart } from "@/components/CartContext";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart();
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    address: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!items.length) {
      setError("Il carrello è vuoto.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: form.name,
          customer_email: form.email,
          address: form.address,
          items: items.map((i) => ({
            product_id: i.id,
            quantity: i.quantity,
            unit_price: i.price
          }))
        })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.message || "Errore durante il checkout.");
        setLoading(false);
        return;
      }

      clearCart();
      router.push("/order-completed");
    } catch (err) {
      console.error(err);
      setError("Errore di rete.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md">
      <h1 className="text-2xl font-semibold">Checkout</h1>
      <p className="mt-1 text-sm text-slate-500">
        Questo è un checkout simulato. Nessun pagamento reale verrà effettuato.
      </p>

      {items.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">
          Il carrello è vuoto. Aggiungi qualche prodotto prima di procedere.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600">
              Nome completo
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="mt-1 w-full rounded border px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600">
              Email
            </label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              className="mt-1 w-full rounded border px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600">
              Indirizzo
            </label>
            <input
              name="address"
              value={form.address}
              onChange={handleChange}
              className="mt-1 w-full rounded border px-3 py-2 text-sm"
              required
            />
          </div>
          {error && (
            <p className="text-xs text-red-500">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {loading
              ? "Invio in corso..."
              : `Conferma ordine (€ ${total.toFixed(2)})`}
          </button>
        </form>
      )}
    </div>
  );
}
