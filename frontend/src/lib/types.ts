// TypeScript types that mirror the Pydantic "Out" models in backend/app/models/.
// If you change a model in the backend, update the matching type here.
// (Bigger projects generate these automatically from FastAPI's /openapi.json.)

export type Role = "customer" | "admin";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string | null;
  available: boolean;
  spicy: boolean;
};

export type OrderStatus = "pending" | "preparing" | "ready" | "delivered" | "cancelled";

export const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "preparing",
  "ready",
  "delivered",
  "cancelled",
];

export type OrderItem = {
  menu_item_id: string;
  name: string;
  price: number;
  quantity: number;
};

export type Order = {
  id: string;
  user_id: string;
  customer_name: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  delivery_address: string;
  notes: string;
  created_at: string; // ISO date string: JSON has no Date type
  status_history: { status: OrderStatus; at: string }[];
};

export type Stats = {
  by_status: { status: OrderStatus; count: number; revenue: number }[];
  top_items: { name: string; quantity: number }[];
};

// The shape every Server Action in this app returns to its form.
export type ActionState = { error?: string; ok?: boolean } | undefined;
