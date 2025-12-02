import { supabaseServer } from "@/lib/supabaseClient";
import { notFound } from "next/navigation";
import ProductDetailClient from "./ProductDetailClient";

type Props = {
  params: { id: string };
};

export default async function ProductPage({ params }: Props) {
  const id = Number(params.id);
  if (Number.isNaN(id)) notFound();

  const { data: product } = await supabaseServer
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (!product) notFound();

  return <ProductDetailClient product={product} />;
}
