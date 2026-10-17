"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import Image from "next/image";
import { ArrowLeft, BarChart3, GraduationCap, ShieldCheck, Sparkles } from "lucide-react";

type Mode = "checking" | "setup" | "login" | "reset";

const SPINNER = (
  <svg
    className="animate-spin h-4 w-4"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

export default function AdminLoginPage() {
  const [mode, setMode] = useState<Mode>("checking");

  // Login state
  const [email, setEmail] = useState("tieyiwebass@gmail.com");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  // Set when the proxy sent a signed-in learner here from an admin page.
  const [fromLearner, setFromLearner] = useState(false);
  useEffect(() => {
    setFromLearner(new URLSearchParams(window.location.search).get("switch") === "learner");
  }, []);

  // Setup state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [setupError, setSetupError] = useState("");
  const [setupLoading, setSetupLoading] = useState(false);

  // Reset state
  const [masterPassword, setMasterPassword] = useState("");
  const [resetNew, setResetNew] = useState("");
  const [resetConfirm, setResetConfirm] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    fetch("/api/admin/setup")
      .then((r) => r.json())
      .then((d) => setMode(d.needsSetup ? "setup" : "login"))
      .catch(() => setMode("login"));
  }, []);

  async function handleSetup(e: React.FormEvent) {
    e.preventDefault();
    setSetupError("");
    if (newPassword !== confirmPassword) {
      setSetupError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setSetupError("Password must be at least 8 characters.");
      return;
    }
    setSetupLoading(true);
    try {
      const res = await fetch("/api/admin/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSetupError(data.error ?? "Setup failed. Please try again.");
        setSetupLoading(false);
        return;
      }
      const result = await signIn("credentials", {
        email: "tieyiwebass@gmail.com",
        password: newPassword,
        callbackUrl: "/admin_pro",
        redirect: false,
      });
      setSetupLoading(false);
      if (result?.url) {
        window.location.href = result.url;
      } else {
        setMode("login");
      }
    } catch {
      setSetupError("Network error. Please try again.");
      setSetupLoading(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    const result = await signIn("credentials", {
      email,
      password,
      callbackUrl: "/admin_pro",
      redirect: false,
    });
    setLoginLoading(false);
    if (result?.error === "TooManyAttempts") {
      setLoginError("Too many sign-in attempts. Wait 15 minutes, then try again with your admin password.");
    } else if (result?.error) {
      setLoginError("Invalid email or password. Use your admin password (the ADMIN_PASSWORD secret), not your ARFA · AI Academy password.");
    } else if (result?.url) {
      window.location.href = result.url;
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setResetError("");
    if (resetNew !== resetConfirm) {
      setResetError("New passwords do not match.");
      return;
    }
    if (resetNew.length < 8) {
      setResetError("New password must be at least 8 characters.");
      return;
    }
    setResetLoading(true);
    try {
      const res = await fetch("/api/admin/recover-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ masterPassword, newPassword: resetNew }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResetError(data.error ?? "Reset failed. Please try again.");
        setResetLoading(false);
        return;
      }
      setResetSuccess(true);
      setResetLoading(false);
      // Auto sign-in with new password
      const result = await signIn("credentials", {
        email: "tieyiwebass@gmail.com",
        password: resetNew,
        callbackUrl: "/admin_pro",
        redirect: false,
      });
      if (result?.url) {
        window.location.href = result.url;
      } else {
        setMode("login");
      }
    } catch {
      setResetError("Network error. Please try again.");
      setResetLoading(false);
    }
  }

  return (
    <main className="grid min-h-[100dvh] bg-[var(--a-bg)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      {/* Brand panel (desktop) */}
      <aside className="relative hidden overflow-hidden bg-[var(--a-navy-deep)] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 -top-32 h-[420px] w-[420px] rounded-full opacity-40"
          style={{ background: "radial-gradient(closest-side, rgba(34,81,163,.55), transparent)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-40 -left-24 h-[380px] w-[380px] rounded-full opacity-30"
          style={{ background: "radial-gradient(closest-side, rgba(244,124,32,.45), transparent)" }}
        />
        <Image src="/footer-logo-light.png" alt="TIBLOGICS" width={600} height={173} className="relative h-11 w-auto self-start" priority />
        <div className="relative max-w-md">
          <p className="font-syne text-[30px] font-bold leading-tight">Run the whole business from one calm console.</p>
          <ul className="mt-8 space-y-4 font-dm text-[14.5px] text-white/80">
            {[
              { icon: BarChart3, text: "Revenue, leads and bookings at a glance" },
              { icon: GraduationCap, text: "ARFA · AI Academy learners, cohorts and live sessions" },
              { icon: Sparkles, text: "Growth content, outreach and campaigns" },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 ring-1 ring-inset ring-white/15">
                  <Icon size={16} aria-hidden />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative flex items-center gap-2 font-dm text-[12.5px] text-white/60">
          <ShieldCheck size={14} aria-hidden /> Staff access only.
        </p>
      </aside>

      <div className="flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-[400px]">
        {/* Logo (mobile) + title */}
        <div className="mb-7">
          <Image src="/logo.png" alt="TIBLOGICS" width={600} height={173} className="mb-6 h-9 w-auto lg:hidden" priority />
          <h1 className="font-syne text-[26px] font-bold leading-tight text-[var(--a-ink)]">
            {mode === "setup" ? "Create your password" : mode === "reset" ? "Reset your password" : "Sign in to admin"}
          </h1>
          <p className="mt-1 font-dm text-[14px] text-[var(--a-ink-3)]">TIBLOGICS back office</p>
        </div>
        <div className="rounded-[var(--a-radius-hero)] border border-[var(--a-border)] bg-[var(--a-surface)] p-6 shadow-[0_1px_2px_rgba(13,27,42,.04),0_12px_32px_rgba(13,27,42,.06)] sm:p-7">

        {mode === "checking" && (
          <div className="flex justify-center py-8 text-[var(--a-ink-3)]" role="status" aria-label="Loading">{SPINNER}</div>
        )}

        {mode === "setup" && (
          <>
            <div className="mb-5">
              <h2 className="font-dm text-[15px] font-semibold text-[var(--a-ink)]">First-time setup</h2>
              <p className="mt-1 font-dm text-[13px] text-[var(--a-ink-3)]">
                First-time setup for <span className="font-medium text-[var(--a-ink-2)]">tieyiwebass@gmail.com</span>
              </p>
            </div>
            <form onSubmit={handleSetup} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block font-dm text-[13px] font-semibold text-[var(--a-ink-2)]">New Password</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="h-11 w-full rounded-[var(--a-radius-control)] border border-[var(--a-border-strong)] bg-[var(--a-surface)] px-3.5 font-dm text-[14.5px] text-[var(--a-ink)] placeholder:text-[var(--a-ink-3)] transition-colors duration-150 focus:border-[var(--a-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--a-blue)]/20"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block font-dm text-[13px] font-semibold text-[var(--a-ink-2)]">Confirm Password</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="h-11 w-full rounded-[var(--a-radius-control)] border border-[var(--a-border-strong)] bg-[var(--a-surface)] px-3.5 font-dm text-[14.5px] text-[var(--a-ink)] placeholder:text-[var(--a-ink-3)] transition-colors duration-150 focus:border-[var(--a-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--a-blue)]/20"
                />
              </div>
              {setupError && (
                <p role="alert" className="rounded-[var(--a-radius-control)] border border-[#f6cccc] bg-[var(--a-danger-bg)] px-3 py-2 font-dm text-[13px] text-[var(--a-danger)]">{setupError}</p>
              )}
              <button
                type="submit"
                disabled={setupLoading}
                className="mt-1 inline-flex h-11 w-full items-center justify-center gap-2 rounded-[var(--a-radius-control)] bg-[var(--a-orange-text)] font-dm text-[14.5px] font-semibold text-white shadow-[0_1px_2px_rgba(13,27,42,.08)] transition-colors duration-150 hover:bg-[#9c4408] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {setupLoading ? <>{SPINNER} Setting up</> : "Save password and sign in"}
              </button>
            </form>
          </>
        )}

        {mode === "login" && (
          <>
            {fromLearner && (
              <p role="status" className="mb-4 rounded-[var(--a-radius-control)] border border-[#f9d6b8] bg-[var(--a-orange-bg)] px-3 py-2.5 font-dm text-[13px] text-[#7A3E0E]">
                You are signed in to your ARFA · AI Academy account. Sign in with your admin password to switch to the admin dashboard.
              </p>
            )}
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="email" className="block font-dm text-[13px] font-semibold text-[var(--a-ink-2)]">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@tiblogics.com"
                  className="h-11 w-full rounded-[var(--a-radius-control)] border border-[var(--a-border-strong)] bg-[var(--a-surface)] px-3.5 font-dm text-[14.5px] text-[var(--a-ink)] placeholder:text-[var(--a-ink-3)] transition-colors duration-150 focus:border-[var(--a-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--a-blue)]/20"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="password" className="block font-dm text-[13px] font-semibold text-[var(--a-ink-2)]">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-11 w-full rounded-[var(--a-radius-control)] border border-[var(--a-border-strong)] bg-[var(--a-surface)] px-3.5 font-dm text-[14.5px] text-[var(--a-ink)] placeholder:text-[var(--a-ink-3)] transition-colors duration-150 focus:border-[var(--a-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--a-blue)]/20"
                />
              </div>
              {loginError && (
                <p role="alert" className="rounded-[var(--a-radius-control)] border border-[#f6cccc] bg-[var(--a-danger-bg)] px-3 py-2 font-dm text-[13px] text-[var(--a-danger)]">{loginError}</p>
              )}
              <button
                type="submit"
                disabled={loginLoading}
                className="mt-1 inline-flex h-11 w-full items-center justify-center gap-2 rounded-[var(--a-radius-control)] bg-[var(--a-orange-text)] font-dm text-[14.5px] font-semibold text-white shadow-[0_1px_2px_rgba(13,27,42,.08)] transition-colors duration-150 hover:bg-[#9c4408] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loginLoading ? <>{SPINNER} Signing in</> : "Sign in"}
              </button>
            </form>
            <div className="mt-5 text-center">
              <button
                onClick={() => { setResetError(""); setResetSuccess(false); setMode("reset"); }}
                className="inline-flex items-center gap-1 font-dm text-[13px] font-medium text-[var(--a-blue)] underline-offset-2 transition-colors hover:underline"
              >
                Forgot password?
              </button>
            </div>
          </>
        )}

        {mode === "reset" && (
          <>
            <div className="mb-5">
              <h2 className="font-dm text-[15px] font-semibold text-[var(--a-ink)]">Verify it is you</h2>
              <p className="mt-1 font-dm text-[13px] text-[var(--a-ink-3)]">
                Enter your <span className="font-semibold text-[var(--a-ink-2)]">Admin Super Password</span> to verify your identity, then set a new password.
              </p>
            </div>

            {resetSuccess ? (
              <div className="text-center py-4">
                <p className="font-dm text-sm font-semibold text-[var(--a-success)]">Password reset. Signing you in.</p>
              </div>
            ) : (
              <form onSubmit={handleReset} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block font-dm text-[13px] font-semibold text-[var(--a-ink-2)]">Admin Super Password</label>
                  <input
                    type="password"
                    autoComplete="off"
                    required
                    value={masterPassword}
                    onChange={(e) => setMasterPassword(e.target.value)}
                    placeholder="Enter your admin super password"
                    className="h-11 w-full rounded-[var(--a-radius-control)] border border-[var(--a-border-strong)] bg-[var(--a-surface)] px-3.5 font-dm text-[14.5px] text-[var(--a-ink)] placeholder:text-[var(--a-ink-3)] transition-colors duration-150 focus:border-[var(--a-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--a-blue)]/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block font-dm text-[13px] font-semibold text-[var(--a-ink-2)]">New Password</label>
                  <input
                    type="password"
                    autoComplete="new-password"
                    required
                    value={resetNew}
                    onChange={(e) => setResetNew(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="h-11 w-full rounded-[var(--a-radius-control)] border border-[var(--a-border-strong)] bg-[var(--a-surface)] px-3.5 font-dm text-[14.5px] text-[var(--a-ink)] placeholder:text-[var(--a-ink-3)] transition-colors duration-150 focus:border-[var(--a-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--a-blue)]/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block font-dm text-[13px] font-semibold text-[var(--a-ink-2)]">Confirm New Password</label>
                  <input
                    type="password"
                    autoComplete="new-password"
                    required
                    value={resetConfirm}
                    onChange={(e) => setResetConfirm(e.target.value)}
                    placeholder="Re-enter new password"
                    className="h-11 w-full rounded-[var(--a-radius-control)] border border-[var(--a-border-strong)] bg-[var(--a-surface)] px-3.5 font-dm text-[14.5px] text-[var(--a-ink)] placeholder:text-[var(--a-ink-3)] transition-colors duration-150 focus:border-[var(--a-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--a-blue)]/20"
                  />
                </div>
                {resetError && (
                  <p role="alert" className="rounded-[var(--a-radius-control)] border border-[#f6cccc] bg-[var(--a-danger-bg)] px-3 py-2 font-dm text-[13px] text-[var(--a-danger)]">{resetError}</p>
                )}
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="mt-1 inline-flex h-11 w-full items-center justify-center gap-2 rounded-[var(--a-radius-control)] bg-[var(--a-orange-text)] font-dm text-[14.5px] font-semibold text-white shadow-[0_1px_2px_rgba(13,27,42,.08)] transition-colors duration-150 hover:bg-[#9c4408] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {resetLoading ? <>{SPINNER} Resetting</> : "Reset password"}
                </button>
              </form>
            )}

            <div className="mt-5 text-center">
              <button
                onClick={() => setMode("login")}
                className="inline-flex items-center gap-1 font-dm text-[13px] font-medium text-[var(--a-blue)] underline-offset-2 transition-colors hover:underline"
              >
                <ArrowLeft size={14} aria-hidden /> Back to sign in
              </button>
            </div>
          </>
        )}
      </div>
      </div>
      </div>
    </main>
  );
}
