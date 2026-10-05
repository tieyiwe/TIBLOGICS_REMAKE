"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { signIn, signOut } from "next-auth/react";
import { useLocale, useT } from "@/lib/i18n/client";
import { fmtPrice } from "@/lib/learn/format";
import SalePrice, { type SaleInfo } from "@/components/promo/SalePrice";
import PromoCodeField from "@/components/promo/PromoCodeField";
import { getStoredCode, setStoredCode, useStoredCode } from "@/lib/promotions/client-code";
import type { TargetT } from "@/lib/promotions/lines";
import { quoteSeats, type SeatTier } from "@/lib/learn/team/config";
import SeatBands from "@/components/learn/team/SeatBands";
import { choiceKey, joinPath, type JoinChoice } from "@/lib/learn/join/choice";
import { trackEvent } from "@/components/public/AnalyticsTracker";

// The one-page "Join ARFA" flow (/learning-box/join), as one client island:
//   1. Choose: all tracks monthly, one track for life, or a team plan.
//   2. Your account: Google, or name + email + password (an existing address
//      switches to "sign in" on the spot). Skipped when already signed in.
//   3. Pay: one click creates the account, signs in and opens Stripe.
// Prices here are display only: checkout recomputes everything on the server.

export interface JoinTrack {
  slug: string;
  title: string;
  tagline: string | null;
  /** "Beginner · 12 hours", localized on the server. */
  meta: string;
  accentColor: string;
  priceCents: number;
  saleCents: number | null;
  owned: boolean;
  /** Open through all-tracks access (subscription, comp or the owner), not bought. */
  included?: boolean;
}

export interface JoinFlowProps {
  tracks: JoinTrack[];
  monthly: { cents: number; sale: SaleInfo | null; compareAtCents: number | null; founding: boolean; active: boolean };
  team: { seatPriceCents: number; minSeats: number; tiers: SeatTier[] };
  initial: JoinChoice | null;
  initialCode: string | null;
  autoGo: boolean;
  cancelled: boolean;
  student: { name: string; email: string } | null;
  google: boolean;
}

type Phase = "idle" | "account" | "signin" | "checkout";
type Mode = "create" | "signin";

const inputCls =
  "mt-1.5 min-h-[44px] w-full rounded-lg border border-[var(--border)] bg-white px-3 py-2.5 text-base text-[var(--ink)] outline-none focus:border-[var(--blue3)] focus:ring-2 focus:ring-[var(--blue3)]/20 sm:text-sm";

function track(event: string, meta: Record<string, unknown>) {
  try {
    trackEvent(event, "/learning-box/join", meta);
  } catch {
    /* analytics never blocks the flow */
  }
}

