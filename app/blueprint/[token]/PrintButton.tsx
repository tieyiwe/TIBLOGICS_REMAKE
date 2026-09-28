"use client";
import { Printer } from "lucide-react";

/** `label` comes from the server page, already in the reader's language. */
export default function PrintButton({ label }: { label: string }) {
  return (
    <button onClick={() => window.print()} className="flex items-center gap-2 font-dm text-sm text-white/80 hover:text-white">
      <Printer size={15} aria-hidden /> <span className="hidden sm:inline">{label}</span>
      <span className="sr-only sm:hidden">{label}</span>
    </button>
  );
}
