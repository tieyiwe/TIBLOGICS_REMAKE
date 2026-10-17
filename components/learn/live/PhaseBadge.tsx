import type { LivePhase } from "@/lib/learn/live/shared";
import type { T } from "@/lib/i18n/server";

const STYLE: Record<LivePhase, string> = {
  upcoming: "bg-blue-50 text-blue-800",
  live: "bg-red-50 text-red-700",
  past: "bg-[var(--s2)] text-[var(--ink2)]",
  cancelled: "bg-amber-50 text-amber-900",
};

/** Upcoming, live now, past or cancelled. */
export default function PhaseBadge({ phase, t }: { phase: LivePhase; t: T }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${STYLE[phase]}`}>
      {phase === "live" && <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-red-600" />}
      {t(`live.phase.${phase}`)}
    </span>
  );
}
