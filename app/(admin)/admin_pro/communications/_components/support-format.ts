import type { BadgeTone } from "@/components/admin/ui";

// Labels for the learner support pages (admin is English).

export const STATUS_BADGE: Record<string, { label: string; tone: BadgeTone }> = {
  open: { label: "Open", tone: "orange" },
  answered: { label: "Answered", tone: "success" },
  closed: { label: "Closed", tone: "neutral" },
};

export const PRIORITY_BADGE: Record<string, { label: string; tone: BadgeTone }> = {
  urgent: { label: "Urgent", tone: "danger" },
  high: { label: "High", tone: "warn" },
  normal: { label: "Normal", tone: "neutral" },
  low: { label: "Low", tone: "info" },
};

/** "15 min", "3h", "2d": time since `d`, for the SLA age ("waiting 3h"). */
export function waitingFor(d: Date | string): string {
  const m = Math.max(0, Math.round((Date.now() - new Date(d).getTime()) / 60_000));
  if (m < 60) return `${m} min`;
  if (m < 48 * 60) return `${Math.round(m / 60)}h`;
  return `${Math.round(m / 1440)}d`;
}
