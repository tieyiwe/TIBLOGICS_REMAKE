"use client";

import { Download } from "lucide-react";

/** "Save as PDF": the browser's print dialog (the page has print styles). */
export default function PrintButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#B8500A] px-5 font-dm text-sm font-bold text-white hover:bg-[#9c4408]"
    >
      <Download size={16} aria-hidden /> {label}
    </button>
  );
}
