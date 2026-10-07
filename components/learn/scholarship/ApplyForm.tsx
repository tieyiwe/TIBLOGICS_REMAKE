"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n/client";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BACKGROUNDS = ["student", "jobseeker", "professional", "business", "educator", "other"] as const;
const input =
  "mt-1 w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--ink)] focus:border-[var(--blue2)] focus:outline-none focus:ring-2 focus:ring-[var(--blue2)]/20";
const label = "block text-sm font-semibold text-[var(--ink)]";

/** The Tilo Vision Scholarship application. Our own messages, in the page's language. */
export default function ApplyForm({ tracks, locale }: { tracks: Array<{ id: string; title: string }>; locale: string }) {
  const t = useT();
  const [f, setF] = useState({ name: "", email: "", country: "", background: "", motivation: "", goals: "", links: "", website: "" });
  const [picked, setPicked] = useState<string[]>([]);
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");
  const [reference, setReference] = useState<string | null>(null);
  const set = (k: keyof typeof f, v: string) => {
    setF((x) => ({ ...x, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: "" }));
  };

  function validate() {
    const e: Record<string, string> = {};
    if (f.name.trim().length < 2) e.name = t("learn.scholarApply.err.name");
    if (!EMAIL_RE.test(f.email.trim())) e.email = t("learn.scholarApply.err.email");
    if (f.motivation.trim().length < 80) e.motivation = t("learn.scholarApply.err.motivation");
    if (!consent) e.consent = t("learn.scholarApply.err.consent");
    setErrors(e);
    return !Object.values(e).some(Boolean);
  }

  if (state === "done") {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center" role="status" data-testid="apply-done">
        <p className="text-lg font-black text-emerald-900">{t("learn.scholarApply.done.title")}</p>
        <p className="mt-2 text-sm text-emerald-900">{t("learn.scholarApply.done.body")}</p>
        {reference && <p className="mt-2 text-xs font-semibold text-emerald-800">{t("learn.scholarApply.email.reference")} {reference}</p>}
      </div>
    );
  }

  return (
    <form
      noValidate
      data-testid="apply-form"
      className="space-y-5"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!validate()) return;
        setState("sending");
        setError("");
        try {
          const res = await fetch("/api/learn/scholarship/apply", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...f, background: f.background || null, trackIds: picked, consent: true, locale }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(data.error ?? t("learn.scholarApply.error.generic"));
          setReference(data.reference ?? null);
          setState("done");
        } catch (err) {
          setError(err instanceof Error ? err.message : t("learn.scholarApply.error.generic"));
          setState("idle");
        }
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={label}>
          {t("learn.scholarApply.f.name")}
          <input className={input} value={f.name} onChange={(e) => set("name", e.target.value)} autoComplete="name" maxLength={120} aria-invalid={!!errors.name} />
          {errors.name && <span className="mt-1 block text-xs text-red-700">{errors.name}</span>}
        </label>
        <label className={label}>
          {t("learn.scholarApply.f.email")}
          <input className={input} type="email" value={f.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" maxLength={254} aria-invalid={!!errors.email} />
          {errors.email && <span className="mt-1 block text-xs text-red-700">{errors.email}</span>}
        </label>
        <label className={label}>
          {t("learn.scholarApply.f.country")}
          <input className={input} value={f.country} onChange={(e) => set("country", e.target.value)} autoComplete="country-name" maxLength={80} />
        </label>
        <label className={label}>
          {t("learn.scholarApply.f.background")}
          <select className={input} value={f.background} onChange={(e) => set("background", e.target.value)}>
            <option value="">{t("learn.scholarApply.f.choose")}</option>
            {BACKGROUNDS.map((b) => <option key={b} value={b}>{t(`learn.scholarApply.bg.${b}`)}</option>)}
          </select>
        </label>
      </div>
      <label className={label}>
        {t("learn.scholarApply.f.motivation")}
        <span className="mt-0.5 block text-xs font-normal text-[var(--ink3)]">{t("learn.scholarApply.f.motivationHint")}</span>
        <textarea className={input} rows={6} value={f.motivation} onChange={(e) => set("motivation", e.target.value)} maxLength={2000} aria-invalid={!!errors.motivation} />
        <span className="mt-1 flex justify-between text-xs text-[var(--ink3)]">
          <span className="text-red-700">{errors.motivation}</span>
          <span>{f.motivation.trim().length}/2000</span>
        </span>
      </label>
      <label className={label}>
        {t("learn.scholarApply.f.goals")}
        <textarea className={input} rows={3} value={f.goals} onChange={(e) => set("goals", e.target.value)} maxLength={1000} />
      </label>
      {tracks.length > 0 && (
        <fieldset>
          <legend className={label}>{t("learn.scholarApply.f.tracks")}</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {tracks.map((tr) => (
              <label key={tr.id} className="flex items-start gap-2 rounded-xl border border-[var(--border)] bg-white px-3 py-2.5 text-sm">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={picked.includes(tr.id)}
                  disabled={!picked.includes(tr.id) && picked.length >= 3}
                  onChange={(e) => setPicked((p) => (e.target.checked ? [...p, tr.id] : p.filter((x) => x !== tr.id)))}
                />
                <span className="min-w-0 break-words text-[var(--ink)]">{tr.title}</span>
              </label>
            ))}
          </div>
          <p className="mt-1 text-xs text-[var(--ink3)]">{t("learn.scholarApply.f.tracksHint")}</p>
        </fieldset>
      )}
      <label className={label}>
        {t("learn.scholarApply.f.links")}
        <input className={input} value={f.links} onChange={(e) => set("links", e.target.value)} maxLength={300} placeholder="linkedin.com/in/…" />
      </label>
      {/* Bots fill every field; people never see this one. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Website
          <input tabIndex={-1} autoComplete="off" value={f.website} onChange={(e) => set("website", e.target.value)} />
        </label>
      </div>
      <label className="flex items-start gap-2 text-sm text-[var(--ink2)]">
        <input type="checkbox" className="mt-1" checked={consent} onChange={(e) => { setConsent(e.target.checked); setErrors((x) => ({ ...x, consent: "" })); }} />
        <span>{t("learn.scholarApply.f.consent")}</span>
      </label>
      {errors.consent && <p className="-mt-3 text-xs text-red-700">{errors.consent}</p>}
      {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <button
        type="submit"
        disabled={state === "sending"}
        className="w-full rounded-full bg-gradient-to-r from-[#F47C4C] to-[#F9A738] px-6 py-4 text-base font-black text-[#131A1B] shadow-sm transition hover:brightness-105 disabled:opacity-60 sm:w-auto"
      >
        {state === "sending" ? t("learn.scholar.busy") : t("learn.scholarApply.f.submit")}
      </button>
    </form>
  );
}
