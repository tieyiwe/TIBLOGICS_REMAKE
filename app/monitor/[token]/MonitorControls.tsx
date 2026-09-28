"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Loader2, RefreshCw, Save } from "lucide-react";

const input =
  "w-full px-4 py-2.5 border border-[#D2DCE8] rounded-xl text-sm font-dm text-[#0D1B2A] placeholder:text-[#7A8FA6] focus:outline-none focus:ring-2 focus:ring-[#2251A3]/20 focus:border-[#2251A3]";

async function post(url: string, body?: unknown) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return { ok: res.ok, data };
}

export default function MonitorControls(props: {
  token: string;
  status: string;
  siteUrl: string;
  competitors: string[];
  manualReadyAt: string | null;
  hasBilling: boolean;
}) {
  const router = useRouter();
  const base = `/api/monitor/${props.token}`;
  const editable = props.status === "active" || props.status === "past_due";

  const [site, setSite] = useState(props.siteUrl);
  const [rivals, setRivals] = useState<string[]>([...props.competitors, "", "", ""].slice(0, 3));
  const [busy, setBusy] = useState<"save" | "run" | "billing" | null>(null);
  const [msg, setMsg] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy("save");
    setMsg(null);
    const { ok, data } = await post(`${base}/settings`, { siteUrl: site, competitors: rivals });
    setBusy(null);
    if (!ok) return setMsg({ tone: "err", text: String(data.error ?? "Could not save.") });
    setMsg({
      tone: "ok",
      text: data.changed ? "Saved. The new list is scanned within the hour." : "No changes to save.",
    });
    router.refresh();
  }

  async function runNow() {
    setBusy("run");
    setMsg(null);
    const { ok, data } = await post(`${base}/run`);
    setBusy(null);
    if (!ok) return setMsg({ tone: "err", text: String(data.error ?? "Could not start a scan.") });
    setMsg({ tone: "ok", text: "Scan complete." });
    router.refresh();
  }

  async function billing() {
    setBusy("billing");
    const { ok, data } = await post(`${base}/billing`);
    if (ok && typeof data.url === "string") {
      window.location.href = data.url;
      return;
    }
    setBusy(null);
    setMsg({ tone: "err", text: String(data.error ?? "Could not open billing.") });
  }

  const readyAt = props.manualReadyAt ? new Date(props.manualReadyAt) : null;

  return (
    <section className="bg-white border border-[#D2DCE8] rounded-2xl p-5 md:p-6">
      <h2 className="font-syne font-bold text-base text-[#0D1B2A]">Settings</h2>

      {editable ? (
        <form onSubmit={save} className="mt-4 grid md:grid-cols-2 gap-4">
          <div>
            <label className="font-dm text-xs font-semibold text-[#3A4A5C] uppercase tracking-wider">Your website</label>
            <input className={`${input} mt-1`} required value={site} onChange={(e) => setSite(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="font-dm text-xs font-semibold text-[#3A4A5C] uppercase tracking-wider">Competitors</label>
            {rivals.map((r, i) => (
              <input
                key={i}
                className={input}
                placeholder={`competitor${i + 1}.com`}
                value={r}
                onChange={(e) => setRivals((prev) => prev.map((v, j) => (j === i ? e.target.value : v)))}
              />
            ))}
          </div>
          <div className="md:col-span-2 flex flex-wrap gap-3">
            <button type="submit" disabled={!!busy} className="btn-secondary text-sm disabled:opacity-60">
              {busy === "save" ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              Save sites
            </button>
            {props.status === "active" && (
              <button
                type="button"
                onClick={runNow}
                disabled={!!busy || !!readyAt}
                className="btn-primary text-sm disabled:opacity-60"
                title={readyAt ? `Available again ${readyAt.toLocaleString()}` : undefined}
              >
                {busy === "run" ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
                {busy === "run" ? "Scanning… (up to a minute)" : readyAt ? "Rescan used for today" : "Rescan now"}
              </button>
            )}
            {props.hasBilling && (
              <button type="button" onClick={billing} disabled={!!busy} className="btn-ghost text-sm disabled:opacity-60">
                {busy === "billing" ? <Loader2 size={15} className="animate-spin" /> : <CreditCard size={15} />}
                Manage billing
              </button>
            )}
          </div>
        </form>
      ) : (
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <p className="font-dm text-sm text-[#3A4A5C]">Settings are available while the subscription is active.</p>
          {props.hasBilling && (
            <button type="button" onClick={billing} disabled={!!busy} className="btn-ghost text-sm">
              <CreditCard size={15} /> Manage billing
            </button>
          )}
        </div>
      )}

      {msg && (
        <p className={`font-dm text-sm mt-4 ${msg.tone === "ok" ? "text-green-700" : "text-red-600"}`}>{msg.text}</p>
      )}
      <p className="font-dm text-xs text-[#7A8FA6] mt-5">
        This page&apos;s address is your key. Don&apos;t share it; if you have, request a new link on the{" "}
        <a href="/tools/readiness-monitor" className="underline">Readiness Monitor page</a> and this one stops working.
      </p>
    </section>
  );
}
