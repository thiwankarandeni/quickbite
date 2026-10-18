"use server";
// "use server" at the top makes every export a Server Action: a function that
// runs ONLY on the server but can be called from a <form action={...}> or from
// client code. Next.js turns each call into a POST request for you.
//
// Each auth action: call FastAPI -> store the JWT in an httpOnly cookie -> redirect.

import { redirect } from "next/navigation";

import { api, ApiError } from "@/lib/api";
import { clearSession, setSession } from "@/lib/session";
import type { ActionState, User } from "@/lib/types";

type TokenResponse = { access_token: string; user: User };

// Only allow redirects to paths in this app ("/orders"), never to another
// site ("https://evil.com" or "//evil.com"). Otherwise this is an "open redirect" bug.
function safeNext(value: FormDataEntryValue | null): string {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/menu";
}

// With useActionState, the action receives (previousState, formData) and
// whatever it returns becomes the new state shown by the form.
export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const res = await api<TokenResponse>("/auth/login", {
      method: "POST",
      // FastAPI's OAuth2 login expects form fields "username" and "password".
      form: {
        username: String(formData.get("email") ?? ""),
        password: String(formData.get("password") ?? ""),
      },
    });
    await setSession(res.access_token);
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Could not reach the server" };
  }
  // redirect() works by throwing a special error, so call it OUTSIDE try/catch.
  redirect(safeNext(formData.get("next")));
}

export async function registerAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const res = await api<TokenResponse>("/auth/register", {
      method: "POST",
      json: {
        name: formData.get("name"),
        email: formData.get("email"),
        password: formData.get("password"),
      },
    });
    await setSession(res.access_token);
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Could not reach the server" };
  }
  redirect("/menu");
}

export async function logoutAction() {
  await clearSession();
  redirect("/");
}
