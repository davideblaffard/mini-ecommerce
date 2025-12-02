import { supabaseServer } from "@/lib/supabaseClient";
import { NextResponse } from "next/server";

type Params = { params: { id: string } };

export async function GET(_req: Request, { params }: Params) {
  const id = Number(params.id);
  if (Number.isNaN(id)) {
    return NextResponse.json({ message: "ID non valido" }, { status: 400 });
  }

  const { data, error } = await supabaseServer
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ message: "Prodotto non trovato" }, { status: 404 });
  }

  return NextResponse.json(data);
}
