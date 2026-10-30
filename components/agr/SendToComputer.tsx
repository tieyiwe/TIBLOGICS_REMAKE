"use client";

import { useState } from "react";

// On a phone (people arrive from a QR code), installing a Claude skill is done
// on a computer: this sends the page link to yourself through the phone's
// share sheet, or copies it where sharing is not available.
export default function SendToComputer({ label, copied, url }: { label: string; copied: string; url: string }) {
  const [done, setDone] = useState(false);

  async function send() {
    try {
      if (navigator.share) {
        await navigator.share({ title: "AI Graveyard Report (AGR Score)", url });
        return;
      }
    } catch {
      /* closed the share sheet: fall back to copying */
    }
    try {
      await navigator.clipboard.writeText(url);
      setDone(true);
      window.setTimeout(() => setDone(false), 2500);
    } catch {
      /* clipboard blocked: nothing else to do */
    }
  }

  return (
    <button
      type="button"
      onClick={send}
      data-track="agr-send-to-computer"
      data-testid="agr-send"
      className="inline-flex min-h-[48px] w-full items-center justify-center rounded-full border-2 border-white/40 px-6 py-3 font-dm text-sm font-bold text-white hover:bg-white/10 sm:w-auto"
    >
      {done ? copied : label}
    </button>
  );
}
