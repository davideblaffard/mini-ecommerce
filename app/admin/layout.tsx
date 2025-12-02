"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useState } from "react";

const navItems = [
  { href: "/admin/products", label: "Prodotti" },
  { href: "/admin/orders", label: "Ordini" },
  { href: "/admin/analytics", label: "Analytics" }
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await fetch("/api/admin/logout", {
        method: "POST"
      });
      // Dopo il logout ti porto alla pagina di login
      router.push("/admin/login");
    } catch (e) {
      console.error(e);
      setLoggingOut(false);
    }
  };

  return (
    <div className="mt-4 flex gap-4 px-4">
      {/* Sidebar */}
      <aside className="hidden w-56 shrink-0 flex-col rounded-2xl border border-white/60 bg-white/70 px-4 py-5 text-sm text-slate-700 shadow-lg backdrop-blur-md md:flex">
        <div className="mb-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Admin
          </div>
          <div className="mt-1 text-sm font-semibold text-slate-900">
            Dashboard
          </div>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "flex items-center justify-between rounded-xl px-3 py-2 text-xs transition",
                  active
                    ? "bg-slate-900 text-white shadow-md"
                    : "text-slate-600 hover:bg-white/80 hover:text-slate-900"
                ].join(" ")}
              >
                <span>{item.label}</span>
                {active && (
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-300" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-3 pt-4">
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full rounded-xl bg-slate-900 px-3 py-2 text-xs font-medium text-white shadow hover:bg-slate-800 disabled:opacity-60"
          >
            {loggingOut ? "Logout..." : "Logout admin"}
          </button>

          <div className="text-[11px] text-slate-500">
            Login sicuro via cookie HttpOnly.
          </div>
        </div>
      </aside>

      <main className="flex-1">{children}</main>
    </div>
  );
}
