"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n/client";
import { api, ghostBtn, primaryBtn } from "@/components/learn/community/client-utils";
import { joinOpen, LIVE_LIMITS, rsvpOpen } from "@/lib/learn/live/shared";

// RSVP, cancel, add to calendar and (from 15 minutes before the start until
// the end) the join button. The meeting link is fetched on the click, which
// records attendance; it is never in the page before that.
export default function RsvpPanel({
  sessionId,
  startsAt,
  durationMinutes,
  status,
  mine,
  full,
}: {
  sessionId: string;
  startsAt: string;
  durationMinutes: number;
  status: string;
  mine: { status: "going" | "waitlist"; position: number; joined: boolean } | null;
  full: boolean;
}) {
  const t = useT();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  // Null on the server and the first render (no clock mismatch), then ticks.
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 20_000);
    return () => window.clearInterval(id);
  }, []);

  const timing = { startsAt, durationMinutes, status };
  const canJoin = now !== null && joinOpen(timing, now);
  const open = now === null ? status !== "ended" && status !== "cancelled" : rsvpOpen(timing, now);

  async function act(action: "rsvp" | "cancel") {
    if (action === "cancel" && !confirm(t(mine?.status === "waitlist" ? "live.leaveWaitlistConfirm" : "live.cancelConfirm"))) return;
    setBusy(true);
    setError(null);
    setNote(null);
    const r = await api<{ status?: string }>(`/api/learn/live/${sessionId}`, "POST", { action });
    setBusy(false);
    if (!r.ok) return setError(r.error);
    if (action === "rsvp") setNote(t(r.data.status === "waitlist" ? "live.rsvp.waitlisted" : "live.rsvp.done"));
    router.refresh();
  }

  async function join() {
    setBusy(true);
    setError(null);
    // Open the tab inside the click (popup blockers), then point it at the meeting.
    const tab = window.open("about:blank", "_blank");
    const r = await api<{ url: string; points: number }>(`/api/learn/live/${sessionId}`, "POST", { action: "join" });
    setBusy(false);
    if (!r.ok) {
      tab?.close();
      return setError(r.error);
    }
    if (tab) {
      tab.opener = null;
      tab.location.href = r.data.url;
    } else window.location.href = r.data.url;
    if (r.data.points > 0) setNote(t("live.join.xp", { n: r.data.points }));
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2" data-testid="rsvp-panel">
      {mine?.status === "going" && (
        <p role="status" className="rounded-lg bg-green-50 px-3 py-2 text-xs font-semibold text-green-800">
          ✓ {t("live.rsvp.going")}
          {mine.joined && ` · ${t("live.attended")}`}
        </p>
      )}
      {mine?.status === "waitlist" && (
        <p role="status" className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
          {t("live.rsvp.waitlist", { n: mine.position })}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {mine?.status === "going" && canJoin && (
          <button type="button" onClick={join} disabled={busy} className={primaryBtn} style={{ background: "#F47C20" }} data-testid="join-btn">
            {t("live.join")} ↗
          </button>
        )}
        {!mine && open && (
          <button type="button" onClick={() => act("rsvp")} disabled={busy} className={primaryBtn} data-testid="rsvp-btn">
            {full ? t("live.rsvp.joinWaitlist") : t("live.rsvp.cta")}
          </button>
        )}
        {mine && (
          <a href={`/api/learn/live/${sessionId}/ics`} className={ghostBtn} data-testid="ics-link">
            📅 {t("live.addToCalendar")}
          </a>
        )}
        {mine && open && (
          <button type="button" onClick={() => act("cancel")} disabled={busy} className={ghostBtn} data-testid="cancel-btn">
            {mine.status === "waitlist" ? t("live.rsvp.leaveWaitlist") : t("live.rsvp.cancel")}
          </button>
        )}
      </div>

      {mine?.status === "going" && !canJoin && open && now !== null && (
        <p className="text-xs text-[var(--ink3)]">{t("live.join.opensAt", { n: LIVE_LIMITS.joinEarlyMs / 60_000 })}</p>
      )}
      {!mine && canJoin && <p className="text-xs text-[var(--ink3)]">{t("live.join.rsvpFirst")}</p>}
      {note && (
        <p role="status" className="text-xs font-semibold text-green-800">
          {note}
        </p>
      )}
      {error && (
        <p role="alert" className="text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
