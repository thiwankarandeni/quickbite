// The site header is a Server Component, with two pieces mixed in:
//   <UserMenu/>   async Server Component that reads the session cookie, so it
//                 must be inside <Suspense> (Cache Components rule)
//   <CartLink/>   Client Component that reads the cart from context
import Link from "next/link";
import { Suspense } from "react";

import { logoutAction } from "@/app/actions/auth";
import { getCurrentUser } from "@/lib/session";

import { CartLink } from "./CartLink";

export function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-stone-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <Link href="/" className="text-xl font-bold text-orange-600">
          🍔 QuickBite
        </Link>
        <Link href="/menu" className="text-stone-700 hover:text-orange-600">
          Menu
        </Link>
        <div className="ml-auto flex items-center gap-4">
          <Suspense fallback={<span className="h-5 w-24 animate-pulse rounded bg-stone-200" />}>
            <UserMenu />
          </Suspense>
          <CartLink />
        </div>
      </nav>
    </header>
  );
}

async function UserMenu() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <>
        <Link href="/login" className="text-stone-700 hover:text-orange-600">
          Log in
        </Link>
        <Link
          href="/register"
          className="rounded-full border border-orange-500 px-3 py-1 text-orange-600 hover:bg-orange-50"
        >
          Sign up
        </Link>
      </>
    );
  }

  const isAdmin = user.role === "admin";

  return (
    <>
      {isAdmin && (
        <Link href="/admin" className="font-medium text-violet-700 hover:underline">
          Admin
        </Link>
      )}
      {/* Admins manage everyone's orders, so they get a link to the admin list
          instead of "My orders" (which only shows orders they placed themselves). */}
      <Link
        href={isAdmin ? "/admin/orders" : "/orders"}
        className="text-stone-700 hover:text-orange-600"
      >
        {isAdmin ? "All orders" : "My orders"}
      </Link>
      <span className="hidden text-sm text-stone-500 sm:inline">Hi, {user.name}</span>
      {/* A form whose action is a Server Action works even before JS loads. */}
      <form action={logoutAction}>
        <button className="text-sm text-stone-500 hover:text-stone-900">Log out</button>
      </form>
    </>
  );
}
