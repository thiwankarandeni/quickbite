import type { Metadata } from "next";
import { Suspense } from "react";

import { createMenuItemAction } from "@/app/actions/admin";
import { getCategories } from "@/lib/data";
import { requireAdmin } from "@/lib/session";

import { MenuItemForm } from "../MenuItemForm";

export const metadata: Metadata = { title: "New menu item" };

export default function NewMenuItemPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">New menu item</h1>
      <Suspense fallback={<div className="h-96 max-w-xl animate-pulse rounded-2xl bg-stone-200" />}>
        <NewForm />
      </Suspense>
    </div>
  );
}

async function NewForm() {
  await requireAdmin();
  const categories = await getCategories();
  // Passing a Server Action as a prop to a Client Component is allowed.
  return <MenuItemForm action={createMenuItemAction} categories={categories} />;
}
