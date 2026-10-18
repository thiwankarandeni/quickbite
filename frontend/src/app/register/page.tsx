import type { Metadata } from "next";

import { AuthForm } from "@/components/AuthForm";

export const metadata: Metadata = { title: "Sign up" };

// No request data here, so this whole page is prerendered as static HTML.
export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-sm space-y-6">
      <h1 className="text-center text-3xl font-bold">Create your account</h1>
      <AuthForm mode="register" />
    </div>
  );
}
