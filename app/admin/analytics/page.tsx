import { supabaseServer } from "@/lib/supabaseClient";
import { isAdminRequest } from "@/lib/adminAuth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  if (!isAdminRequest()) {
    redirect("/admin/login");
  }

  const [{ data: products }, { data: orders }, { data: items }] =
    await Promise.all([
      supabaseServer.from("products").select("*"),
      supabaseServer.from("orders").select("*"),
      supabaseServer.from("order_items").select("*")
    ]);

  const safeProducts = (products || []).map((p: any) => ({
    ...p,
    price: Number(p.price),
    stock: Number(p.stock ?? 0)
  }));
  const safeOrders = orders || [];
  const safeItems = (items || []).map((i: any) => ({
    ...i,
    unit_price: Number(i.unit_price),
    quantity: Number(i.quantity)
  }));

  const totalProducts = safeProducts.length;
  const totalStock = safeProducts.reduce((acc, p) => acc + p.stock, 0);
  const totalOrders = safeOrders.length;
  const totalRevenue = safeItems.reduce(
    (acc, i) => acc + i.quantity * i.unit_price,
    0
  );

  const salesByProduct = new Map<number, { quantity: number; revenue: number }>();
  for (const item of safeItems) {
    if (!salesByProduct.has(item.product_id)) {
      salesByProduct.set(item.product_id, { quantity: 0, revenue: 0 });
    }
    const entry = salesByProduct.get(item.product_id)!;
    entry.quantity += item.quantity;
    entry.revenue += item.quantity * item.unit_price;
  }

  const productNameMap = new Map<number, string>();
  safeProducts.forEach((p) => productNameMap.set(p.id, p.name));

  const bestSellers = Array.from(salesByProduct.entries())
    .sort((a, b) => b[1].quantity - a[1].quantity)
    .slice(0, 5);

  return (
    <div className="space-y-4">
      <div className="backdrop-blur-md bg-white/70 rounded-2xl border border-white/60 px-4 py-3 shadow-lg">
        <h1 className="text-lg font-semibold">Analytics</h1>
        <p className="mt-1 text-xs text-slate-500">
          Panoramica veloce delle metriche principali del mini e-commerce.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-3 md:grid-cols-4">
        <div className="backdrop-blur-md bg-slate-900 text-white rounded-2xl px-4 py-3 shadow-lg">
          <div className="text-[11px] uppercase tracking-wide text-slate-300">
            Prodotti
          </div>
          <div className="mt-1 text-2xl font-semibold">
            {totalProducts}
          </div>
          <div className="mt-1 text-[11px] text-slate-300">
            nel catalogo
          </div>
        </div>

        <div className="backdrop-blur-md bg-white/80 rounded-2xl border border-white/70 px-4 py-3 shadow-md">
          <div className="text-[11px] uppercase tracking-wide text-slate-500">
            Stock totale
          </div>
          <div className="mt-1 text-2xl font-semibold text-slate-900">
            {totalStock}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            pezzi disponibili
          </div>
        </div>

        <div className="backdrop-blur-md bg-white/80 rounded-2xl border border-white/70 px-4 py-3 shadow-md">
          <div className="text-[11px] uppercase tracking-wide text-slate-500">
            Ordini
          </div>
          <div className="mt-1 text-2xl font-semibold text-slate-900">
            {totalOrders}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            creati via demo
          </div>
        </div>

        <div className="backdrop-blur-md bg-violet-600 text-white rounded-2xl px-4 py-3 shadow-lg">
          <div className="text-[11px] uppercase tracking-wide text-violet-200">
            Fatturato simulato
          </div>
          <div className="mt-1 text-2xl font-semibold">
            € {totalRevenue.toFixed(2)}
          </div>
          <div className="mt-1 text-[11px] text-violet-100">
            totale ordini
          </div>
        </div>
      </div>

      {/* Best seller */}
      <div className="backdrop-blur-md bg-white/70 rounded-2xl border border-white/60 px-4 py-4 shadow-md">
        <h2 className="text-sm font-semibold text-slate-800">
          Best seller
        </h2>
        {bestSellers.length === 0 ? (
          <p className="mt-2 text-xs text-slate-500">
            Nessun dato ancora. Completa qualche ordine per popolare questa sezione.
          </p>
        ) : (
          <div className="mt-3 space-y-2 text-xs">
            {bestSellers.map(([productId, stats]) => (
              <div
                key={productId}
                className="flex items-center justify-between rounded-xl border border-white/70 bg-white/80 px-3 py-2 shadow-sm"
              >
                <div>
                  <div className="font-semibold text-slate-800">
                    {productNameMap.get(productId) || `Prodotto #${productId}`}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {stats.quantity} pezzi venduti
                  </div>
                </div>
                <div className="text-right text-[11px] text-slate-600">
                  <div>€ {stats.revenue.toFixed(2)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
