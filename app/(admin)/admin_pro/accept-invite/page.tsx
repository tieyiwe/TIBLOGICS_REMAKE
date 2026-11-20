"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";

// Staff invitation (and Team & Roles password reset) landing page: the person
// confirms their name, sets a password, and is signed straight in, landing on
// the admin home (which only shows what their role opens).

type Peek = { name: string; email: string; reset: boolean };

const input =
  "w-full border border-[var(--a-border-strong)] rounded-[var(--a-radius-control)] px-4 py-2.5 text-sm font-dm text-[var(--a-ink)] bg-[var(--a-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--a-blue)]/30 focus:border-[var(--a-blue)]";

function AcceptInviteForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  const [peek, setPeek] = useState<Peek | null>(null);
  const [peekError, setPeekError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    let live = true;
    fetch(`/api/admin/collaborators/accept?token=${encodeURIComponent(token)}`)
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (!live) return;
        if (r.ok) {
          setPeek(d as Peek);
          setName((d as Peek).name ?? "");
        } else setPeekError(d.error ?? "This link is invalid or has expired.");
      })
      .catch(() => live && setPeekError("Could not check this link. Try again."));
    return () => {
      live = false;
    };
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    if (password.length < 10) {
      setStatus({ type: "error", msg: "Use at least 10 characters." });
      return;
    }
    if (password !== confirm) {
      setStatus({ type: "error", msg: "The passwords do not match." });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/collaborators/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, ...(peek && !peek.reset && name.trim() ? { name: name.trim() } : {}) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus({ type: "error", msg: data.error ?? "Could not accept the invitation." });
        return;
      }
      setStatus({ type: "success", msg: "Password set. Signing you in." });
      const r = await signIn("credentials", { email: data.email, password, redirect: false });
      if (r?.ok) router.push("/admin_pro");
      else router.push("/admin_pro/login");
    } catch {
      setStatus({ type: "error", msg: "Network error. Try again." });
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return <p className="text-center font-dm text-sm text-[var(--a-danger)]">This invitation link is incomplete. Ask for a new one.</p>;
  }
  if (peekError) {
    return (
      <div className="flex items-start gap-2 rounded-[var(--a-radius-control)] bg-[var(--a-danger-bg)] px-4 py-3 font-dm text-sm text-[var(--a-danger)]" role="alert">
        <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden /> {peekError}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" aria-busy={loading}>
      {peek ? (
        <p className="rounded-[var(--a-radius-control)] bg-[var(--a-surface-2)] px-4 py-3 font-dm text-sm text-[var(--a-ink-2)]">
          {peek.reset ? "Setting a new password for " : "Joining as "}
          <strong className="text-[var(--a-ink)]">{peek.email}</strong>
        </p>
      ) : null}
      {peek && !peek.reset ? (
        <div>
          <label htmlFor="inv-name" className="mb-1 block font-dm text-sm font-medium text-[var(--a-ink)]">
            Your name
          </label>
          <input id="inv-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} required autoComplete="name" className={input} />
        </div>
      ) : null}
      <div>
        <label htmlFor="inv-pass" className="mb-1 block font-dm text-sm font-medium text-[var(--a-ink)]">
          Password (at least 10 characters)
        </label>
        <div className="relative">
          <input
            id="inv-pass"
            type={show ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={10}
            autoComplete="new-password"
            className={`${input} pr-11`}
          />
          <button
            type="button"
            onClick={() => setShow(!show)}
            aria-label={show ? "Hide password" : "Show password"}
            className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center text-[var(--a-ink-3)] hover:text-[var(--a-ink-2)]"
          >
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>
      <div>
        <label htmlFor="inv-confirm" className="mb-1 block font-dm text-sm font-medium text-[var(--a-ink)]">
          Confirm password
        </label>
        <input id="inv-confirm" type={show ? "text" : "password"} value={confirm} onChange={(e) => setConfirm(e.target.value)} required autoComplete="new-password" className={input} />
      </div>

      {status && (
        <div
          role={status.type === "error" ? "alert" : "status"}
          className={`flex items-center gap-2 rounded-[var(--a-radius-control)] px-4 py-3 font-dm text-sm ${
            status.type === "success" ? "bg-[var(--a-success-bg)] text-[var(--a-success)]" : "bg-[var(--a-danger-bg)] text-[var(--a-danger)]"
          }`}
        >
          {status.type === "success" ? <CheckCircle size={15} aria-hidden /> : <AlertCircle size={15} aria-hidden />}
          {status.msg}
        </div>
      )}

      <button type="submit" disabled={loading || !peek} className="btn-primary w-full py-3 text-sm disabled:opacity-60">
        {loading ? "Setting your password" : peek?.reset ? "Set new password and sign in" : "Accept invitation and sign in"}
      </button>
    </form>
  );
}

export default function AcceptInvitePage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--a-surface-2)] px-4">
      <div className="w-full max-w-md rounded-[var(--a-radius-card)] border border-[var(--a-border)] bg-[var(--a-surface)] p-6 shadow-[var(--a-shadow-card)] sm:p-8">
        <div className="mb-6 text-center">
          <h1 className="font-dm text-[26px] font-bold leading-none tracking-tight text-[var(--a-ink)]">
            <span className="text-[#1B3A6B]">TIB</span>
            <span className="text-[#F47C20]">LOGICS</span>
          </h1>
          <p className="mt-2 font-dm text-sm text-[var(--a-ink-3)]">Welcome to the admin team. Set your password to get started.</p>
        </div>
        <Suspense>
          <AcceptInviteForm />
        </Suspense>
      </div>
    </div>
  );
}
