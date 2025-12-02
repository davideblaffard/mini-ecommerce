import ProductCard from "@/components/ProductCard";
import { supabaseServer } from "@/lib/supabaseClient";

export const revalidate = 60;

export default async function HomePage() {
  const [{ data: products }, { data: categories }] = await Promise.all([
    supabaseServer
      .from("products")
      .select("*, categories(name)")
      .order("created_at", { ascending: false }),
    supabaseServer
      .from("categories")
      .select("*")
      .order("name", { ascending: true })
  ]);

  const safeProducts = products || [];
  const safeCategories = categories || [];

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-violet-700 px-6 py-8 text-white shadow-xl">
        <h1 className="text-2xl font-semibold tracking-tight">
          MiniShop Glass
        </h1>
        <p className="mt-2 text-sm text-slate-200 max-w-xl">
          Demo e-commerce full-stack con Next.js & Supabase. Aggiungi prodotti
          dal pannello admin, gioca con le categorie e prova il checkout
          simulato.
        </p>
      </section>

      {/* Filtri categorie (solo UI client-side, ma utile per UX) */}
      <section className="backdrop-blur-md bg-white/60 rounded-2xl border border-white/60 shadow-lg px-4 py-3">
        {safeCategories.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-600 mr-1">Categorie:</span>
            {safeCategories.map((c) => (
              <span
                key={c.id}
                className="inline-flex items-center gap-1 rounded-full border border-white/70 bg-white/80 px-3 py-1 text-[11px] text-slate-700 shadow-sm"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                {c.name}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500">
            Nessuna categoria ancora definita. Aggiungile dalla sezione admin.
          </p>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {safeProducts.length ? (
          safeProducts.map((p: any) => (
            <div
              key={p.id}
              className="backdrop-blur-md bg-white/70 rounded-2xl border border-white/60 shadow-md"
            >
              <ProductCard
                id={p.id}
                name={p.name}
                price={Number(p.price)}
                description={p.description}
                image_url={p.image_url}
              />
            </div>
          ))
        ) : (
          <div className="col-span-full rounded-2xl border border-dashed border-slate-300 bg-white/60 p-6 text-sm text-slate-500">
            Nessun prodotto disponibile. Accedi come admin e creane uno.
          </div>
        )}
      </section>
    </div>
  );
}
