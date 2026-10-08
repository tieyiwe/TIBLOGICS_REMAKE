"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n/client";
import { fmtPrice } from "@/lib/learn/format";
import { laneForAge } from "@/lib/learn/youth";

// "Sponsor a young person", phone first, in four steps: you, your
// relationship, the young person, then note and plan. Every rule (consent,
// prices, filters) is enforced again by app/api/learn/youth/sponsor.

const RELS = ["parent", "guardian", "grandparent", "auntUncle", "sibling", "godparent", "friend", "mentor", "teacher", "other"] as const;
const CONSENT_AGE = 13;

const input = "mt-1 w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2.5 text-base text-[var(--ink)] focus:border-[var(--ink)] focus:outline-none";
const btn = "inline-flex min-h-[44px] items-center justify-center rounded-full bg-[var(--ink)] px-5 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50";
const btn2 = "inline-flex min-h-[44px] items-center justify-center rounded-full border border-[var(--border)] bg-white px-5 py-2.5 text-sm font-bold text-[var(--ink)] hover:bg-[var(--s2)]";
const emailOk = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());

export default function SponsorFlow(props: {
  lanes: Array<{ slug: string; title: string; lifetimeCents: number; monthlyCents: number }>;
  initialLane: string;
  locale: string;
  sponsor: { name: string; email: string } | null;
  siblingPct: number;
}) {
  const t = useT();
  const [step, setStep] = useState(1);
  const [sponsorName, setSponsorName] = useState(props.sponsor?.name ?? "");
  const [sponsorEmail, setSponsorEmail] = useState(props.sponsor?.email ?? "");
  const [rel, setRel] = useState<string>("");
  const [relOther, setRelOther] = useState("");
  const [childName, setChildName] = useState("");
  const [age, setAge] = useState("");
  const [lane, setLane] = useState(props.lanes.some((l) => l.slug === props.initialLane) ? props.initialLane : props.lanes[0].slug);
  const [childEmail, setChildEmail] = useState("");
  const [childLocale, setChildLocale] = useState(["en", "fr", "sw"].includes(props.locale) ? props.locale : "en");
  const [parentEmail, setParentEmail] = useState("");
  const [attested, setAttested] = useState(false);
  const [note, setNote] = useState("");
  const [plan, setPlan] = useState<"lifetime" | "monthly">("lifetime");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const n = Number(age);
  const ageOk = Number.isInteger(n) && n >= 10 && n <= 17;
  const parentRole = rel === "parent" || rel === "guardian";
  const needParentEmail = !parentRole && ageOk && n < CONSENT_AGE;
  const needAttest = parentRole && ageOk && n < CONSENT_AGE;
  const chosen = props.lanes.find((l) => l.slug === lane) ?? props.lanes[0];
  const less = (c: number) => (props.siblingPct ? Math.round((c * (100 - props.siblingPct)) / 100) : c);

  function next() {
    setError("");
    if (step === 1) {
      if (sponsorName.trim().length < 2) return setError(t("learn.youth.sponsor.err.name"));
      if (!emailOk(sponsorEmail)) return setError(t("learn.youth.sponsor.err.email"));
    }
    if (step === 2) {
      if (!rel) return setError(t("learn.youth.sponsor.err.relationship"));
      if (rel === "other" && relOther.trim().length < 2) return setError(t("learn.youth.sponsor.err.relationshipOther"));
    }
    if (step === 3) {
      if (!childName.trim()) return setError(t("learn.youth.sponsor.err.name"));
      if (!ageOk) return setError(t("learn.youth.sponsor.err.age"));
      if (!emailOk(childEmail)) return setError(t("learn.youth.sponsor.err.childEmail"));
      if (childEmail.trim().toLowerCase() === sponsorEmail.trim().toLowerCase()) return setError(t("learn.youth.sponsor.err.childEmailSame"));
      if (needParentEmail && !emailOk(parentEmail)) return setError(t("learn.youth.sponsor.err.parentEmail"));
      if (needAttest && !attested) return setError(t("learn.youth.sponsor.err.attest"));
    }
    setStep((s) => s + 1);
  }

  async function pay() {
    setBusy(true);
    setError("");
    const res = await fetch("/api/learn/youth/sponsor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sponsorName, sponsorEmail, relationship: rel, ...(rel === "other" ? { relationshipOther: relOther } : {}),
        childFirstName: childName, childAge: n, childEmail, childLocale, lane, ...(note.trim() ? { note } : {}), plan,
        ...(needParentEmail || (!parentRole && parentEmail.trim()) ? { parentEmail } : {}), ...(parentRole ? { parentAttested: attested } : {}),
      }),
    }).catch(() => null);
    const data = res ? await res.json().catch(() => ({})) : {};
    if (!res?.ok || !data.url) {
      setError(data.error ?? t("learn.plan.checkoutFailed"));
      setBusy(false);
      const back: Record<string, number> = { sponsorName: 1, sponsorEmail: 1, relationship: 2, relationshipOther: 2, childEmail: 3, parentEmail: 3, parentAttested: 3, lane: 3 };
      if (data.field && back[data.field]) setStep(back[data.field]);
      return;
    }
    window.location.href = data.url;
  }

  const stepTitle = ["learn.youth.sponsor.step.you", "learn.youth.sponsor.step.relationship", "learn.youth.sponsor.step.child", "learn.youth.sponsor.step.plan"][step - 1];
  return (
    <section className="mt-6 rounded-2xl border border-[var(--border)] bg-white p-5 sm:p-6" data-testid="sponsor-flow">
      <p className="text-xs font-semibold text-[var(--ink3)]">{t("learn.youth.sponsor.stepOf", { n: step, total: 4 })}</p>
      <h2 className="mt-1 text-lg font-black text-[var(--ink)]">{t(stepTitle)}</h2>

      <div className="mt-4 space-y-4">
        {step === 1 && (
          <>
            <label className="block text-sm font-semibold text-[var(--ink)]">
              {t("learn.youth.sponsor.yourName")}
              <input value={sponsorName} onChange={(e) => setSponsorName(e.target.value)} maxLength={80} className={input} autoComplete="name" data-testid="sp-name" />
            </label>
            <label className="block text-sm font-semibold text-[var(--ink)]">
              {t("learn.youth.sponsor.yourEmail")}
              <input type="email" value={sponsorEmail} onChange={(e) => setSponsorEmail(e.target.value)} className={input} autoComplete="email" data-testid="sp-email" />
            </label>
          </>
        )}

        {step === 2 && (
          <fieldset>
            <legend className="text-sm text-[var(--ink2)]">{t("learn.youth.sponsor.relationshipQ")}</legend>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {RELS.map((r) => (
                <label key={r} className={`flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm ${rel === r ? "border-[var(--ink)] bg-[var(--s2)] font-bold" : "border-[var(--border)]"}`}>
                  <input type="radio" name="sp-rel" value={r} checked={rel === r} onChange={() => setRel(r)} className="h-4 w-4" data-testid={`sp-rel-${r}`} />
                  {t(`learn.youth.sponsor.rel.${r}`)}
                </label>
              ))}
            </div>
            {rel === "other" && (
              <label className="mt-3 block text-sm font-semibold text-[var(--ink)]">
                {t("learn.youth.sponsor.relationshipOther")}
                <input value={relOther} onChange={(e) => setRelOther(e.target.value.slice(0, 40))} maxLength={40} className={input} data-testid="sp-rel-other" />
              </label>
            )}
          </fieldset>
        )}

        {step === 3 && (
          <>
            <label className="block text-sm font-semibold text-[var(--ink)]">
              {t("learn.youth.sponsor.childName")}
              <input value={childName} onChange={(e) => setChildName(e.target.value)} maxLength={40} className={input} autoComplete="off" data-testid="sp-child-name" />
            </label>
            <label className="block text-sm font-semibold text-[var(--ink)]">
              {t("learn.youth.sponsor.childAge")}
              <input
                inputMode="numeric"
                value={age}
                maxLength={2}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "");
                  setAge(v);
                  const a = Number(v);
                  if (a >= 10 && a <= 17 && props.lanes.some((l) => l.slug === laneForAge(a))) setLane(laneForAge(a));
                }}
                className={input}
                data-testid="sp-child-age"
              />
            </label>
            {props.lanes.length > 1 && (
              <fieldset>
                <legend className="text-sm font-semibold text-[var(--ink)]">{t("learn.youth.sponsor.lane")}</legend>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {props.lanes.map((l) => (
                    <label key={l.slug} className={`flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm ${lane === l.slug ? "border-[var(--ink)] bg-[var(--s2)] font-bold" : "border-[var(--border)]"}`}>
                      <input type="radio" name="sp-lane" checked={lane === l.slug} onChange={() => setLane(l.slug)} className="h-4 w-4" data-testid={`sp-lane-${l.slug}`} />
                      {t(l.slug.endsWith("explorer") ? "learn.youth.band.explorer" : "learn.youth.band.builder")}
                    </label>
                  ))}
                </div>
                <p className="mt-1 text-xs text-[var(--ink3)]">{t("learn.youth.sponsor.laneHint")}</p>
              </fieldset>
            )}
            <label className="block text-sm font-semibold text-[var(--ink)]">
              {t("learn.youth.sponsor.childEmail")}
              <input type="email" value={childEmail} onChange={(e) => setChildEmail(e.target.value)} className={input} autoComplete="off" data-testid="sp-child-email" />
              <span className="mt-1 block text-xs font-normal text-[var(--ink3)]">{t("learn.youth.sponsor.childEmailHint")}</span>
            </label>
            <label className="block text-sm font-semibold text-[var(--ink)]">
              {t("learn.youth.sponsor.childLocale")}
              <select value={childLocale} onChange={(e) => setChildLocale(e.target.value)} className={input} data-testid="sp-child-locale">
                <option value="en">English</option>
                <option value="fr">Français</option>
                <option value="sw">Kiswahili</option>
              </select>
            </label>
            {!parentRole && ageOk && (
              <label className="block text-sm font-semibold text-[var(--ink)]">
                {t(needParentEmail ? "learn.youth.sponsor.parentEmail" : "learn.youth.sponsor.parentEmailOptional")}
                <input type="email" value={parentEmail} onChange={(e) => setParentEmail(e.target.value)} className={input} autoComplete="off" data-testid="sp-parent-email" />
                <span className="mt-1 block text-xs font-normal text-[var(--ink3)]">{t(needParentEmail ? "learn.youth.sponsor.parentEmailHint" : "learn.youth.sponsor.parentEmailHintTeen")}</span>
              </label>
            )}
            {parentRole && (
              <label className="flex cursor-pointer items-start gap-3 rounded-xl bg-[var(--s2)] p-3">
                <input type="checkbox" checked={attested} onChange={(e) => setAttested(e.target.checked)} className="mt-1 h-5 w-5 shrink-0" data-testid="sp-attest" />
                <span className="text-sm leading-relaxed text-[var(--ink)]">{t("learn.parent.consent.agree", { name: childName.trim() || t("learn.youth.sponsor.yourChild") })}</span>
              </label>
            )}
          </>
        )}

        {step === 4 && (
          <>
            <label className="block text-sm font-semibold text-[var(--ink)]">
              {t("learn.youth.sponsor.note", { name: childName.trim() })}
              <textarea value={note} onChange={(e) => setNote(e.target.value.slice(0, 300))} rows={3} maxLength={300} className={input} data-testid="sp-note" />
              <span className="mt-1 block text-xs font-normal text-[var(--ink3)]">{t("learn.portal.encourage.ownHint", { n: 300 - note.length })}</span>
            </label>
            <fieldset>
              <legend className="text-sm font-semibold text-[var(--ink)]">{t("learn.youth.sponsor.plan")}</legend>
              {props.siblingPct > 0 && (
                <p className="mt-2 inline-flex rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-800" data-testid="sibling-discount">{t("learn.youth.siblingDiscount", { pct: props.siblingPct })}</p>
              )}
              <div className="mt-2 grid gap-2">
                {(["lifetime", "monthly"] as const).map((pl) => (
                  <label key={pl} className={`flex min-h-[56px] cursor-pointer items-center justify-between gap-3 rounded-xl border px-3 py-2 ${plan === pl ? "border-[var(--ink)] bg-[var(--s2)]" : "border-[var(--border)]"}`}>
                    <span className="flex items-center gap-2 text-sm">
                      <input type="radio" name="sp-plan" checked={plan === pl} onChange={() => setPlan(pl)} className="h-4 w-4" data-testid={`sp-plan-${pl}`} />
                      <span className="font-bold text-[var(--ink)]">{t(`learn.youth.sponsor.plan.${pl}`)}</span>
                    </span>
                    <span className="text-sm font-black text-[var(--ink)]">
                      {fmtPrice(less(pl === "lifetime" ? chosen.lifetimeCents : chosen.monthlyCents), props.locale)}
                      {pl === "monthly" ? <span className="text-xs font-normal text-[var(--ink3)]"> {t("learn.plan.per.month")}</span> : null}
                    </span>
                  </label>
                ))}
              </div>
              {props.siblingPct === 0 && (
                <a href="/portal/signin" className="mt-2 block text-xs text-[var(--ink3)] underline-offset-2 hover:underline">
                  {t("learn.youth.sponsor.siblingNote")}
                </a>
              )}
            </fieldset>
            <p className="text-xs leading-relaxed text-[var(--ink3)]">{t(needParentEmail ? "learn.youth.sponsor.consentNote" : "learn.youth.sponsor.childNote", { name: childName.trim() })}</p>
          </>
        )}

        {error && <p role="alert" className="text-sm text-red-700" data-testid="sp-error">{error}</p>}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          {step > 1 ? <button type="button" className={btn2} onClick={() => { setError(""); setStep((s) => s - 1); }}>{t("learn.youth.sponsor.back")}</button> : <span />}
          {step < 4 ? (
            <button type="button" className={btn} onClick={next} data-testid="sp-next">{t("learn.youth.sponsor.next")}</button>
          ) : (
            <button type="button" className={btn} onClick={pay} disabled={busy} data-testid="sp-pay">{busy ? t("learn.plan.opening") : t("learn.youth.sponsor.pay")}</button>
          )}
        </div>
      </div>
    </section>
  );
}
