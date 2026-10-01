import Link from "next/link";
import { requireAdminPage } from "../../_lib/admin-page-auth";
import {
  filterQuery, listLearners, parseFilters, type LearnerFilters, type LearnerRow, type SortKey,
} from "@/lib/learn/admin/learners";

export const dynamic = "force-dynamic";

// TIBLOGICS Learn learners: who signed up, their plan, progress, placement
// check and sign-ins. Filters live in the URL (a plain GET form), so a view
// can be bookmarked and the CSV export uses exactly the same filters.

const LANG: Record<string, string> = { en: "EN", fr: "FR", sw: "SW" };
const STATUS_STYLE: Record<string, string> = {
  active: "bg-green-50 text-green-700",
  trial: "bg-blue-50 text-blue-700",
  lifetime: "bg-emerald-50 text-emerald-700",
  "past due": "bg-amber-50 text-amber-800",
  cancelled: "bg-red-50 text-red-700",
  none: "bg-[var(--s2)] text-[var(--ink3)]",
};

const date = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
function ago(d: Date | null): string {
  if (!d) return "Never";
  const m = Math.round((Date.now() - d.getTime()) / 60_000);
  if (m < 60) return `${Math.max(1, m)} min ago`;
  if (m < 48 * 60) return `${Math.round(m / 60)} h ago`;
  return `${Math.round(m / 1440)} days ago`;
}

