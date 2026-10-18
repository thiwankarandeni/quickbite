// Dynamic route: the folder name [id] means this page matches /menu/<anything>,
// and that value arrives as params.id.
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { AddToCartButton } from "@/components/AddToCartButton";
import { capitalize, formatPrice } from "@/lib/format";
import { getMenuItem } from "@/lib/data";

export default function MenuItemPage({ params }: PageProps<"/menu/[id]">) {
  return (
    <div className="space-y-6">
      <Link href="/menu" className="text-sm text-stone-500 hover:text-orange-600">
        ← Back to menu
      </Link>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-stone-200" />}>
        <MenuItemDetails params={params} />
      </Suspense>
    </div>
  );
}

async function MenuItemDetails({ params }: { params: PageProps<"/menu/[id]">["params"] }) {
  const { id } = await params;
  const item = await getMenuItem(id);
  if (!item) notFound(); // renders app/not-found.tsx

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-stone-100">
        {item.image_url && (
          <Image src={item.image_url} alt={item.name} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" priority />
        )}
      </div>
      <div className="space-y-4">
        <span className="text-sm font-medium uppercase tracking-wide text-orange-600">
          {capitalize(item.category)}
        </span>
        <h1 className="text-3xl font-bold">{item.name}</h1>
        <p className="text-stone-600">{item.description}</p>
        <p className="text-2xl font-semibold">{formatPrice(item.price)}</p>
        <AddToCartButton item={item} />
      </div>
    </div>
  );
}
