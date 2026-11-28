"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowRight, EyeOff, Loader2, Search } from "lucide-react";
import { useT } from "@/lib/i18n/client";

// The home page's flagship: AI Agent Readiness, minimal. One fact, one fear,
// one field. The check runs on the server (/api/tools/agent-ready) and the
// visitor lands on their report, where the full story and the offers are.

export default function AgentHeroScanner({ reportPrice }: { reportPrice: string | null }) {
  const t = useT();
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(e: React.FormEvent) {
    e.preventDefault();
    const target = url.trim();
    if (!target || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/tools/agent-ready", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: target }),
      });
      const data = (await res.json().catch(() => ({}))) as { token?: string; error?: string };
      if (!res.ok || !data.token) throw new Error(data.error || t("home.agent.error"));
      router.push(`/tools/ai-agent-ready/r/${data.token}`);
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : t("home.agent.error"));
      setBusy(false);
    }
  }

  return (
    <div className="relative" data-testid="home-agent">
      <div
        aria-hidden
        className="absolute -inset-6 rounded-[2rem] opacity-70 blur-2xl"
        style={{ background: "radial-gradient(60% 60% at 75% 25%, rgba(244,124,32,0.32), transparent 70%), radial-gradient(60% 60% at 20% 85%, rgba(198,40,40,0.25), transparent 70%)" }}
      />
      <div className="relative overflow-hidden rounded-3xl bg-[#0D1B2A] p-6 text-white shadow-[0_24px_80px_-20px_rgba(13,27,42,0.55)] ring-1 ring-white/10 sm:p-8">
        <p className="font-dm text-[11px] font-bold uppercase tracking-[0.16em] text-[#F47C20]">{t("home.agent.tag")}</p>

        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-[#F47C20]/30 bg-[#F47C20]/10 p-3.5">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-[#F47C20]" aria-hidden />
          <p className="font-dm text-sm font-semibold leading-snug text-white">
            {t("home.agent.stat")} <span className="font-normal text-white/50">({t("home.agent.source")})</span>
          </p>
        </div>

        <h2 className="mt-5 font-syne text-2xl font-extrabold leading-tight sm:text-[1.9rem]">{t("home.agent.title")}</h2>
        <p className="mt-3 font-dm text-[15px] leading-relaxed text-white/75">{t("home.agent.body")}</p>

        <form onSubmit={run} className="mt-6 space-y-3">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" aria-hidden />
            <input
              type="text"
              inputMode="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={t("home.agent.placeholder")}
              aria-label={t("home.agent.label")}
              disabled={busy}
              data-testid="home-agent-url"
              className="w-full rounded-xl border border-white/15 bg-white/[0.07] py-3.5 pl-10 pr-4 font-dm text-sm text-white outline-none transition placeholder:text-white/35 focus:border-[#F47C20] focus:ring-2 focus:ring-[#F47C20]/30"
            />
          </div>
          <button
            type="submit"
            disabled={busy || !url.trim()}
            data-testid="home-agent-submit"
            data-track="cta-home-agent-ready"
            className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#F47C20] px-5 py-3.5 font-dm text-base font-bold text-white shadow-[0_10px_30px_-10px_rgba(244,124,32,0.8)] transition hover:bg-[#E06A0E] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? (
              <>
                <Loader2 size={18} className="animate-spin" aria-hidden /> {t("home.agent.busy")}
              </>
            ) : (
              <>
                <EyeOff size={18} aria-hidden /> {t("home.agent.button")} <ArrowRight size={18} className="transition group-hover:translate-x-0.5" aria-hidden />
              </>
            )}
          </button>
        </form>
        {error && (
          <p role="alert" className="mt-3 rounded-xl bg-red-500/15 px-3 py-2 font-dm text-sm text-red-200" data-testid="home-agent-error">
            {error}
          </p>
        )}
        <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1 font-dm text-xs text-white/55">
          {[1, 2, 3].map((n) => (
            <li key={n} className="flex items-center gap-1.5">
              <span className="h-1 w-1 rounded-full bg-[#F47C20]" aria-hidden /> {t(`home.agent.points.${n}`)}
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-4">
          {reportPrice && <p className="font-dm text-xs text-white/55">{t("home.agent.note", { report: reportPrice })}</p>}
          <Link href="/tools/ai-agent-ready" className="font-dm text-xs font-semibold text-[#F9A96B] hover:underline">
            {t("home.agent.more")} →
          </Link>
        </div>
      </div>
    </div>
  );
}
