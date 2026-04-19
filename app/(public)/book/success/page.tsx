"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const appointmentId = searchParams.get("appointmentId");

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full text-center">

        {/* Checkmark circle */}
        <div className="flex items-center justify-center mx-auto mb-8">
          <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center shadow-lg shadow-emerald-100">
            <svg
              className="w-12 h-12 text-emerald-500"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
        </div>

        {/* Heading */}
        <h1 className="font-syne font-extrabold text-4xl text-[#0D1B2A] mb-3">
          You&rsquo;re booked!
        </h1>
        <p className="font-dm text-[#3A4A5C] text-lg mb-8">
          Your session has been confirmed.
        </p>

        {/* Info box */}
        <div className="bg-[#EBF0FA] border border-[#D2DCE8] rounded-2xl p-6 mb-10 text-left">
          <div className="flex gap-3">
            <div className="mt-0.5 shrink-0">
              <svg
                className="w-5 h-5 text-[#2251A3]"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
                />
              </svg>
            </div>
            <div>
              <p className="font-dm text-[#1B3A6B] font-semibold text-sm mb-1">
                What happens next
              </p>
              <p className="font-dm text-[#3A4A5C] text-sm leading-relaxed">
                A confirmation email has been sent to your inbox. Your Zoom link will be
                shared 24 hours before your session.
              </p>
              {appointmentId && (
                <p className="font-dm text-[#7A8FA6] text-xs mt-3">
                  Booking reference:{" "}
                  <span className="font-mono text-[#2251A3]">{appointmentId}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="btn-secondary justify-center">
            ← Back to Home
          </Link>
          <Link href="/tools" className="btn-primary justify-center">
            Try Smart Tools →
          </Link>
        </div>

      </div>
    </div>
  );
}

export default function BookSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-[#2251A3] border-t-transparent animate-spin" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
