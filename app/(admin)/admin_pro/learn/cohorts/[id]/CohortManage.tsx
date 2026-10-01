"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// Announcements, recordings and members of one cohort (admin, English).

const input = "w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm";
const btn = "rounded-lg bg-[var(--ink)] px-4 py-2 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50";
const small = "text-xs font-semibold text-red-600 underline";

export default function CohortManage({
  cohortId,
  announcements,
  recordings,
  members,
}: {
  cohortId: string;
  announcements: Array<{ id: string; bodyMd: string; createdAt: string }>;
  recordings: Array<{ title: string; url: string; addedAt: string }>;
  members: Array<{ studentId: string; name: string; email: string; joinedAt: string; percent: number }>;
}) {
  const router = useRouter();
  const [news, setNews] = useState("");
  const [recTitle, setRecTitle] = useState("");
  const [recUrl, setRecUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function post(body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/admin/learn/cohorts/${cohortId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Failed");
      return false;
    }
    router.refresh();
    return true;
  }

  async function remove() {
    if (!confirm("Delete this cohort, its members, announcements and cohort-only threads?")) return;
    const res = await fetch(`/api/admin/learn/cohorts/${cohortId}`, { method: "DELETE" });
    if (res.ok) router.push("/admin_pro/learn/cohorts");
  }

  return (
    <div className="space-y-6">
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <section className="rounded-xl border border-[var(--border)] bg-white p-5">
        <h2 className="text-sm font-bold text-[var(--ink)]">Announcements</h2>
        <p className="text-xs text-[var(--ink3)]">Shown to members on the cohort page (Markdown).</p>
        <textarea value={news} onChange={(e) => setNews(e.target.value)} rows={3} className={`${input} mt-3`} placeholder="Week 2 starts Monday. Bring one question about prompts to the live session." />
        <button disabled={busy || news.trim().length < 2} onClick={async () => (await post({ action: "announce", bodyMd: news })) && setNews("")} className={`${btn} mt-2`}>
          Post announcement
        </button>
        <ul className="mt-4 space-y-2">
          {announcements.map((a) => (
            <li key={a.id} className="rounded-lg bg-[var(--s2)] p-3 text-sm">
              <p className="text-xs text-[var(--ink3)]">{new Date(a.createdAt).toLocaleString()}</p>
              <p className="mt-1 whitespace-pre-wrap">{a.bodyMd}</p>
              <button onClick={() => post({ action: "deleteAnnouncement", announcementId: a.id })} className={`${small} mt-1`}>
                Delete
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-white p-5">
        <h2 className="text-sm font-bold text-[var(--ink)]">Recordings</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_2fr_auto]">
          <input value={recTitle} onChange={(e) => setRecTitle(e.target.value)} placeholder="Week 1 live session" className={input} />
          <input value={recUrl} onChange={(e) => setRecUrl(e.target.value)} placeholder="https://..." className={input} />
          <button
            disabled={busy}
            onClick={async () => {
              if (await post({ action: "addRecording", title: recTitle, url: recUrl })) {
                setRecTitle("");
                setRecUrl("");
              }
            }}
            className={btn}
          >
            Add
          </button>
        </div>
        <ul className="mt-3 space-y-1 text-sm">
          {recordings.map((r, i) => (
            <li key={i} className="flex flex-wrap items-center gap-3">
              <a href={r.url} target="_blank" rel="noopener noreferrer" className="text-[var(--blue2)] underline">{r.title}</a>
              <span className="text-xs text-[var(--ink3)]">{new Date(r.addedAt).toLocaleDateString()}</span>
              <button onClick={() => post({ action: "removeRecording", index: i })} className={small}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-white p-5">
        <h2 className="text-sm font-bold text-[var(--ink)]">Members ({members.length})</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-xs text-[var(--ink3)]">
                <th className="py-2 pr-3">Name</th>
                <th className="py-2 pr-3">Email</th>
                <th className="py-2 pr-3">Joined</th>
                <th className="py-2 pr-3">Progress</th>
                <th className="py-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {members.map((m) => (
                <tr key={m.studentId}>
                  <td className="py-2 pr-3">{m.name}</td>
                  <td className="py-2 pr-3">{m.email}</td>
                  <td className="py-2 pr-3">{new Date(m.joinedAt).toLocaleDateString()}</td>
                  <td className="py-2 pr-3">{m.percent}%</td>
                  <td className="py-2">
                    <button onClick={() => confirm(`Remove ${m.name} from this cohort?`) && post({ action: "removeMember", studentId: m.studentId })} className={small}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <button onClick={remove} className="text-sm font-semibold text-red-600 underline">
        Delete cohort
      </button>
    </div>
  );
}
