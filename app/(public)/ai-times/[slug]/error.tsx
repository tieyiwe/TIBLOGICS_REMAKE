"use client";

import Link from "next/link";

export default function ArticleError() {
  return (
    <div className="pt-32 sm:pt-44 min-h-screen bg-[#F4F7FB] flex items-center justify-center">
      <div className="text-center px-4">
        <p className="text-5xl mb-4">📰</p>
        <h1 className="font-syne font-bold text-2xl text-[#0D1B2A] mb-2">Something went wrong</h1>
        <p className="font-dm text-[#7A8FA6] text-sm mb-6">We couldn&apos;t load this article. Please try again.</p>
        <div className="flex gap-3 justify-center">
          <Link href="/ai-times" className="bg-[#1B3A6B] text-white font-dm font-semibold px-5 py-2.5 rounded-xl text-sm">
            Back to AI Times
          </Link>
          <button
            onClick={() => window.location.reload()}
            className="border border-[#D2DCE8] text-[#3A4A5C] font-dm font-medium px-5 py-2.5 rounded-xl text-sm hover:bg-white transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}