export default function JoinFlow(props: JoinFlowProps) {
  const { tracks, monthly, team, student } = props;
  const t = useT();
  const locale = useLocale();
  const uid = useId();
  const firstFree = tracks.find((x) => !x.owned);

  // ── Step 1: the choice ────────────────────────────────────────────────
  const [choice, setChoice] = useState<JoinChoice | null>(() => {
    const c = props.initial;
    if (c?.kind === "track" && !tracks.some((x) => x.slug === c.slug && !x.owned)) return null;
    if (c?.kind === "team") return { ...c, seats: Math.max(team.minSeats, c.seats || team.minSeats) };
    if (c) return c;
    // Nothing chosen yet: the all-tracks plan, unless it is already active.
    return monthly.active ? (firstFree ? { kind: "track", slug: firstFree.slug } : null) : { kind: "monthly", track: null };
  });
  const [seats, setSeats] = useState(choice?.kind === "team" ? choice.seats : team.minSeats);
  const [company, setCompany] = useState("");
  const chosenTrack = choice?.kind === "track" ? tracks.find((x) => x.slug === choice.slug) ?? null : null;
  const contextTrack = choice?.kind === "monthly" && choice.track ? tracks.find((x) => x.slug === choice.track) ?? null : null;
  const quote = quoteSeats(team, Number.isInteger(seats) ? Math.max(seats, 0) : team.minSeats);
  const seatsValid = Number.isInteger(seats) && seats >= team.minSeats && seats <= 500;
  const fullChoice: JoinChoice | null = choice?.kind === "team" ? { kind: "team", seats, company: company.trim() || null } : choice;

  const pick = (c: JoinChoice) => {
    setChoice(c);
    setError("");
    track("join_choice", { choice: choiceKey(c) });
  };

  // Keep the URL in step so a reload, the back button or a shared link keeps the choice.
  useEffect(() => {
    if (!choice) return;
    const url = joinPath(choice.kind === "team" ? { kind: "team", seats } : choice);
    try {
      window.history.replaceState(window.history.state, "", url + window.location.hash);
    } catch {
      /* ignore */
    }
  }, [choice, seats]);

  // ── Promo code (?code=) ────────────────────────────────────────────────
  const applied = useStoredCode();
  useEffect(() => {
    const code = props.initialCode;
    if (!code || getStoredCode()) return;
    const target: TargetT = chosenTrack ? { kind: "track", slug: chosenTrack.slug } : { kind: "arfa_monthly" };
    fetch("/api/promotions/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, targets: [target] }),
    })
      .then((r) => r.json())
      .then((d: { ok?: boolean; code?: string }) => d.ok && setStoredCode(d.code || code))
      .catch(() => {});
    // Once, on arrival.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const promoTargets: TargetT[] =
    choice?.kind === "track" ? [{ kind: "track", slug: choice.slug }] : choice?.kind === "monthly" ? [{ kind: "arfa_monthly" }] : [];

  // ── Step 2: the account ───────────────────────────────────────────────
  const [mode, setMode] = useState<Mode>("create");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState("");
  const [statusLink, setStatusLink] = useState("");
  // Account created (or signed in) but checkout did not open: offer a retry
  // that only repeats the checkout step.
  const [accountReady, setAccountReady] = useState(!!student);
  const [retry, setRetry] = useState(false);
  const busy = phase !== "idle";
  const passwordRef = useRef<HTMLInputElement>(null);
  const companyRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const payRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    track("join_view", { choice: choiceKey(props.initial), signedIn: !!student, cancelled: props.cancelled });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Client-side checks before anything is sent. False with an error shown. */
  function ready(): boolean {
    if (!choice) {
      setError(t("learn.join.err.choose"));
      return false;
    }
    if (choice.kind === "team") {
      if (!seatsValid) {
        setError(t("team.offer.minError", { n: team.minSeats }));
        return false;
      }
      if (company.trim().length < 2) {
        setError(t("learn.join.err.company"));
        companyRef.current?.focus();
        return false;
      }
    }
    return true;
  }

  const checkout = useCallback(async (): Promise<boolean> => {
    const c = fullChoice;
    if (!c) return false;
    setPhase("checkout");
    setError("");
    const code = getStoredCode();
    try {
      // Remember the choice (resume card, reminder) before leaving for Stripe.
      await fetch("/api/learn/join/choice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ choice: c, promoCode: code }),
      }).catch(() => {});
      const res =
        c.kind === "team"
          ? await fetch("/api/learn/team/checkout", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ seats: c.seats, name: c.company ?? "", from: "join" }),
            })
          : await fetch("/api/learn/checkout", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...(c.kind === "track" ? { trackSlug: c.slug } : { plan: "monthly", ...(c.track ? { track: c.track } : {}) }),
                ...(code ? { promoCode: code } : {}),
                from: "join",
              }),
            });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) throw new Error(data.error ?? t("learn.plan.checkoutFailed"));
      track("join_checkout", { choice: choiceKey(c), promo: !!code });
      window.location.href = data.url;
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : t("learn.error.generic"));
      setRetry(true);
      setPhase("idle");
      return false;
    }
    // fullChoice changes with every keystroke in the company field.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [choice, seats, company, t]);

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (busy) return;
    setStatusLink("");
    if (!ready()) return;
    if (accountReady) {
      await checkout();
      return;
    }
    setError("");
    try {
      if (mode === "create") {
        setPhase("account");
        const res = await fetch("/api/learn/join/account", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password, locale, choice: fullChoice, promoCode: getStoredCode() }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.status === 409 && data.code === "exists") {
          // Existing account: sign in right here, nothing else changes.
          setMode("signin");
          setPassword("");
          setPhase("idle");
          track("join_existing", {});
          setTimeout(() => passwordRef.current?.focus(), 30);
          return;
        }
        if (!res.ok) throw new Error(data.error ?? t("learn.auth.createFailed"));
      } else {
        setPhase("signin");
      }
      const r = await signIn("student", { email, password, redirect: false });
      if (r?.error) {
        const locked = /^Account(Suspended|Blocked):(.*)$/.exec(r.error);
        if (locked) setStatusLink(`/learn/account-status?t=${encodeURIComponent(locked[2])}`);
        if (mode === "create") {
          // The account exists now; only the automatic sign-in failed.
          setMode("signin");
          setPassword("");
        }
        throw new Error(locked ? t("learn.join.err.locked") : t("learn.auth.badCredentials"));
      }
      setAccountReady(true);
      track("join_account", { method: mode === "create" ? "password" : "signin", choice: choiceKey(choice) });
      await checkout();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("learn.error.generic"));
      setPhase("idle");
    }
  }

  // Signed in with ?go=1 (back from Google, or a "Finish your enrolment"
  // link): continue straight to payment, once. The flag leaves the URL first,
  // so the back button from Stripe does not bounce the learner there again.
  const went = useRef(false);
  useEffect(() => {
    if (!props.autoGo || !student || went.current) return;
    went.current = true;
    try {
      const u = new URL(window.location.href);
      u.searchParams.delete("go");
      window.history.replaceState(window.history.state, "", u.pathname + u.search + u.hash);
    } catch {
      /* ignore */
    }
    if (choice?.kind === "team" && company.trim().length < 2) {
      companyRef.current?.focus();
      return;
    }
    if (choice) void checkout();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Summary ───────────────────────────────────────────────────────────
  const summary = useMemo(() => {
    if (!choice) return null;
    if (choice.kind === "track" && chosenTrack) {
      return {
        what: chosenTrack.title,
        price: t("learn.join.sum.once", { price: fmtPrice(chosenTrack.saleCents ?? chosenTrack.priceCents, locale) }),
        was: chosenTrack.saleCents != null && chosenTrack.saleCents < chosenTrack.priceCents ? fmtPrice(chosenTrack.priceCents, locale) : null,
        note: t("learn.join.sum.trackNote"),
      };
    }
    if (choice.kind === "monthly") {
      return {
        what: t("learn.join.monthly.title"),
        price: t("learn.price.perMonth", { price: fmtPrice(monthly.sale?.saleCents ?? monthly.cents, locale) }),
        was: monthly.sale ? fmtPrice(monthly.sale.originalCents, locale) : null,
        note: t("learn.join.sum.monthlyNote"),
      };
    }
    if (choice.kind === "team") {
      return {
        what: t("learn.join.sum.team", { n: seatsValid ? seats : team.minSeats }),
        price: t("learn.price.perMonth", { price: fmtPrice(seatsValid ? quote.totalCents : quoteSeats(team, team.minSeats).totalCents, locale) }),
        was: null,
        note: t("learn.join.sum.teamNote"),
      };
    }
    return null;
  }, [choice, chosenTrack, monthly, seats, seatsValid, quote.totalCents, team, t, locale]);

  const payLabel = (() => {
    if (phase === "account") return t("learn.join.busy.account");
    if (phase === "signin") return t("learn.auth.signingIn");
    if (phase === "checkout") return t("learn.join.busy.checkout");
    if (retry && accountReady) return t("learn.join.retry");
    if (accountReady) return choice?.kind === "team" ? t("learn.join.pay.team") : t("learn.join.pay.continue");
    if (mode === "signin") return t("learn.join.pay.signin");
    return t("learn.join.pay.create");
  })();

  // Mobile: a summary bar fixed to the bottom while the pay button is off screen.
  const [payVisible, setPayVisible] = useState(false);
  useEffect(() => {
    const el = payRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setPayVisible(e.isIntersecting), { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  function toAccount() {
    payRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => {
      if (choice?.kind === "team" && company.trim().length < 2) companyRef.current?.focus();
      else if (!accountReady && mode === "create") nameRef.current?.focus({ preventScroll: true });
    }, 350);
  }

  const googleNext = joinPath(fullChoice, { go: true, code: applied });
  const freeHref = `/learn/signup${chosenTrack ? `?track=${encodeURIComponent(chosenTrack.slug)}` : contextTrack ? `?track=${encodeURIComponent(contextTrack.slug)}` : ""}`;

  // ── Render ────────────────────────────────────────────────────────────
  const radioCard =
    "relative block cursor-pointer rounded-2xl border-2 bg-white transition-colors has-[:checked]:border-[var(--orange)] has-[:checked]:bg-[#FFF8F1] has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[var(--blue3)] has-[:focus-visible]:ring-offset-2 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-70";
  const dot = (on: boolean) => (
    <span
      aria-hidden="true"
      className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${on ? "border-[var(--orange)]" : "border-[var(--border)]"}`}
    >
      {on && <span className="h-2.5 w-2.5 rounded-full bg-[var(--orange)]" />}
    </span>
  );
  const isMonthly = choice?.kind === "monthly";
  const isTeam = choice?.kind === "team";

  return (
    <div className="grid gap-6 pb-28 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:pb-0">
      {/* ── 1. Choose ───────────────────────────────────────────────── */}
      <section aria-labelledby={`${uid}-s1`} className="min-w-0">
        <h2 id={`${uid}-s1`} className="flex items-center gap-2 text-lg font-black text-[var(--ink)]">
          <StepNum n={1} /> {t("learn.join.step1")}
        </h2>
        {props.cancelled && (
          <p role="status" className="mt-3 rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-sm text-[var(--ink2)]">
            {t("learn.join.cancelled")}
          </p>
        )}

        <fieldset className="mt-4">
          <legend className="sr-only">{t("learn.join.step1")}</legend>

          {/* All tracks, monthly */}
          <label className={`${radioCard} ${isMonthly ? "" : "border-[var(--border)]"} p-5`}>
            <input
              type="radio"
              name="join-plan"
              className="sr-only"
              checked={isMonthly}
              disabled={monthly.active}
              onChange={() => pick({ kind: "monthly", track: chosenTrack?.slug ?? contextTrack?.slug ?? null })}
            />
            <span className="flex items-start gap-3">
              {dot(isMonthly)}
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-base font-black text-[var(--ink)]">{t("learn.join.monthly.title")}</span>
                  <span className="rounded-full bg-[var(--ink)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                    {t("learn.join.monthly.badge")}
                  </span>
                </span>
                <span className="mt-1 block text-sm leading-relaxed text-[var(--ink2)]">{t("learn.offer.all.blurb")}</span>
                <span className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span className="text-2xl font-black text-[var(--ink)]">{fmtPrice(monthly.sale?.saleCents ?? monthly.cents, locale)}</span>
                  <span className="text-sm text-[var(--ink3)]">{t("learn.plan.per.month")}</span>
                  {monthly.sale ? <SalePrice sale={monthly.sale} recurring /> : null}
                  {!monthly.sale && monthly.founding && monthly.compareAtCents ? (
                    <span className="text-xs text-[var(--ink3)]">
                      <span className="line-through">{fmtPrice(monthly.compareAtCents, locale)}</span>{" "}
                      <span className="font-bold text-[var(--orange2)]">{t("learn.billing.foundingRate")}</span>
                    </span>
                  ) : null}
                </span>
                {monthly.active ? (
                  <span className="mt-2 inline-block rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-800">✓ {t("learn.join.monthly.active")}</span>
                ) : (
                  <span className="mt-2 grid gap-1 text-xs text-[var(--ink2)] sm:grid-cols-2">
                    {[1, 2, 3, 5].map((n) => (
                      <span key={n} className="flex gap-1.5">
                        <span aria-hidden="true" className="font-bold text-[var(--orange2)]">✓</span>
                        {t(`learn.subscribe.item.${n}`)}
                      </span>
                    ))}
                  </span>
                )}
              </span>
            </span>
          </label>

          {/* Teams, surfaced near the top: the full team option is further down. */}
          {!isTeam && (
            <div className="mt-3 flex flex-col gap-3 rounded-2xl border-2 border-dashed border-[var(--blue3)] bg-white p-4 sm:flex-row sm:items-center sm:justify-between" data-testid="team-shortcut">
              <span className="min-w-0">
                <span className="block text-sm font-black text-[var(--ink)]">{t("learn.join.teamShortcut.title")}</span>
                <span className="mt-0.5 block text-xs leading-relaxed text-[var(--ink2)]">
                  {t("learn.join.teamShortcut.body", {
                    from: fmtPrice(team.seatPriceCents, locale),
                    to: fmtPrice(Math.min(team.seatPriceCents, ...team.tiers.map((x) => x.seatPriceCents)), locale),
                  })}
                </span>
              </span>
              <button
                type="button"
                onClick={() => {
                  pick({ kind: "team", seats });
                  setTimeout(() => document.getElementById(`${uid}-teams`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
                }}
                className="shrink-0 rounded-full bg-[var(--ink)] px-5 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
              >
                {t("learn.join.teamShortcut.cta")} →
              </button>
            </div>
          )}

          {/* One track, for life */}
          <div className="mt-6 flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-sm font-bold text-[var(--ink)]">{t("learn.subscribe.pickTitle")}</h3>
            <p className="text-xs text-[var(--ink3)]">{t("learn.subscribe.singleBody")}</p>
          </div>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {tracks.map((c) => {
              const on = choice?.kind === "track" && choice.slug === c.slug;
              const sale = c.saleCents != null && c.saleCents < c.priceCents ? { saleCents: c.saleCents, originalCents: c.priceCents } : null;
              return (
                <li key={c.slug} className="min-w-0">
                  <label
                    className={`${radioCard} ${on ? "" : "border-[var(--border)]"} flex h-full flex-col overflow-hidden p-4`}
                    style={{ borderTopColor: on ? undefined : c.accentColor, borderTopWidth: 4 }}
                  >
                    <input
                      type="radio"
                      name="join-plan"
                      className="sr-only"
                      checked={on}
                      disabled={c.owned}
                      onChange={() => pick({ kind: "track", slug: c.slug })}
                    />
                    <span className="flex items-start gap-2.5">
                      {dot(on)}
                      <span className="min-w-0 flex-1">
                        <span className="block text-[11px] font-semibold uppercase tracking-wide text-[var(--ink3)]">{c.meta}</span>
                        <span className="mt-0.5 block text-sm font-bold leading-snug text-[var(--ink)]">{c.title}</span>
                        {c.tagline && <span className="mt-1 line-clamp-2 block text-xs leading-relaxed text-[var(--ink2)]">{c.tagline}</span>}
                      </span>
                    </span>
                    <span className="mt-auto flex flex-wrap items-baseline gap-x-1.5 pl-7 pt-3">
                      {c.owned ? (
                        <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-bold text-green-800">✓ {t(c.included ? "learn.join.included" : "learn.join.owned")}</span>
                      ) : (
                        <>
                          <span className="text-base font-black text-[var(--ink)]">{fmtPrice(sale?.saleCents ?? c.priceCents, locale)}</span>
                          <span className="text-xs text-[var(--ink3)]">{t("learn.offer.oneTime")}</span>
                          {sale ? <SalePrice sale={sale} /> : null}
                        </>
                      )}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
          <p className="mt-2 text-xs text-[var(--ink3)]">
            <Link href="/learning-box#path" className="underline underline-offset-2">
              {t("learn.join.compare")}
            </Link>
          </p>

          {/* Teams */}
          <label id={`${uid}-teams`} className={`${radioCard} ${isTeam ? "" : "border-[var(--border)]"} mt-6 scroll-mt-32 p-5`}>
            <input type="radio" name="join-plan" className="sr-only" checked={isTeam} onChange={() => pick({ kind: "team", seats })} />
            <span className="flex items-start gap-3">
              {dot(isTeam)}
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-base font-black text-[var(--ink)]">{t("team.offer.title")}</span>
                  <span className="text-sm text-[var(--ink2)]">
                    <strong className="text-[var(--ink)]">{fmtPrice(team.seatPriceCents, locale)}</strong> {t("team.offer.perSeat")}
                    {team.tiers.length > 0 && (
                      <span className="block text-right text-xs text-[var(--ink3)]">
                        {t("team.offer.fromPrice", { price: fmtPrice(Math.min(...team.tiers.map((x) => x.seatPriceCents)), locale) })}
                      </span>
                    )}
                  </span>
                </span>
                <span className="mt-1 block text-sm leading-relaxed text-[var(--ink2)]">
                  {t("team.offer.blurb", { price: fmtPrice(team.seatPriceCents, locale), n: team.minSeats })}
                </span>
                {team.tiers.length > 0 && (
                  <span className="mt-3 block">
                    <SeatBands seatPriceCents={team.seatPriceCents} minSeats={team.minSeats} tiers={team.tiers} seats={isTeam && Number.isInteger(seats) ? seats : undefined} />
                  </span>
                )}
              </span>
            </span>
          </label>
          {isTeam && (
            <div className="mt-3 grid gap-4 rounded-2xl border border-[var(--border)] bg-white p-5 sm:grid-cols-[auto_1fr] sm:items-end">
              <div>
                <label htmlFor={`${uid}-seats`} className="block text-sm font-semibold text-[var(--ink)]">
                  {t("team.offer.seats")}
                </label>
                <div className="mt-1.5 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSeats((s) => Math.max(team.minSeats, (Number.isInteger(s) ? s : team.minSeats) - 1))}
                    aria-label={t("team.offer.fewer")}
                    className="h-11 w-11 rounded-lg border border-[var(--border)] text-lg font-bold"
                  >
                    −
                  </button>
                  <input
                    id={`${uid}-seats`}
                    type="number"
                    inputMode="numeric"
                    min={team.minSeats}
                    max={500}
                    value={Number.isFinite(seats) ? seats : ""}
                    onChange={(e) => setSeats(parseInt(e.target.value, 10))}
                    className="h-11 w-20 rounded-lg border border-[var(--border)] text-center text-base font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => setSeats((s) => Math.min(500, (Number.isInteger(s) ? s : team.minSeats) + 1))}
                    aria-label={t("team.offer.more")}
                    className="h-11 w-11 rounded-lg border border-[var(--border)] text-lg font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="min-w-0">
                <label htmlFor={`${uid}-company`} className="block text-sm font-semibold text-[var(--ink)]">
                  {t("team.offer.company")}
                </label>
                <input
                  id={`${uid}-company`}
                  ref={companyRef}
                  required
                  minLength={2}
                  maxLength={80}
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  autoComplete="organization"
                  className={inputCls}
                />
              </div>
              <p className="text-sm text-[var(--ink2)] sm:col-span-2" aria-live="polite">
                {seatsValid
                  ? t("team.offer.total", { n: seats, price: fmtPrice(quote.seatPriceCents, locale), total: fmtPrice(quote.totalCents, locale) })
                  : t("team.offer.minError", { n: team.minSeats })}
              </p>
            </div>
          )}
        </fieldset>

      </section>

      {/* ── 2. Account + 3. Pay ─────────────────────────────────────── */}
      <aside className="min-w-0 lg:sticky lg:top-32">
        <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm sm:p-6">
          {/* Summary */}
          <div className="rounded-xl bg-[var(--s2)] p-4" aria-live="polite">
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">{t("learn.join.sum.label")}</p>
            {summary ? (
              <>
                <p className="mt-1 text-base font-black leading-snug text-[var(--ink)]">{summary.what}</p>
                <p className="mt-0.5 text-sm text-[var(--ink2)]">
                  {summary.was ? <span className="mr-1.5 text-[var(--ink3)] line-through">{summary.was}</span> : null}
                  <strong className="text-[var(--ink)]">{summary.price}</strong>
                </p>
                <p className="mt-1 text-xs text-[var(--ink3)]">{summary.note}</p>
                {applied && !isTeam && <p className="mt-1 text-xs font-semibold text-green-800">{t("learn.join.sum.code", { code: applied })}</p>}
              </>
            ) : (
              <p className="mt-1 text-sm text-[var(--ink2)]">{t("learn.join.sum.none")}</p>
            )}
          </div>
          {promoTargets.length > 0 && (
            <div className="mt-3">
              <PromoCodeField targets={promoTargets} email={email || student?.email} />
            </div>
          )}

          <h2 className="mt-5 flex items-center gap-2 text-lg font-black text-[var(--ink)]">
            <StepNum n={2} done={accountReady} /> {t("learn.join.step2")}
          </h2>

          {accountReady && student ? (
            <p className="mt-2 text-sm text-[var(--ink2)]">
              {t("learn.join.signedInAs", { name: student.name })}{" "}
              <span className="text-[var(--ink3)]">({student.email})</span>{" "}
              <button
                type="button"
                className="font-semibold text-[var(--blue2)] underline underline-offset-2"
                onClick={() => void signOut({ callbackUrl: joinPath(fullChoice) })}
              >
                {t("learn.join.notYou")}
              </button>
            </p>
          ) : accountReady ? (
            <p className="mt-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">✓ {t("learn.join.accountReady")}</p>
          ) : null}

          <form onSubmit={submit} className="mt-3 space-y-4" noValidate={false}>
            {!accountReady && (
              <>
                {props.google && mode === "create" && (
                  <GoogleButton next={googleNext} disabled={busy || !choice} label={t("learn.auth.google")} or={t("learn.auth.or")} onClick={() => track("join_account", { method: "google", choice: choiceKey(choice) })} />
                )}
                {mode === "signin" ? (
                  <div role="status" className="rounded-lg bg-[var(--blue-light)] px-3 py-2.5 text-sm text-[var(--blue)]">
                    <strong>{t("learn.join.exists.title")}</strong> {t("learn.join.exists.body", { email })}
                  </div>
                ) : (
                  <div>
                    <label htmlFor={`${uid}-name`} className="block text-sm font-semibold text-[var(--ink)]">
                      {t("learn.auth.fullName")}
                    </label>
                    <input id={`${uid}-name`} ref={nameRef} required autoComplete="name" maxLength={100} value={name} onChange={(e) => setName(e.target.value)} className={inputCls} aria-describedby={`${uid}-name-hint`} />
                    <p id={`${uid}-name-hint`} className="mt-1 text-xs text-[var(--ink3)]">{t("learn.auth.nameOnCert")}</p>
                  </div>
                )}
                <div>
                  <label htmlFor={`${uid}-email`} className="block text-sm font-semibold text-[var(--ink)]">
                    {t("learn.account.email")}
                  </label>
                  <input
                    id={`${uid}-email`}
                    type="email"
                    required
                    autoComplete="email"
                    inputMode="email"
                    value={email}
                    readOnly={mode === "signin"}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`${inputCls} ${mode === "signin" ? "bg-[var(--s2)]" : ""}`}
                  />
                </div>
                <div>
                  <label htmlFor={`${uid}-password`} className="block text-sm font-semibold text-[var(--ink)]">
                    {t("learn.auth.password")}
                  </label>
                  <input
                    id={`${uid}-password`}
                    ref={passwordRef}
                    type="password"
                    required
                    minLength={mode === "create" ? 8 : undefined}
                    autoComplete={mode === "create" ? "new-password" : "current-password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputCls}
                    aria-describedby={mode === "create" ? `${uid}-pw-hint` : undefined}
                  />
                  {mode === "create" ? (
                    <p id={`${uid}-pw-hint`} className="mt-1 text-xs text-[var(--ink3)]">{t("learn.auth.passwordHint")}</p>
                  ) : (
                    <p className="mt-1 flex flex-wrap justify-between gap-2 text-xs">
                      <Link href="/learn/forgot" className="font-semibold text-[var(--blue2)] underline underline-offset-2">
                        {t("learn.auth.forgot")}
                      </Link>
                      <button
                        type="button"
                        className="font-semibold text-[var(--ink2)] underline underline-offset-2"
                        onClick={() => {
                          setMode("create");
                          setError("");
                          setPassword("");
                        }}
                      >
                        {t("learn.join.otherEmail")}
                      </button>
                    </p>
                  )}
                </div>
              </>
            )}

            {error && (
              <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
                {statusLink && (
                  <>
                    {" "}
                    <Link href={statusLink} className="font-semibold underline underline-offset-2">
                      {t("learn.join.details")}
                    </Link>
                  </>
                )}
                {retry && accountReady && <span className="mt-1 block text-xs text-red-800">{t("learn.join.retryNote")}</span>}
              </p>
            )}

            <div ref={payRef} id="join-pay" className="scroll-mt-40">
              <h2 className="sr-only">{t("learn.join.step3")}</h2>
              <button
                type="submit"
                disabled={busy}
                aria-busy={busy}
                className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[var(--orange)] to-[#F9A738] px-5 py-3 text-sm font-black text-[var(--ink)] transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {busy && <span aria-hidden="true" className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--ink)] border-t-transparent" />}
                {payLabel}
                {!busy && <span aria-hidden="true">→</span>}
              </button>
              <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-xs text-[var(--ink3)]">
                <span aria-hidden="true">🔒</span> {t("learn.join.secure")}
              </p>
            </div>

            {!accountReady && mode === "create" && (
              <p className="text-xs leading-relaxed text-[var(--ink3)]">
                {t("learn.join.consent.before")}{" "}
                <Link href="/terms" className="underline underline-offset-2" target="_blank">
                  {t("learn.join.consent.terms")}
                </Link>{" "}
                {t("learn.join.consent.and")}{" "}
                <Link href="/privacy" className="underline underline-offset-2" target="_blank">
                  {t("learn.join.consent.privacy")}
                </Link>
                .
              </p>
            )}
          </form>

          {!accountReady && (
            <div className="mt-5 space-y-2 border-t border-[var(--border)] pt-4 text-sm">
              {mode === "create" && (
                <p className="text-[var(--ink2)]">
                  {t("learn.auth.alreadyHaveAccount")}{" "}
                  <button
                    type="button"
                    className="font-semibold text-[var(--blue2)] underline underline-offset-2"
                    onClick={() => {
                      setMode("signin");
                      setError("");
                      setTimeout(() => passwordRef.current?.focus(), 30);
                    }}
                  >
                    {t("learn.nav.signIn")}
                  </button>
                </p>
              )}
              <p className="text-xs text-[var(--ink3)]">
                {t("learn.join.free.before")}{" "}
                <Link href={freeHref} className="font-semibold text-[var(--ink2)] underline underline-offset-2">
                  {t("learn.join.free.link")}
                </Link>
              </p>
            </div>
          )}
        </div>
        <p className="mt-3 px-1 text-xs leading-relaxed text-[var(--ink3)]">{t("learn.offer.secure")}</p>
      </aside>

      {/* Mobile summary bar */}
      <div
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border)] bg-white/95 backdrop-blur transition-transform duration-200 lg:hidden ${
          payVisible || !summary ? "translate-y-full" : "translate-y-0"
        }`}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-hidden={payVisible || !summary}
        data-testid="join-bar"
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--ink3)]">{t("learn.join.sum.label")}</p>
            <p className="truncate text-sm font-bold text-[var(--ink)]">
              {summary?.what}
              <span className="font-normal text-[var(--ink2)]"> · {summary?.price}</span>
            </p>
          </div>
          <button
            type="button"
            tabIndex={payVisible ? -1 : 0}
            onClick={accountReady ? () => void submit() : toAccount}
            disabled={busy}
            className="shrink-0 rounded-full bg-[var(--ink)] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
          >
            {accountReady ? t("learn.join.bar.pay") : t("learn.join.bar.continue")}
          </button>
        </div>
      </div>
    </div>
  );
}

