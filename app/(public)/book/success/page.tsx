"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";

type Status = "polling" | "confirmed" | "timeout";

function SuccessContent() {
  const searchParams = useSearchParams();
  const appointmentId = searchParams.get("appointmentId");
  const [status, setStatus] = useState<Status>("polling");
  const [zoomLink, setZoomLink] = useState<string | null>(null);

  useEffect(() => {
    if (!appointmentId) { setStatus("confirmed"); return; }

    let attempts = 0;
    const MAX = 20; // poll for up to 20 × 1.5s = 30s

    const interval = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch(`/api/appointments/${appointmentId}/status`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === "CONFIRMED") {
            setZoomLink(data.zoomLink ?? null);
            setStatus("confirmed");
            clearInterval(interval);
            return;
          }
        }
      } catch { /* ignore */ }

      if (attempts >= MAX) {
        setStatus("timeout");
        clearInterval(interval);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [appointmentId]);

  if (status === "polling") {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-16">
        <div className="max-w-lg w-full text-center">
          <div className="flex items-center justify-center mx-auto mb-8">
            <div className="w-24 h-24 rounded-full bg-[#EBF0FA] flex items-center justify-center">
              <div className="w-10 h-10 rounded-full border-4 border-[#2251A3] border-t-transparent animate-spin" />
            </div>
          </div>
          <h1 className="font-syne font-extrabold text-3xl text-[#0D1B2A] mb-3">Confirming your payment…</h1>
          <p className="font-dm text-[#7A8FA6] text-base">This only takes a moment. Please don&apos;t close this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full text-center">

        <div className="flex items-center justify-center mx-auto mb-8">
          <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center shadow-lg shadow-emerald-100">
            <svg className="w-12 h-12 text-emerald-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
        </div>

        <h1 className="font-syne font-extrabold text-4xl text-[#0D1B2A] mb-3">You&rsquo;re booked!</h1>
        <p className="font-dm text-[#3A4A5C] text-lg mb-8">
          {status === "confirmed" ? "Your session is confirmed and payment received." : "Your payment was received — confirmation is on its way."}
        </p>

        <div className="bg-[#EBF0FA] border border-[#D2DCE8] rounded-2xl p-6 mb-10 text-left">
          <div className="flex gap-3">
            <div className="mt-0.5 shrink-0">
              <svg className="w-5 h-5 text-[#2251A3]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
            </div>
            <div className="w-full">
              <p className="font-dm text-[#1B3A6B] font-semibold text-sm mb-1">What happens next</p>
              {zoomLink ? (
                <>
                  <p className="font-dm text-[#3A4A5C] text-sm leading-relaxed mb-3">
                    A confirmation email has been sent to your inbox with your meeting details.
                  </p>
                  <a
                    href={zoomLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-[#2D8CFF] text-white text-sm font-dm font-semibold px-4 py-2.5 rounded-xl hover:bg-[#1a7ae8] transition-colors"
                  >
                    🎥 Join your meeting
                  </a>
                </>
              ) : (
                <p className="font-dm text-[#3A4A5C] text-sm leading-relaxed">
                  A confirmation email has been sent to your inbox. Your meeting link will be shared at least 24 hours before your session.
                </p>
              )}
              {appointmentId && (
                <p className="font-dm text-[#7A8FA6] text-xs mt-3">
                  Booking reference: <span className="font-mono text-[#2251A3]">{appointmentId}</span>
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="btn-secondary justify-center">← Back to Home</Link>
          <Link href="/tools" className="btn-primary justify-center">Try Smart Tools →</Link>
        </div>
      </div>
    </div>
  );
}

export default function BookSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#2251A3] border-t-transparent animate-spin" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
