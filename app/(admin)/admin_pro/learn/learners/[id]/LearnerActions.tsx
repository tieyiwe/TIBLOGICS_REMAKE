"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

// Admin actions that already exist elsewhere, reachable from the learner page:
// free access (the Test access API) and certificate revoke/restore (the Learn
// certificate API). Each API checks staff rights itself.

export function AccessActions({ email, comped, canGrant }: { email: string; comped: boolean; canGrant: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function run(revoke: boolean) {
    if (revoke && !confirm(`Revoke free access for ${email}?`)) return;
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/test-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(revoke ? { tool: "learn", action: "revoke", email } : { tool: "learn", email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setMsg(revoke ? "Free access revoked." : "Free access granted.");
      router.refresh();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {canGrant &&
        (comped ? (
          <button
            onClick={() => run(true)}
            disabled={busy}
            className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:border-red-400 disabled:opacity-50"
          >
            Revoke free access
          </button>
        ) : (
          <button
            onClick={() => run(false)}
            disabled={busy}
            className="rounded-lg bg-[var(--ink)] px-3 py-1.5 text-xs font-bold text-white hover:opacity-90 disabled:opacity-50"
          >
            Grant free access
          </button>
        ))}
      <Link href="/admin_pro/test-access" className="text-xs font-semibold text-[var(--blue2)] underline">
        Test access page
      </Link>
      {msg && <span className="text-xs text-[var(--ink2)]">{msg}</span>}
    </div>
  );
}

export function CertificateRevoke({ id, revoked }: { id: string; revoked: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function toggle() {
    if (!revoked && !confirm("Revoke this certificate? Its verify page will show it as revoked.")) return;
    setBusy(true);
    await fetch(`/api/admin/learn/certificate/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ revoked: !revoked }),
    }).catch(() => {});
    setBusy(false);
    router.refresh();
  }
  return (
    <button onClick={toggle} disabled={busy} className="text-xs font-semibold text-[var(--blue2)] underline disabled:opacity-50">
      {revoked ? "Restore" : "Revoke"}
    </button>
  );
}
