"use client";

import { useState } from "react";
import { Check, Copy, Linkedin, Mail, MessageCircle, Twitter } from "lucide-react";
import { useT } from "@/lib/i18n/client";

// The personal link with copy and share buttons. Each share opens the
// network's own share page (no SDKs, no tracking pixels) and counts once.

function count(channel: string) {
  void fetch("/api/learn/referrals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ channel }),
    keepalive: true,
  }).catch(() => {});
}

export default function ReferralShare({ link }: { link: string }) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  const text = t("referrals.shareText");
  const enc = encodeURIComponent;
  const channels = [
    { id: "whatsapp", label: t("referrals.channel.whatsapp"), icon: MessageCircle, href: `https://wa.me/?text=${enc(`${text} ${link}`)}`, color: "#128C4A" },
    { id: "linkedin", label: t("referrals.channel.linkedin"), icon: Linkedin, href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(link)}`, color: "#0A66C2" },
    { id: "x", label: t("referrals.channel.x"), icon: Twitter, href: `https://x.com/intent/post?text=${enc(text)}&url=${enc(link)}`, color: "#0D1B2A" },
    { id: "email", label: t("referrals.channel.email"), icon: Mail, href: `mailto:?subject=${enc(t("referrals.emailSubject"))}&body=${enc(`${text}\n\n${link}`)}`, color: "#B8500A" },
  ];

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      const el = document.getElementById("ref-link") as HTMLInputElement | null;
      el?.select();
      document.execCommand?.("copy");
    }
    setCopied(true);
    count("copy");
    window.setTimeout(() => setCopied(false), 2500);
  }

  return (
    <div>
      <label htmlFor="ref-link" className="text-xs font-semibold uppercase tracking-wide text-[var(--ink3)]">
        {t("referrals.linkLabel")}
      </label>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <input
          id="ref-link"
          readOnly
          value={link}
          onFocus={(e) => e.currentTarget.select()}
          className="min-h-[48px] w-full min-w-0 flex-1 rounded-xl border border-[var(--border)] bg-[var(--s2)] px-4 font-mono text-sm text-[var(--ink)]"
        />
        <button
          type="button"
          onClick={copy}
          className="inline-flex min-h-[48px] shrink-0 items-center justify-center gap-2 rounded-xl bg-[var(--ink)] px-5 text-sm font-bold text-white"
        >
          {copied ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />}
          {copied ? t("referrals.copied") : t("referrals.copy")}
        </button>
      </div>
      <p aria-live="polite" className="sr-only">
        {copied ? t("referrals.copied") : ""}
      </p>
      <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-[var(--ink3)]">{t("referrals.shareTitle")}</p>
      <ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {channels.map((c) => (
          <li key={c.id}>
            <a
              href={c.href}
              target={c.id === "email" ? undefined : "_blank"}
              rel="noopener noreferrer"
              onClick={() => count(c.id)}
              aria-label={t("referrals.shareVia", { channel: c.label })}
              className="flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-white px-3 text-sm font-bold text-[var(--ink)] hover:bg-[var(--s2)]"
            >
              <c.icon size={18} aria-hidden style={{ color: c.color }} />
              {c.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
