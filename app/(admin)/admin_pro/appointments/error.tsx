"use client";
import { useEffect } from "react";
import Link from "next/link";

export default function AppointmentsError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error("Appointments page error:", error); }, [error]);
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
      <p className="font-syne font-bold text-lg text-[var(--a-ink)]">Appointments failed to load</p>
      <p className="font-dm text-sm text-[var(--a-ink-3)]">{error.message || "An unexpected error occurred."}</p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="px-4 py-2 bg-[#2251A3] text-white text-sm font-dm rounded-[var(--a-radius-control)] hover:bg-[var(--a-navy)] transition-colors"
        >
          Try again
        </button>
        <Link href="/admin_pro" className="px-4 py-2 border border-[var(--a-border)] text-sm font-dm rounded-[var(--a-radius-control)] hover:bg-[var(--a-surface-2)] transition-colors">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
