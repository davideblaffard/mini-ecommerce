import { cookies } from "next/headers";

const ADMIN_COOKIE_NAME = "admin_token";

export function isAdminRequest() {
  const cookieStore = cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return false;

  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;

  // Semplice confronto; in un progetto reale useresti un token firmato
  return token === expected;
}

export function setAdminCookie() {
  const cookieStore = cookies();
  if (!process.env.ADMIN_PASSWORD) {
    throw new Error("ADMIN_PASSWORD is not set");
  }

  cookieStore.set({
    name: ADMIN_COOKIE_NAME,
    value: process.env.ADMIN_PASSWORD,
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 60 * 60 * 8 // 8 ore
  });
}

export function clearAdminCookie() {
  const cookieStore = cookies();
  cookieStore.set({
    name: ADMIN_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: true,
    path: "/",
    maxAge: 0
  });
}
