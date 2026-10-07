"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

// Admin kit look (tokens from app/(admin)/admin.css).
const input =
  "mt-1 h-9 w-full rounded-[var(--a-radius-control)] border border-[var(--a-border-strong)] bg-[var(--a-surface)] px-3 font-dm text-[13.5px] font-normal text-[var(--a-ink)] focus:border-[var(--a-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--a-blue)]/20";
const area =
  "mt-1 w-full rounded-[var(--a-radius-control)] border border-[var(--a-border-strong)] bg-[var(--a-surface)] px-3 py-2 font-dm text-[13.5px] font-normal text-[var(--a-ink)] focus:border-[var(--a-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--a-blue)]/20";
const btn =
  "inline-flex h-9 items-center justify-center rounded-[var(--a-radius-control)] bg-[var(--a-orange-text)] px-4 font-dm text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#9c4408] disabled:opacity-60";
const ghost =
  "inline-flex h-9 items-center justify-center rounded-[var(--a-radius-control)] border border-[var(--a-border-strong)] bg-[var(--a-surface)] px-3 font-dm text-[13px] font-semibold text-[var(--a-ink)] hover:bg-[var(--a-surface-2)] disabled:opacity-60";
const danger =
  "inline-flex h-9 items-center justify-center rounded-[var(--a-radius-control)] border border-red-300 bg-[var(--a-surface)] px-3 font-dm text-[13px] font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60";
const label = "block font-dm text-[13px] font-semibold text-[var(--a-ink)]";
const hint = "mt-0.5 font-dm text-[12px] font-normal text-[var(--a-ink-3)]";

async function send(url: string, method: string, body?: unknown) {
  const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body ?? {}) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Request failed");
  return data;
}

function useAction() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const run = async (fn: () => Promise<string>) => {
    setBusy(true);
    setMsg(null);
    try {
      setMsg({ ok: true, text: await fn() });
      router.refresh();
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : "Failed" });
    } finally {
      setBusy(false);
    }
  };
  return { busy, msg, run };
}

function Msg({ msg }: { msg: { ok: boolean; text: string } | null }) {
  if (!msg) return null;
  return (
    <p role={msg.ok ? "status" : "alert"} className={`mt-2 rounded-md px-3 py-2 font-dm text-[13px] ${msg.ok ? "bg-emerald-50 text-emerald-900" : "bg-red-50 text-red-700"}`}>
      {msg.text}
    </p>
  );
}

export interface TrackOption {
  id: string;
  title: string;
  priceCents: number;
}

const usd = (c: number) => `$${(c / 100).toLocaleString("en-US", { minimumFractionDigits: c % 100 ? 2 : 0, maximumFractionDigits: 2 })}`;
const LANGS = [
  { v: "en", l: "English" },
  { v: "fr", l: "French" },
  { v: "sw", l: "Swahili" },
];

type Recipient = { name: string; email: string; locale: string };

/** "Name, email" / "Name <email>" / "email" per line → recipients. */
function parseList(text: string): Recipient[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const email = line.match(/[^\s<>,;]+@[^\s<>,;]+/)?.[0] ?? "";
      const name = line.replace(email, "").replace(/[<>,;\t]/g, " ").replace(/\s+/g, " ").trim();
      return { name: name || email.split("@")[0], email, locale: "en" };
    });
}

/** Coverage: quick choices plus an exact percentage (100 = free). */
function CoverageInput({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div>
      <div className="mt-1 flex flex-wrap gap-2">
        {[25, 50, 75, 100].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            aria-pressed={value === n}
            className={`h-9 rounded-full border px-3 font-dm text-[13px] font-semibold ${value === n ? "border-[var(--a-orange-text)] bg-[#FFF1E3] text-[var(--a-orange-text)]" : "border-[var(--a-border-strong)] text-[var(--a-ink)]"}`}
          >
            {n === 100 ? "100% · Free" : `${n}%`}
          </button>
        ))}
        <label className="flex items-center gap-1.5 font-dm text-[13px] text-[var(--a-ink-2)]">
          or
          <input
            type="number"
            min={1}
            max={100}
            value={value}
            onChange={(e) => onChange(Math.max(1, Math.min(100, parseInt(e.target.value, 10) || 1)))}
            className="h-9 w-20 rounded-[var(--a-radius-control)] border border-[var(--a-border-strong)] bg-[var(--a-surface)] px-2 font-dm text-[13.5px]"
            aria-label="Coverage percentage"
          />
          %
        </label>
      </div>
      <input type="range" min={1} max={100} value={value} onChange={(e) => onChange(parseInt(e.target.value, 10))} className="mt-2 w-full accent-[#C2570C]" aria-label="Coverage slider" />
    </div>
  );
}

