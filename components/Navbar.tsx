"use client";

import Link from "next/link";
import { useCart } from "./CartContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type SearchResult = {
  id: number;
  name: string;
  price: number;
  image_url?: string | null;
};

export default function Navbar() {
  const { cartCount } = useCart();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }

    let active = true;
    setLoading(true);

    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search-products?q=${encodeURIComponent(query.trim())}`
        );
        if (!res.ok) {
          if (active) {
            setResults([]);
            setOpen(false);
          }
          return;
        }
        const data = await res.json();
        if (active) {
          setResults(data.results || []);
          setOpen((data.results || []).length > 0);
        }
      } catch (e) {
        console.error(e);
        if (active) {
          setResults([]);
          setOpen(false);
        }
      } finally {
        if (active) setLoading(false);
      }
    }, 300); // debounce

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [query]);

  const handleSelect = (id: number) => {
    setOpen(false);
    setQuery("");
    router.push(`/products/${id}`);
  };

  return (
    <nav className="w-full border-b border-white/40 bg-white/60 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link
          href="/"
          className="font-semibold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-violet-700"
        >
          MiniShop
        </Link>

        {/* Search + actions */}
        <div className="flex flex-1 items-center justify-end gap-4">
          {/* Search (desktop) */}
          <div className="relative hidden min-w-[220px] max-w-xs md:block">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cerca prodotti..."
              className="w-full rounded-full border border-white/70 bg-white/70 px-3 py-1.5 text-xs text-slate-800 shadow-sm outline-none placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-200"
            />
            {loading && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">
                ...
              </span>
            )}

            {open && results.length > 0 && (
              <div className="absolute left-0 right-0 z-20 mt-2 rounded-xl border border-white/70 bg-white/90 backdrop-blur-md shadow-lg text-xs">
                <ul className="max-h-72 overflow-auto">
                  {results.map((r) => (
                    <li
                      key={r.id}
                      className="flex cursor-pointer items-center gap-2 px-3 py-2 hover:bg-violet-50/80"
                      onClick={() => handleSelect(r.id)}
                    >
                      <div className="h-8 w-8 overflow-hidden rounded-md bg-slate-100">
                        {r.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={r.image_url}
                            alt={r.name}
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>
                      <div className="flex-1">
                        <div className="truncate">{r.name}</div>
                        <div className="text-[11px] text-slate-500">
                          € {Number(r.price).toFixed(2)}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Carrello / admin */}
          <div className="flex items-center gap-4 text-sm">
            <Link
              href="/cart"
              className="relative flex items-center gap-1 text-slate-700 hover:text-slate-900"
            >
              <span>Carrello</span>
              {cartCount > 0 && (
                <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-slate-900 px-1 text-xs text-white">
                  {cartCount}
                </span>
              )}
            </Link>
            <Link
              href="/admin/login"
              className="text-slate-500 hover:text-slate-900 text-xs"
            >
              Admin
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
