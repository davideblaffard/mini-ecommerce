import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseClient";
import { isAdminRequest } from "@/lib/adminAuth";
import { simpleRateLimit } from "@/lib/rateLimit";
import { z } from "zod";

const categorySchema = z.object({
  action: z.enum(["create", "delete"]),
  id: z.number().int().positive().optional(),
  name: z.string().min(1).max(255).optional()
});

export async function POST(req: Request) {
  if (!isAdminRequest()) {
    return NextResponse.json({ message: "Non autorizzato." }, { status: 401 });
  }

  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const rate = simpleRateLimit(`admin_categories_${ip}`, 20, 60_000);
  if (!rate.ok) {
    return NextResponse.json(
      { message: "Troppi tentativi, riprova tra poco." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = categorySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Dati non validi", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const payload = parsed.data;

  try {
    if (payload.action === "create") {
      if (!payload.name) {
        return NextResponse.json(
          { message: "Nome categoria richiesto." },
          { status: 400 }
        );
      }

      await supabaseServer.from("categories").insert({
        name: payload.name
      });
    } else if (payload.action === "delete") {
      if (!payload.id) {
        return NextResponse.json(
          { message: "ID categoria richiesto per cancellazione." },
          { status: 400 }
        );
      }

      // Prima rimuoviamo il riferimento dai prodotti
      await supabaseServer
        .from("products")
        .update({ category_id: null })
        .eq("category_id", payload.id);

      await supabaseServer.from("categories").delete().eq("id", payload.id);
    }

    const { data: categories } = await supabaseServer
      .from("categories")
      .select("*")
      .order("name", { ascending: true });

    return NextResponse.json({ categories: categories || [] });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { message: "Errore interno server." },
      { status: 500 }
    );
  }
}
