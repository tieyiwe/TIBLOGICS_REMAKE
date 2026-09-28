"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch("/api/learn/auth/forgot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }).catch(() => null);
    const data = res ? await res.json().catch(() => ({})) : {};
    setMsg(res?.ok ? { ok: true, text: data.message } : { ok: false, text: data.error ?? "Something went wrong. Try again." });
    setBusy(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--s2)] px-4 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="block text-center text-lg font-black tracking-tight text-[var(--ink)]">
          TIB<span className="text-[var(--orange)]">LOGICS</span>
        </Link>
        <div className="mt-6 rounded-2xl border border-[var(--border)] bg-white p-7 shadow-sm">
          <h1 className="text-xl font-bold text-[var(--ink)]">Reset your password</h1>
          <p className="mt-1 text-sm text-[var(--ink3)]">We&apos;ll email you a link to choose a new one.</p>
          {msg?.ok ? (
            <p className="mt-6 rounded-lg bg-green-50 px-3 py-2.5 text-sm text-green-800">{msg.text}</p>
          ) : (
            <form onSubmit={submit} className="mt-6 space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-[var(--ink)]">Email</label>
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
              {msg && !msg.ok && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{msg.text}</p>}
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-full bg-gradient-to-r from-[var(--orange)] to-[#F9A738] py-3 text-sm font-bold text-[var(--ink)] hover:opacity-90 disabled:opacity-50"
              >
                {busy ? "Sending…" : "Send reset link"}
              </button>
            </form>
          )}
          <p className="mt-6 text-center text-sm text-[var(--ink2)]">
            <Link href="/learn/login" className="font-semibold text-[var(--blue2)] underline underline-offset-2">Back to sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
