"use client";
// useFormStatus reads the status of the PARENT <form>. It must be used in a
// component rendered inside the form, which is why this is its own component.
import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  pendingText = "Working…",
  className = "",
}: {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`rounded-full bg-orange-500 px-5 py-2.5 font-semibold text-white transition hover:bg-orange-600 disabled:opacity-60 ${className}`}
    >
      {pending ? pendingText : children}
    </button>
  );
}
