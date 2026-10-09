"use client";

import { useEffect, useState } from "react";

// A timestamp in the viewer's own time zone (the server renders UTC, then the
// browser swaps in local time), with "5 min ago" under it.

function rel(ms: number): string {
  const s = Math.round((Date.now() - ms) / 1000);
  if (s < 45) return "just now";
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86_400) return `${Math.round(s / 3600)} h ago`;
  const d = Math.round(s / 86_400);
  return d < 60 ? `${d} d ago` : `${Math.round(d / 30)} mo ago`;
}

export default function LocalTime({ iso, relative = true }: { iso: string; relative?: boolean }) {
  const ms = new Date(iso).getTime();
  const [text, setText] = useState(() =>
    new Date(ms).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "UTC" }) + " UTC",
  );
  const [ago, setAgo] = useState<string | null>(null);
  useEffect(() => {
    setText(new Date(ms).toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }));
    setAgo(rel(ms));
  }, [ms]);
  return (
    <time dateTime={iso} title={iso} className="block whitespace-nowrap">
      <span className="text-[var(--a-ink)]">{text}</span>
      {relative && ago && <span className="block text-[11px] text-[var(--a-ink-3)]">{ago}</span>}
    </time>
  );
}
