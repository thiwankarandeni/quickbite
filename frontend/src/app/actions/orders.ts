"use server";

import { revalidatePath } from "next/cache";

import { api, ApiError } from "@/lib/api";
import { requireUser } from "@/lib/session";
import type { Order } from "@/lib/types";

export type PlaceOrderState = { error?: string; orderId?: string } | undefined;

export async function placeOrderAction(
  _prev: PlaceOrderState,
  formData: FormData,
): Promise<PlaceOrderState> {
  // Server Actions are public POST endpoints, so ALWAYS re-check auth inside them,
  // even if the page that shows the form already checked.
  const { token } = await requireUser();

  let items: { menu_item_id: string; quantity: number }[];
  try {
    items = JSON.parse(String(formData.get("items") ?? "[]"));
  } catch {
    return { error: "Invalid cart data" };
  }
  if (items.length === 0) return { error: "Your cart is empty" };

  try {
    const order = await api<Order>("/orders", {
      method: "POST",
      token,
      json: {
        items,
        delivery_address: formData.get("delivery_address"),
        notes: formData.get("notes") ?? "",
      },
    });
    // Tell Next.js the order list changed, so it won't show stale data.
    revalidatePath("/orders");
    revalidatePath("/admin/orders");
    // Returning (instead of redirecting) lets the client clear the cart first.
    return { orderId: order.id };
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : "Could not place order" };
  }
}
