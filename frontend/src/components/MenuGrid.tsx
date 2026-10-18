import type { MenuItem } from "@/lib/types";

import { MenuItemCard } from "./MenuItemCard";

export function MenuGrid({ items }: { items: MenuItem[] }) {
  // Conditional rendering: return early when there's nothing to show.
  if (items.length === 0) {
    return <p className="py-12 text-center text-stone-500">No dishes found.</p>;
  }
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {/* List rendering: every item needs a stable, unique `key` so React can
          tell which items changed between renders. Use an id, not the array index. */}
      {items.map((item) => (
        <MenuItemCard key={item.id} item={item} />
      ))}
    </div>
  );
}

export function MenuGridSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="h-80 animate-pulse rounded-2xl bg-stone-200" />
      ))}
    </div>
  );
}
