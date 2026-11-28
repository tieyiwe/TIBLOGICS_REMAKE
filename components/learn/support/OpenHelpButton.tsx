"use client";

import { OPEN_HELP_EVENT } from "./events";

/** Any button that opens the "Need help?" panel (HelpWidget listens for the event). */
export default function OpenHelpButton({ className, children, topic }: { className?: string; children: React.ReactNode; topic?: string }) {
  return (
    <button type="button" className={className} onClick={() => window.dispatchEvent(new CustomEvent(OPEN_HELP_EVENT, { detail: { topic } }))}>
      {children}
    </button>
  );
}
