"use client";
import Link from "next/link";

import { useCart } from "@/context/CartContext";

export function CartLink() {
  const { count } = useCart();
  return (
    <Link
      href="/cart"
      className="relative rounded-full bg-stone-900 px-4 py-1.5 text-sm font-medium text-white hover:bg-stone-700"
    >
      Cart
      {count > 0 && (
        <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1 text-xs">
          {count}
        </span>
      )}
    </Link>
  );
}
