"use client";

import { useState } from "react";
import { useOp } from "./_editor/useOp";

// The track's status, changeable right in the admin track list: Draft
// (hidden), Coming soon (shown with a waitlist) or Live (shown and on sale).
// Going live or hiding a track asks first.
const LABEL: Record<string, string> = { draft: "Draft (hidden)", coming_soon: "Coming soon", live: "Live" };
const TONE: Record<string, string> = {
  live: "border-green-300 bg-green-50 text-green-800",
  coming_soon: "border-amber-300 bg-amber-50 text-amber-900",
  draft: "border-[var(--border)] bg-[var(--s2)] text-[var(--ink2)]",
};

export default function TrackStatusSelect({ id, title, status }: { id: string; title: string; status: string }) {
  const { run, busy, error } = useOp();
  const [value, setValue] = useState(status);

  async function change(next: string) {
    if (next === value) return;
    const ask =
      next === "live"
        ? `Make "${title}" live? It becomes visible in the Academy and open for purchase.`
        : next === "draft"
          ? `Hide "${title}"? It disappears from the Academy. Learners who already have it keep their access.`
          : `Show "${title}" as Coming soon? It stays visible with a waitlist, but can't be bought.`;
    const prev = value;
    setValue(next);
    const ok = await run({ op: "track.status", id, status: next }, { key: `status:${id}`, confirmText: ask });
    if (!ok) setValue(prev);
  }

  return (
    <span className="inline-flex flex-col gap-1">
      <select
        aria-label={`Status of ${title}`}
        data-testid={`track-status-${id}`}
        value={value}
        disabled={busy !== null}
        onChange={(e) => change(e.target.value)}
        className={`rounded-md border px-2 py-1 text-xs font-bold ${TONE[value] ?? TONE.draft}`}
      >
        {Object.entries(LABEL).map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
      {error && <span className="max-w-[14rem] text-[11px] text-red-700">{error}</span>}
    </span>
  );
}
