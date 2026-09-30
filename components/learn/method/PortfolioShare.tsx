"use client";

import { useEffect, useId, useState } from "react";
import { useT } from "@/lib/i18n/client";

// Sharing settings for the learner's portfolio: public or not, whether work
// samples (lab excerpts and reflections) are included, and which sections
// are shown. Everything is private until the learner turns it on.

const SECTIONS = ["labs", "studio", "capstone", "certificates", "badges", "memory"] as const;
type Section = (typeof SECTIONS)[number];

const SECTION_KEY: Record<Section, string> = {
  labs: "method.portfolio.labs",
  studio: "method.portfolio.studio",
  capstone: "method.portfolio.capstone",
  certificates: "method.portfolio.certificates",
  badges: "method.portfolio.badges",
  memory: "method.portfolio.memory",
};

export default function PortfolioShare({
  initial,
}: {
  initial: { isPublic: boolean; slug: string | null; includeWork: boolean; hidden: string[] };
}) {
  const t = useT();
  const ids = useId();
  const [isPublic, setIsPublic] = useState(initial.isPublic);
  const [includeWork, setIncludeWork] = useState(initial.includeWork);
  const [hidden, setHidden] = useState<Set<string>>(new Set(initial.hidden));
  const [saved, setSaved] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => setOrigin(window.location.origin), []);

  const link = saved.slug && saved.isPublic ? `${origin}/p/${saved.slug}` : null;

  async function save(newLink = false) {
    if (busy) return;
    setBusy(true);
    setStatus(null);
    const res = await fetch("/api/learn/portfolio", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublic, includeWork, hidden: [...hidden], newLink }),
    }).catch(() => null);
    const d = res ? await res.json().catch(() => ({})) : {};
    setBusy(false);
    if (!res?.ok || !d.settings) {
      setStatus({ ok: false, msg: d.error ?? t("method.share.error") });
      return;
    }
    setSaved(d.settings);
    setCopied(false);
    setStatus({ ok: true, msg: `${t("method.share.saved")}. ${d.settings.isPublic ? t("method.share.publicNow") : t("method.share.privateNow")}` });
  }

  async function copy() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  const toggleSection = (s: Section) =>
    setHidden((cur) => {
      const next = new Set(cur);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });

  return (
    <section aria-labelledby={`${ids}-h`} className="rounded-2xl border border-[var(--border)] bg-white p-5">
      <h2 id={`${ids}-h`} className="text-base font-bold text-[var(--ink)]">
        <span aria-hidden="true">🔗 </span>
        {t("method.share.title")}
      </h2>

      <div className="mt-4 space-y-4">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="mt-1 h-5 w-5 shrink-0"
            aria-describedby={`${ids}-pub`}
          />
          <span>
            <span className="block text-sm font-semibold text-[var(--ink)]">{t("method.share.public")}</span>
            <span id={`${ids}-pub`} className="block text-xs leading-relaxed text-[var(--ink3)]">
              {t("method.share.publicHint")}
            </span>
          </span>
        </label>

        <label className={`flex items-start gap-3 ${isPublic ? "cursor-pointer" : "opacity-50"}`}>
          <input
            type="checkbox"
            checked={includeWork}
            disabled={!isPublic}
            onChange={(e) => setIncludeWork(e.target.checked)}
            className="mt-1 h-5 w-5 shrink-0"
            aria-describedby={`${ids}-work`}
          />
          <span>
            <span className="block text-sm font-semibold text-[var(--ink)]">{t("method.share.includeWork")}</span>
            <span id={`${ids}-work`} className="block text-xs leading-relaxed text-[var(--ink3)]">
              {t("method.share.includeWorkHint")}
            </span>
          </span>
        </label>

        <fieldset disabled={!isPublic} className={isPublic ? "" : "opacity-50"}>
          <legend className="text-sm font-semibold text-[var(--ink)]">{t("method.share.sections")}</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {SECTIONS.map((s) => (
              <label
                key={s}
                className="flex min-h-[40px] cursor-pointer items-center gap-2 rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--ink2)]"
              >
                <input type="checkbox" checked={!hidden.has(s)} onChange={() => toggleSection(s)} className="h-4 w-4" />
                {t(SECTION_KEY[s])}
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => save(false)}
          disabled={busy}
          className="min-h-[44px] rounded-full bg-[var(--ink)] px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {busy ? t("method.share.saving") : t("method.share.save")}
        </button>
        <p role="status" aria-live="polite" className={`text-sm font-semibold ${status && !status.ok ? "text-red-600" : "text-green-700"}`}>
          {status?.msg ?? ""}
        </p>
      </div>

      {link ? (
        <div className="mt-5 rounded-xl bg-[var(--s2)] p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--ink3)]">{t("method.share.link")}</p>
          <p className="mt-1 break-all font-mono text-sm text-[var(--ink)]">{link}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={copy}
              className="min-h-[40px] rounded-full border border-[var(--border)] bg-white px-4 py-2 text-xs font-semibold text-[var(--ink)]"
            >
              {copied ? t("method.share.copied") : t("method.share.copy")}
            </button>
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[40px] items-center rounded-full border border-[var(--border)] bg-white px-4 py-2 text-xs font-semibold text-[var(--ink)]"
            >
              {t("method.share.open")} ↗
            </a>
            <button
              type="button"
              onClick={() => save(true)}
              disabled={busy}
              title={t("method.share.newLinkHint")}
              aria-describedby={`${ids}-new`}
              className="min-h-[40px] rounded-full border border-[var(--border)] bg-white px-4 py-2 text-xs font-semibold text-[var(--ink2)]"
            >
              {t("method.share.newLink")}
            </button>
            <span id={`${ids}-new`} className="sr-only">
              {t("method.share.newLinkHint")}
            </span>
          </div>
          <span className="sr-only" aria-live="polite">
            {copied ? t("method.share.copied") : ""}
          </span>
        </div>
      ) : (
        <p className="mt-4 text-xs text-[var(--ink3)]">{t("method.share.privateNow")}</p>
      )}
    </section>
  );
}
