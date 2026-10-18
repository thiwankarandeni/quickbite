// A Server Component (no "use client"): it renders to HTML on the server and
// ships no JavaScript of its own. It receives data through props.
import Image from "next/image";
import Link from "next/link";

import { formatPrice } from "@/lib/format";
import type { MenuItem } from "@/lib/types";

import { AddToCartButton } from "./AddToCartButton";

export function MenuItemCard({ item }: { item: MenuItem }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
      <Link href={`/menu/${item.id}`} className="relative block aspect-[4/3] bg-stone-100">
        {item.image_url && (
          // next/image: lazy-loads, resizes and serves modern formats automatically.
          // `fill` + `sizes` makes it cover the parent box responsively.
          <Image
            src={item.image_url}
            alt={item.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
          />
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/menu/${item.id}`} className="font-semibold hover:text-orange-600">
            {item.name}
          </Link>
          <span className="font-semibold text-orange-600">{formatPrice(item.price)}</span>
        </div>
        <p className="flex-1 text-sm text-stone-600">{item.description}</p>
        <div className="flex justify-end">
          <AddToCartButton item={item} />
        </div>
      </div>
    </article>
  );
}
