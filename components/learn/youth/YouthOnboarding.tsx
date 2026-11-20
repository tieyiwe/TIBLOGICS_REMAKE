"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useT } from "@/lib/i18n/client";
import { getStoredCode } from "@/lib/promotions/client-code";

type Stage = "setup" | "pending" | "revoked" | "ready";

// AI-Empowered Youth onboarding (/learn/youth): birth year and parent email,
// then payment (when the learner was buying), the lane, or the "waiting for
// your parent" step. Every rule is enforced again on the server.
export default function YouthOnboarding(props: {
  stage: Stage;
  firstName: string;
  lane: string;
  buy: "track" | "monthly" | null;
  from: "join" | null;
  birthYear: number | null;
  parentEmailMasked: string | null;
  consentNeeded: boolean;
  minYear: number;
  maxYear: number;
}) {
  const t = useT();
  const [stage, setStage] = useState<Stage>(props.stage);
  const [editParent, setEditParent] = useState(false);
  const [year, setYear] = useState(props.birthYear ? String(props.birthYear) : "");
  const [parentEmail, setParentEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [outOfRange, setOutOfRange] = useState(false);
  const [notice, setNotice] = useState("");
  const [masked, setMasked] = useState(props.parentEmailMasked);
  const started = useRef(false);

  async function checkout(lane: string) {
    const code = getStoredCode();
    const res = await fetch("/api/learn/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(props.buy === "monthly" ? { plan: "monthly", track: lane } : { trackSlug: lane }),
        ...(code ? { promoCode: code } : {}),
        ...(props.from ? { from: props.from } : {}),
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 409 && data.code === "already_owned") {
      window.location.href = `/learn/track/${lane}`;
      return;
    }
    if (!res.ok || !data.url) throw new Error(data.error ?? t("learn.plan.checkoutFailed"));
    window.location.href = data.url;
  }

  // Profile already complete and on the way to payment: continue at once.
  useEffect(() => {
    if (props.stage === "ready" && props.buy && !started.current) {
      started.current = true;
      setBusy(true);
      checkout(props.lane).catch((err) => {
        setError(err instanceof Error ? err.message : t("learn.error.generic"));
        setBusy(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError("");
    setOutOfRange(false);
    const y = Number(year);
    if (!Number.isInteger(y) || String(y).length !== 4) {
      setError(t("learn.youth.err.birthYear"));
      return;
    }
    if (y < props.minYear || y > props.maxYear) {
      setOutOfRange(true);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parentEmail.trim())) {
      setError(t("learn.youth.err.parentEmail"));
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/learn/youth/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ birthYear: y, parentEmail: parentEmail.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.code === "range") {
        setOutOfRange(true);
        setBusy(false);
        return;
      }
      if (!res.ok) throw new Error(data.error ?? t("learn.error.generic"));
      setMasked(maskEmail(parentEmail.trim()));
      setEditParent(false);
      // On the way to payment: the parent often pays at the same time; the
      // lane stays locked until they confirm (under 13).
      if (props.buy) {
        await checkout(data.lane);
        return;
      }
      if (data.gate === "pending") {
        setStage("pending");
        setNotice(data.emailed ? t("learn.youth.sent") : t("learn.youth.err.sendFailed"));
        setBusy(false);
        return;
      }
      // The server sends them to the lane, or to its offer when not bought yet.
      window.location.href = `/learn/youth?lane=${encodeURIComponent(data.lane)}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : t("learn.error.generic"));
      setBusy(false);
    }
  }

  async function resend() {
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    const res = await fetch("/api/learn/youth/resend", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" }).catch(() => null);
    const data = res ? await res.json().catch(() => ({})) : {};
    setBusy(false);
    if (!res?.ok) setError(data.error ?? t("learn.error.generic"));
    else setNotice(t("learn.youth.sent"));
  }

  const input = "mt-1 w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2.5 text-base text-[var(--ink)] focus:border-[var(--ink)] focus:outline-none";
  const btn = "inline-flex min-h-[44px] items-center justify-center rounded-full bg-[var(--ink)] px-5 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50";
  const btn2 = "inline-flex min-h-[44px] items-center justify-center rounded-full border border-[var(--border)] bg-white px-5 py-2.5 text-sm font-bold text-[var(--ink)] hover:bg-[var(--s2)] disabled:opacity-50";

  const form = (parentOnly: boolean) => (
    <form onSubmit={save} className="mt-5 space-y-4" noValidate data-testid="youth-setup-form">
      {!parentOnly && (
        <label className="block text-sm font-semibold text-[var(--ink)]">
          {t("learn.youth.birthYear")}
          <input
            inputMode="numeric"
            autoComplete="off"
            maxLength={4}
            value={year}
            onChange={(e) => setYear(e.target.value.replace(/\D/g, ""))}
            placeholder={String(props.maxYear - 2)}
            className={input}
            data-testid="youth-birth-year"
            aria-describedby="youth-year-hint"
          />
          <span id="youth-year-hint" className="mt-1 block text-xs font-normal text-[var(--ink3)]">{t("learn.youth.birthYearHint")}</span>
        </label>
      )}
      <label className="block text-sm font-semibold text-[var(--ink)]">
        {t("learn.youth.parentEmail")}
        <input
          type="email"
          autoComplete="off"
          value={parentEmail}
          onChange={(e) => setParentEmail(e.target.value)}
          className={input}
          data-testid="youth-parent-email"
          aria-describedby="youth-parent-hint"
        />
        <span id="youth-parent-hint" className="mt-1 block text-xs font-normal text-[var(--ink3)]">{t("learn.youth.parentEmailHint")}</span>
      </label>
      {outOfRange && (
        <div role="alert" className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900" data-testid="youth-out-of-range">
          <p className="font-bold">{t("learn.youth.range.title")}</p>
          <p className="mt-1">{t("learn.youth.range.body")}</p>
          <Link href="/learning-box" className="mt-2 inline-block font-semibold underline">{t("learn.youth.range.cta")}</Link>
        </div>
      )}
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <p className="text-xs leading-relaxed text-[var(--ink3)]">{t("learn.youth.privacyNote")}</p>
      <button type="submit" disabled={busy} className={`${btn} w-full sm:w-auto`} data-testid="youth-setup-submit">
        {busy ? t("learn.youth.saving") : props.buy ? t("learn.youth.continuePay") : t("learn.youth.continue")}
      </button>
    </form>
  );

  if (stage === "setup") {
    return (
      <section className="mt-2 rounded-2xl border border-[var(--border)] bg-white p-5 sm:p-6" data-testid="youth-setup">
        <h1 className="text-xl font-black text-[var(--ink)] sm:text-2xl">{t("learn.youth.setup.title", { name: props.firstName })}</h1>
        <p className="mt-2 text-sm leading-relaxed text-[var(--ink2)]">{t("learn.youth.setup.body")}</p>
        {form(props.birthYear != null)}
      </section>
    );
  }

  if (stage === "ready") {
    return (
      <section className="mt-2 rounded-2xl border border-[var(--border)] bg-white p-5 sm:p-6" data-testid="youth-ready">
        <h1 className="text-xl font-black text-[var(--ink)]">{t("learn.youth.ready.title")}</h1>
        <p className="mt-2 text-sm text-[var(--ink2)]" role="status">{busy ? t("learn.plan.opening") : ""}</p>
        {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
        {!busy && (
          <Link href={`/learn/track/${props.lane}`} className={`${btn} mt-4`}>
            {t("learn.youth.goToLane")}
          </Link>
        )}
      </section>
    );
  }

  const revoked = stage === "revoked";
  return (
    <section className="mt-2 rounded-2xl border border-[var(--border)] bg-white p-5 sm:p-6" data-testid={revoked ? "youth-revoked" : "youth-pending"}>
      <p aria-hidden="true" className="text-3xl">{revoked ? "🔒" : "📬"}</p>
      <h1 className="mt-2 text-xl font-black text-[var(--ink)] sm:text-2xl">{t(revoked ? "learn.youth.revoked.title" : "learn.youth.pending.title")}</h1>
      <p className="mt-2 text-sm leading-relaxed text-[var(--ink2)]">
        {t(revoked ? "learn.youth.revoked.body" : "learn.youth.pending.body", { email: masked ?? "" })}
      </p>
      {!revoked && (
        <ol className="mt-4 list-decimal space-y-1 pl-5 text-sm text-[var(--ink2)]">
          <li>{t("learn.youth.pending.step1")}</li>
          <li>{t("learn.youth.pending.step2")}</li>
          <li>{t("learn.youth.pending.step3")}</li>
        </ol>
      )}
      {notice && <p role="status" className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">{notice}</p>}
      {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <button type="button" onClick={resend} disabled={busy} className={btn} data-testid="youth-resend">
          {t("learn.youth.resend")}
        </button>
        <button type="button" onClick={() => window.location.reload()} className={btn2}>
          {t("learn.youth.checkAgain")}
        </button>
        {!revoked && !editParent && (
          <button type="button" onClick={() => setEditParent(true)} className={btn2}>
            {t("learn.youth.changeParent")}
          </button>
        )}
      </div>
      {editParent && form(true)}
    </section>
  );
}

function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  return domain ? `${user.slice(0, Math.min(2, user.length))}***@${domain}` : "***";
}
