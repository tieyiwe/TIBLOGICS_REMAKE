"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function ResetForm() {
  const token = useSearchParams().get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) return setError("The two passwords don't match.");
    setBusy(true);
    setError("");
    const res = await fetch("/api/learn/auth/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    }).catch(() => null);
    const data = res ? await res.json().catch(() => ({})) : {};
    if (res?.ok) setDone(true);
    else setError(data.error ?? "Something went wrong. Try again.");
    setBusy(false);
  }

  if (!token) {
    return <p className="mt-6 text-sm text-[var(--ink2)]">This link is missing its reset code. <Link href="/learn/forgot" className="underline">Request a new link.</Link></p>;
  }
  if (done) {
    return (
      <p className="mt-6 rounded-lg bg-green-50 px-3 py-2.5 text-sm text-green-800">
        Your password is changed. <Link href="/learn/login" className="font-semibold underline">Sign in</Link>
      </p>
    );
  }
  const input = "mt-1.5 w-full rounded-lg border border-[var(--border)] px-3 py-2.5 text-sm outline-none focus:border-[var(--blue3)] focus:ring-2 focus:ring-[var(--blue3)]/20";
  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      <div>
        <label htmlFor="pw" className="block text-sm font-semibold text-[var(--ink)]">New password</label>
        <input id="pw" type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className={input} />
        <p className="mt-1 text-xs text-[var(--ink3)]">At least 8 characters.</p>
      </div>
      <div>
        <label htmlFor="pw2" className="block text-sm font-semibold text-[var(--ink)]">Confirm password</label>
        <input id="pw2" type="password" required minLength={8} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={input} />
      </div>
      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error} {/expired|used/.test(error) && <Link href="/learn/forgot" className="underline">Request a new link.</Link>}
        </p>
      )}
      <button type="submit" disabled={busy} className="w-full rounded-full bg-gradient-to-r from-[var(--orange)] to-[#F9A738] py-3 text-sm font-bold text-[var(--ink)] hover:opacity-90 disabled:opacity-50">
        {busy ? "Saving…" : "Set new password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--s2)] px-4 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-center text-lg font-black tracking-tight text-[var(--ink)]">
          TIB<span className="text-[var(--orange)]">LOGICS</span>
        </Link>
        <div className="mt-6 rounded-2xl border border-[var(--border)] bg-white p-7 shadow-sm">
          <h1 className="text-xl font-bold text-[var(--ink)]">Choose a new password</h1>
          <Suspense fallback={<p className="mt-6 text-sm text-[var(--ink3)]">Loading…</p>}>
            <ResetForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
