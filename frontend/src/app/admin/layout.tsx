// A NESTED LAYOUT: wraps every page under /admin (inside the root layout).
// Navigating between admin pages keeps this sub-navigation mounted.
import Link from "next/link";

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  const link = "rounded-full px-4 py-1.5 text-sm font-medium hover:bg-violet-100";
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-violet-50 p-2">
        <span className="px-3 text-sm font-bold text-violet-800">Admin</span>
        <Link href="/admin" className={link}>
          Dashboard
        </Link>
        <Link href="/admin/orders" className={link}>
          Orders
        </Link>
        <Link href="/admin/menu" className={link}>
          Menu items
        </Link>
      </div>
      {children}
    </div>
  );
}
