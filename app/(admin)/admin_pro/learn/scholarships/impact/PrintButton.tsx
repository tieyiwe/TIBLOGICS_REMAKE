"use client";

export default function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="inline-flex h-9 items-center rounded-[var(--a-radius-control)] bg-[var(--a-ink)] px-4 font-dm text-[13px] font-semibold text-white">
      Print or save as PDF
    </button>
  );
}
