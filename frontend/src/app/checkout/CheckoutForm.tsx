"use client";
// THE FULL ORDER FLOW (trace it!):
//   1. The form submits -> placeOrderAction runs on the Next.js server
//   2. The action POSTs to FastAPI /orders with the user's JWT
//   3. FastAPI looks up real prices in MongoDB, computes the total, inserts the order
//   4. The action returns { orderId } -> `state` updates here
//   5. useEffect sees the new orderId -> clears the cart -> navigates to the order page
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";

import { placeOrderAction } from "@/app/actions/orders";
import { FormError } from "@/components/FormError";
import { SubmitButton } from "@/components/SubmitButton";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/format";

export function CheckoutForm({ customerName }: { customerName: string }) {
  const { lines, loaded, subtotal, clear } = useCart();
  const router = useRouter();

  // useActionState(action, initialState) returns:
  //   state      - whatever the action last returned
  //   formAction - pass this to <form action>
  //   (a 3rd value, isPending, is also available. SubmitButton uses useFormStatus instead)
  const [state, formAction] = useActionState(placeOrderAction, undefined);

  // A CONTROLLED input: React state is the single source of truth for its value.
  const [address, setAddress] = useState("");

  // useRef holds a value that survives re-renders WITHOUT causing one.
  // We use it so the "order placed" effect only runs once: clear() changes the
  // cart, which re-creates `clear`, which would re-run this effect.
  const handledOrder = useRef<string | null>(null);

  useEffect(() => {
    if (state?.orderId && handledOrder.current !== state.orderId) {
      handledOrder.current = state.orderId;
      clear();
      router.push(`/orders/${state.orderId}?placed=1`);
    }
  }, [state, clear, router]);

  if (!loaded) return null;
  if (lines.length === 0 && !state?.orderId) {
    return (
      <p className="text-stone-600">
        Your cart is empty.{" "}
        <Link href="/menu" className="text-orange-600 hover:underline">
          Browse the menu
        </Link>
      </p>
    );
  }

  // Only ids and quantities go to the server. Prices are looked up there.
  const itemsPayload = JSON.stringify(lines.map((l) => ({ menu_item_id: l.id, quantity: l.quantity })));

  return (
    <form action={formAction} className="space-y-5 rounded-2xl border border-stone-200 bg-white p-6">
      <p className="text-stone-600">
        Ordering as <span className="font-medium text-stone-900">{customerName}</span>
      </p>

      <ul className="space-y-1 text-sm">
        {lines.map((l) => (
          <li key={l.id} className="flex justify-between">
            <span>
              {l.quantity} × {l.name}
            </span>
            <span>{formatPrice(l.price * l.quantity)}</span>
          </li>
        ))}
        <li className="flex justify-between border-t border-stone-200 pt-2 font-semibold">
          <span>Total</span>
          <span>{formatPrice(subtotal)}</span>
        </li>
      </ul>

      {/* Hidden inputs send extra data along with the form. */}
      <input type="hidden" name="items" value={itemsPayload} />

      <label className="block space-y-1">
        <span className="text-sm font-medium">Delivery address</span>
        <textarea
          name="delivery_address"
          required
          minLength={5}
          rows={2}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="field"
        />
        <span className="text-xs text-stone-500">{address.length}/300</span>
      </label>

      {/* An UNCONTROLLED input: the browser keeps the value; we read it from FormData on submit. */}
      <label className="block space-y-1">
        <span className="text-sm font-medium">Notes (optional)</span>
        <input name="notes" maxLength={300} placeholder="e.g. no onions" className="field" />
      </label>

      <FormError message={state?.error} />
      <SubmitButton pendingText="Placing order…" className="w-full">
        Place order
      </SubmitButton>
    </form>
  );
}
