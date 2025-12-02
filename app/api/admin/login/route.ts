import { NextResponse } from "next/server";
import { simpleRateLimit } from "@/lib/rateLimit";
import { setAdminCookie } from "@/lib/adminAuth";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const rate = simpleRateLimit(`admin_login_${ip}`, 10, 60_000);
  if (!rate.ok) {
    return NextResponse.json(
      { message: "Troppi tentativi, riprova tra poco." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null) as { password?: string } | null;
  const password = body?.password;

  if (!password || !process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ message: "Credenziali mancanti." }, { status: 400 });
  }

  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ message: "Password errata." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  setAdminCookie();
  return res;
}
