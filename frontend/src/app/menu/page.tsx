// Menu page: "/menu" and "/menu?category=pizza"
//
// `searchParams` is a Promise (it's request data). We pass the promise down
// and await it INSIDE the Suspense boundary, so the heading still prerenders
// into the static shell and only the list waits for the request.
import type { Metadata } from "next";
import { Suspense } from "react";

import { CategoryFilter } from "@/components/CategoryFilter";
import { MenuGrid, MenuGridSkeleton } from "@/components/MenuGrid";
import { getCategories, getMenu } from "@/lib/data";

export const metadata: Metadata = { title: "Menu" };

export default function MenuPage({ searchParams }: PageProps<"/menu">) {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Our menu</h1>
      <Suspense fallback={<MenuGridSkeleton />}>
        <FilteredMenu searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function FilteredMenu({ searchParams }: { searchParams: PageProps<"/menu">["searchParams"] }) {
  const { category } = await searchParams;
  const active = typeof category === "string" ? category : undefined;

  // Promise.all runs both requests in PARALLEL instead of one after the other.
  const [categories, items] = await Promise.all([getCategories(), getMenu({ category: active })]);

  return (
    <div className="space-y-6">
      <CategoryFilter categories={categories} active={active} />
      <MenuGrid items={items} />
    </div>
  );
}
