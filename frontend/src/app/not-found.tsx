// Shown for unknown URLs, and whenever a page calls notFound().
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-20 text-center">
      <h1 className="text-3xl font-bold">Page not found</h1>
      <p className="mt-2 text-stone-600">We couldn&apos;t find what you were looking for.</p>
      <Link href="/menu" className="mt-6 inline-block text-orange-600 hover:underline">
        Back to the menu
      </Link>
    </div>
  );
}
