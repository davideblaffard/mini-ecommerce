import { supabaseServer } from "@/lib/supabaseClient";
import { isAdminRequest } from "@/lib/adminAuth";
import { redirect } from "next/navigation";

type Order = {
  id: number;
  customer_name: string;
  customer_email: string;
  address: string;
  created_at: string;
};

type OrderItem = {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
};

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  if (!isAdminRequest()) {
    redirect("/admin/login");
  }

  const [{ data: orders }, { data: items }, { data: products }] =
    await Promise.all([
      supabaseServer
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false }),
      supabaseServer.from("order_items").select("*"),
      supabaseServer.from("products").select("id, name")
    ]);

  const safeOrders: Order[] = orders || [];
  const safeItems: OrderItem[] = (items || []).map((i: any) => ({
    ...i,
    unit_price: Number(i.unit_price)
  }));
  const productsMap = new Map<number, string>();
  (products || []).forEach((p: any) => {
    productsMap.set(p.id, p.name);
  });

  const itemsByOrderId = new Map<number, OrderItem[]>();
  for (const item of safeItems) {
    if (!itemsByOrderId.has(item.order_id)) {
      itemsByOrderId.set(item.order_id, []);
    }
    itemsByOrderId.get(item.order_id)!.push(item);
  }

  return (
    <div className="space-y-4">
      <div className="backdrop-blur-md bg-white/70 rounded-2xl border border-white/60 px-4 py-3 shadow-lg">
        <h1 className="text-lg font-semibold">Ordini</h1>
        <p className="mt-1 text-xs text-slate-500">
          Elenco degli ordini effettuati tramite il checkout simulato.
        </p>
      </div>

      {safeOrders.length === 0 ? (
        <div className="backdrop-blur-md bg-white/70 rounded-2xl border border-dashed border-slate-300 px-4 py-6 text-sm text-slate-500 shadow">
          Nessun ordine ancora. Completa un checkout dal frontend per vedere
          qualcosa qui.
        </div>
      ) : (
        <div className="space-y-3">
          {safeOrders.map((order) => {
            const orderItems = itemsByOrderId.get(order.id) || [];
            const total = orderItems.reduce(
              (acc, i) => acc + i.quantity * i.unit_price,
              0
            );

            return (
              <div
                key={order.id}
                className="backdrop-blur-md bg-white/70 rounded-2xl border border-white/60 px-4 py-3 text-sm shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Ordine #{order.id}
                    </div>
                    <div className="mt-1 text-sm font-semibold">
                      {order.customer_name}
                    </div>
                    <div className="text-xs text-slate-500">
                      {order.customer_email}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {order.address}
                    </div>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    <div>
                      {new Date(order.created_at).toLocaleDateString("it-IT", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric"
                      })}
                    </div>
                    <div>
                      {new Date(order.created_at).toLocaleTimeString("it-IT", {
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </div>
                    <div className="mt-2 text-sm font-semibold text-slate-900">
                      Totale: € {total.toFixed(2)}
                    </div>
                  </div>
                </div>

                {orderItems.length > 0 && (
                  <div className="mt-3 rounded-xl bg-white/80 border border-white/70 px-3 py-2 text-xs shadow-inner">
                    <div className="mb-1 text-[11px] font-semibold text-slate-500">
                      Articoli
                    </div>
                    <ul className="space-y-1">
                      {orderItems.map((item) => (
                        <li
                          key={item.id}
                          className="flex items-center justify-between"
                        >
                          <span className="text-slate-700">
                            {productsMap.get(item.product_id) ||
                              `Prodotto #${item.product_id}`}
                          </span>
                          <span className="text-slate-500">
                            x{item.quantity} · € {item.unit_price.toFixed(2)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
