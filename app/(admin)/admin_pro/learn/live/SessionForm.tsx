"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// Create or edit a live expert session (admin, English).

export interface SessionFormValue {
  title: string;
  expertName: string;
  expertBio: string;
  expertPhotoUrl: string;
  topic: string;
  trackIds: string[];
  date: string;
  time: string;
  timezone: string;
  durationMinutes: number;
  meetingUrl: string;
  capacity: number;
  status: string;
  recordingUrl: string;
  resources: Array<{ title: string; url: string }>;
}

const ZONES = ["Africa/Nairobi", "Africa/Lagos", "Africa/Johannesburg", "Africa/Kinshasa", "Africa/Dakar", "Africa/Abidjan", "Europe/London", "Europe/Paris", "America/New_York", "America/Chicago", "America/Los_Angeles", "UTC"];
const STATUSES = [
  ["scheduled", "Scheduled"],
  ["live", "Live now (keeps the join button open past the end)"],
  ["ended", "Ended"],
  ["cancelled", "Cancelled"],
] as const;

const input = "w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm";
const label = "text-xs font-semibold text-[var(--ink2)]";

export default function SessionForm({
  tracks,
  initial,
  sessionId,
}: {
  tracks: Array<{ id: string; title: string }>;
  initial?: SessionFormValue;
  sessionId?: string;
}) {
  const router = useRouter();
  const [v, setV] = useState<SessionFormValue>(
    initial ?? {
      title: "",
      expertName: "",
      expertBio: "",
      expertPhotoUrl: "",
      topic: "",
      trackIds: [],
      date: "",
      time: "18:00",
      timezone: "Africa/Nairobi",
      durationMinutes: 60,
      meetingUrl: "",
      capacity: 100,
      status: "scheduled",
      recordingUrl: "",
      resources: [],
    },
  );
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const set = <K extends keyof SessionFormValue>(k: K, val: SessionFormValue[K]) => setV((x) => ({ ...x, [k]: val }));
  const allTracks = v.trackIds.length === 0;

  async function save() {
    setBusy(true);
    setMsg(null);
    const res = await fetch(sessionId ? `/api/admin/learn/live/${sessionId}` : "/api/admin/learn/live", {
      method: sessionId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...v, resources: v.resources.filter((r) => r.title.trim() || r.url.trim()) }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setMsg({ ok: false, text: data.error ?? "Save failed" });
    if (!sessionId && data.id) return router.push(`/admin_pro/learn/live/${data.id}`);
    setMsg({ ok: true, text: data.promoted ? `Saved. ${data.promoted} moved up from the waitlist.` : "Saved." });
    router.refresh();
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className={label}>
        Title
        <input name="title" value={v.title} onChange={(e) => set("title", e.target.value)} placeholder="Ask an AI product lead" className={`${input} mt-1`} />
      </label>
      <label className={label}>
        Topic
        <input name="topic" value={v.topic} onChange={(e) => set("topic", e.target.value)} placeholder="Shipping AI features safely" className={`${input} mt-1`} />
      </label>
      <label className={label}>
        Expert name
        <input name="expertName" value={v.expertName} onChange={(e) => set("expertName", e.target.value)} className={`${input} mt-1`} />
      </label>
      <label className={label}>
        Expert photo URL (https)
        <input name="expertPhotoUrl" value={v.expertPhotoUrl} onChange={(e) => set("expertPhotoUrl", e.target.value)} placeholder="https://..." className={`${input} mt-1`} />
      </label>
      <label className={`${label} sm:col-span-2`}>
        Expert bio
        <textarea name="expertBio" value={v.expertBio} onChange={(e) => set("expertBio", e.target.value)} rows={3} className={`${input} mt-1`} />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className={label}>
          Date
          <input name="date" type="date" value={v.date} onChange={(e) => set("date", e.target.value)} className={`${input} mt-1`} />
        </label>
        <label className={label}>
          Start (24h)
          <input name="time" type="time" value={v.time} onChange={(e) => set("time", e.target.value)} className={`${input} mt-1`} />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className={label}>
          Time zone (IANA)
          <input name="timezone" list="live-tz-list" value={v.timezone} onChange={(e) => set("timezone", e.target.value)} className={`${input} mt-1`} />
          <datalist id="live-tz-list">
            {ZONES.map((z) => (
              <option key={z} value={z} />
            ))}
          </datalist>
        </label>
        <label className={label}>
          Minutes
          <input name="durationMinutes" type="number" min={15} max={480} value={v.durationMinutes} onChange={(e) => set("durationMinutes", Number(e.target.value))} className={`${input} mt-1`} />
        </label>
      </div>
      <label className={label}>
        Meeting link (shown to learners with a seat, from 15 minutes before)
        <input name="meetingUrl" value={v.meetingUrl} onChange={(e) => set("meetingUrl", e.target.value)} placeholder="https://meet.google.com/..." className={`${input} mt-1`} />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className={label}>
          Capacity
          <input name="capacity" type="number" min={1} value={v.capacity} onChange={(e) => set("capacity", Number(e.target.value))} className={`${input} mt-1`} />
        </label>
        <label className={label}>
          Status
          <select name="status" value={v.status} onChange={(e) => set("status", e.target.value)} className={`${input} mt-1`}>
            {STATUSES.map(([val, text]) => (
              <option key={val} value={val}>
                {text}
              </option>
            ))}
          </select>
        </label>
      </div>
      <fieldset className="sm:col-span-2">
        <legend className={label}>Related tracks</legend>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={allTracks} onChange={() => set("trackIds", [])} />
            All tracks
          </label>
          {tracks.map((t) => (
            <label key={t.id} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={v.trackIds.includes(t.id)}
                onChange={(e) => set("trackIds", e.target.checked ? [...v.trackIds, t.id] : v.trackIds.filter((x) => x !== t.id))}
              />
              {t.title}
            </label>
          ))}
        </div>
        <p className="mt-1 text-xs text-[var(--ink3)]">A label for learners. Anyone with a subscription or a track purchase can attend.</p>
      </fieldset>
      <label className={`${label} sm:col-span-2`}>
        Recording URL (after the event: YouTube, Vimeo, https MP4, or a /videos/... file). Learners with a seat get an email once.
        <input name="recordingUrl" value={v.recordingUrl} onChange={(e) => set("recordingUrl", e.target.value)} placeholder="https://www.youtube.com/watch?v=..." className={`${input} mt-1`} />
      </label>
      <fieldset className="sm:col-span-2">
        <legend className={label}>Resources (links shown on the session page)</legend>
        <div className="mt-1 space-y-2">
          {v.resources.map((r, i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-[1fr_2fr_auto]">
              <input
                aria-label={`Resource ${i + 1} title`}
                value={r.title}
                onChange={(e) => set("resources", v.resources.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))}
                placeholder="Slides"
                className={input}
              />
              <input
                aria-label={`Resource ${i + 1} link`}
                value={r.url}
                onChange={(e) => set("resources", v.resources.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))}
                placeholder="https://..."
                className={input}
              />
              <button type="button" onClick={() => set("resources", v.resources.filter((_, j) => j !== i))} className="text-xs font-semibold text-red-600 underline">
                Remove
              </button>
            </div>
          ))}
          <button type="button" onClick={() => set("resources", [...v.resources, { title: "", url: "" }])} className="text-xs font-semibold text-[var(--blue2)] underline">
            + Add a resource
          </button>
        </div>
      </fieldset>
      <div className="flex items-center gap-3 sm:col-span-2">
        <button onClick={save} disabled={busy} className="rounded-lg bg-[var(--ink)] px-4 py-2 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50">
          {busy ? "Saving…" : sessionId ? "Save changes" : "Create session"}
        </button>
        {msg && <span role="status" className={`text-sm ${msg.ok ? "text-green-700" : "text-red-700"}`}>{msg.text}</span>}
      </div>
    </div>
  );
}
