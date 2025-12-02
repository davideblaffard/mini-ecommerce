import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseClient";
import { isAdminRequest } from "@/lib/adminAuth";
import { simpleRateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs"; // per sicurezza con upload file

export async function POST(req: Request) {
  if (!isAdminRequest()) {
    return NextResponse.json({ message: "Non autorizzato." }, { status: 401 });
  }

  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const rate = simpleRateLimit(`admin_upload_${ip}`, 20, 60_000);
  if (!rate.ok) {
    return NextResponse.json(
      { message: "Troppi upload, riprova tra poco." },
      { status: 429 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { message: "File mancante o non valido." },
        { status: 400 }
      );
    }

    // Controllo tipo base
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { message: "Tipo file non supportato. Usa JPG, PNG o WEBP." },
        { status: 400 }
      );
    }

    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data, error } = await supabaseServer.storage
      .from("product-images")
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false
      });

    if (error || !data) {
      console.error("Supabase upload error:", error);
      return NextResponse.json(
        { message: "Errore durante l'upload dell'immagine." },
        { status: 500 }
      );
    }

    const {
      data: { publicUrl }
    } = supabaseServer.storage
      .from("product-images")
      .getPublicUrl(data.path);

    return NextResponse.json({ url: publicUrl });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { message: "Errore interno durante l'upload." },
      { status: 500 }
    );
  }
}
