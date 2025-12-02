import { supabaseServer } from "@/lib/supabaseClient";
import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/adminAuth";
import { simpleRateLimit } from "@/lib/rateLimit";
import { z } from "zod";

const createUpdateSchema = z.object({
  action: z.enum(["create", "update", "delete"]),
  id: z.number().optional(),
  name: z.string().min(1).max(255).optional(),
  description: z.string().min(1).max(2000).optional(),
  price: z.number().nonnegative().optional(),
  image_url: z.string().url().or(z.literal("")).optional(),
  stock: z.number().int().nonnegative().optional(),
  category_id: z.number().int().positive().optional()
});

export async function POST(req: Request) {
  if (!isAdminRequest()) {
    return NextResponse.json({ message: "Non autorizzato." }, { status: 401 });
  }

  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const rate = simpleRateLimit(`admin_products_${ip}`, 20, 60_000);
  if (!rate.ok) {
    return NextResponse.json(
      { message: "Troppi tentativi, riprova tra poco." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = createUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Dati non validi", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const payload = parsed.data;

  try {
    if (payload.action === "delete") {
      if (!payload.id) {
        return NextResponse.json(
          { message: "ID richiesto per cancellazione." },
          { status: 400 }
        );
      }
      await supabaseServer.from("products").delete().eq("id", payload.id);
    } else if (payload.action === "create") {
      if (
        !payload.name ||
        !payload.description ||
        payload.price === undefined ||
        payload.stock === undefined
      ) {
        return NextResponse.json(
          { message: "Campi richiesti mancanti." },
          { status: 400 }
        );
      }

      await supabaseServer.from("products").insert({
        name: payload.name,
        description: payload.description,
        price: payload.price,
        image_url: payload.image_url || null,
        stock: payload.stock,
        category_id: payload.category_id ?? null
      });
    } else if (payload.action === "update") {
      if (!payload.id) {
        return NextResponse.json(
          { message: "ID richiesto per aggiornamento." },
          { status: 400 }
        );
      }

      const updateData: any = {};
      if (payload.name !== undefined) updateData.name = payload.name;
      if (payload.description !== undefined)
        updateData.description = payload.description;
      if (payload.price !== undefined) updateData.price = payload.price;
      if (payload.image_url !== undefined)
        updateData.image_url = payload.image_url || null;
      if (payload.stock !== undefined) updateData.stock = payload.stock;
      if (payload.category_id !== undefined)
        updateData.category_id = payload.category_id ?? null;

      await supabaseServer
        .from("products")
        .update(updateData)
        .eq("id", payload.id);
    }

    const { data: products } = await supabaseServer
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    return NextResponse.json({ products: products || [] });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { message: "Errore interno server." },
      { status: 500 }
    );
  }
}
