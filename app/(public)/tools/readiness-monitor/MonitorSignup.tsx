"use client";
import { useState } from "react";
import { Loader2, Lock } from "lucide-react";
import { useT } from "@/lib/i18n/client";

const input =
  "w-full px-4 py-2.5 border border-[#D2DCE8] rounded-xl text-sm font-dm text-[#0D1B2A] placeholder:text-[#7A8FA6] focus:outline-none focus:ring-2 focus:ring-[#2251A3]/20 focus:border-[#2251A3]";

async function post(url: string, body: unknown): Promise<{ ok: boolean; data: Record<string, unknown> }> {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

export default function MonitorSignup({ price, maxCompetitors }: { price: string | null; maxCompetitors: number }) {
  const t = useT();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [site, setSite] = useState("");
  const [rivals, setRivals] = useState<string[]>(Array(maxCompetitors).fill(""));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [linkEmail, setLinkEmail] = useState("");
  const [linkMsg, setLinkMsg] = useState<string | null>(null);

  async function subscribe(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { ok, data } = await post("/api/monitor/checkout", { email, name, siteUrl: site, competitors: rivals });
    if (ok && typeof data.url === "string") {
      window.location.href = data.url;
      return;
    }
    setError(typeof data.error === "string" ? data.error : t("tools.common.error"));
    setBusy(false);
  }

  async function joinWaitlist(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const { ok, data } = await post("/api/waitlist", { email, product: "readiness-monitor" });
    setBusy(false);
    if (ok) setNotice(t("tools.monitor.waitlistDone"));
    else setError(typeof data.error === "string" ? data.error : t("tools.common.error"));
  }

  async function requestLink(e: React.FormEvent) {
    e.preventDefault();
    const { data } = await post("/api/monitor/link", { email: linkEmail });
    setLinkMsg(typeof data.message === "string" ? data.message : typeof data.error === "string" ? data.error : t("tools.common.tryAgain"));
  }

  return (
    <div className="space-y-4 lg:sticky lg:top-32">
      <div className="bg-white border border-[#D2DCE8] rounded-2xl p-6 shadow-[0_8px_32px_rgba(27,58,107,0.08)]">
        {price ? (
          <>
            <p className="font-syne font-extrabold text-3xl text-[#0D1B2A]">
              {price}
              <span className="font-dm text-base font-medium text-[#7A8FA6]"> {t("tools.common.perMonth")}</span>
            </p>
            <p className="font-dm text-sm text-[#7A8FA6] mt-1">{t("tools.monitor.cancelAnytime")}</p>

            <form onSubmit={subscribe} className="mt-5 space-y-3">
              <input className={input} type="email" required placeholder={t("tools.monitor.ph.email")} aria-label={t("tools.monitor.ph.email")} value={email} onChange={(e) => setEmail(e.target.value)} />
              <input className={input} placeholder={t("tools.monitor.ph.name")} aria-label={t("tools.monitor.ph.name")} value={name} onChange={(e) => setName(e.target.value)} />
              <div>
                <label htmlFor="monitor-site" className="font-dm text-xs font-semibold text-[#3A4A5C] uppercase tracking-wider">{t("tools.monitor.yourSite")}</label>
                <input id="monitor-site" className={`${input} mt-1`} required placeholder={t("tools.monitor.ph.site")} value={site} onChange={(e) => setSite(e.target.value)} />
              </div>
              <div>
                <p className="font-dm text-xs font-semibold text-[#3A4A5C] uppercase tracking-wider">
                  {t("tools.monitor.competitorsUpTo", { n: maxCompetitors })}
                </p>
                <div className="space-y-2 mt-1">
                  {rivals.map((r, i) => (
                    <input
                      key={i}
                      className={input}
                      placeholder={t("tools.monitor.ph.competitor", { n: i + 1 })}
                      aria-label={t("tools.monitor.competitorLabel", { n: i + 1 })}
                      value={r}
                      onChange={(e) => setRivals((prev) => prev.map((v, j) => (j === i ? e.target.value : v)))}
                    />
                  ))}
                </div>
                <p className="font-dm text-xs text-[#7A8FA6] mt-1">{t("tools.monitor.changeLater")}</p>
              </div>
              {error && <p role="alert" className="font-dm text-sm text-red-600">{error}</p>}
              <button type="submit" disabled={busy} className="btn-primary w-full justify-center text-center disabled:opacity-60">
                {busy ? <Loader2 size={16} className="animate-spin shrink-0" /> : <Lock size={15} className="shrink-0" />}
                {busy ? t("tools.monitor.checking") : t("tools.monitor.continue")}
              </button>
            </form>
          </>
        ) : (
          <>
            <p className="font-syne font-bold text-xl text-[#0D1B2A]">{t("tools.common.openingSoon")}</p>
            <p className="font-dm text-sm text-[#3A4A5C] mt-1">
              {t("tools.monitor.soonBody")}
            </p>
            {notice ? (
              <p className="font-dm text-sm text-green-700 mt-4">{notice}</p>
            ) : (
              <form onSubmit={joinWaitlist} className="mt-4 space-y-3">
                <input className={input} type="email" required placeholder={t("tools.common.waitlistPlaceholder")} aria-label={t("tools.common.yourEmail")} value={email} onChange={(e) => setEmail(e.target.value)} />
                {error && <p role="alert" className="font-dm text-sm text-red-600">{error}</p>}
                <button type="submit" disabled={busy} className="btn-primary w-full justify-center disabled:opacity-60">
                  {busy && <Loader2 size={16} className="animate-spin" />}
                  {t("tools.common.joinWaitlist")}
                </button>
              </form>
            )}
          </>
        )}
      </div>

      <div className="bg-white border border-[#D2DCE8] rounded-2xl p-5">
        <p className="font-dm text-sm font-semibold text-[#0D1B2A]">{t("tools.monitor.already")}</p>
        <p className="font-dm text-xs text-[#7A8FA6] mt-0.5">{t("tools.monitor.alreadyBody")}</p>
        {linkMsg ? (
          <p className="font-dm text-sm text-[#3A4A5C] mt-3">{linkMsg}</p>
        ) : (
          <form onSubmit={requestLink} className="mt-3 flex gap-2">
            <input className={`${input} min-w-0`} type="email" required placeholder={t("tools.common.yourEmail")} aria-label={t("tools.common.yourEmail")} value={linkEmail} onChange={(e) => setLinkEmail(e.target.value)} />
            <button type="submit" className="btn-secondary !px-4 shrink-0 text-sm">{t("tools.common.send")}</button>
          </form>
        )}
      </div>
    </div>
  );
}