function StepNum({ n, done }: { n: number; done?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-black ${
        done ? "bg-green-600 text-white" : "bg-[var(--ink)] text-white"
      }`}
    >
      {done ? "✓" : n}
    </span>
  );
}

/** "Continue with Google": the callback URL brings the learner back to this page, choice kept, straight to payment. */
function GoogleButton({ next, disabled, label, or, onClick }: { next: string; disabled: boolean; label: string; or: string; onClick: () => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <div>
      <button
        type="button"
        disabled={disabled || busy}
        onClick={() => {
          setBusy(true);
          onClick();
          void signIn("google", { callbackUrl: next });
        }}
        className="flex min-h-[48px] w-full items-center justify-center gap-3 rounded-full border border-[var(--border)] bg-white py-3 text-sm font-bold text-[var(--ink)] transition-colors hover:bg-[var(--s2)] disabled:opacity-60"
      >
        <svg aria-hidden="true" width="18" height="18" viewBox="0 0 48 48">
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
          <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
          <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
        </svg>
        {label}
      </button>
      <div className="mt-4 flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-[var(--ink3)]">
        <span className="h-px flex-1 bg-[var(--border)]" />
        {or}
        <span className="h-px flex-1 bg-[var(--border)]" />
      </div>
    </div>
  );
}
