import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { getAllOrders } from "@/lib/data";
import { capitalize, formatDate, formatPrice } from "@/lib/format";
import { ORDER_STATUSES } from "@/lib/types";

import { StatusSelect } from "./StatusSelect";

export const metadata: Metadata = { title: "Manage orders" };

export default function AdminOrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Orders</h1>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-stone-200" />}>
        <OrdersTable searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function OrdersTable({ searchParams }: { searchParams: PageProps<"/admin/orders">["searchParams"] }) {
  const { status } = await searchParams;
  const active = typeof status === "string" ? status : undefined;
  const orders = await getAllOrders(active);

  const pill = (on: boolean) =>
    `rounded-full px-3 py-1 text-sm ${on ? "bg-stone-900 text-white" : "bg-white border border-stone-200 hover:bg-stone-100"}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Link href="/admin/orders" className={pill(!active)}>
          All
        </Link>
        {ORDER_STATUSES.map((s) => (
          <Link key={s} href={`/admin/orders?status=${s}`} className={pill(active === s)}>
            {capitalize(s)}
          </Link>
        ))}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-stone-600">
            <tr>
              <th className="p-3">Order</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Items</th>
              <th className="p-3">Total</th>
              <th className="p-3">Status</th>
              <th className="p-3">Change status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {orders.map((o) => (
              <tr key={o.id}>
                <td className="p-3">
                  <Link href={`/orders/${o.id}`} className="font-mono text-orange-600 hover:underline">
                    #{o.id.slice(-6).toUpperCase()}
                  </Link>
                  <div className="text-xs text-stone-500">{formatDate(o.created_at)}</div>
                </td>
                <td className="p-3">{o.customer_name}</td>
                <td className="p-3">{o.items.map((i) => `${i.quantity}× ${i.name}`).join(", ")}</td>
                <td className="p-3 font-medium">{formatPrice(o.total)}</td>
                <td className="p-3">
                  <OrderStatusBadge status={o.status} />
                </td>
                <td className="p-3">
                  <StatusSelect orderId={o.id} current={o.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && <p className="p-6 text-center text-stone-500">No orders.</p>}
      </div>
    </div>
  );
}
