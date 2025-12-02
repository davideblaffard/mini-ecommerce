import { supabaseServer } from "@/lib/supabaseClient";
import { isAdminRequest } from "@/lib/adminAuth";
import { redirect } from "next/navigation";
import AdminDashboardClient from "../AdminDashboardClient";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  if (!isAdminRequest()) {
    redirect("/admin/login");
  }

  const [{ data: products }, { data: categories }] = await Promise.all([
    supabaseServer
      .from("products")
      .select("*")
      .order("created_at", { ascending: false }),
    supabaseServer
      .from("categories")
      .select("*")
      .order("name", { ascending: true })
  ]);

  return (
    <AdminDashboardClient
      initialProducts={products || []}
      initialCategories={categories || []}
    />
  );
}
