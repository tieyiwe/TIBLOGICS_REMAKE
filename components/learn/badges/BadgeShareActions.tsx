"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n/client";
import { linkedInAddUrl, shareLinks } from "@/lib/learn/skill-badges/share";

// Add to LinkedIn, share, copy and download for a public skill badge.
export default function BadgeShareActions({
  awardId,
  name,
  issuedAt,
  url,
  canDownload,
}: {
  awardId: string;
  /** The badge name as written in the credential (English). */
  name: string;
  issuedAt: string;
  url: string;
  canDownload: boolean;
}) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  const links = shareLinks(url, t("badges.share.text", { badge: name }));

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked: the URL is in the address bar */
    }
  }

  const pill =
    "inline-flex items-center rounded-full border border-[var(--border)] bg-white px-4 py-2 text-xs font-semibold text-[var(--ink2)] transition-colors hover:border-[var(--ink3)]";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <a
          href={linkedInAddUrl({ name: `${name} (TIBLOGICS skill badge)`, issuedAt, certUrl: url, certId: awardId })}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center rounded-full bg-[#0A66C2] px-5 py-2.5 text-sm font-bold text-white hover:opacity-90"
        >
          {t("badges.addToLinkedIn")}
        </a>
        <button onClick={copy} className="rounded-full bg-[#1B3A6B] px-5 py-2.5 text-sm font-bold text-white hover:opacity-90">
          {copied ? `✓ ${t("badges.linkCopied")}` : t("badges.copyLink")}
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2" aria-label={t("badges.share.label")} role="group">
        <a className={pill} href={links.linkedin} target="_blank" rel="noopener noreferrer">{t("badges.share.linkedin")}</a>
        <a className={pill} href={links.x} target="_blank" rel="noopener noreferrer">{t("badges.share.x")}</a>
        <a className={pill} href={links.facebook} target="_blank" rel="noopener noreferrer">{t("badges.share.facebook")}</a>
        <a className={pill} href={links.whatsapp} target="_blank" rel="noopener noreferrer">{t("badges.share.whatsapp")}</a>
        <a className={pill} href={links.email}>{t("badges.share.email")}</a>
      </div>
      {canDownload && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
          <a className="font-semibold text-[#1B3A6B] underline" href={`/badges/${awardId}/credential?download=1`}>
            {t("badges.downloadJson")}
          </a>
          <a className="font-semibold text-[#1B3A6B] underline" href={`/badges/${awardId}/credential?format=jwt&download=1`}>
            {t("badges.downloadJwt")}
          </a>
        </div>
      )}
    </div>
  );
}
