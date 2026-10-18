import { capitalize } from "@/lib/format";
import type { OrderStatus } from "@/lib/types";

// Record<K, V> = an object with a key for EVERY OrderStatus. If someone adds a
// new status to the type, TypeScript will complain here until it gets a color.
const STYLES: Record<OrderStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  preparing: "bg-blue-100 text-blue-800",
  ready: "bg-violet-100 text-violet-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-stone-200 text-stone-700",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STYLES[status]}`}>
      {capitalize(status)}
    </span>
  );
}
