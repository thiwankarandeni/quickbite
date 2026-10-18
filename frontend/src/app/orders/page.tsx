import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { getMyOrders } from "@/lib/data";
import { formatDate, formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "My orders" };

export default function OrdersPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-3xl font-bold">My orders</h1>
      <Suspense fallback={<div className="h-48 animate-pulse rounded-2xl bg-stone-200" />}>
        <OrderList />
      </Suspense>
    </div>
  );
}

async function OrderList() {
  const orders = await getMyOrders();

  if (orders.length === 0) {
    return (
      <p className="text-stone-600">
        No orders yet.{" "}
        <Link href="/menu" className="text-orange-600 hover:underline">
          Order something!
        </Link>
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {orders.map((order) => (
        <li key={order.id}>
          <Link
            href={`/orders/${order.id}`}
            className="flex items-center justify-between gap-4 rounded-2xl border border-stone-200 bg-white p-4 hover:border-orange-300"
          >
            <div>
              <p className="font-medium">
                {order.items.map((i) => `${i.quantity}× ${i.name}`).join(", ")}
              </p>
              <p className="text-sm text-stone-500">{formatDate(order.created_at)}</p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className="font-semibold">{formatPrice(order.total)}</span>
              <OrderStatusBadge status={order.status} />
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
