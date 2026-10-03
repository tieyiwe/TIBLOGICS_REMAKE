import { getT } from "@/lib/i18n/server";
import { BADGE_BY_ID, BADGES, TIER_COLORS, badgeDescKey, badgeHowKey, badgeNameKey } from "@/lib/learn/badge-defs";
import type { BadgeStatus } from "@/lib/learn/badges";
import type { T } from "@/lib/learn/format";

// Earned badges first, then the three closest to unlocking with a progress
// bar, then every badge (locked ones greyed, with how to earn them).
export default async function BadgeShelf({ badges }: { badges: BadgeStatus[] }) {
  const t = await getT();
  const earned = badges.filter((b) => b.earned);
  const order = new Map(BADGES.map((b, i) => [b.id, i]));
  const next = badges
    .filter((b) => !b.earned)
    .sort((a, b) => b.current / b.target - a.current / a.target || order.get(a.id)! - order.get(b.id)!)
    .slice(0, 3);

  return (
    <section aria-labelledby="badges-heading">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="badges-heading" className="text-lg font-bold text-[var(--ink)]">
          {t("game.badges.title")}
        </h2>
        <p className="text-xs font-semibold text-[var(--ink3)]">
          {t("game.badges.count", { n: earned.length, total: badges.length })}
        </p>
      </div>

      {earned.length === 0 ? (
        <p className="mt-3 rounded-2xl border border-dashed border-[var(--border)] bg-white p-5 text-sm text-[var(--ink2)]">
          {t("game.badges.none")}
        </p>
      ) : (
        <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {earned.map((b) => (
            <li key={b.id}>
              <BadgeTile status={b} t={t} />
            </li>
          ))}
        </ul>
      )}

      {next.length > 0 && (
        <>
          <h3 className="mt-6 text-sm font-bold text-[var(--ink)]">{t("game.badges.nextUp")}</h3>
          <ul className="mt-3 grid gap-3 sm:grid-cols-3">
            {next.map((b) => (
              <li key={b.id}>
                <BadgeTile status={b} t={t} showProgress />
              </li>
            ))}
          </ul>
        </>
      )}

      <details className="mt-4 rounded-2xl border border-[var(--border)] bg-white p-4">
        <summary className="cursor-pointer text-sm font-semibold text-[var(--ink)]">
          {t("game.badges.all", { n: badges.length })}
        </summary>
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {badges.map((b) => (
            <li key={b.id}>
              <BadgeTile status={b} t={t} showProgress={!b.earned} />
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}

function BadgeTile({
  status,
  t,
  showProgress = false,
}: {
  status: BadgeStatus;
  t: T;
  showProgress?: boolean;
}) {
  const def = BADGE_BY_ID.get(status.id)!;
  const ring = def.tier ? TIER_COLORS[def.tier] : "#F9A738";
  const pct = Math.round((status.current / status.target) * 100);
  const progressText =
    def.unit === "percent"
      ? t("game.badges.progressPct", { n: status.current, total: status.target })
      : t("game.badges.progress", { n: status.current, total: status.target });
  return (
    <div
      className={`flex h-full flex-col rounded-2xl border p-4 ${
        status.earned ? "border-[var(--border)] bg-white" : "border-dashed border-[var(--border)] bg-[var(--s2)]"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-2xl"
          style={
            status.earned
              ? { background: `${ring}22`, boxShadow: `inset 0 0 0 2px ${ring}` }
              : { background: "var(--s3)", filter: "grayscale(1)", opacity: 0.55 }
          }
        >
          {def.icon}
        </span>
        <div className="min-w-0">
          <p className={`text-sm font-bold ${status.earned ? "text-[var(--ink)]" : "text-[var(--ink2)]"}`}>
            {t(badgeNameKey(status.id))}
          </p>
          <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--ink3)]">
            {status.earned ? `✓ ${t("game.badges.earned")}` : `🔒 ${t("game.badges.locked")}`}
            {def.tier && ` · ${t(`game.tier.${def.tier}`)}`}
          </p>
        </div>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-[var(--ink2)]">
        {status.earned ? t(badgeDescKey(status.id)) : t(badgeHowKey(status.id))}
      </p>
      {showProgress && !status.earned && (
        <div className="mt-auto pt-3">
          <div
            className="h-1.5 overflow-hidden rounded-full bg-[var(--s3)]"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={status.target}
            aria-valuenow={status.current}
            aria-label={progressText}
          >
            <div className="h-full rounded-full bg-gradient-to-r from-[var(--orange)] to-[#F9A738]" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-1 text-[11px] text-[var(--ink3)]">{progressText}</p>
        </div>
      )}
    </div>
  );
}
