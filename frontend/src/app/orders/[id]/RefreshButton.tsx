"use client";
// router.refresh() re-runs the Server Components for the current page and
// merges the fresh result in, without losing client state or reloading the page.
// Good for checking whether the admin has updated the order status.
// (Exercise: make it poll automatically every 10 seconds with setInterval in a useEffect.)
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function RefreshButton() {
  const router = useRouter();
  // useTransition gives a pending flag for non-urgent updates like this one.
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => router.refresh())}
      disabled={isPending}
      className="rounded-full border border-stone-300 px-3 py-1 text-sm hover:bg-stone-100 disabled:opacity-50"
    >
      {isPending ? "Refreshing…" : "↻ Refresh"}
    </button>
  );
}
