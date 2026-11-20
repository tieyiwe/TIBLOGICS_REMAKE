"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// Admin kit look (tokens from app/(admin)/admin.css).
const input =
  "mt-1 h-9 w-full rounded-[var(--a-radius-control)] border border-[var(--a-border-strong)] bg-[var(--a-surface)] px-3 font-dm text-[13.5px] font-normal text-[var(--a-ink)] focus:border-[var(--a-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--a-blue)]/20";
const btn =
  "inline-flex h-9 items-center justify-center rounded-[var(--a-radius-control)] bg-[var(--a-orange-text)] px-4 font-dm text-sm font-semibold text-white transition-colors duration-150 hover:bg-[#9c4408] disabled:opacity-60";

async function send(url: string, method: string, body: unknown) {
  const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Request failed");
  return data;
}

function useAction() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const run = async (fn: () => Promise<string>) => {
    setBusy(true);
    setMsg(null);
    try {
      setMsg(await fn());
      router.refresh();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(false);
    }
  };
  return { busy, msg, run };
}

/** Defaults for new teams, with the volume bands (price per seat by team size). */
export function DefaultsForm({ seatPriceCents, minSeats, tiers }: { seatPriceCents: number; minSeats: number; tiers: { minSeats: number; seatPriceCents: number }[] }) {
  const [price, setPrice] = useState((seatPriceCents / 100).toFixed(2));
  const [min, setMin] = useState(String(minSeats));
  const [bands, setBands] = useState(tiers.map((x) => ({ from: String(x.minSeats), price: (x.seatPriceCents / 100).toFixed(2) })));
  const { busy, msg, run } = useAction();
  const setBand = (i: number, k: "from" | "price", v: string) => setBands((b) => b.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  // "2 to 10 seats", "11 to 25 seats", "51+ seats": what each band covers, for the owner to read back.
  const sorted = bands.map((b) => ({ from: parseInt(b.from, 10), price: Number(b.price) })).filter((b) => Number.isInteger(b.from) && b.from > 1).sort((x, y) => x.from - y.from);
  const ranges = [{ from: parseInt(min, 10) || 1, price: Number(price) }, ...sorted].map((r, i, all) => {
    const next = all[i + 1];
    return `${r.from}${next ? ` to ${next.from - 1}` : "+"} seats: $${Number.isFinite(r.price) ? r.price.toFixed(2) : "?"}`;
  });
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void run(async () => {
          await send("/api/admin/learn/teams", "PUT", {
            seatPriceCents: Math.round(Number(price) * 100),
            minSeats: parseInt(min, 10),
            tiers: sorted.map((b) => ({ minSeats: b.from, seatPriceCents: Math.round(b.price * 100) })),
          });
          return "Saved. New team checkouts use these values.";
        });
      }}
      className="space-y-3"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-semibold">
          Base price per seat per month (USD)
          <input className={input} inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
        </label>
        <label className="text-sm font-semibold">
          Minimum seats
          <input className={input} type="number" min={1} value={min} onChange={(e) => setMin(e.target.value)} />
        </label>
      </div>
      <div>
        <p className="text-sm font-semibold">Volume bands</p>
        <p className="text-[12px] font-normal text-[var(--a-ink-3)]">From this many seats, every seat costs this price.</p>
        <div className="mt-2 space-y-2">
          {bands.map((b, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
              <label className="text-[12px] font-semibold">
                From seats
                <input className={input} type="number" min={2} value={b.from} onChange={(e) => setBand(i, "from", e.target.value)} />
              </label>
              <label className="text-[12px] font-semibold">
                Price per seat (USD)
                <input className={input} inputMode="decimal" value={b.price} onChange={(e) => setBand(i, "price", e.target.value)} />
              </label>
              <button type="button" className="h-9 px-2 text-[12px] font-semibold text-[var(--a-ink-3)] hover:text-red-600" onClick={() => setBands((x) => x.filter((_, j) => j !== i))}>
                Remove
              </button>
            </div>
          ))}
        </div>
        {bands.length < 10 && (
          <button type="button" className="mt-2 text-[12.5px] font-semibold text-[var(--a-blue)] hover:underline" onClick={() => setBands((x) => [...x, { from: "", price: "" }])}>
            + Add a band
          </button>
        )}
      </div>
      <ul className="rounded-[var(--a-radius-control)] bg-[var(--a-surface-2)] px-3 py-2 text-[12.5px] font-normal text-[var(--a-ink-2)]" data-testid="team-bands-preview">
        {ranges.map((r) => <li key={r}>{r}</li>)}
      </ul>
      <button className={btn} disabled={busy}>Save defaults</button>
      {msg && <p className="text-sm text-[var(--ink2)]">{msg}</p>}
    </form>
  );
}

