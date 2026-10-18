"use client";
// error.tsx is an Error Boundary for this route segment: if a page below it
// throws (e.g. the API is down), this UI replaces the page instead of a blank
// screen. Error boundaries must be Client Components.
import { useEffect } from "react";

export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error); // a real app would send this to an error-reporting service
  }, [error]);

  // In production, server error messages are hidden from the browser for security,
  // so this hint only appears in development.
  const message = error instanceof Error ? error.message : "";

  return (
    <div className="mx-auto max-w-md py-20 text-center">
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="mt-2 text-stone-600">
        {message.includes("fetch failed")
          ? "Can't reach the API. Is the FastAPI backend running on port 8000?"
          : "An unexpected error occurred."}
      </p>
      <button
        onClick={() => retry()}
        className="mt-6 rounded-full bg-orange-500 px-5 py-2 font-semibold text-white hover:bg-orange-600"
      >
        Try again
      </button>
    </div>
  );
}
