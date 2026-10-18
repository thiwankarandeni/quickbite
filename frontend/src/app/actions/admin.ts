"use server";
// Admin Server Actions. Each one calls requireAdmin() first: the admin pages
// are hidden from customers, but anyone could still POST to these actions directly.
// (The FastAPI backend also checks the role, so there are two layers.)

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { api, ApiError } from "@/lib/api";
import { requireAdmin } from "@/lib/session";
import type { ActionState, OrderStatus } from "@/lib/types";

// Turn form fields into the JSON body FastAPI expects.
function menuItemFromForm(formData: FormData) {
  const imageUrl = String(formData.get("image_url") ?? "").trim();
  return {
    name: formData.get("name"),
    description: formData.get("description") ?? "",
    price: Number(formData.get("price")),
    category: formData.get("category"),
    image_url: imageUrl || null,
    // An unchecked checkbox is simply missing from FormData.
    available: formData.get("available") === "on",
  };
}

function refreshMenuPages() {
  // "layout" revalidates every page under that path, including /menu/[id] pages.
  revalidatePath("/menu", "layout");
  revalidatePath("/admin/menu");
  revalidatePath("/");
}

export async function createMenuItemAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { token } = await requireAdmin();
  try {
    await api("/menu", { method: "POST", token, json: menuItemFromForm(formData) });
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Could not save" };
  }
  refreshMenuPages();
  redirect("/admin/menu");
}

// The first argument (id) is pre-filled with .bind() in the page:
//   updateMenuItemAction.bind(null, item.id)
// That's how you pass extra, non-form data to a Server Action.
export async function updateMenuItemAction(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { token } = await requireAdmin();
  try {
    await api(`/menu/${id}`, { method: "PATCH", token, json: menuItemFromForm(formData) });
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Could not save" };
  }
  refreshMenuPages();
  redirect("/admin/menu");
}

export async function deleteMenuItemAction(id: string) {
  const { token } = await requireAdmin();
  await api(`/menu/${id}`, { method: "DELETE", token });
  refreshMenuPages();
}

export async function updateOrderStatusAction(formData: FormData) {
  const { token } = await requireAdmin();
  const orderId = String(formData.get("order_id"));
  const status = formData.get("status") as OrderStatus;
  await api(`/admin/orders/${orderId}/status`, { method: "PATCH", token, json: { status } });
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  revalidatePath(`/orders/${orderId}`);
}
