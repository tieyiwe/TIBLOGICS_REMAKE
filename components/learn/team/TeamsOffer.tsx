"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fmtPrice } from "@/lib/learn/format";
import { useLocale, useT } from "@/lib/i18n/client";
import SeatBands from "./SeatBands";
import { quoteSeats, type SeatTier } from "@/lib/learn/team/config";
import { joinPath } from "@/lib/learn/join/choice";

/**
 * The Teams option: pick seats (at least the minimum), name the company, then
 * Stripe Checkout. mode "checkout" (signed-in) starts checkout; mode "link"
 * (public pages) sends the visitor to create an account first and brings
 * them back here with the seat count. Prices are display only: the server
 * recomputes them. Optional volume bands are read from /api/learn/team/pricing
 * and priced with the same quoteSeats() that checkout uses.
 */
export default function TeamsOffer({
  seatPriceCents,
  minSeats,
  mode,
  initialSeats,
  defaultOpen = false,
}: {
  seatPriceCents: number;
  minSeats: number;
  mode: "checkout" | "link";
  initialSeats?: number;
  defaultOpen?: boolean;
}) {
  const t = useT();
  const locale = useLocale();
  const [open, setOpen] = useState(defaultOpen);
  const [seats, setSeats] = useState(Math.max(minSeats, initialSeats ?? minSeats));
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [tiers, setTiers] = useState<SeatTier[]>([]);
  useEffect(() => {
    let live = true;
    fetch("/api/learn/team/pricing")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (live && d && Array.isArray(d.tiers)) setTiers(d.tiers);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);
  const quote = quoteSeats({ seatPriceCents, minSeats, tiers }, Number.isInteger(seats) ? seats : minSeats);
  const unit = quote.seatPriceCents;
  const total = quote.totalCents;
  const valid = Number.isInteger(seats) && seats >= minSeats && seats <= 500;
  // Public pages: the one-page join flow with the team plan preselected.
  const joinHref = joinPath({ kind: "team", seats: valid ? seats : minSeats });

  async function start(e: React.FormEvent) {
    e.preventDefault();
    if (!valid) return setError(t("team.offer.minError", { n: minSeats }));
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/learn/team/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seats, name }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) throw new Error(data.error ?? t("team.api.checkoutFailed"));
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : t("team.error.generic"));
      setBusy(false);
    }
  }

  const step = (d: number) => setSeats((s) => Math.min(500, Math.max(minSeats, (Number.isInteger(s) ? s : minSeats) + d)));

  return (
    <section id="teams" aria-labelledby="teams-title" className="scroll-mt-24 rounded-2xl border border-[var(--border)] bg-white p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--ink3)]">{t("team.offer.kicker")}</p>
          <h2 id="teams-title" className="mt-1 text-lg font-black text-[var(--ink)]">{t("team.offer.title")}</h2>
          <p className="mt-1 text-sm leading-relaxed text-[var(--ink2)]">
            {t("team.offer.blurb", { price: fmtPrice(seatPriceCents, locale), n: minSeats })}
          </p>
        </div>
        <p className="shrink-0 sm:text-right">
          <span className="text-2xl font-black text-[var(--ink)]">{fmtPrice(seatPriceCents, locale)}</span>
          <span className="block text-xs text-[var(--ink3)]">{t("team.offer.perSeat")}</span>
        </p>
      </div>
      {tiers.length > 0 && (
        <div className="mt-3">
          <SeatBands seatPriceCents={seatPriceCents} minSeats={minSeats} tiers={tiers} seats={open ? seats : undefined} />
        </div>
      )}
      <ul className="mt-4 grid gap-1.5 text-sm text-[var(--ink2)] sm:grid-cols-2">
        {[1, 2, 3, 4].map((n) => (
          <li key={n} className="flex gap-2">
            <span aria-hidden="true" className="font-bold text-[var(--orange)]">✓</span>
            {t(`team.offer.item.${n}`)}
          </li>
        ))}
      </ul>

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-5 w-full rounded-full bg-[var(--ink)] px-4 py-3 text-sm font-bold text-white hover:opacity-90 sm:w-auto"
        >
          {t("team.offer.cta")}
        </button>
      ) : (
        <form onSubmit={start} className="mt-5 grid gap-4 sm:grid-cols-[auto_1fr] sm:items-end">
          <div>
            <label htmlFor="team-seats" className="block text-sm font-semibold text-[var(--ink)]">{t("team.offer.seats")}</label>
            <div className="mt-1.5 flex items-center gap-2">
              <button type="button" onClick={() => step(-1)} aria-label={t("team.offer.fewer")} className="h-10 w-10 rounded-lg border border-[var(--border)] text-lg font-bold">−</button>
              <input
                id="team-seats"
                type="number"
                inputMode="numeric"
                min={minSeats}
                max={500}
                value={Number.isFinite(seats) ? seats : ""}
                onChange={(e) => setSeats(parseInt(e.target.value, 10))}
                className="h-10 w-20 rounded-lg border border-[var(--border)] text-center text-sm font-bold"
              />
              <button type="button" onClick={() => step(1)} aria-label={t("team.offer.more")} className="h-10 w-10 rounded-lg border border-[var(--border)] text-lg font-bold">+</button>
            </div>
          </div>
          {mode === "checkout" && (
            <div className="min-w-0">
              <label htmlFor="team-name" className="block text-sm font-semibold text-[var(--ink)]">{t("team.offer.company")}</label>
              <input
                id="team-name"
                required
                minLength={2}
                maxLength={80}
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="organization"
                className="mt-1.5 h-10 w-full rounded-lg border border-[var(--border)] px-3 text-sm"
              />
            </div>
          )}
          <p className="text-sm text-[var(--ink2)] sm:col-span-2" aria-live="polite">
            {valid
              ? t("team.offer.total", { n: seats, price: fmtPrice(unit, locale), total: fmtPrice(total, locale) })
              : t("team.offer.minError", { n: minSeats })}
          </p>
          <div className="sm:col-span-2">
            {mode === "link" ? (
              <Link
                href={joinHref}
                className="block w-full rounded-full bg-[var(--ink)] px-4 py-3 text-center text-sm font-bold text-white hover:opacity-90 sm:inline-block sm:w-auto sm:px-8"
              >
                {t("team.offer.createAccount")}
              </Link>
            ) : (
              <button
                type="submit"
                disabled={busy || !valid}
                className="w-full rounded-full bg-[var(--ink)] px-8 py-3 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50 sm:w-auto"
              >
                {busy ? t("team.offer.opening") : t("team.offer.checkout", { total: fmtPrice(total, locale) })}
              </button>
            )}
            {mode === "link" && (
              <p className="mt-2 text-xs text-[var(--ink3)]">
                {t("team.offer.haveAccount")}{" "}
                <Link href={`/learn/login?next=${encodeURIComponent(joinHref)}`} className="font-semibold underline">{t("team.offer.signIn")}</Link>
              </p>
            )}
          </div>
        </form>
      )}
      {error && (
        <p role="alert" className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}
      <p className="mt-4 text-xs text-[var(--ink3)]">{t("team.offer.fine")}</p>
    </section>
  );
}
