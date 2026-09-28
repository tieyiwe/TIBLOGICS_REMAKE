"use client";
import { Printer } from "lucide-react";

export default function PrintButton() {
  return (
    <button onClick={() => window.print()} className="flex items-center gap-2 font-dm text-sm text-white/80 hover:text-white">
      <Printer size={15} /> Print or save as PDF
    </button>
  );
}
