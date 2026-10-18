import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { getOrder } from "@/lib/data";
import { capitalize, formatDate, formatPrice } from "@/lib/format";

import { RefreshButton } from "./RefreshButton";

export default function OrderPage({ params, searchParams }: PageProps<"/orders/[id]">) {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/orders" className="text-sm text-stone-500 hover:text-orange-600">
        ← All orders
      </Link>
      <Suspense fallback={<div className="h-96 animate-pulse rounded-2xl bg-stone-200" />}>
        <OrderDetails params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function OrderDetails({
  params,
  searchParams,
}: Pick<PageProps<"/orders/[id]">, "params" | "searchParams">) {
  // Await both promises in parallel.
  const [{ id }, { placed }] = await Promise.all([params, searchParams]);
  const order = await getOrder(id);
  if (!order) notFound();

  return (
    <div className="space-y-6">
      {placed && (
        <div className="rounded-2xl bg-green-50 p-4 text-green-800">
          🎉 Order placed! We&apos;ll start preparing it shortly.
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Order #{order.id.slice(-6).toUpperCase()}</h1>
          <p className="text-sm text-stone-500">{formatDate(order.created_at)}</p>
        </div>
        <div className="flex items-center gap-3">
          <OrderStatusBadge status={order.status} />
          <RefreshButton />
        </div>
      </div>

      <section className="rounded-2xl border border-stone-200 bg-white p-5">
        <ul className="space-y-2">
          {order.items.map((item) => (
            <li key={item.menu_item_id} className="flex justify-between">
              <span>
                {item.quantity} × {item.name}
              </span>
              <span>{formatPrice(item.price * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex justify-between border-t border-stone-200 pt-3 text-lg font-bold">
          <span>Total</span>
          <span>{formatPrice(order.total)}</span>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <h2 className="mb-1 font-semibold">Delivery address</h2>
          <p className="whitespace-pre-line text-stone-600">{order.delivery_address}</p>
          {order.notes && <p className="mt-2 text-sm text-stone-500">Notes: {order.notes}</p>}
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
          <h2 className="mb-2 font-semibold">Status history</h2>
          {/* status_history is the array the backend grows with MongoDB's $push */}
          <ol className="space-y-1 text-sm">
            {order.status_history.map((h, i) => (
              <li key={i} className="flex justify-between gap-2">
                <span>{capitalize(h.status)}</span>
                <span className="text-stone-500">{formatDate(h.at)}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  );
}
