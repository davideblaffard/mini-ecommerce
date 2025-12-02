import { supabaseServer } from "@/lib/supabaseClient";
import { NextResponse } from "next/server";

export async function GET() {
  const { data, error } = await supabaseServer
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { message: "Errore nel recupero prodotti" },
      { status: 500 }
    );
  }

  return NextResponse.json(data || []);
}
