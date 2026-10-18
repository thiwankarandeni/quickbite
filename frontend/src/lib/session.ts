// Session helpers: everything about "who is logged in" lives here.
// This is the "Data Access Layer" pattern from the Next.js auth docs: one place
// that reads the cookie and verifies it, instead of scattering cookie code around.
import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { api, ApiError } from "./api";
import type { User } from "./types";

export const SESSION_COOKIE = "session";

export async function getToken(): Promise<string | undefined> {
  return (await cookies()).get(SESSION_COOKIE)?.value;
}

export async function setSession(token: string) {
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true, // JavaScript in the browser can't read it, which protects it from XSS
    secure: process.env.NODE_ENV === "production", // HTTPS only in production
    sameSite: "lax", // not sent on cross-site POSTs, which helps against CSRF
    path: "/",
    maxAge: 60 * 60 * 24, // 1 day, matching JWT_EXPIRE_MINUTES in the backend
  });
}

export async function clearSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

// React's cache() de-duplicates calls within ONE request: if the navbar and the
// page both call getCurrentUser(), the backend is only asked once.
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const token = await getToken();
  if (!token) return null;
  try {
    // The backend verifies the JWT signature and expiry. We trust its answer.
    return await api<User>("/auth/me", { token });
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) return null; // expired/invalid token
    throw e;
  }
});

// For pages and actions that need a logged-in user.
export async function requireUser(): Promise<{ user: User; token: string }> {
  const user = await getCurrentUser();
  const token = await getToken();
  if (!user || !token) redirect("/login");
  return { user, token };
}

export async function requireAdmin(): Promise<{ user: User; token: string }> {
  const session = await requireUser();
  if (session.user.role !== "admin") redirect("/");
  return session;
}
