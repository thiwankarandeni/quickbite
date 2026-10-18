// Home page: "/"
// The hero section is static, so it is prerendered at build time and served instantly.
// The featured dishes come from the API at request time, so they stream into a
// <Suspense> boundary, showing the skeleton fallback until they arrive.
import Link from "next/link";
import { Suspense } from "react";

import { MenuGrid, MenuGridSkeleton } from "@/components/MenuGrid";
import { getMenu } from "@/lib/data";

export default function HomePage() {
  return (
    <div className="space-y-12">
      <section className="rounded-3xl bg-gradient-to-br from-orange-500 to-amber-400 px-8 py-16 text-white">
        <h1 className="max-w-xl text-4xl font-bold sm:text-5xl">Hungry? Your food is a few clicks away.</h1>
        <p className="mt-4 max-w-lg text-lg text-orange-50">
          Burgers, pizza, salads and more, made fresh and delivered fast.
        </p>
        <Link
          href="/menu"
          className="mt-8 inline-block rounded-full bg-white px-6 py-3 font-semibold text-orange-600 hover:bg-orange-50"
        >
          Browse the menu
        </Link>
      </section>

      <section>
        <h2 className="mb-6 text-2xl font-bold">Popular right now</h2>
        <Suspense fallback={<MenuGridSkeleton />}>
          <FeaturedItems />
        </Suspense>
      </section>
    </div>
  );
}

// An async Server Component: it can `await` data directly. No useEffect, no
// loading state variables. The fetch runs on the server.
async function FeaturedItems() {
  const items = await getMenu();
  return <MenuGrid items={items.slice(0, 3)} />;
}