/** Award the scholarship to one or more people: each becomes a draft to review. */
export function AwardForm({ tracks }: { tracks: TrackOption[] }) {
  const [rows, setRows] = useState<Recipient[]>([{ name: "", email: "", locale: "en" }]);
  const [paste, setPaste] = useState<string | null>(null);
  const [count, setCount] = useState(1);
  const [pct, setPct] = useState(100);
  const [limit, setLimit] = useState(false);
  const [chosen, setChosen] = useState<string[]>([]);
  const [days, setDays] = useState(30);
  const [message, setMessage] = useState("");
  const [note, setNote] = useState("");
  const { busy, msg, run } = useAction();

  const pool = limit ? tracks.filter((t) => chosen.includes(t.id)) : tracks;
  const maxCount = Math.max(1, pool.length);
  // Most it can be worth to one person: the dearest tracks it can be used on.
  const worth = useMemo(
    () => [...pool].sort((a, b) => b.priceCents - a.priceCents).slice(0, count).reduce((n, t) => n + Math.round((t.priceCents * pct) / 100), 0),
    [pool, count, pct],
  );
  const setRow = (i: number, k: keyof Recipient, v: string) => setRows((r) => r.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  const filled = rows.filter((r) => r.email.trim());

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void run(async () => {
          const r = await send("/api/admin/learn/scholarships", "POST", {
            recipients: filled.map((x) => ({ name: x.name.trim(), email: x.email.trim(), locale: x.locale })),
            trackCount: count,
            coveragePct: pct,
            trackIds: limit ? chosen : [],
            message: message.trim() || null,
            note: note.trim() || null,
            offerDays: days,
          });
          const skipped = (r.skipped as Array<{ email: string; reason: string }>).map((s) => `${s.email}: ${s.reason}`);
          if (r.created.length) setRows([{ name: "", email: "", locale: "en" }]);
          return `${r.created.length} draft${r.created.length === 1 ? "" : "s"} created for review below. Nothing is sent until you approve.${skipped.length ? ` Skipped: ${skipped.join("; ")}.` : ""}`;
        });
      }}
      className="space-y-5"
      data-testid="award-form"
    >
      <fieldset>
        <legend className={label}>Recipients</legend>
        <p className={hint}>Their ARFA account must use this email to accept the scholarship.</p>
        {paste === null ? (
          <div className="mt-2 space-y-2">
            {rows.map((r, i) => (
              <div key={i} className="grid grid-cols-1 gap-2 rounded-lg border border-[var(--a-border)] p-2 sm:grid-cols-[1fr_1.3fr_120px_auto] sm:border-0 sm:p-0">
                <input className={input + " mt-0"} placeholder="Full name" value={r.name} onChange={(e) => setRow(i, "name", e.target.value)} aria-label={`Recipient ${i + 1} name`} />
                <input className={input + " mt-0"} type="email" placeholder="email@example.com" value={r.email} onChange={(e) => setRow(i, "email", e.target.value)} aria-label={`Recipient ${i + 1} email`} />
                <select className={input + " mt-0"} value={r.locale} onChange={(e) => setRow(i, "locale", e.target.value)} aria-label={`Recipient ${i + 1} email language`}>
                  {LANGS.map((x) => <option key={x.v} value={x.v}>{x.l}</option>)}
                </select>
                <button type="button" className={ghost} disabled={rows.length === 1} onClick={() => setRows((rr) => rr.filter((_, j) => j !== i))} aria-label={`Remove recipient ${i + 1}`}>
                  Remove
                </button>
              </div>
            ))}
            <div className="flex flex-wrap gap-2">
              <button type="button" className={ghost} onClick={() => setRows((r) => [...r, { name: "", email: "", locale: "en" }])} disabled={rows.length >= 50}>
                + Add recipient
              </button>
              <button type="button" className={ghost} onClick={() => setPaste("")}>Paste a list</button>
            </div>
          </div>
        ) : (
          <div className="mt-2">
            <textarea className={area} rows={5} value={paste} onChange={(e) => setPaste(e.target.value)} placeholder={"Ama Mensah, ama@example.com\nJean Dupont <jean@example.fr>"} aria-label="Recipients list" />
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                className={ghost}
                onClick={() => {
                  const list = parseList(paste).slice(0, 50);
                  if (list.length) setRows(list);
                  setPaste(null);
                }}
              >
                Use this list
              </button>
              <button type="button" className={ghost} onClick={() => setPaste(null)}>Cancel</button>
            </div>
          </div>
        )}
      </fieldset>

      <div className="grid gap-5 lg:grid-cols-2">
        <div>
          <span className={label}>Coverage</span>
          <p className={hint}>Share of each track’s price the scholarship pays. 100% means free.</p>
          <CoverageInput value={pct} onChange={setPct} />
        </div>
        <label className={label}>
          Number of tracks
          <p className={hint}>How many tracks each recipient can unlock with it.</p>
          <input className={input} type="number" min={1} max={maxCount} value={count} onChange={(e) => setCount(Math.max(1, Math.min(maxCount, parseInt(e.target.value, 10) || 1)))} />
        </label>
      </div>

      <fieldset>
        <legend className={label}>Which tracks</legend>
        <div className="mt-1 flex flex-wrap gap-4 font-dm text-[13.5px]">
          <label className="flex items-center gap-2"><input type="radio" checked={!limit} onChange={() => setLimit(false)} /> Any live track (the recipient chooses)</label>
          <label className="flex items-center gap-2"><input type="radio" checked={limit} onChange={() => setLimit(true)} /> Only tracks I choose</label>
        </div>
        {limit && (
          <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
            {tracks.map((t) => (
              <label key={t.id} className="flex items-start gap-2 rounded-md border border-[var(--a-border)] px-3 py-2 font-dm text-[13px]">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={chosen.includes(t.id)}
                  onChange={(e) => setChosen((c) => (e.target.checked ? [...c, t.id] : c.filter((x) => x !== t.id)))}
                />
                <span className="min-w-0">
                  <span className="block break-words font-semibold text-[var(--a-ink)]">{t.title}</span>
                  <span className="text-[var(--a-ink-3)]">{usd(t.priceCents)}</span>
                </span>
              </label>
            ))}
          </div>
        )}
      </fieldset>

      <div className="grid gap-5 lg:grid-cols-2">
        <label className={label}>
          Personal message (optional)
          <p className={hint}>Shown in the congratulations email, under the award.</p>
          <textarea className={area} rows={3} maxLength={1000} value={message} onChange={(e) => setMessage(e.target.value)} />
        </label>
        <div className="space-y-4">
          <label className={label}>
            Offer valid for (days)
            <p className={hint}>Time to accept after the email is sent. You can resend later.</p>
            <input className={input} type="number" min={3} max={180} value={days} onChange={(e) => setDays(Math.max(3, Math.min(180, parseInt(e.target.value, 10) || 30)))} />
          </label>
          <label className={label}>
            Internal note (staff only)
            <input className={input} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Partner nomination, cohort Nov 2026" />
          </label>
        </div>
      </div>

      <div className="rounded-lg border border-[#F4C9A0] bg-[#FFFBF6] px-4 py-3 font-dm text-[13px] text-[var(--a-ink)]">
        Each recipient: <strong>{count} track{count === 1 ? "" : "s"}</strong> at <strong>{pct >= 100 ? "100% (free)" : `${pct}% covered`}</strong>
        {limit ? ` from ${chosen.length} chosen track${chosen.length === 1 ? "" : "s"}` : " from any live track"}. Worth up to <strong>{usd(worth)}</strong> per person.
        Individual tracks only: never team plans or the monthly plan.
      </div>

      <div>
        <button type="submit" className={btn} disabled={busy || filled.length === 0 || (limit && chosen.length < count)}>
          {busy ? "Creating…" : `Create ${filled.length > 1 ? `${filled.length} drafts` : "draft"} for review`}
        </button>
        {limit && chosen.length < count && <p className={hint}>Choose at least {count} track{count === 1 ? "" : "s"}.</p>}
        <Msg msg={msg} />
      </div>
    </form>
  );
}

