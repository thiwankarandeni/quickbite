// Filtering with plain links: the selected category lives in the URL
// (/menu?category=pizza). URL state is shareable, bookmarkable, and needs no useState.
import Link from "next/link";

import { capitalize } from "@/lib/format";

export function CategoryFilter({
  categories,
  active,
}: {
  categories: string[];
  active?: string;
}) {
  const pill = (selected: boolean) =>
    `rounded-full px-4 py-1.5 text-sm font-medium transition ${
      selected ? "bg-orange-500 text-white" : "bg-white text-stone-700 hover:bg-orange-50 border border-stone-200"
    }`;

  return (
    <div className="flex flex-wrap gap-2">
      <Link href="/menu" className={pill(!active)}>
        All
      </Link>
      {categories.map((c) => (
        <Link key={c} href={`/menu?category=${c}`} className={pill(active === c)}>
          {capitalize(c)}
        </Link>
      ))}
    </div>
  );
}
