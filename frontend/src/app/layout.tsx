// The ROOT LAYOUT wraps every page. It stays mounted while you navigate between
// pages, so the header and the cart state are not re-created on each navigation.
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { Header } from "@/components/Header";
import { CartProvider } from "@/context/CartContext";

import "./globals.css";

// next/font downloads the font at build time and serves it from your own domain.
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

// Static metadata becomes <title> and <meta> tags. `template` lets each page
// set just its own name: `export const metadata = { title: "Menu" }` -> "Menu · QuickBite".
export const metadata: Metadata = {
  title: { default: "QuickBite", template: "%s · QuickBite" },
  description: "A sample food ordering app built with Next.js, FastAPI and MongoDB",
};

// LayoutProps<"/"> is a type Next.js generates for you. `children` is the current page.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        {/* A Client Component (CartProvider) can wrap Server Components: they're
            passed in as already-rendered `children`, so they stay server-side. */}
        <CartProvider>
          <Header />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
          <footer className="border-t border-stone-200 py-6 text-center text-sm text-stone-500">
            QuickBite: a learning project (Next.js · FastAPI · MongoDB)
          </footer>
        </CartProvider>
      </body>
    </html>
  );
}
