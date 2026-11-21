"use client";

import { useCallback, useEffect, useState } from "react";
import { FileSignature, Loader2 } from "lucide-react";

type Eng = { id: string; createdAt: string; createdBy: string; client: string; contactName: string | null; contactEmail: string | null; authorizedBy: string; scope: string[]; startsAt: string; endsAt: string; note: string | null; revokedAt: string | null };
const field = "w-full rounded-lg border border-[var(--a-border)] bg-[var(--a-surface)] px-3 py-2 font-dm text-sm text-[var(--a-ink)]";
const day = (d: Date) => d.toISOString().slice(0, 10);

export default function EngagementsClient() {
  const [list, setList] = useState<Eng[]>([]);
  const [f, setF] = useState({ client: "", contactName: "", contactEmail: "", authorizedBy: "", scope: "", startsAt: day(new Date()), endsAt: day(new Date(Date.now() + 30 * 86_400_000)), note: "" });
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const load = useCallback(async () => setList((await fetch("/api/admin/scanner-leads/cyber/engagements").then((r) => r.json()).catch(() => ({}))).engagements ?? []), []);
  useEffect(() => { void load(); }, [load]);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const r = await fetch("/api/admin/scanner-leads/cyber/engagements", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...f, startsAt: new Date(`${f.startsAt}T00:00:00`).toISOString(), endsAt: new Date(`${f.endsAt}T23:59:59`).toISOString(), confirm }) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return setMsg({ ok: false, text: j.error ?? "Could not save" });
    setMsg({ ok: true, text: `Saved. In scope: ${j.scope.join(", ")}` });
    setF({ ...f, client: "", contactName: "", contactEmail: "", authorizedBy: "", scope: "", note: "" });
    setConfirm(false);
    void load();
  }

  const status = (e: Eng) => (e.revokedAt ? "revoked" : new Date(e.endsAt) < new Date() ? "ended" : new Date(e.startsAt) > new Date() ? "not started" : "active");
  return (
    <div className="space-y-6">
      <form onSubmit={save} className="space-y-3 rounded-2xl border border-[var(--a-border)] bg-[var(--a-surface)] p-5" data-testid="engagement-form">
        <h2 className="flex items-center gap-2 font-syne text-base font-bold text-[var(--a-ink)]"><FileSignature size={18} aria-hidden /> New engagement</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="block"><span className="font-dm text-xs font-semibold">Client</span><input required name="client" value={f.client} onChange={set("client")} maxLength={160} className={`${field} mt-1`} /></label>
          <label className="block"><span className="font-dm text-xs font-semibold">Authorised by (name and role)</span><input required name="authorizedBy" value={f.authorizedBy} onChange={set("authorizedBy")} maxLength={200} placeholder="Jane Doe, Managing Director" className={`${field} mt-1`} /></label>
          <label className="block"><span className="font-dm text-xs font-semibold">Contact name</span><input name="contactName" value={f.contactName} onChange={set("contactName")} maxLength={120} className={`${field} mt-1`} /></label>
          <label className="block"><span className="font-dm text-xs font-semibold">Contact email</span><input type="email" name="contactEmail" value={f.contactEmail} onChange={set("contactEmail")} maxLength={254} className={`${field} mt-1`} /></label>
          <label className="block md:col-span-2"><span className="font-dm text-xs font-semibold">Domains in scope (comma or one per line; subdomains included)</span><textarea required name="scope" rows={2} value={f.scope} onChange={set("scope")} maxLength={2000} placeholder="client.com, client-shop.com" className={`${field} mt-1`} /></label>
          <label className="block"><span className="font-dm text-xs font-semibold">From</span><input type="date" required name="startsAt" value={f.startsAt} onChange={set("startsAt")} className={`${field} mt-1`} /></label>
          <label className="block"><span className="font-dm text-xs font-semibold">Until</span><input type="date" required name="endsAt" value={f.endsAt} onChange={set("endsAt")} className={`${field} mt-1`} /></label>
          <label className="block md:col-span-2"><span className="font-dm text-xs font-semibold">Note (where the signed authorisation is kept, limits agreed)</span><textarea name="note" rows={2} value={f.note} onChange={set("note")} maxLength={2000} className={`${field} mt-1`} /></label>
        </div>
        <label className="flex items-start gap-2 font-dm text-sm text-[var(--a-ink)]">
          <input type="checkbox" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} className="mt-1" data-testid="engagement-confirm" />
          <span>I confirm we hold the client&apos;s written authorisation to test these domains between these dates, and that the domains belong to them.</span>
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={busy || !confirm} className="inline-flex items-center gap-2 rounded-lg bg-[var(--a-orange)] px-4 py-2.5 font-dm text-sm font-semibold text-white disabled:opacity-50" data-testid="engagement-save">{busy && <Loader2 size={16} className="animate-spin" />} Save engagement</button>
          {msg && <p role="status" className={`font-dm text-sm ${msg.ok ? "text-green-700" : "text-red-600"}`}>{msg.text}</p>}
        </div>
      </form>

      <div className="overflow-hidden rounded-2xl border border-[var(--a-border)] bg-[var(--a-surface)]">
        <h2 className="border-b border-[var(--a-border)] px-5 py-3 font-syne text-base font-bold text-[var(--a-ink)]">Engagements</h2>
        {!list.length ? <p className="px-5 py-8 text-center font-dm text-sm text-[var(--a-ink-3)]">None yet.</p> : (
          <ul className="divide-y divide-[var(--a-border)]" data-testid="engagement-list">
            {list.map((e) => (
              <li key={e.id} className="flex flex-wrap items-start gap-3 px-5 py-3 font-dm text-sm">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[var(--a-ink)]">{e.client} <span className={`ml-1 rounded px-1.5 py-0.5 text-[11px] ${status(e) === "active" ? "bg-green-100 text-green-800" : "bg-[var(--a-surface-2)] text-[var(--a-ink-3)]"}`}>{status(e)}</span></p>
                  <p className="text-xs text-[var(--a-ink-3)]">{e.scope.join(", ")} · {new Date(e.startsAt).toLocaleDateString()} to {new Date(e.endsAt).toLocaleDateString()} · authorised by {e.authorizedBy} · recorded by {e.createdBy}</p>
                  {e.note && <p className="text-xs text-[var(--a-ink-3)]">{e.note}</p>}
                </div>
                {status(e) === "active" || status(e) === "not started" ? (
                  <button type="button" className="text-xs font-semibold text-red-700 hover:underline" onClick={async () => {
                    if (!window.confirm(`Revoke the engagement with ${e.client}? Active testing stops at once.`)) return;
                    await fetch(`/api/admin/scanner-leads/cyber/engagements/${e.id}`, { method: "DELETE" });
                    void load();
                  }}>Revoke</button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
