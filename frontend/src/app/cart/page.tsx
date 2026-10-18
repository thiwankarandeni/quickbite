// The page itself is a Server Component that just sets metadata and renders
// <CartView/>, a Client Component, because the cart lives in browser state.
import type { Metadata } from "next";

import { CartView } from "./CartView";

export const metadata: Metadata = { title: "Cart" };

export default function CartPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-3xl font-bold">Your cart</h1>
      <CartView />
    </div>
  );
}