/** Comp a new team: free seats for a partner or pilot. */
export function CompTeamForm() {
  const [name, setName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [seats, setSeats] = useState("10");
  const { busy, msg, run } = useAction();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void run(async () => {
          const d = await send("/api/admin/learn/teams", "POST", { name, ownerEmail, seats: parseInt(seats, 10) });
          window.location.href = `/admin_pro/learn/teams/${d.id}`;
          return "Created.";
        });
      }}
      className="grid gap-3 sm:grid-cols-[1fr_1fr_8rem_auto] sm:items-end"
    >
      <label className="text-sm font-semibold">
        Team name
        <input className={input} required value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label className="text-sm font-semibold">
        Owner (learner account email)
        <input className={input} type="email" required value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} />
      </label>
      <label className="text-sm font-semibold">
        Seats
        <input className={input} type="number" min={1} value={seats} onChange={(e) => setSeats(e.target.value)} />
      </label>
      <button className={btn} disabled={busy}>Comp team</button>
      {msg && <p className="text-sm text-[var(--ink2)] sm:col-span-4">{msg}</p>}
    </form>
  );
}

/** One team: comp, seats (comped), per-seat price. */
export function TeamAdminForm({
  id,
  comped,
  seats,
  seatPriceCents,
  defaultPriceCents,
  billed,
}: {
  id: string;
  comped: boolean;
  seats: number;
  seatPriceCents: number | null;
  defaultPriceCents: number;
  billed: boolean;
}) {
  const [seatCount, setSeatCount] = useState(String(seats));
  const [price, setPrice] = useState(seatPriceCents != null ? (seatPriceCents / 100).toFixed(2) : "");
  const { busy, msg, run } = useAction();
  const patch = (body: unknown, ok: string) =>
    run(async () => {
      const d = await send(`/api/admin/learn/teams/${id}`, "PATCH", body);
      return [ok, d.stripe].filter(Boolean).join(" ");
    });
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm">
          {comped ? "Comped: free seats, Stripe does not bill or change this team." : billed ? "Billed through Stripe." : "Not billed."}
        </span>
        <button
          type="button"
          className={btn}
          disabled={busy}
          onClick={() => {
            if (window.confirm(comped ? "Stop comping this team? It goes back to its Stripe subscription (or inactive)." : "Comp this team? Members keep access for free."))
              void patch({ comped: !comped }, comped ? "No longer comped." : "Team comped.");
          }}
        >
          {comped ? "Stop comping" : "Comp this team"}
        </button>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void patch({ seats: parseInt(seatCount, 10) }, "Seats saved.");
        }}
        className="flex flex-wrap items-end gap-3"
      >
        <label className="text-sm font-semibold">
          Seats {billed && !comped ? "(follow Stripe for paying teams)" : ""}
          <input className={`${input} w-28`} type="number" min={1} value={seatCount} onChange={(e) => setSeatCount(e.target.value)} disabled={billed && !comped} />
        </label>
        <button className={btn} disabled={busy || (billed && !comped)}>Save seats</button>
      </form>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const cents = price.trim() === "" ? null : Math.round(Number(price) * 100);
          void patch({ seatPriceCents: cents }, cents == null ? "Back to the default price." : "Seat price saved.");
        }}
        className="flex flex-wrap items-end gap-3"
      >
        <label className="text-sm font-semibold">
          Price per seat per month (USD, empty = default ${(defaultPriceCents / 100).toFixed(2)})
          <input className={`${input} w-40`} inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
        </label>
        <button className={btn} disabled={busy}>Save price</button>
      </form>
      {msg && <p className="rounded-lg bg-[var(--s2)] px-3 py-2 text-sm">{msg}</p>}
    </div>
  );
}
