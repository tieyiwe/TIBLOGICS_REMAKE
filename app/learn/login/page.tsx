"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useT } from "@/lib/i18n/client";

/**
 * Only same-site paths are allowed as a post-login destination. A bare
 * "/foo" is fine; "//evil.com" (protocol-relative) and "https://evil.com"
 * are not — without this check, ?next= is an open-redirect phishing vector.
 */
function safeNext(raw: string | null): string {
  if (!raw) return "/learn";
  if (!raw.startsWith("/")) return "/learn";
  if (raw.startsWith("//") || raw.startsWith("/\\")) return "/learn";
  // Browsers drop tabs and newlines, so "/%09/evil.com" becomes "//evil.com":
  // resolve it and keep it only if it stays on this site.
  try {
    const u = new URL(raw, "https://same.site.invalid");
    if (u.origin !== "https://same.site.invalid") return "/learn";
    return u.pathname + u.search + u.hash;
  } catch {
    return "/learn";
  }
}

function LoginForm() {
  const t = useT();
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");

    const res = await signIn("student", { email, password, redirect: false });
    if (res?.error) {
      setError(t("learn.auth.badCredentials"));
      setBusy(false);
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
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
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1.5 w-full rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm outline-none focus:border-[var(--blue3)] focus:ring-2 focus:ring-[var(--blue3)]/20"
        />
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="w-full rounded-full bg-[var(--ink)] py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {busy ? t("learn.auth.signingIn") : t("learn.nav.signIn")}
      </button>
    </form>
  );
}

/** Keeps ?next= so someone who signs up from here lands where they were going. */
function SignupLink() {
  const t = useT();
  const next = useSearchParams().get("next");
  const href = next ? `/learn/signup?next=${encodeURIComponent(safeNext(next))}` : "/learn/signup";
  return (
    <Link href={href} className="font-semibold text-[var(--blue2)] underline underline-offset-2">
      {t("learn.auth.createAnAccount")}
    </Link>
  );
}

export default function StudentLoginPage() {
  const t = useT();
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--s2)] px-4 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-center text-lg font-black tracking-tight text-[var(--ink)]">
          TIB<span className="text-[var(--orange)]">LOGICS</span>
          <span className="ml-1.5 text-sm font-semibold text-[var(--ink3)]">Learn</span>
        </Link>

        <div className="mt-6 rounded-2xl border border-[var(--border)] bg-white p-7 shadow-sm">
          <h1 className="text-xl font-bold text-[var(--ink)]">{t("learn.auth.welcomeBack")}</h1>
          <p className="mt-1 text-sm text-[var(--ink3)]">{t("learn.auth.signInToContinue")}</p>

          <div className="mt-6">
            <Suspense fallback={<p className="text-sm text-[var(--ink3)]">{t("learn.common.loading")}</p>}>
              <LoginForm />
            </Suspense>
          </div>

          <p className="mt-4 text-center text-sm">
            <Link href="/learn/forgot" className="text-[var(--blue2)] underline underline-offset-2">
              {t("learn.auth.forgot")}
            </Link>
          </p>

          <p className="mt-4 text-center text-sm text-[var(--ink2)]">
            {t("learn.auth.newHere")}{" "}
            <Suspense fallback={<Link href="/learn/signup" className="font-semibold text-[var(--blue2)] underline underline-offset-2">{t("learn.auth.createAnAccount")}</Link>}>
              <SignupLink />
            </Suspense>
          </p>
        </div>

        <p className="mt-5 text-center text-xs text-[var(--ink3)]">
          {t("learn.auth.adminPrompt")}{" "}
          <Link href="/admin_pro/login" className="underline">
            {t("learn.auth.adminLink")}
          </Link>
        </p>
        <div className="mt-4 flex justify-center">
          <LanguageSwitcher />
        </div>
      </div>
    </div>
  );
}
