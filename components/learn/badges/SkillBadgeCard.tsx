"use client";

import Link from "next/link";
import { useState } from "react";
import { useT } from "@/lib/i18n/client";
import { linkedInAddUrl } from "@/lib/learn/skill-badges/share";

export interface CardReq {
  label: string;
  have: number;
  need: number;
  /** Show "have of need"; false for single steps. */
  counted: boolean;
  items: Array<{ title: string; done: boolean; track?: string }>;
}

export interface CardData {
  key: string;
  svg: string;
  kicker: string;
  title: string;
  description: string;
  /** 0 to 1. */
  progress: number;
  reqs: CardReq[];
  award: null | {
    id: string;
    issuedLabel: string;
    issuedAt: string;
    isPublic: boolean;
    revoked: boolean;
    signed: boolean;
    /** Canonical English name, for LinkedIn. */
    credentialName: string;
  };
  extraLink?: { href: string; label: string };
  compact?: boolean;
}

// One skill badge on the learner's shelf: earned (share, LinkedIn, privacy)
// or locked (progress and what is left to do).
export default function SkillBadgeCard({ data, siteBase }: { data: CardData; siteBase: string }) {
  const t = useT();
  const [isPublic, setIsPublic] = useState(data.award?.isPublic ?? true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const a = data.award;
  const earned = !!a && !a.revoked;
  const pct = Math.round(Math.max(0, Math.min(1, data.progress)) * 100);

  async function toggle() {
    if (!a) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/learn/badges", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: a.id, isPublic: !isPublic }),
      });
      if (!res.ok) throw new Error();
      setIsPublic(!isPublic);
    } catch {
      setError(t("badges.error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={`flex flex-col rounded-2xl border bg-white p-4 ${earned ? "border-[#F47C20]/50 shadow-sm" : "border-[var(--border)]"}`}
      data-badge-key={data.key}
      data-earned={earned ? "true" : "false"}
    >
      <div className="flex items-start gap-3">
        <div
          aria-hidden="true"
          className={`shrink-0 ${data.compact ? "h-16 w-16" : "h-20 w-20"} ${earned ? "" : "opacity-40 grayscale"} [&>svg]:h-full [&>svg]:w-full`}
          dangerouslySetInnerHTML={{ __html: data.svg }}
        />
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#F47C20]">{data.kicker}</p>
          <h3 className="mt-0.5 text-sm font-black leading-snug text-[#1B3A6B]">{data.title}</h3>
          {a ? (
            <p className="mt-1 flex flex-wrap gap-1.5 text-xs">
              {a.revoked ? (
                <span className="rounded bg-red-50 px-1.5 py-0.5 font-bold text-red-700">{t("badges.status.revoked")}</span>
              ) : (
                <span className="rounded bg-green-50 px-1.5 py-0.5 font-bold text-green-800">{t("badges.status.earned", { date: a.issuedLabel })}</span>
              )}
              {!isPublic && <span className="rounded bg-[var(--s2)] px-1.5 py-0.5 font-bold text-[var(--ink2)]">{t("badges.status.private")}</span>}
              {!a.signed && <span className="rounded bg-amber-50 px-1.5 py-0.5 font-bold text-amber-800">{t("badges.status.unsigned")}</span>}
            </p>
          ) : (
            <p className="mt-1 text-xs font-semibold text-[var(--ink3)]">{t("badges.status.locked")}</p>
          )}
        </div>
      </div>

      {!data.compact && data.description && <p className="mt-3 text-xs leading-relaxed text-[var(--ink2)]">{data.description}</p>}

      {!earned && (
        <>
          <div
            className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--s3)]"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={t("badges.progressLabel", { name: data.title })}
          >
            <div className="h-full rounded-full bg-gradient-to-r from-[#1B3A6B] to-[#F47C20]" style={{ width: `${pct}%` }} />
          </div>
          {data.reqs.length > 0 && (
            <ul className="mt-3 space-y-2 text-xs">
              {data.reqs.map((r, i) => {
                const done = r.have >= r.need;
                return (
                  <li key={i}>
                    <p className={`font-semibold ${done ? "text-green-800" : "text-[var(--ink)]"}`}>
                      <span aria-hidden="true">{done ? "✓ " : "○ "}</span>
                      {r.label}
                      {r.counted && <span className="ml-1 font-normal text-[var(--ink3)]">({t("badges.progress", { have: r.have, need: r.need })})</span>}
                      <span className="sr-only"> {done ? t("badges.req.done") : t("badges.req.todo")}</span>
                    </p>
                    {r.items.length > 1 && (
                      <ul className="mt-1 space-y-0.5 pl-4 text-[var(--ink2)]">
                        {r.items.map((it, j) => (
                          <li key={j} className={it.done ? "text-green-800" : ""}>
                            <span aria-hidden="true">{it.done ? "✓ " : "· "}</span>
                            {it.title}
                            {it.track && <span className="text-[var(--ink3)]"> ({it.track})</span>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
          {data.extraLink && (
            <Link href={data.extraLink.href} className="mt-3 text-xs font-bold text-[#1B3A6B] underline">
              {data.extraLink.label} →
            </Link>
          )}
        </>
      )}

      {a && !a.revoked && (
        <div className="mt-auto pt-4">
          <div className="flex flex-wrap gap-2">
            {isPublic && (
              <>
                <Link href={`/badges/${a.id}`} className="rounded-full bg-[#1B3A6B] px-3.5 py-1.5 text-xs font-bold text-white hover:opacity-90">
                  {t("badges.view")}
                </Link>
                <a
                  href={linkedInAddUrl({
                    name: `${a.credentialName} (TIBLOGICS skill badge)`,
                    issuedAt: a.issuedAt,
                    certUrl: `${siteBase}/badges/${a.id}`,
                    certId: a.id,
                  })}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-[#0A66C2] px-3.5 py-1.5 text-xs font-bold text-white hover:opacity-90"
                >
                  {t("badges.addToLinkedIn")}
                </a>
              </>
            )}
            <button
              onClick={toggle}
              disabled={busy}
              aria-pressed={!isPublic}
              className="rounded-full border border-[var(--border)] px-3.5 py-1.5 text-xs font-semibold text-[var(--ink2)] hover:border-[var(--ink3)] disabled:opacity-60"
            >
              {busy ? t("badges.saving") : isPublic ? t("badges.makePrivate") : t("badges.makePublic")}
            </button>
          </div>
          {!isPublic && <p className="mt-2 text-xs text-[var(--ink3)]">{t("badges.privateHint")}</p>}
          {error && <p role="alert" className="mt-2 text-xs font-semibold text-red-700">{error}</p>}
        </div>
      )}
    </div>
  );
}
