"use client";

import type { ReactNode } from "react";

/**
 * Opens the Tibo assistant in place.
 *
 * "Talk to Tibo" links across the site pointed at /tools/advisor, a page marked
 * retired in production. The assistant already runs on every public page as
 * the floating launcher (EchelonFloat), which listens for `tibo:open` — the
 * same event the Tibo tab in the mobile bottom bar sends. So these open the
 * conversation where the visitor already is, instead of navigating away to a
 * retired tool.
 */
export default function OpenTiboButton({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent("tibo:open"))}
      className={className}
    >
      {children}
    </button>
  );
}
