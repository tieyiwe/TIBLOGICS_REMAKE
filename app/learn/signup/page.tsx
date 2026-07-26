"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { PLANS, formatPlanPrice, FOUNDING_PRICING } from "@/lib/payments/provider";

function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  // Carried from the track landing page so the learner lands back on the
  // track they chose, rather than a generic dashboard.
  const track = params.get("track");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
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
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not create your account");

      // Sign in immediately so the learner lands on the plan step already authenticated
      const signInRes = await signIn("student", { email, password, redirect: false });
      if (signInRes?.error) {
        router.push("/learn/login");
        return;
      }
      router.push(track ? `/learn/subscribe?track=${encodeURIComponent(track)}` : "/learn/subscribe");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--s2)] px-4 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-center text-lg font-black tracking-tight text-[var(--ink)]">
          TIB<span className="text-[var(--orange)]">LOGICS</span>
          <span className="ml-1.5 text-sm font-semibold text-[var(--ink3)]">Learn</span>
        </Link>

        <div className="mt-6 rounded-2xl border border-[var(--border)] bg-white p-7 shadow-sm">
          <h1 className="text-xl font-bold text-[var(--ink)]">Create your account</h1>
          <p className="mt-1 text-sm text-[var(--ink3)]">
            {FOUNDING_PRICING && (
              <span className="mr-1 font-bold text-[var(--orange2)]">Founding rate ·</span>
            )}
            {formatPlanPrice(PLANS.monthly)}/month for every track. Cancel anytime.
          </p>

          {track && (
            <p className="mt-4 rounded-lg bg-[var(--blue-light)] px-3 py-2.5 text-sm text-[var(--blue)]">
              You're signing up to start{" "}
              <strong>{track.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}</strong>.
              We'll take you straight there once you're set up.
            </p>
          )}

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-[var(--ink)]">
                Full name
              </label>
              <p className="text-xs text-[var(--ink3)]">This is the name printed on your certificate.</p>
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
                Email
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
                Password
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
              <p className="mt-1 text-xs text-[var(--ink3)]">At least 8 characters.</p>
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
              {busy ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[var(--ink2)]">
            Already have an account?{" "}
            <Link href="/learn/login" className="font-semibold text-[var(--blue2)] underline underline-offset-2">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function StudentSignupPage() {
  // useSearchParams needs a Suspense boundary in the app router
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[var(--s2)]">
          <p className="text-sm text-[var(--ink3)]">Loading…</p>
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  );
}
