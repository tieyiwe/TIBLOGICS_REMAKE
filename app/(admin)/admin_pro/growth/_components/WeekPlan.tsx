"use client";

import { useMemo, useState } from "react";
import type { PostView } from "@/lib/growth/content/posts";
import { PLATFORM_INFO, STATUS_LABEL, type PostStatus } from "@/lib/growth/content/platforms";
import PostDrawer, { type AudienceTz } from "./PostDrawer";
import { StatusPill } from "./ui";

/** Monday-to-Sunday of the current week, in the viewer's time zone. */
export default function WeekPlan({ initial, audiences }: { initial: PostView[]; audiences: AudienceTz[] }) {
  const [posts, setPosts] = useState(initial);
  const [open, setOpen] = useState<PostView | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const days = useMemo(() => {
    const now = new Date();
    const mon = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
    return Array.from({ length: 7 }, (_, i) => new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + i));
  }, []);
  const key = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  const today = key(new Date());
  const byDay = new Map<string, PostView[]>();
  for (const p of posts) {
    if (!p.scheduledAt || p.status === "rejected") continue;
    const k = key(new Date(p.scheduledAt));
    byDay.set(k, [...(byDay.get(k) ?? []), p]);
  }
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-7 gap-2">
        {days.map((d) => {
          const list = (byDay.get(key(d)) ?? []).sort((a, b) => (a.scheduledAt ?? "").localeCompare(b.scheduledAt ?? ""));
          return (
            <div key={key(d)} className={`rounded-xl border p-2 min-h-[90px] ${key(d) === today ? "border-[#F47C20] bg-[#FFF8F2]" : "border-[#E6ECF3] bg-[#FAFBFD]"}`}>
              <p className={`font-dm text-xs mb-1 ${key(d) === today ? "font-bold text-[#F47C20]" : "text-[#7A8FA6]"}`}>
                {d.toLocaleDateString("en-US", { weekday: "short", day: "numeric" })}
              </p>
              <ul className="space-y-1">
                {(expanded.has(key(d)) ? list : list.slice(0, 6)).map((p) => (
                  <li key={p.id}>
                    <button onClick={() => setOpen(p)} className="w-full text-left rounded-md bg-white border border-[#E6ECF3] px-1.5 py-1 hover:shadow-sm" style={{ borderLeft: `3px solid ${PLATFORM_INFO[p.platform].color}` }}>
                      <span className="block font-dm text-[11px] font-semibold text-[#0D1B2A] truncate">
                        {new Date(p.scheduledAt!).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} {PLATFORM_INFO[p.platform].label}
                      </span>
                      <StatusPill status={p.status} label={STATUS_LABEL[p.status as PostStatus] ?? p.status} />
                    </button>
                  </li>
                ))}
                {list.length > 6 && !expanded.has(key(d)) && (
                  <li><button className="font-dm text-[11px] text-[#2251A3] underline" onClick={() => setExpanded((x) => new Set(x).add(key(d)))}>+{list.length - 6} more</button></li>
                )}
                {list.length === 0 && <li className="font-dm text-[11px] text-[#9AAABB]">—</li>}
              </ul>
            </div>
          );
        })}
      </div>
      {open && (
        <PostDrawer post={open} audiences={audiences} onClose={() => setOpen(null)}
          onChange={(p) => { setPosts((xs) => xs.map((x) => (x.id === p.id ? p : x))); setOpen(p); }}
          onDelete={(id) => { setPosts((xs) => xs.filter((x) => x.id !== id)); setOpen(null); }} />
      )}
    </>
  );
}
