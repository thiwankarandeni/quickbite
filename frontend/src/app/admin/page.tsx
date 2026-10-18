// Admin dashboard: numbers come from the MongoDB aggregation pipeline in
// backend/app/routers/admin.py (GET /admin/stats).
import type { Metadata } from "next";
import { Suspense } from "react";

import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { getStats } from "@/lib/data";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Admin" };

export default function AdminDashboard() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-stone-200" />}>
      <StatsView />
    </Suspense>
  );
}

async function StatsView() {
  const stats = await getStats(); // calls requireAdmin() internally

  const totalOrders = stats.by_status.reduce((s, x) => s + x.count, 0);
  const revenue = stats.by_status
    .filter((x) => x.status !== "cancelled")
    .reduce((s, x) => s + x.revenue, 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Total orders" value={String(totalOrders)} />
        <StatCard label="Revenue (excl. cancelled)" value={formatPrice(revenue)} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-2xl border border-stone-200 bg-white p-5">
          <h2 className="mb-3 font-semibold">Orders by status</h2>
          <ul className="space-y-2">
            {stats.by_status.map((s) => (
              <li key={s.status} className="flex items-center justify-between">
                <OrderStatusBadge status={s.status} />
                <span>
                  {s.count} · {formatPrice(s.revenue)}
                </span>
              </li>
            ))}
            {stats.by_status.length === 0 && <li className="text-stone-500">No orders yet.</li>}
          </ul>
        </section>
        <section className="rounded-2xl border border-stone-200 bg-white p-5">
          <h2 className="mb-3 font-semibold">Top 5 dishes</h2>
          <ol className="list-decimal space-y-1 pl-5">
            {stats.top_items.map((t) => (
              <li key={t.name}>
                {t.name} <span className="text-stone-500">({t.quantity} sold)</span>
              </li>
            ))}
          </ol>
          {stats.top_items.length === 0 && <p className="text-stone-500">No sales yet.</p>}
        </section>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5">
      <p className="text-sm text-stone-500">{label}</p>
      <p className="mt-1 text-3xl font-bold">{value}</p>
    </div>
  );
}
