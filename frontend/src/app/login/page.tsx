import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <div className="mx-auto max-w-sm space-y-6">
      <h1 className="text-center text-3xl font-bold">Welcome back</h1>
      <Suspense fallback={<div className="h-72 animate-pulse rounded-2xl bg-stone-200" />}>
        <LoginForm searchParams={searchParams} />
      </Suspense>
      <p className="text-center text-xs text-stone-500">
        Demo admin: admin@example.com / admin123 (after running seed.py)
      </p>
    </div>
  );
}

// ?next=/checkout is set by proxy.ts so we can return the user where they were going.
async function LoginForm({ searchParams }: { searchParams: PageProps<"/login">["searchParams"] }) {
  const { next } = await searchParams;
  return <AuthForm mode="login" next={typeof next === "string" ? next : undefined} />;
}