export default async function LearnersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdminPage();
  const f = parseFilters(await searchParams);
  const { rows, total, page, pages, tracks } = await listLearners(f);

  const sortLink = (key: SortKey) =>
    filterQuery(f, { sort: key, dir: f.sort === key && f.dir === "desc" ? "asc" : "desc", page: 1 });
  const th = (key: SortKey | null, label: string, right = false) => (
    <th className={`whitespace-nowrap pb-2 pr-3 ${right ? "text-right" : ""}`}>
      {key ? (
        <Link href={`/admin_pro/learn/learners${sortLink(key)}`} className="hover:text-[var(--ink)]">
          {label}
          {f.sort === key ? (f.dir === "desc" ? " ↓" : " ↑") : ""}
        </Link>
      ) : (
        label
      )}
    </th>
  );
  const input = "rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm text-[var(--ink)]";
  const exportHref = `/api/admin/learn/learners/export${filterQuery(f, { page: 1 })}`;
  const filtered = !!(f.q || f.plan || f.active || f.never || f.cert || f.track);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/admin_pro/learn" className="text-sm text-[var(--blue2)] hover:underline">
            ← TIBLOGICS Learn
          </Link>
          <h1 className="mt-2 text-2xl font-black text-[var(--ink)]">Learners</h1>
          <p className="mt-1 text-sm text-[var(--ink3)]">
            Everyone who signed up for TIBLOGICS Learn: plan, progress, placement check and sign-ins.
          </p>
        </div>
        <a
          href={exportHref}
          className="rounded-lg border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--ink2)] hover:border-[var(--ink3)]"
        >
          Download CSV ({total.toLocaleString("en")})
        </a>
      </header>

      <form method="get" className="flex flex-wrap items-end gap-3 rounded-xl border border-[var(--border)] bg-white p-4">
        <label className="flex min-w-[220px] flex-1 flex-col gap-1 text-xs font-semibold text-[var(--ink3)]">
          Search
          <input name="q" defaultValue={f.q} placeholder="Name or email" className={input} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-[var(--ink3)]">
          Plan
          <select name="plan" defaultValue={f.plan ?? ""} className={input}>
            <option value="">Any plan</option>
            <option value="paid">Paying (subscription or track)</option>
            <option value="monthly">Monthly</option>
            <option value="annual">Annual (legacy)</option>
            <option value="comped">Comped</option>
            <option value="team">Team</option>
            <option value="tracks">Tracks bought</option>
            <option value="none">None</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-[var(--ink3)]">
          Activity
          <select name="active" defaultValue={f.active ? String(f.active) : ""} className={input}>
            <option value="">Any time</option>
            <option value="7">Active in last 7 days</option>
            <option value="30">Active in last 30 days</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-[var(--ink3)]">
          Track
          <select name="track" defaultValue={f.track ?? ""} className={input}>
            <option value="">Any track</option>
            {tracks.map((t) => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 pb-2 text-sm text-[var(--ink2)]">
          <input type="checkbox" name="never" value="1" defaultChecked={f.never} /> Never back since sign-up
        </label>
        <label className="flex items-center gap-2 pb-2 text-sm text-[var(--ink2)]">
          <input type="checkbox" name="cert" value="1" defaultChecked={f.cert} /> Has a certificate
        </label>
        {f.sort !== "created" && <input type="hidden" name="sort" value={f.sort} />}
        {f.dir !== "desc" && <input type="hidden" name="dir" value={f.dir} />}
        <button className="rounded-lg bg-[var(--ink)] px-4 py-2 text-sm font-bold text-white hover:opacity-90">Apply</button>
        {filtered && (
          <Link href="/admin_pro/learn/learners" className="pb-2 text-sm text-[var(--blue2)] underline">
            Clear
          </Link>
        )}
      </form>

      <section className="rounded-xl border border-[var(--border)] bg-white p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-sm font-bold text-[var(--ink)]">
            {total.toLocaleString("en")} learner{total === 1 ? "" : "s"}
            {filtered ? " match" : ""}
          </h2>
          <p className="text-xs text-[var(--ink3)]">
            Active = signed in, finished a lesson or earned XP. Progress = lessons done in the tracks started.
          </p>
        </div>
        {rows.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--ink3)]">No learners {filtered ? "match these filters" : "yet"}.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[1280px] text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-wide text-[var(--ink3)]">
                  {th("name", "Learner")}
                  {th("created", "Signed up")}
                  {th(null, "Lang")}
                  {th(null, "Plan")}
                  {th(null, "Status")}
                  {th(null, "Tracks started")}
                  {th("progress", "Progress", true)}
                  {th(null, "Placement check")}
                  {th("lastLogin", "Last login")}
                  {th("logins", "Logins 30d", true)}
                  {th("xp", "XP", true)}
                  {th("certs", "Certs", true)}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {rows.map((r) => (
                  <Row key={r.id} r={r} />
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pages > 1 && <Pager f={f} page={page} pages={pages} />}
      </section>
    </div>
  );
}

function Row({ r }: { r: LearnerRow }) {
  return (
    <tr className="align-top">
      <td className="min-w-[220px] max-w-[280px] py-2.5 pr-3">
        <Link href={`/admin_pro/learn/learners/${r.id}`} className="font-semibold text-[var(--ink)] hover:text-[var(--blue2)] hover:underline">
          {r.name}
        </Link>
        <p className="break-all text-xs text-[var(--ink3)]">
          {r.email}
          {!r.emailVerified && <span title="Email not verified"> · unverified</span>}
        </p>
      </td>
      <td className="whitespace-nowrap py-2.5 pr-3 text-[var(--ink2)]">{date(r.createdAt)}</td>
      <td className="py-2.5 pr-3 text-[var(--ink2)]">{LANG[r.locale] ?? r.locale}</td>
      <td className="py-2.5 pr-3 text-[var(--ink2)]">
        {r.plan.labels.map((l) => (
          <p key={l} className="whitespace-nowrap">{l}</p>
        ))}
      </td>
      <td className="py-2.5 pr-3">
        <span className={`whitespace-nowrap rounded px-2 py-0.5 text-xs font-bold capitalize ${STATUS_STYLE[r.plan.status]}`}>
          {r.plan.status === "none" ? "—" : r.plan.status}
        </span>
      </td>
      <td className="py-2.5 pr-3 text-[var(--ink2)]">
        {r.tracksStarted.length ? r.tracksStarted.join(", ") : <span className="text-[var(--ink3)]">None</span>}
      </td>
      <td className="py-2.5 pr-3 text-right font-semibold text-[var(--ink)]">{r.tracksStarted.length ? `${r.progress}%` : "—"}</td>
      <td className="py-2.5 pr-3 text-xs text-[var(--ink2)]">
        {r.placement.length === 0 ? (
          <span className="text-[var(--ink3)]">—</span>
        ) : (
          r.placement.map((p) => (
            <p key={p.track}>
              <span className={p.done ? "font-semibold text-green-700" : "text-[var(--ink3)]"}>{p.done ? "Yes" : "No"}</span> · {p.track}
              {p.summary && <span className="text-[var(--ink3)]"> ({p.summary})</span>}
            </p>
          ))
        )}
      </td>
      <td className="whitespace-nowrap py-2.5 pr-3 text-[var(--ink2)]" title={r.lastLoginAt?.toISOString()}>{ago(r.lastLoginAt)}</td>
      <td className="py-2.5 pr-3 text-right text-[var(--ink2)]">{r.logins30}</td>
      <td className="py-2.5 pr-3 text-right text-[var(--ink2)]">{r.xp.toLocaleString("en")}</td>
      <td className="py-2.5 pr-3 text-right text-[var(--ink2)]">{r.certificates}</td>
    </tr>
  );
}

function Pager({ f, page, pages }: { f: LearnerFilters; page: number; pages: number }) {
  const link = (p: number, label: string, disabled: boolean) =>
    disabled ? (
      <span className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--ink3)] opacity-50">{label}</span>
    ) : (
      <Link href={`/admin_pro/learn/learners${filterQuery(f, { page: p })}`} className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-sm font-semibold text-[var(--ink2)] hover:border-[var(--ink3)]">
        {label}
      </Link>
    );
  return (
    <div className="mt-4 flex items-center justify-between gap-3">
      {link(page - 1, "← Previous", page <= 1)}
      <span className="text-xs text-[var(--ink3)]">
        Page {page} of {pages}
      </span>
      {link(page + 1, "Next →", page >= pages)}
    </div>
  );
}
