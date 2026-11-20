"use client";

import { useT } from "@/lib/i18n/client";

/**
 * "Skip to main content" (WCAG 2.4.1). Hidden until it receives keyboard
 * focus, then shown top left above everything. The target needs
 * id="main-content" and tabIndex={-1}.
 */
export default function SkipLink({ target = "main-content" }: { target?: string }) {
  const t = useT();
  return (
    <a
      href={`#${target}`}
      className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[200] focus:rounded-lg focus:bg-[#1B3A6B] focus:px-4 focus:py-3 focus:text-sm focus:font-bold focus:text-white focus:shadow-lg focus:outline focus:outline-2 focus:outline-offset-2 focus:outline-[#F9A738]"
    >
      {t("a11y.skip")}
    </a>
  );
}
