"use client";

import Link from "next/link";
import { Download } from "lucide-react";
import { useT } from "@/lib/i18n/client";
import { useInstallPlatform } from "@/lib/learn/pwa/platform";

/**
 * A quiet "Install the ARFA app" link for the dashboard's first visit
 * (no track started yet). Nothing once installed, in the app itself, or in a
 * browser that cannot install.
 */
export default function InstallHint() {
  const t = useT();
  const env = useInstallPlatform();
  if (!env || env.platform === "installed" || env.platform === "unsupported" || env.platform === "firefox-desktop") return null;
  return (
    <Link
      href="/learn/install"
      className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--blue2)] underline-offset-2 hover:underline"
      data-testid="install-hint"
    >
      <Download size={15} aria-hidden /> {t("pwa.prompt.title")} →
    </Link>
  );
}
