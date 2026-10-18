import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { deleteMenuItemAction } from "@/app/actions/admin";
import { getMenu } from "@/lib/data";
import { capitalize, formatPrice } from "@/lib/format";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Manage menu" };

export default function AdminMenuPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Menu items</h1>
        <Link
          href="/admin/menu/new"
          className="rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
        >
          + New item
        </Link>
      </div>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-stone-200" />}>
        <MenuTable />
      </Suspense>
    </div>
  );
}

async function MenuTable() {
  await requireAdmin(); // the menu itself is public, but this management page isn't
  const items = await getMenu({ includeUnavailable: true });

  return (
    <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-stone-200 bg-stone-50 text-stone-600">
          <tr>
            <th className="p-3">Name</th>
            <th className="p-3">Category</th>
            <th className="p-3">Price</th>
            <th className="p-3">Available</th>
            <th className="p-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {items.map((item) => (
            <tr key={item.id}>
              <td className="p-3 font-medium">{item.name}</td>
              <td className="p-3">{capitalize(item.category)}</td>
              <td className="p-3">{formatPrice(item.price)}</td>
              <td className="p-3">{item.available ? "Yes" : "No"}</td>
              <td className="p-3">
                <div className="flex justify-end gap-3">
                  <Link href={`/admin/menu/${item.id}/edit`} className="text-orange-600 hover:underline">
                    Edit
                  </Link>
                  {/* .bind(null, item.id) pre-fills the action's first argument.
                      This works in a Server Component with no client JS at all. */}
                  <form action={deleteMenuItemAction.bind(null, item.id)}>
                    <button className="text-red-600 hover:underline">Delete</button>
                  </form>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
