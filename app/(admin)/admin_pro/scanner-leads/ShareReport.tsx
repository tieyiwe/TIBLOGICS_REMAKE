"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Download, Link2, Lock, Mail, MessageCircle } from "lucide-react";

// Staff: download a scan's full report as a PDF and share its link.
// A locked scan's link only shows the free view, so sharing one asks to
// unlock it first (the same unlock as "Unlock report"); the PDF is always the
// full report for staff (app/api/scanner/report/[token]/pdf).

export default function ShareReport({
  id,
  token,
  domain,
  unlocked,
  compact = false,
}: {
  id: string;
  token: string;
  domain: string;
  unlocked: boolean;
  compact?: boolean;
}) {
  const router = useRouter();
  const [lang, setLang] = useState("en");
  const [state, setState] = useState<"idle" | "busy" | "copied" | "error">("idle");
  const [isUnlocked, setUnlocked] = useState(unlocked);
  const link = () => `${window.location.origin}/tools/scanner/report/${token}`;
  const pdf = `/api/scanner/report/${encodeURIComponent(token)}/pdf?lang=${lang}`;

  async function ensureUnlocked(): Promise<boolean> {
    if (isUnlocked) return true;
    if (!confirm(`Unlock the full report for ${domain} so the link shows everything? Anyone with the link will see the full report.`)) return false;
    setState("busy");
    const r = await fetch(`/api/admin/scanner-leads/${encodeURIComponent(id)}/unlock`, { method: "POST" }).catch(() => null);
    if (!r?.ok) {
      setState("error");
      return false;
    }
    setUnlocked(true);
    router.refresh();
    return true;
  }

  async function copy() {
    if (!(await ensureUnlocked())) return;
    try {
      await navigator.clipboard.writeText(link());
      setState("copied");
      setTimeout(() => setState("idle"), 2500);
    } catch {
      window.prompt("Copy the report link:", link());
      setState("idle");
    }
  }

  async function open(kind: "email" | "whatsapp") {
    if (!(await ensureUnlocked())) return;
    const text = `Website report for ${domain}: ${link()}`;
    const href =
      kind === "email"
        ? `mailto:?subject=${encodeURIComponent(`Website report for ${domain}`)}&body=${encodeURIComponent(text)}`
        : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(href, "_blank", "noopener,noreferrer");
    setState("idle");
  }

  const btn = "inline-flex items-center gap-1.5 rounded-lg border border-[var(--a-border)] px-2.5 py-1.5 font-dm text-xs font-semibold text-[var(--a-ink)] hover:border-[var(--a-blue)] disabled:opacity-50";

  return (
    <div className={`flex flex-wrap items-center gap-2 ${compact ? "" : "mt-3"}`} data-testid="share-report">
      {!compact && (
        <select value={lang} onChange={(e) => setLang(e.target.value)} aria-label="PDF language" className="rounded-lg border border-[var(--a-border)] bg-[var(--a-surface)] px-2 py-1.5 font-dm text-xs">
          <option value="en">EN</option>
          <option value="fr">FR</option>
          <option value="sw">SW</option>
        </select>
      )}
      <a href={pdf} className={btn} data-testid="report-pdf" download>
        <Download size={13} aria-hidden /> PDF
      </a>
      <button type="button" onClick={copy} disabled={state === "busy"} className={btn} data-testid="report-copy">
        {state === "copied" ? <Check size={13} aria-hidden /> : isUnlocked ? <Link2 size={13} aria-hidden /> : <Lock size={13} aria-hidden />}
        {state === "copied" ? "Copied" : isUnlocked ? "Copy link" : "Unlock & copy link"}
      </button>
      {!compact && (
        <>
          <button type="button" onClick={() => open("email")} disabled={state === "busy"} className={btn} data-testid="report-share-email">
            <Mail size={13} aria-hidden /> Email
          </button>
          <button type="button" onClick={() => open("whatsapp")} disabled={state === "busy"} className={btn} data-testid="report-share-whatsapp">
            <MessageCircle size={13} aria-hidden /> WhatsApp
          </button>
        </>
      )}
      {state === "error" && <span className="font-dm text-xs text-red-600">Could not unlock</span>}
    </div>
  );
}
