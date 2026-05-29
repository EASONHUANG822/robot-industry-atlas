import "server-only";
import { cookies } from "next/headers";

const COOKIE_NAME = "admin_session";
const SESSION_VALUE = "authenticated";

export function validateCredentials(username: string, password: string) {
  const expectedUser = process.env.ADMIN_USERNAME;
  const expectedPass = process.env.ADMIN_PASSWORD;

  if (!expectedUser || !expectedPass) {
    return { ok: false as const, error: "Admin credentials not configured." };
  }

  if (username !== expectedUser || password !== expectedPass) {
    return { ok: false as const, error: "Invalid username or password." };
  }

  return { ok: true as const };
}

export async function setAdminSession() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, SESSION_VALUE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 hours
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function validateAdminSession(): Promise<{ ok: true } | { ok: false; error: string }> {
  const cookieStore = await cookies();
  const session = cookieStore.get(COOKIE_NAME);

  if (!session || session.value !== SESSION_VALUE) {
    return { ok: false as const, error: "Unauthorized." };
  }

  return { ok: true };
}
