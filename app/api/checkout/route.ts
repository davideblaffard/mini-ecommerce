import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseClient";
import { z } from "zod";
import { simpleRateLimit } from "@/lib/rateLimit";

const checkoutSchema = z.object({
  customer_name: z.string().min(1).max(255),
  customer_email: z.string().email().max(255),
  address: z.string().min(5).max(500),
  items: z
    .array(
      z.object({
        product_id: z.number().int().positive(),
        quantity: z.number().int().positive(),
        unit_price: z.number().nonnegative() // lo ignoriamo per sicurezza, usiamo il prezzo da DB
      })
    )
    .min(1)
});

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const rate = simpleRateLimit(`checkout_${ip}`, 5, 60_000);
  if (!rate.ok) {
    return NextResponse.json(
      { message: "Troppi tentativi di checkout, riprova tra poco." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Dati non validi", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { customer_name, customer_email, address, items } = parsed.data;

  try {
    // 1) Recupero prodotti dal DB
    const productIds = Array.from(
      new Set(items.map((i) => i.product_id))
    );

    const { data: products, error: productsError } = await supabaseServer
      .from("products")
      .select("id, name, price, stock")
      .in("id", productIds);

    if (productsError || !products) {
      console.error("Supabase products error:", productsError);
      return NextResponse.json(
        { message: "Errore nel recupero prodotti." },
        { status: 500 }
      );
    }

    // 2) Mappiamo prodotti per id per accesso veloce
    const productMap = new Map<number, { id: number; name: string; price: number; stock: number }>();
    for (const p of products) {
      productMap.set(p.id, {
        id: p.id,
        name: p.name,
        price: Number(p.price),
        stock: Number(p.stock ?? 0)
      });
    }

    // 3) Validazione stock lato server
    for (const item of items) {
      const product = productMap.get(item.product_id);
      if (!product) {
        return NextResponse.json(
          { message: `Prodotto ID ${item.product_id} non trovato.` },
          { status: 400 }
        );
      }

      if (product.stock <= 0) {
        return NextResponse.json(
          { message: `Il prodotto "${product.name}" è esaurito.` },
          { status: 400 }
        );
      }

      if (item.quantity > product.stock) {
        return NextResponse.json(
          {
            message: `Quantità richiesta per "${product.name}" superiore allo stock disponibile (${product.stock}).`
          },
          { status: 400 }
        );
      }
    }

    // 4) Creazione ordine
    const { data: order, error: orderError } = await supabaseServer
      .from("orders")
      .insert({
        customer_name,
        customer_email,
        address
      })
      .select("id")
      .single();

    if (orderError || !order) {
      console.error(orderError);
      return NextResponse.json(
        { message: "Errore nella creazione dell'ordine." },
        { status: 500 }
      );
    }

    // 5) Creazione order_items usando il prezzo DB (non quello client)
    const orderItemsPayload = items.map((item) => {
      const product = productMap.get(item.product_id)!;
      return {
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: product.price
      };
    });

    const { error: itemsError } = await supabaseServer
      .from("order_items")
      .insert(orderItemsPayload);

    if (itemsError) {
      console.error(itemsError);
      return NextResponse.json(
        { message: "Errore nella creazione degli articoli d'ordine." },
        { status: 500 }
      );
    }

    // 6) Aggiornamento stock prodotti
    // (per semplicità facciamo un update per prodotto; per produzione useremmo una funzione SQL/transaction)
    for (const item of items) {
      const product = productMap.get(item.product_id)!;
      const newStock = product.stock - item.quantity;

      const { error: updateError } = await supabaseServer
        .from("products")
        .update({ stock: newStock })
        .eq("id", product.id);

      if (updateError) {
        console.error(
          `Errore aggiornamento stock per prodotto ${product.id}:`,
          updateError
        );
        // non abortiamo l'ordine perché è già creato, ma potresti loggare/monitorare
      }
    }

    return NextResponse.json({ ok: true, order_id: order.id });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { message: "Errore interno server." },
      { status: 500 }
    );
  }
}
