"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// Create or edit a cohort (admin, English).

export interface CohortFormValue {
  trackId: string;
  name: string;
  startDate: string;
  endDate: string;
  sessionWeekday: number;
  sessionTime: string;
  timezone: string;
  sessionMinutes: number;
  meetingUrl: string;
  capacity: number;
  enrolmentOpen: boolean;
  priceNote: string;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const ZONES = ["Africa/Nairobi", "Africa/Lagos", "Africa/Johannesburg", "Africa/Kinshasa", "Africa/Dakar", "Africa/Abidjan", "Europe/London", "Europe/Paris", "America/New_York", "America/Chicago", "America/Los_Angeles", "UTC"];

const input = "w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm";

export default function CohortForm({
  tracks,
  initial,
  cohortId,
}: {
  tracks: Array<{ id: string; title: string }>;
  initial?: CohortFormValue;
  cohortId?: string;
}) {
  const router = useRouter();
  const [v, setV] = useState<CohortFormValue>(
    initial ?? {
      trackId: tracks[0]?.id ?? "",
      name: "",
      startDate: "",
      endDate: "",
      sessionWeekday: 2,
      sessionTime: "18:00",
      timezone: "Africa/Nairobi",
      sessionMinutes: 60,
      meetingUrl: "",
      capacity: 30,
      enrolmentOpen: true,
      priceNote: "",
    },
  );
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const set = <K extends keyof CohortFormValue>(k: K, val: CohortFormValue[K]) => setV((x) => ({ ...x, [k]: val }));

  async function save() {
    setBusy(true);
    setMsg(null);
    const res = await fetch(cohortId ? `/api/admin/learn/cohorts/${cohortId}` : "/api/admin/learn/cohorts", {
      method: cohortId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(v),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setMsg({ ok: false, text: data.error ?? "Save failed" });
    if (!cohortId && data.id) return router.push(`/admin_pro/learn/cohorts/${data.id}`);
    setMsg({ ok: true, text: "Saved." });
    router.refresh();
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="text-xs font-semibold text-[var(--ink2)]">
        Track
        <select value={v.trackId} disabled={!!cohortId} onChange={(e) => set("trackId", e.target.value)} className={`${input} mt-1`}>
          {tracks.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>
      </label>
      <label className="text-xs font-semibold text-[var(--ink2)]">
        Cohort name
        <input value={v.name} onChange={(e) => set("name", e.target.value)} placeholder="January 2027 evening cohort" className={`${input} mt-1`} />
      </label>
      <label className="text-xs font-semibold text-[var(--ink2)]">
        Start date
        <input type="date" value={v.startDate} onChange={(e) => set("startDate", e.target.value)} className={`${input} mt-1`} />
      </label>
      <label className="text-xs font-semibold text-[var(--ink2)]">
        End date
        <input type="date" value={v.endDate} onChange={(e) => set("endDate", e.target.value)} className={`${input} mt-1`} />
      </label>
      <label className="text-xs font-semibold text-[var(--ink2)]">
        Weekly live session day
        <select value={v.sessionWeekday} onChange={(e) => set("sessionWeekday", Number(e.target.value))} className={`${input} mt-1`}>
          {DAYS.map((d, i) => (
            <option key={d} value={i}>
              {d}
            </option>
          ))}
        </select>
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-xs font-semibold text-[var(--ink2)]">
          Time (24h)
          <input type="time" value={v.sessionTime} onChange={(e) => set("sessionTime", e.target.value)} className={`${input} mt-1`} />
        </label>
        <label className="text-xs font-semibold text-[var(--ink2)]">
          Minutes
          <input type="number" min={15} max={480} value={v.sessionMinutes} onChange={(e) => set("sessionMinutes", Number(e.target.value))} className={`${input} mt-1`} />
        </label>
      </div>
      <label className="text-xs font-semibold text-[var(--ink2)]">
        Time zone (IANA)
        <input list="tz-list" value={v.timezone} onChange={(e) => set("timezone", e.target.value)} className={`${input} mt-1`} />
        <datalist id="tz-list">
          {ZONES.map((z) => (
            <option key={z} value={z} />
          ))}
        </datalist>
      </label>
      <label className="text-xs font-semibold text-[var(--ink2)]">
        Meeting link (members only)
        <input value={v.meetingUrl} onChange={(e) => set("meetingUrl", e.target.value)} placeholder="https://meet.google.com/..." className={`${input} mt-1`} />
      </label>
      <label className="text-xs font-semibold text-[var(--ink2)]">
        Capacity
        <input type="number" min={1} value={v.capacity} onChange={(e) => set("capacity", Number(e.target.value))} className={`${input} mt-1`} />
      </label>
      <label className="text-xs font-semibold text-[var(--ink2)]">
        Price note (optional, shown to learners)
        <input value={v.priceNote} onChange={(e) => set("priceNote", e.target.value)} placeholder="Included with your plan" className={`${input} mt-1`} />
      </label>
      <label className="flex items-center gap-2 text-sm font-semibold text-[var(--ink)]">
        <input type="checkbox" checked={v.enrolmentOpen} onChange={(e) => set("enrolmentOpen", e.target.checked)} />
        Enrolment open
      </label>
      <div className="flex items-center gap-3 sm:col-span-2">
        <button onClick={save} disabled={busy} className="rounded-lg bg-[var(--ink)] px-4 py-2 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50">
          {busy ? "Saving…" : cohortId ? "Save changes" : "Create cohort"}
        </button>
        {msg && <span className={`text-sm ${msg.ok ? "text-green-700" : "text-red-700"}`}>{msg.text}</span>}
      </div>
    </div>
  );
}
