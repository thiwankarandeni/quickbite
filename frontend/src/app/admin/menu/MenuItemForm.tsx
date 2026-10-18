"use client";
// Shared by "new" and "edit". When editing, `item` pre-fills the fields with
// defaultValue (uncontrolled inputs).
import Link from "next/link";
import { useActionState } from "react";

import { FormError } from "@/components/FormError";
import { SubmitButton } from "@/components/SubmitButton";
import { capitalize } from "@/lib/format";
import type { ActionState, MenuItem } from "@/lib/types";

type Props = {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  categories: string[];
  item?: MenuItem;
};

export function MenuItemForm({ action, categories, item }: Props) {
  const [state, formAction] = useActionState(action, undefined);

  return (
    <form action={formAction} className="max-w-xl space-y-4 rounded-2xl border border-stone-200 bg-white p-6">
      <label className="block space-y-1">
        <span className="text-sm font-medium">Name</span>
        <input name="name" required defaultValue={item?.name} className="field" />
      </label>
      <label className="block space-y-1">
        <span className="text-sm font-medium">Description</span>
        <textarea name="description" rows={3} defaultValue={item?.description} className="field" />
      </label>
      <div className="grid grid-cols-2 gap-4">
        <label className="block space-y-1">
          <span className="text-sm font-medium">Price (USD)</span>
          <input
            name="price"
            type="number"
            step="0.01"
            min="0.01"
            required
            defaultValue={item?.price}
            className="field"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Category</span>
          <select name="category" defaultValue={item?.category ?? categories[0]} className="field">
            {categories.map((c) => (
              <option key={c} value={c}>
                {capitalize(c)}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="block space-y-1">
        <span className="text-sm font-medium">Image URL</span>
        <input
          name="image_url"
          type="url"
          placeholder="https://…"
          defaultValue={item?.image_url ?? ""}
          className="field"
        />
      </label>
      <label className="flex items-center gap-2">
        <input name="available" type="checkbox" defaultChecked={item?.available ?? true} />
        <span className="text-sm">Available to order</span>
      </label>

      <FormError message={state?.error} />
      <div className="flex items-center gap-4">
        <SubmitButton pendingText="Saving…">{item ? "Save changes" : "Create item"}</SubmitButton>
        <Link href="/admin/menu" className="text-stone-600 hover:underline">
          Cancel
        </Link>
      </div>
    </form>
  );
}
