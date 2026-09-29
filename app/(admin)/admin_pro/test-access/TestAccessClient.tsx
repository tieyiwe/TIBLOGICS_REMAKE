"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Wand2, Radar, FileText, GraduationCap, Loader2 } from "lucide-react";

const input =
  "w-full px-3.5 py-2.5 border border-[#D2DCE8] rounded-xl text-sm font-dm text-[#0D1B2A] placeholder:text-[#7A8FA6] focus:outline-none focus:ring-2 focus:ring-[#2251A3]/20 focus:border-[#2251A3] bg-white";
const card = "bg-white border border-[#D2DCE8] rounded-2xl p-6 space-y-4";
const btn = "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1B3A6B] text-white font-dm text-sm font-semibold disabled:opacity-50";

interface Props {
  canGrant: boolean;
  learn: string[];
  toolkit: { email: string; plan: string }[];
  monitors: { id: string; email: string; siteUrl: string; createdAt: string }[];
}

async function call(body: object): Promise<{ ok: boolean; error?: string; link?: string }> {
  const res = await fetch("/api/admin/test-access", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch(() => null);
  const d = res ? await res.json().catch(() => ({})) : {};
  return res?.ok ? { ok: true, link: d.link } : { ok: false, error: d.error ?? "Something went wrong." };
}

export default function TestAccessClient({ canGrant, learn, toolkit, monitors }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<Record<string, string>>({});
  const [tkEmail, setTkEmail] = useState("");
  const [lbEmail, setLbEmail] = useState("");
  const [tkPlan, setTkPlan] = useState("toolkit");
  const [mon, setMon] = useState({ email: "", siteUrl: "", competitors: "" });
  const [monLink, setMonLink] = useState<string | null>(null);

  async function run(key: string, body: object, ok: string) {
    setBusy(key);
    const r = await call(body);
    setBusy(null);
    setMsg((m) => ({ ...m, [key]: r.ok ? ok : r.error ?? "Failed" }));
    if (r.ok) router.refresh();
    return r;
  }

  if (!canGrant) {
    return <p className="font-dm text-sm text-[#7A8FA6]">Only the owner or an admin can grant free access.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-syne font-bold text-2xl text-[#0D1B2A]">Test access</h1>
        <p className="font-dm text-sm text-[#7A8FA6] mt-0.5">
          Use every paid tool free, to check and test it. Nothing here charges a card or counts as revenue.
        </p>
      </div>

      <section className={card}>
        <div className="flex items-center gap-2">
          <GraduationCap size={18} className="text-[#2251A3]" />
          <h2 className="font-syne font-bold text-lg text-[#0D1B2A]">Learning Box</h2>
        </div>
        <p className="font-dm text-sm text-[#3A4A5C]">
          Free access to every track, lesson, lab and exam for a TIBLOGICS account (create it at{" "}
          <Link href="/learn/signup" className="underline" target="_blank">/learn/signup</Link> first). Your own learner account
          with the owner email always has free access and does not need to be listed here.
        </p>
        <form
          className="flex flex-col sm:flex-row gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            run("learn", { tool: "learn", email: lbEmail }, "Free access granted. Sign in to that account at /learn.");
          }}
        >
          <input className={input} type="email" required placeholder="Learner account email" value={lbEmail} onChange={(e) => setLbEmail(e.target.value)} />
          <button className={btn} disabled={busy === "learn"}>
            {busy === "learn" && <Loader2 size={14} className="animate-spin" />} Grant
          </button>
        </form>
        {msg.learn && <p className="font-dm text-sm text-[#1B3A6B]">{msg.learn}</p>}
        {learn.length > 0 && (
          <ul className="divide-y divide-[#F4F7FB] border border-[#F4F7FB] rounded-xl">
            {learn.map((em) => (
              <li key={em} className="flex items-center justify-between px-4 py-2.5 font-dm text-sm">
                <span>{em}</span>
                <button
                  className="text-red-600 text-xs font-semibold"
                  disabled={busy === `lb-${em}`}
                  onClick={() => run(`lb-${em}`, { tool: "learn", action: "revoke", email: em }, "Revoked.")}
                >
                  Revoke
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={card}>
        <div className="flex items-center gap-2">
          <Wand2 size={18} className="text-[#B8500A]" />
          <h2 className="font-syne font-bold text-lg text-[#0D1B2A]">Toolkit Live</h2>
        </div>
        <p className="font-dm text-sm text-[#3A4A5C]">
          Toolkit Live works through a TIBLOGICS account. Create one at{" "}
          <Link href="/learn/signup" className="underline" target="_blank">/learn/signup</Link> (use a different email from your admin login),
          grant it free access here, then sign in to that account and open{" "}
          <Link href="/toolkit" className="underline" target="_blank">/toolkit</Link>. The normal monthly run allowance still applies,
          so test use cannot run up an unlimited AI bill.
        </p>
        <form
          className="flex flex-col sm:flex-row gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            run("toolkit", { tool: "toolkit", email: tkEmail, plan: tkPlan }, "Free access granted. Sign in to that account and open /toolkit.");
          }}
        >
          <input className={input} type="email" required placeholder="Account email" value={tkEmail} onChange={(e) => setTkEmail(e.target.value)} />
          <select className={`${input} sm:w-56`} value={tkPlan} onChange={(e) => setTkPlan(e.target.value)}>
            <option value="toolkit">Toolkit Live (full)</option>
            <option value="guard">Compliance Guard only</option>
          </select>
          <button className={btn} disabled={busy === "toolkit"}>
            {busy === "toolkit" && <Loader2 size={14} className="animate-spin" />} Grant
          </button>
        </form>
        {msg.toolkit && <p className="font-dm text-sm text-[#1B3A6B]">{msg.toolkit}</p>}
        {toolkit.length > 0 && (
          <ul className="divide-y divide-[#F4F7FB] border border-[#F4F7FB] rounded-xl">
            {toolkit.map((t) => (
              <li key={t.email} className="flex items-center justify-between px-4 py-2.5 font-dm text-sm">
                <span>{t.email} <span className="text-[#7A8FA6]">· {t.plan === "guard" ? "Guard only" : "Toolkit Live"}</span></span>
                <button
                  className="text-red-600 text-xs font-semibold"
                  disabled={busy === `tk-${t.email}`}
                  onClick={() => run(`tk-${t.email}`, { tool: "toolkit", action: "revoke", email: t.email }, "Revoked.")}
                >
                  Revoke
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={card}>
        <div className="flex items-center gap-2">
          <Radar size={18} className="text-[#1B3A6B]" />
          <h2 className="font-syne font-bold text-lg text-[#0D1B2A]">Readiness Monitor</h2>
        </div>
        <p className="font-dm text-sm text-[#3A4A5C]">
          Creates a free monitor, runs the first scan now and weekly after that, and gives you its private dashboard link.
          Save the link: only its fingerprint is stored. The welcome and weekly emails go to the email you enter.
        </p>
        <form
          className="grid sm:grid-cols-2 gap-3"
          onSubmit={async (e) => {
            e.preventDefault();
            setMonLink(null);
            const r = await run(
              "monitor",
              {
                tool: "monitor",
                email: mon.email,
                siteUrl: mon.siteUrl,
                competitors: mon.competitors.split(/[\s,]+/).filter(Boolean),
              },
              "Monitor created. The first scan is running.",
            );
            if (r.link) setMonLink(r.link);
          }}
        >
          <input className={input} type="email" required placeholder="Email for reports" value={mon.email} onChange={(e) => setMon({ ...mon, email: e.target.value })} />
          <input className={input} required placeholder="Your site, e.g. tiblogics.com" value={mon.siteUrl} onChange={(e) => setMon({ ...mon, siteUrl: e.target.value })} />
          <input className={`${input} sm:col-span-2`} placeholder="Competitors (optional, up to 3, separated by commas)" value={mon.competitors} onChange={(e) => setMon({ ...mon, competitors: e.target.value })} />
          <div>
            <button className={btn} disabled={busy === "monitor"}>
              {busy === "monitor" && <Loader2 size={14} className="animate-spin" />} Create free monitor
            </button>
          </div>
        </form>
        {msg.monitor && <p className="font-dm text-sm text-[#1B3A6B]">{msg.monitor}</p>}
        {monLink && (
          <p className="font-dm text-sm break-all">
            Dashboard: <a href={monLink} target="_blank" rel="noreferrer" className="underline text-[#2251A3]">{monLink}</a>
          </p>
        )}
        {monitors.length > 0 && (
          <ul className="divide-y divide-[#F4F7FB] border border-[#F4F7FB] rounded-xl">
            {monitors.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-3 px-4 py-2.5 font-dm text-sm">
                <span className="truncate">{m.siteUrl} <span className="text-[#7A8FA6]">· {m.email}</span></span>
                <button
                  className="text-red-600 text-xs font-semibold shrink-0"
                  disabled={busy === `mon-${m.id}`}
                  onClick={() => run(`mon-${m.id}`, { tool: "monitor", action: "revoke", id: m.id }, "Monitor stopped.")}
                >
                  Stop
                </button>
              </li>
            ))}
          </ul>
        )}
        <p className="font-dm text-xs text-[#7A8FA6]">
          Lost a dashboard link? Request a new one with the same email on the Readiness Monitor page.
        </p>
      </section>

      <section className={card}>
        <div className="flex items-center gap-2">
          <FileText size={18} className="text-[#0F6E56]" />
          <h2 className="font-syne font-bold text-lg text-[#0D1B2A]">Automation Blueprint</h2>
        </div>
        <p className="font-dm text-sm text-[#3A4A5C]">
          Opens the real intake form in test mode. Submitting it skips checkout, writes the blueprint straight away and
          takes you to its private page.
        </p>
        <Link href="/tools/automation-blueprint?test=1" target="_blank" className={btn}>
          Open the form in test mode
        </Link>
      </section>
    </div>
  );
}
