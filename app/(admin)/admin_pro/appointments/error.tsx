"use client";
import { useEffect } from "react";
import Link from "next/link";

export default function AppointmentsError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => { console.error("Appointments page error:", error); }, [error]);
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
      <p className="font-syne font-bold text-lg text-[#0D1B2A]">Appointments failed to load</p>
      <p className="font-dm text-sm text-[#7A8FA6]">{error.message || "An unexpected error occurred."}</p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="px-4 py-2 bg-[#2251A3] text-white text-sm font-dm rounded-xl hover:bg-[#1B3A6B] transition-colors"
        >
          Try again
        </button>
        <Link href="/admin_pro" className="px-4 py-2 border border-[#D2DCE8] text-sm font-dm rounded-xl hover:bg-[#F4F7FB] transition-colors">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