/** Approve a reviewed draft: emails the congratulations with the link. */
export function ApproveButton({ id, name }: { id: string; name: string }) {
  const { busy, msg, run } = useAction();
  return (
    <div>
      <button
        type="button"
        className={btn}
        disabled={busy}
        data-testid="approve"
        onClick={() => {
          if (!window.confirm(`Approve and email the Tilo Vision Scholarship to ${name}?`)) return;
          void run(async () => {
            const r = await send(`/api/admin/learn/scholarships/${id}`, "POST", { action: "approve" });
            return r.emailed ? "Approved. The congratulations email is on its way." : "Approved, but the email could not be sent. Use Resend.";
          });
        }}
      >
        {busy ? "Sending…" : "Approve and send"}
      </button>
      <Msg msg={msg} />
    </div>
  );
}

export function ApproveAll({ ids }: { ids: string[] }) {
  const { busy, msg, run } = useAction();
  if (ids.length < 2) return null;
  return (
    <div>
      <button
        type="button"
        className={ghost}
        disabled={busy}
        onClick={() => {
          if (!window.confirm(`Approve all ${ids.length} drafts and email each recipient?`)) return;
          void run(async () => {
            let ok = 0;
            const failed: string[] = [];
            for (const id of ids) {
              try {
                const r = await send(`/api/admin/learn/scholarships/${id}`, "POST", { action: "approve" });
                if (r.emailed) ok++;
                else failed.push("email not sent");
              } catch (err) {
                failed.push(err instanceof Error ? err.message : "failed");
              }
            }
            return `${ok} approved and emailed.${failed.length ? ` ${failed.length} need attention: ${failed.join("; ")}.` : ""}`;
          });
        }}
      >
        {busy ? "Approving…" : `Approve all ${ids.length}`}
      </button>
      <Msg msg={msg} />
    </div>
  );
}

