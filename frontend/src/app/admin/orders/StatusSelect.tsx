"use client";
// A <select> that submits its form as soon as the value changes.
// The form's action is a Server Action, so no fetch() code is needed here.
import { useFormStatus } from "react-dom";

import { updateOrderStatusAction } from "@/app/actions/admin";
import { capitalize } from "@/lib/format";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/types";

export function StatusSelect({ orderId, current }: { orderId: string; current: OrderStatus }) {
  return (
    <form action={updateOrderStatusAction}>
      <input type="hidden" name="order_id" value={orderId} />
      <Select current={current} />
    </form>
  );
}

function Select({ current }: { current: OrderStatus }) {
  const { pending } = useFormStatus();
  return (
    <select
      name="status"
      // `key` forces React to re-create the select when the server sends a new
      // status, so its defaultValue updates too.
      key={current}
      defaultValue={current}
      disabled={pending}
      // requestSubmit() submits the form like clicking a submit button would.
      onChange={(e) => e.currentTarget.form?.requestSubmit()}
      className="rounded-lg border border-stone-300 bg-white px-2 py-1 disabled:opacity-50"
    >
      {ORDER_STATUSES.map((s) => (
        <option key={s} value={s}>
          {capitalize(s)}
        </option>
      ))}
    </select>
  );
}
