import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const ADMIN_COOKIE_NAME = "admin_";

export async function POST() {
  const res = NextResponse.json({ ok: true });

  // Cancella il cookie admin
  res.cookies.set(ADMIN_COOKIE_NAME, "", {
    httpOnly: true,
    path: "/",
    maxAge: 0
  });

  return res;
}
