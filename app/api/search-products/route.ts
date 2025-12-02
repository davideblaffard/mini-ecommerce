import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseClient";
import { z } from "zod";

const searchSchema = z.object({
  q: z.string().min(1).max(100)
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";

  const parsed = searchSchema.safeParse({ q });
  if (!parsed.success) {
    return NextResponse.json({ results: [] }, { status: 200 });
  }

  const term = `%${parsed.data.q}%`;

  const { data, error } = await supabaseServer
    .from("products")
    .select("id, name, price, image_url")
    .or(`name.ilike.${term},description.ilike.${term}`)
    .limit(6);

  if (error || !data) {
    console.error("Search error:", error);
    return NextResponse.json({ results: [] }, { status: 200 });
  }

  return NextResponse.json({ results: data });
}