export interface EditableScholarship {
  id: string;
  status: string;
  name: string;
  email: string;
  locale: string;
  trackCount: number;
  coveragePct: number;
  trackIds: string[];
  message: string | null;
  note: string | null;
  offerDays: number;
  used: number;
}

/** Edit a draft (everything) or an approved/accepted award (tracks and note). */
export function EditScholarship({ s, tracks }: { s: EditableScholarship; tracks: TrackOption[] }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState(s);
  const { busy, msg, run } = useAction();
  const draft = s.status === "draft";
  const set = <K extends keyof EditableScholarship>(k: K, v: EditableScholarship[K]) => setF((x) => ({ ...x, [k]: v }));
  if (!open) return <button type="button" className={ghost} onClick={() => setOpen(true)}>Edit</button>;
  return (
    <form
      className="mt-3 w-full space-y-3 rounded-lg border border-[var(--a-border)] bg-[var(--a-surface-2)] p-3"
      onSubmit={(e) => {
        e.preventDefault();
        void run(async () => {
          const body: Record<string, unknown> = { trackCount: f.trackCount, trackIds: f.trackIds, note: f.note };
          if (draft) Object.assign(body, { name: f.name, email: f.email, locale: f.locale, coveragePct: f.coveragePct, message: f.message, offerDays: f.offerDays });
          await send(`/api/admin/learn/scholarships/${s.id}`, "PATCH", body);
          setOpen(false);
          return "Saved.";
        });
      }}
    >
      {draft && (
        <div className="grid gap-3 sm:grid-cols-3">
          <label className={label}>Name<input className={input} value={f.name} onChange={(e) => set("name", e.target.value)} /></label>
          <label className={label}>Email<input className={input} type="email" value={f.email} onChange={(e) => set("email", e.target.value)} /></label>
          <label className={label}>
            Email language
            <select className={input} value={f.locale} onChange={(e) => set("locale", e.target.value)}>
              {LANGS.map((x) => <option key={x.v} value={x.v}>{x.l}</option>)}
            </select>
          </label>
        </div>
      )}
      {draft && (
        <div>
          <span className={label}>Coverage</span>
          <CoverageInput value={f.coveragePct} onChange={(n) => set("coveragePct", n)} />
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={label}>
          Number of tracks
          {!draft && <p className={hint}>Not below the {s.used} already used.</p>}
          <input className={input} type="number" min={Math.max(1, s.used)} max={20} value={f.trackCount} onChange={(e) => set("trackCount", parseInt(e.target.value, 10) || 1)} />
        </label>
        {draft && (
          <label className={label}>
            Offer valid for (days)
            <input className={input} type="number" min={3} max={180} value={f.offerDays} onChange={(e) => set("offerDays", parseInt(e.target.value, 10) || 30)} />
          </label>
        )}
      </div>
      <details>
        <summary className="cursor-pointer font-dm text-[13px] font-semibold text-[var(--a-ink)]">
          Tracks it can be used on: {f.trackIds.length ? `${f.trackIds.length} chosen` : "any live track"}
        </summary>
        <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
          {tracks.map((t) => (
            <label key={t.id} className="flex items-center gap-2 font-dm text-[13px]">
              <input
                type="checkbox"
                checked={f.trackIds.includes(t.id)}
                onChange={(e) => set("trackIds", e.target.checked ? [...f.trackIds, t.id] : f.trackIds.filter((x) => x !== t.id))}
              />
              <span className="break-words">{t.title}</span>
            </label>
          ))}
        </div>
        <p className={hint}>None ticked = any live track.</p>
      </details>
      {draft && (
        <label className={label}>
          Personal message
          <textarea className={area} rows={3} maxLength={1000} value={f.message ?? ""} onChange={(e) => set("message", e.target.value)} />
        </label>
      )}
      <label className={label}>
        Internal note
        <input className={input} maxLength={1000} value={f.note ?? ""} onChange={(e) => set("note", e.target.value)} />
      </label>
      <div className="flex flex-wrap gap-2">
        <button type="submit" className={btn} disabled={busy}>{busy ? "Saving…" : "Save"}</button>
        <button type="button" className={ghost} onClick={() => { setOpen(false); setF(s); }}>Cancel</button>
      </div>
      <Msg msg={msg} />
    </form>
  );
}

export function DeleteDraft({ id }: { id: string }) {
  const { busy, msg, run } = useAction();
  return (
    <div>
      <button
        type="button"
        className={danger}
        disabled={busy}
        onClick={() => {
          if (!window.confirm("Delete this draft? Nothing was sent.")) return;
          void run(async () => {
            await send(`/api/admin/learn/scholarships/${id}`, "DELETE");
            return "Deleted.";
          });
        }}
      >
        Delete
      </button>
      <Msg msg={msg} />
    </div>
  );
}

/** Resend (approved, not accepted) and revoke (approved or accepted). */
export function AwardActions({ id, status, freeTracks }: { id: string; status: string; freeTracks: number }) {
  const { busy, msg, run } = useAction();
  const [revoking, setRevoking] = useState(false);
  const [removeFree, setRemoveFree] = useState(false);
  return (
    <div className="flex flex-col items-start gap-2">
      <div className="flex flex-wrap gap-2">
        {status === "approved" && (
          <button
            type="button"
            className={ghost}
            disabled={busy}
            onClick={() =>
              void run(async () => {
                const r = await send(`/api/admin/learn/scholarships/${id}`, "POST", { action: "resend" });
                return r.emailed ? "Sent again with a new link and a fresh offer period. The old link no longer works." : "The email could not be sent. Check the mail settings and try again.";
              })
            }
          >
            Resend email
          </button>
        )}
        {(status === "approved" || status === "claimed") && !revoking && (
          <button type="button" className={danger} onClick={() => setRevoking(true)}>Revoke</button>
        )}
      </div>
      {revoking && (
        <div className="w-full rounded-lg border border-red-200 bg-red-50 p-3 font-dm text-[13px] text-red-900">
          <p>Revoking stops the link and any further track choices.</p>
          {freeTracks > 0 && (
            <label className="mt-2 flex items-start gap-2">
              <input type="checkbox" className="mt-0.5" checked={removeFree} onChange={(e) => setRemoveFree(e.target.checked)} />
              Also remove the {freeTracks} free track{freeTracks === 1 ? "" : "s"} unlocked with it (tracks the learner paid for always stay).
            </label>
          )}
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              className={danger}
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  const r = await send(`/api/admin/learn/scholarships/${id}`, "POST", { action: "revoke", removeFree });
                  setRevoking(false);
                  return `Revoked.${r.removed ? ` ${r.removed} free track${r.removed === 1 ? "" : "s"} removed.` : ""}`;
                })
              }
            >
              {busy ? "Revoking…" : "Confirm revoke"}
            </button>
            <button type="button" className={ghost} onClick={() => setRevoking(false)}>Cancel</button>
          </div>
        </div>
      )}
      <Msg msg={msg} />
    </div>
  );
}
