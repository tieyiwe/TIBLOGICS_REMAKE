"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useT } from "@/lib/i18n/client";

/**
 * A TIBLOGICS promo placed inside the article body, where readers actually
 * are — the end-of-article CTA only reaches the minority who finish.
 *
 * The offer is chosen from what the reader is currently reading about, so it
 * is relevant rather than the same banner everywhere. It is labelled as ours
 * rather than dressed up as part of the article: a promo that reads like
 * editorial costs more trust than it earns clicks.
 */

type Promo = {
  /** Dictionary id: pages.promo.<id>.title / .body / .cta */
  id: "build" | "readiness" | "learn" | "toolkit";
  href: string;
  color: string;
};

const PROMOS: Record<Promo["id"], Promo> = {
  build: { id: "build", href: "/book", color: "#F47C20" },
  readiness: { id: "readiness", href: "/tools/scanner", color: "#2251A3" },
  learn: { id: "learn", href: "/learning-box", color: "#0F6E56" },
  toolkit: { id: "toolkit", href: "/store", color: "#7c3aed" },
};

/** Deterministic so the server and client agree and the page stays cacheable. */
function pickPromo(category: string, tags: string[]): Promo {
  const hay = `${category} ${tags.join(" ")}`.toLowerCase();
  if (/\b(tool|tools|prompt|prompts|template)\b/.test(hay)) return PROMOS.toolkit;
  if (/\b(tip|tips|guide|learn|training|course|skills)\b/.test(hay)) return PROMOS.learn;
  if (/\b(readiness|strategy|audit|adoption|assessment)\b/.test(hay)) return PROMOS.readiness;
  return PROMOS.build;
}

export default function InArticlePromo({
  category,
  tags,
}: {
  category: string;
  tags: string[];
}) {
  const t = useT();
  const p = pickPromo(category, tags);

  return (
    <aside
      aria-label={t("pages.promo.ariaLabel")}
      className="my-9 overflow-hidden rounded-2xl border border-[#D2DCE8] bg-[#F4F7FB]"
    >
      <div className="h-1 w-full" style={{ backgroundColor: p.color }} />
      <div className="p-5 sm:p-6">
        <span
          className="font-dm text-[11px] font-bold uppercase tracking-[0.12em]"
          style={{ color: p.color }}
        >
          {t("pages.promo.label")}
        </span>
        <h3 className="font-syne font-bold text-lg text-[#0D1B2A] mt-1.5 leading-snug">
          {t(`pages.promo.${p.id}.title`)}
        </h3>
        <p className="font-dm text-sm text-[#7A8FA6] leading-relaxed mt-2">{t(`pages.promo.${p.id}.body`)}</p>
        <Link
          href={p.href}
          className="mt-4 inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 font-dm text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
          style={{ backgroundColor: p.color }}
        >
          {t(`pages.promo.${p.id}.cta`)} <ArrowRight size={14} className="shrink-0" />
        </Link>
      </div>
    </aside>
  );
}

/**
 * Split generated article HTML at a top-level tag boundary near the middle, so
 * the promo lands between blocks and never inside a paragraph or list.
 * Returns the whole article and an empty tail when it is too short to break up.
 */
export function splitForPromo(html: string): [string, string] {
  const boundaries = [...html.matchAll(/<\/(?:p|ul|ol|h2|h3|blockquote)>/gi)].map(
    (m) => (m.index ?? 0) + m[0].length,
  );
  if (boundaries.length < 5) return [html, ""];
  const mid = boundaries[Math.floor(boundaries.length / 2)];
  return [html.slice(0, mid), html.slice(mid)];
}
