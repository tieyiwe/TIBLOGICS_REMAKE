"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";

type Mode = "checking" | "setup" | "login";

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

  // Setup state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [setupError, setSetupError] = useState("");
  const [setupLoading, setSetupLoading] = useState(false);

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
      // Auto sign-in after setup
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
    if (result?.error) {
      setLoginError("Invalid email or password. Please try again.");
    } else if (result?.url) {
      window.location.href = result.url;
    }
  }

  return (
    <div className="min-h-screen bg-[#F4F7FB] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center gap-1 mb-6">
          <span className="font-syne font-extrabold text-2xl tracking-tight">
            <span className="text-[#4A7CA5]">TIB</span>
            <span className="text-[#F47C20]">LOGICS</span>
          </span>
          <p className="text-[#7A8FA6] text-sm">Admin Portal</p>
        </div>

        <hr className="border-[#D2DCE8] mb-6" />

        {mode === "checking" && (
          <div className="flex justify-center py-8 text-[#7A8FA6]">{SPINNER}</div>
        )}

        {mode === "setup" && (
          <>
            <div className="mb-5 text-center">
              <h2 className="font-syne font-bold text-[#1B3A6B] text-lg">Create Admin Password</h2>
              <p className="text-[#7A8FA6] text-sm mt-1">
                First-time setup for <span className="font-medium text-[#3A4A5C]">tieyiwebass@gmail.com</span>
              </p>
            </div>
            <form onSubmit={handleSetup} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-[#3A4A5C]">New Password</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="input-base w-full"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-[#3A4A5C]">Confirm Password</label>
                <input
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="input-base w-full"
                />
              </div>
              {setupError && (
                <p className="text-red-500 text-sm text-center">{setupError}</p>
              )}
              <button
                type="submit"
                disabled={setupLoading}
                className="btn-primary w-full justify-center mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {setupLoading ? <>{SPINNER} Setting up…</> : "Save Password & Sign In"}
              </button>
            </form>
          </>
        )}

        {mode === "login" && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-[#3A4A5C]">
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
                className="input-base w-full"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-[#3A4A5C]">
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
                className="input-base w-full"
              />
            </div>
            {loginError && (
              <p className="text-red-500 text-sm text-center">{loginError}</p>
            )}
            <button
              type="submit"
              disabled={loginLoading}
              className="btn-primary w-full justify-center mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loginLoading ? <>{SPINNER} Signing in…</> : "Sign In"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
