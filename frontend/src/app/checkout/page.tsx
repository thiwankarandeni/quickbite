import type { Metadata } from "next";
import { Suspense } from "react";

import { requireUser } from "@/lib/session";

import { CheckoutForm } from "./CheckoutForm";

export const metadata: Metadata = { title: "Checkout" };

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="text-3xl font-bold">Checkout</h1>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-stone-200" />}>
        <AuthedCheckout />
      </Suspense>
    </div>
  );
}

// Verifies the session (proxy.ts only checked that a cookie exists), then hands
// the user's name to the Client Component as a prop.
async function AuthedCheckout() {
  const { user } = await requireUser();
  return <CheckoutForm customerName={user.name} />;
}
