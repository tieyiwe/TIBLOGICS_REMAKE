"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bot, Check, DoorOpen, FileSearch, Loader2, Search, ShoppingBag } from "lucide-react";
import HelpBox from "./HelpBox";
import { useT } from "@/lib/i18n/client";

// AI Agent Readiness landing (client part): the free check, the two paid options and the way to
// ask us for help. The scan runs on the server (/api/tools/agent-ready) and
// the report lives at /tools/ai-agent-ready/r/<token>.

export default function AgentReadyLanding({ prices, rescans }: { prices: { report: string | null; kit: string | null }; rescans: number }) {
  const t = useT();
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  async function run(raw: string) {
    const target = raw.trim();
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
      if (!res.ok || !data.token) throw new Error(data.error || t("tools.agent.err.generic"));
      router.push(`/tools/ai-agent-ready/r/${data.token}`);
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : t("tools.agent.err.generic"));
      setBusy(false);
    }
  }

  // /tools/ai-agent-ready?url=… (the website scanner's hand-off) starts the check.
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const handed = new URLSearchParams(window.location.search).get("url");
    if (handed && handed.length < 500) {
      setUrl(handed);
      void run(handed);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-[#F4F7FB] pb-20 pt-32 sm:pt-44">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <span className="section-tag">{t("tools.agent.hero.eyebrow")}</span>
          <h1 className="mt-2 break-words font-syne text-3xl font-extrabold text-[#0D1B2A] sm:text-4xl md:text-5xl">{t("tools.agent.hero.title")}</h1>
          <p className="mx-auto mt-4 max-w-2xl font-dm text-base text-[#3A4A5C] sm:text-lg">{t("tools.agent.hero.body")}</p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void run(url);
          }}
          className="mx-auto flex w-full max-w-2xl flex-col gap-3 sm:flex-row"
        >
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7A8FA6]" aria-hidden />
            <input
              type="text"
              inputMode="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={t("tools.agent.form.placeholder")}
              aria-label={t("tools.agent.form.label")}
              disabled={busy}
              data-testid="agent-url"
              className="w-full rounded-xl border border-[#D2DCE8] bg-white py-3 pl-10 pr-4 font-dm text-sm text-[#0D1B2A] outline-none transition-all placeholder:text-[#7A8FA6] focus:border-[#2251A3] focus:ring-2 focus:ring-[#2251A3]/20"
            />
          </div>
          <button type="submit" disabled={busy || !url.trim()} data-testid="agent-submit" data-track="cta-agent-ready-scan" className="btn-primary justify-center whitespace-nowrap rounded-xl px-6 py-3 disabled:cursor-not-allowed disabled:opacity-50">
            {busy ? (
              <>
                <Loader2 size={16} className="animate-spin" aria-hidden /> {t("tools.agent.form.scanning")}
              </>
            ) : (
              <>
                <Bot size={16} aria-hidden /> {t("tools.agent.form.submit")}
              </>
            )}
          </button>
        </form>
        <p className="mx-auto mt-3 max-w-2xl text-center font-dm text-xs text-[#7A8FA6]">{t("tools.agent.form.note", { report: prices.report ?? "", kit: prices.kit ?? "" })}</p>
        {error && (
          <div role="alert" data-testid="agent-error" className="mx-auto mt-6 max-w-2xl rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-center font-dm text-sm text-[#7A2020]">
            {error}
          </div>
        )}

        <section className="mt-12 rounded-2xl bg-[#0D1B2A] p-6 text-white sm:p-8" aria-label={t("tools.agent.stat.source")} data-testid="agent-stats">
          <div className="grid gap-6 sm:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <div key={n}>
                <p className="font-syne text-4xl font-extrabold text-[#F47C20]">{t(`tools.agent.stat${n}.num`)}</p>
                <p className="mt-1 font-dm text-sm leading-relaxed text-white/80">{t(`tools.agent.stat${n}.label`)}</p>
              </div>
            ))}
          </div>
          <p className="mt-5 font-dm text-[11px] text-white/50">{t("tools.agent.stat.source")}</p>
        </section>

        <section className="mt-16" aria-labelledby="agent-what">
          <h2 id="agent-what" className="text-center font-syne text-2xl font-bold text-[#0D1B2A]">{t("tools.agent.what.title")}</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              { icon: DoorOpen, title: "tools.agent.what.access", body: "tools.agent.what.accessBody" },
              { icon: FileSearch, title: "tools.agent.what.read", body: "tools.agent.what.readBody" },
              { icon: ShoppingBag, title: "tools.agent.what.data", body: "tools.agent.what.dataBody" },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-2xl border border-[#D2DCE8] bg-white p-6">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#EBF0FA] text-[#2251A3]">
                  <Icon size={20} aria-hidden />
                </span>
                <h3 className="mt-3 font-syne text-lg font-bold text-[#0D1B2A]">{t(title)}</h3>
                <p className="mt-1.5 font-dm text-sm leading-relaxed text-[#3A4A5C]">{t(body)}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16" aria-labelledby="agent-plans">
          <h2 id="agent-plans" className="text-center font-syne text-2xl font-bold text-[#0D1B2A]">{t("tools.agent.plans.title")}</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <Plan name={t("tools.agent.plans.free")} price={t("tools.agent.plans.freePrice")} items={[1, 2, 3].map((n) => t(`tools.agent.plans.free.${n}`))} />
            {prices.report && <Plan name={t("tools.agent.plans.report")} price={prices.report} note={t("tools.agent.plans.oneTime")} items={[1, 2, 3, 4].map((n) => t(`tools.agent.plans.report.${n}`))} />}
            {prices.kit && <Plan
              name={t("tools.agent.plans.kit")}
              price={prices.kit}
              note={t("tools.agent.plans.oneTime")}
              badge={t("tools.agent.plans.kitBadge")}
              highlight
              items={[1, 2, 3, 4, 5].map((n) => t(`tools.agent.plans.kit.${n}`, { n: rescans }))}
            />}
          </div>
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                window.scrollTo({ top: 0, behavior: "smooth" });
                document.querySelector<HTMLInputElement>("[data-testid=agent-url]")?.focus();
              }}
              className="inline-flex items-center gap-2 font-dm text-sm font-semibold text-[#2251A3] hover:underline"
            >
              {t("tools.agent.plans.start")}
            </button>
          </div>
        </section>

        <HelpBox />

        <section className="mx-auto mt-16 max-w-3xl" aria-labelledby="agent-faq">
          <h2 id="agent-faq" className="font-syne text-2xl font-bold text-[#0D1B2A]">{t("tools.agent.faq.title")}</h2>
          <div className="mt-4 divide-y divide-[#D2DCE8] rounded-2xl border border-[#D2DCE8] bg-white">
            {[1, 2, 3].map((n) => (
              <details key={n} className="group px-5 py-4">
                <summary className="cursor-pointer list-none font-dm font-semibold text-[#0D1B2A]">{t(`tools.agent.faq.q${n}`)}</summary>
                <p className="mt-2 font-dm text-sm leading-relaxed text-[#3A4A5C]">{t(`tools.agent.faq.a${n}`)}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function Plan({ name, price, note, items, badge, highlight }: { name: string; price: string; note?: string; items: string[]; badge?: string; highlight?: boolean }) {
  return (
    <div className={`relative flex flex-col rounded-2xl border bg-white p-6 ${highlight ? "border-[#F47C20] shadow-lg shadow-[#F47C20]/10" : "border-[#D2DCE8]"}`}>
      {badge && <span className="absolute -top-3 left-6 rounded-full bg-[#F47C20] px-3 py-0.5 font-dm text-xs font-bold text-white">{badge}</span>}
      <h3 className="font-syne text-lg font-bold text-[#0D1B2A]">{name}</h3>
      <p className="mt-1 font-syne text-3xl font-extrabold text-[#0D1B2A]">
        {price} {note && <span className="font-dm text-sm font-normal text-[#7A8FA6]">{note}</span>}
      </p>
      <ul className="mt-4 space-y-2">
        {items.map((it) => (
          <li key={it} className="flex gap-2 font-dm text-sm text-[#3A4A5C]">
            <Check size={16} className="mt-0.5 shrink-0 text-[#1E9E6A]" aria-hidden /> {it}
          </li>
        ))}
      </ul>
    </div>
  );
}
