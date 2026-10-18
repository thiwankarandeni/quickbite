"use client";
// A tiny Client Component inside a Server Component (MenuItemCard).
// Only this button ships JavaScript to the browser; the rest of the card is plain HTML.
// That is the main idea of Server Components: keep interactive parts small.

import { useState } from "react";

import { useCart } from "@/context/CartContext";
import type { MenuItem } from "@/lib/types";

export function AddToCartButton({ item }: { item: MenuItem }) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  function handleClick() {
    addItem(item);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  }

  return (
    <button
      onClick={handleClick}
      disabled={!item.available}
      className="rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-stone-300"
    >
      {!item.available ? "Sold out" : added ? "Added ✓" : "Add to cart"}
    </button>
  );
}
