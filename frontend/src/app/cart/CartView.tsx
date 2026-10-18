"use client";
// Files next to page.tsx that aren't special names (page, layout, loading…)
// are NOT routes. This is a safe place for components used only by this page.
import Image from "next/image";
import Link from "next/link";

import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/format";

export function CartView() {
  const { lines, loaded, subtotal, setQuantity, removeItem } = useCart();

  if (!loaded) return <div className="h-40 animate-pulse rounded-2xl bg-stone-200" />;

  if (lines.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-300 py-16 text-center">
        <p className="text-stone-600">Your cart is empty.</p>
        <Link href="/menu" className="mt-4 inline-block font-semibold text-orange-600 hover:underline">
          Find something tasty →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ul className="divide-y divide-stone-200 rounded-2xl border border-stone-200 bg-white">
        {lines.map((line) => (
          <li key={line.id} className="flex items-center gap-4 p-4">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-stone-100">
              {line.image_url && <Image src={line.image_url} alt="" fill sizes="64px" className="object-cover" />}
            </div>
            <div className="flex-1">
              <p className="font-medium">{line.name}</p>
              <p className="text-sm text-stone-500">{formatPrice(line.price)} each</p>
            </div>
            <div className="flex items-center gap-2">
              {/* Event handlers: onClick receives a function, not a function call. */}
              <button
                onClick={() => setQuantity(line.id, line.quantity - 1)}
                className="h-8 w-8 rounded-full border border-stone-300 hover:bg-stone-100"
                aria-label={`Decrease ${line.name}`}
              >
                −
              </button>
              <span className="w-6 text-center">{line.quantity}</span>
              <button
                onClick={() => setQuantity(line.id, line.quantity + 1)}
                className="h-8 w-8 rounded-full border border-stone-300 hover:bg-stone-100"
                aria-label={`Increase ${line.name}`}
              >
                +
              </button>
            </div>
            <p className="w-20 text-right font-semibold">{formatPrice(line.price * line.quantity)}</p>
            <button
              onClick={() => removeItem(line.id)}
              className="text-sm text-stone-400 hover:text-red-600"
              aria-label={`Remove ${line.name}`}
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between">
        <p className="text-lg">
          Subtotal: <span className="font-bold">{formatPrice(subtotal)}</span>
        </p>
        <Link
          href="/checkout"
          className="rounded-full bg-orange-500 px-6 py-3 font-semibold text-white hover:bg-orange-600"
        >
          Checkout
        </Link>
      </div>
    </div>
  );
}
