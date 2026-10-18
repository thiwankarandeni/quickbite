import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { updateMenuItemAction } from "@/app/actions/admin";
import { getCategories, getMenuItem } from "@/lib/data";
import { requireAdmin } from "@/lib/session";

import { MenuItemForm } from "../../MenuItemForm";

export const metadata: Metadata = { title: "Edit menu item" };

export default function EditMenuItemPage({ params }: PageProps<"/admin/menu/[id]/edit">) {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Edit menu item</h1>
      <Suspense fallback={<div className="h-96 max-w-xl animate-pulse rounded-2xl bg-stone-200" />}>
        <EditForm params={params} />
      </Suspense>
    </div>
  );
}

async function EditForm({ params }: { params: PageProps<"/admin/menu/[id]/edit">["params"] }) {
  await requireAdmin();
  const { id } = await params;
  const [item, categories] = await Promise.all([getMenuItem(id), getCategories()]);
  if (!item) notFound();

  // bind() fills in the `id` argument, so the form only needs to supply (prevState, formData).
  return <MenuItemForm action={updateMenuItemAction.bind(null, item.id)} categories={categories} item={item} />;
}
