"use client";

import { useState } from "react";
import { Loader2, Play } from "lucide-react";

const field = "w-full rounded-lg border border-[var(--a-border)] bg-[var(--a-surface)] px-3 py-2 font-dm text-sm text-[var(--a-ink)]";
type Tool = "request" | "cors" | "paths" | "reflect" | "dns" | "tls";
const TOOLS: Array<{ id: Tool; name: string; desc: string; active: boolean }> = [
  { id: "request", name: "Request inspector", desc: "Send a GET, HEAD or OPTIONS with your own headers (e.g. a test account's cookie) and see the raw response.", active: true },
  { id: "cors", name: "CORS tester", desc: "Is this origin trusted by the site, with or without credentials?", active: true },
  { id: "paths", name: "Path probe", desc: "Status, type and size for up to 30 paths (one per line).", active: true },
  { id: "reflect", name: "Reflection test", desc: "Sends harmless HTML in one parameter and shows whether it comes back encoded (cross-site scripting indicator).", active: true },
  { id: "dns", name: "DNS and email security", desc: "Addresses, MX, name servers, SPF, DMARC, CAA and MTA-STS of any domain.", active: false },
  { id: "tls", name: "TLS inspector", desc: "Certificate, protocol, old TLS versions and the HTTP redirect of any domain.", active: false },
];

export default function ToolsClient() {
  const [tool, setTool] = useState<Tool>("request");
  const [v, setV] = useState({ url: "", method: "GET", headers: "", follow: false, origin: "https://evil.example", paths: "/admin\n/.env\n/backup.zip", param: "q", domain: "" });
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState<unknown>(null);
  const [err, setErr] = useState<string | null>(null);
  const t = TOOLS.find((x) => x.id === tool)!;

  async function run(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    setOut(null);
    const r = await fetch("/api/admin/scanner-leads/cyber/tools", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tool, ...v }) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) setErr(j.error ?? "Failed");
    else setOut(j);
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
      <ul className="space-y-1" role="tablist" aria-label="Tools">
        {TOOLS.map((x) => (
          <li key={x.id}>
            <button type="button" role="tab" aria-selected={tool === x.id} onClick={() => { setTool(x.id); setOut(null); setErr(null); }} className={`w-full rounded-lg px-3 py-2 text-left font-dm text-sm ${tool === x.id ? "bg-[var(--a-ink)] text-white" : "bg-[var(--a-surface)] text-[var(--a-ink)] hover:bg-[var(--a-surface-2)]"}`} data-testid={`tool-${x.id}`}>
              <span className="font-semibold">{x.name}</span>
              <span className={`ml-1 text-[10px] uppercase ${tool === x.id ? "text-white/70" : "text-[var(--a-ink-3)]"}`}>{x.active ? "engagement" : "passive"}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="space-y-4">
        <form onSubmit={run} className="space-y-3 rounded-2xl border border-[var(--a-border)] bg-[var(--a-surface)] p-5" data-testid="tool-form">
          <p className="font-dm text-sm text-[var(--a-ink-2)]">{t.desc}</p>
          {tool === "dns" || tool === "tls" ? (
            <label className="block"><span className="font-dm text-xs font-semibold">Domain</span><input required name="domain" value={v.domain} onChange={(e) => setV({ ...v, domain: e.target.value })} placeholder="client.com" className={`${field} mt-1`} /></label>
          ) : (
            <label className="block"><span className="font-dm text-xs font-semibold">URL (inside an active engagement)</span><input required name="url" value={v.url} onChange={(e) => setV({ ...v, url: e.target.value })} placeholder="https://client.com/page" className={`${field} mt-1`} /></label>
          )}
          {tool === "request" && (
            <div className="grid gap-3 md:grid-cols-[140px_1fr]">
              <label className="block"><span className="font-dm text-xs font-semibold">Method</span><select name="method" value={v.method} onChange={(e) => setV({ ...v, method: e.target.value })} className={`${field} mt-1`}><option>GET</option><option>HEAD</option><option>OPTIONS</option></select></label>
              <label className="block"><span className="font-dm text-xs font-semibold">Extra headers (Name: value, one per line)</span><textarea name="headers" rows={3} value={v.headers} onChange={(e) => setV({ ...v, headers: e.target.value })} className={`${field} mt-1 font-mono text-xs`} /></label>
              <label className="flex items-center gap-2 font-dm text-sm md:col-span-2"><input type="checkbox" checked={v.follow} onChange={(e) => setV({ ...v, follow: e.target.checked })} /> Follow redirects</label>
            </div>
          )}
          {tool === "cors" && <label className="block"><span className="font-dm text-xs font-semibold">Origin to test</span><input name="origin" value={v.origin} onChange={(e) => setV({ ...v, origin: e.target.value })} className={`${field} mt-1`} /></label>}
          {tool === "paths" && <label className="block"><span className="font-dm text-xs font-semibold">Paths</span><textarea name="paths" rows={6} value={v.paths} onChange={(e) => setV({ ...v, paths: e.target.value })} className={`${field} mt-1 font-mono text-xs`} /></label>}
          {tool === "reflect" && <label className="block"><span className="font-dm text-xs font-semibold">Parameter name</span><input name="param" value={v.param} onChange={(e) => setV({ ...v, param: e.target.value })} className={`${field} mt-1`} /></label>}
          <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-[var(--a-orange)] px-4 py-2.5 font-dm text-sm font-semibold text-white disabled:opacity-50" data-testid="tool-run">
            {busy ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <Play size={16} aria-hidden />} Run
          </button>
        </form>
        {err && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 font-dm text-sm text-red-800" data-testid="tool-error">{err}</p>}
        {out !== null && <pre className="max-h-[520px] overflow-auto rounded-2xl bg-[#0D1B2A] p-4 font-mono text-[12px] leading-relaxed text-[#E4EAF2]" data-testid="tool-output">{JSON.stringify(out, null, 2)}</pre>}
      </div>
    </div>
  );
}
