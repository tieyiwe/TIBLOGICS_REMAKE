"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import GoogleSignIn from "@/components/learn/GoogleSignIn";
import ArfaWordmark from "@/components/learn/ArfaWordmark";
import { useRouter, useSearchParams } from "next/navigation";
import { PLANS, FOUNDING_PRICING } from "@/lib/payments/provider";
import { TRACK_BASE_PRICE_CENTS } from "@/lib/learn/pricing";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { fmtPrice } from "@/lib/learn/format";
import { useLocale, useT } from "@/lib/i18n/client";
import { isSlug, joinPath } from "@/lib/learn/join/choice";


/** A same-site path, or null. Resolved so "/%09/evil.com" (read as "//evil.com") is refused. */
function sameSitePath(raw: string | null): string | null {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return null;
  try {
    const u = new URL(raw, "https://same.site.invalid");
    return u.origin === "https://same.site.invalid" ? u.pathname + u.search + u.hash : null;
  } catch {
    return null;
  }
}

function SignupForm() {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const params = useSearchParams();
  // Carried from the track landing page so the learner lands back on the
  // track they chose, rather than a generic dashboard.
  const track = params.get("track");
  // Where to go after sign-up when arriving from somewhere other than Learn
  // (the paid tools). Same-site paths only, as on the login page.
  const rawNext = params.get("next");
  const next = sameSitePath(rawNext);
  const [name, setName] = useState("");
  // Prefilled from a team invitation link (/join-team/...).
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");

    try {
      const res = await fetch("/api/learn/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, locale, track, next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? t("learn.auth.createFailed"));

      // Sign in immediately so the learner lands on the plan step already authenticated
      const signInRes = await signIn("student", { email, password, redirect: false });
      if (signInRes?.error) {
        router.push(next ? `/learn/login?next=${encodeURIComponent(next)}` : "/learn/login");
        return;
      }
      if (next) {
        router.push(next);
        router.refresh();
        return;
      }
      router.push(track ? `/learn/subscribe?track=${encodeURIComponent(track)}` : "/learn/subscribe");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("learn.error.generic"));
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--s2)] px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <Link href="/learning-box" className="inline-block">
            <ArfaWordmark size="md" academyLabel={t("learn.brand.academy")} />
          </Link>
          <p className="mt-1.5 text-xs text-[var(--ink3)]">
            {t("learn.brand.by")}{" "}
            <Link href="/" className="font-black tracking-tight text-[var(--ink)] hover:underline">
              TIB<span className="text-[var(--orange)]">LOGICS</span>
            </Link>
          </p>
        </div>

        <div className="mt-6 rounded-2xl border border-[var(--border)] bg-white p-7 shadow-sm">
          <h1 className="text-xl font-bold text-[var(--ink)]">{t("learn.auth.signUpTitle")}</h1>
          {next ? (
            <p className="mt-1 text-sm text-[var(--ink3)]">{t("learn.auth.oneAccount")}</p>
          ) : (
          <p className="mt-1 text-sm text-[var(--ink3)]">
            {FOUNDING_PRICING && (
              <span className="mr-1 font-bold text-[var(--orange2)]">{t("learn.billing.foundingRate")} ·</span>
            )}
            {t("learn.auth.priceLine", {
              price: fmtPrice(PLANS.monthly.amount, locale),
              from: fmtPrice(TRACK_BASE_PRICE_CENTS, locale),
            })}
          </p>
          )}

          {track && (
            <p className="mt-4 rounded-lg bg-[var(--blue-light)] px-3 py-2.5 text-sm text-[var(--blue)]">
              {t("learn.auth.signingUpFor1")}{" "}
              <strong>{track.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</strong>
              {t("learn.auth.signingUpFor2")}
            </p>
          )}

          {!next && (
            // The one-page flow (choose, account and payment together) for
            // visitors who already know what they want.
            <p className="mt-4 rounded-lg border border-[var(--border)] bg-[var(--s2)] px-3 py-2.5 text-xs leading-relaxed text-[var(--ink2)]">
              {t("learn.join.signupHint")}{" "}
              <Link
                href={joinPath(track && isSlug(track) ? { kind: "track", slug: track } : null)}
                className="font-bold text-[var(--blue2)] underline underline-offset-2"
              >
                {t("learn.join.signupHintLink")} →
              </Link>
            </p>
          )}

          <div className="mt-6">
            <GoogleSignIn
              next={next ?? (track ? `/learn/subscribe?track=${encodeURIComponent(track)}` : "/learn/subscribe")}
            />
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-[var(--ink)]">
                {t("learn.auth.fullName")}
              </label>
              <p className="text-xs text-[var(--ink3)]">{t("learn.auth.nameOnCert")}</p>
              <input
                id="name"
                required
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm outline-none focus:border-[var(--blue3)] focus:ring-2 focus:ring-[var(--blue3)]/20"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-[var(--ink)]">
                {t("learn.account.email")}
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm outline-none focus:border-[var(--blue3)] focus:ring-2 focus:ring-[var(--blue3)]/20"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-[var(--ink)]">
                {t("learn.auth.password")}
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm outline-none focus:border-[var(--blue3)] focus:ring-2 focus:ring-[var(--blue3)]/20"
              />
              <p className="mt-1 text-xs text-[var(--ink3)]">{t("learn.auth.passwordHint")}</p>
            </div>

            {error && (
              <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-full bg-gradient-to-r from-[var(--orange)] to-[#F9A738] py-3 text-sm font-bold text-[var(--ink)] transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {busy ? t("learn.auth.creating") : t("learn.auth.createButton")}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[var(--ink2)]">
            {t("learn.auth.alreadyHaveAccount")}{" "}
            <Link href={next ? `/learn/login?next=${encodeURIComponent(next)}` : "/learn/login"} className="font-semibold text-[var(--blue2)] underline underline-offset-2">
              {t("learn.nav.signIn")}
            </Link>
          </p>
        </div>
        <div className="mt-5 flex justify-center">
          <LanguageSwitcher />
        </div>
      </div>
    </div>
  );
}

export default function StudentSignupPage() {
  const t = useT();
  // useSearchParams needs a Suspense boundary in the app router
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--s2)]">
          <p className="text-sm text-[var(--ink3)]">{t("learn.common.loading")}</p>
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  );
}
