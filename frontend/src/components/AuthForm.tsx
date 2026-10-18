"use client";
// One form component reused by /login and /register. `mode` changes which
// fields appear and which Server Action is called.
import Link from "next/link";
import { useActionState } from "react";

import { loginAction, registerAction } from "@/app/actions/auth";
import type { ActionState } from "@/lib/types";

import { FormError } from "./FormError";
import { SubmitButton } from "./SubmitButton";

export function AuthForm({ mode, next }: { mode: "login" | "register"; next?: string }) {
  const action = mode === "login" ? loginAction : registerAction;
  const [state, formAction] = useActionState<ActionState, FormData>(action, undefined);
  const isLogin = mode === "login";

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6">
      {!isLogin && (
        <label className="block space-y-1">
          <span className="text-sm font-medium">Name</span>
          <input name="name" required className="field" autoComplete="name" />
        </label>
      )}
      <label className="block space-y-1">
        <span className="text-sm font-medium">Email</span>
        <input name="email" type="email" required className="field" autoComplete="email" />
      </label>
      <label className="block space-y-1">
        <span className="text-sm font-medium">Password</span>
        <input
          name="password"
          type="password"
          required
          minLength={6}
          className="field"
          autoComplete={isLogin ? "current-password" : "new-password"}
        />
      </label>
      {next && <input type="hidden" name="next" value={next} />}

      <FormError message={state?.error} />
      <SubmitButton pendingText={isLogin ? "Logging in…" : "Creating account…"} className="w-full">
        {isLogin ? "Log in" : "Create account"}
      </SubmitButton>

      <p className="text-center text-sm text-stone-600">
        {isLogin ? "New here? " : "Already have an account? "}
        <Link href={isLogin ? "/register" : "/login"} className="font-medium text-orange-600 hover:underline">
          {isLogin ? "Create an account" : "Log in"}
        </Link>
      </p>
    </form>
  );
}
