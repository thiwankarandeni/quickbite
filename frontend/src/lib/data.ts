// Data-fetching functions used by Server Components. Keeping them here (rather
// than inline in pages) means pages read like "what to show", and this file
// is the one place that knows the API's URLs.
import "server-only";

import { api, ApiError } from "./api";
import { requireAdmin, requireUser } from "./session";
import type { MenuItem, Order, Stats } from "./types";

// ---- Public menu ----------------------------------------------------------

export async function getMenu(opts: { category?: string; includeUnavailable?: boolean } = {}) {
  const params = new URLSearchParams();
  if (opts.category) params.set("category", opts.category);
  if (opts.includeUnavailable) params.set("include_unavailable", "true");
  const qs = params.size ? `?${params}` : "";
  return api<MenuItem[]>(`/menu${qs}`);
}

export async function getCategories() {
  return api<string[]>("/menu/categories");
}

// Returns null for 404 so the page can call notFound().
export async function getMenuItem(id: string): Promise<MenuItem | null> {
  try {
    return await api<MenuItem>(`/menu/${id}`);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

// ---- Logged-in customer ---------------------------------------------------

export async function getMyOrders() {
  const { token } = await requireUser();
  return api<Order[]>("/orders", { token });
}

export async function getOrder(id: string): Promise<Order | null> {
  const { token } = await requireUser();
  try {
    return await api<Order>(`/orders/${id}`, { token });
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

// ---- Admin ----------------------------------------------------------------

export async function getAllOrders(status?: string) {
  const { token } = await requireAdmin();
  const qs = status ? `?status_filter=${status}` : "";
  return api<Order[]>(`/admin/orders${qs}`, { token });
}

export async function getStats() {
  const { token } = await requireAdmin();
  return api<Stats>("/admin/stats", { token });
}
