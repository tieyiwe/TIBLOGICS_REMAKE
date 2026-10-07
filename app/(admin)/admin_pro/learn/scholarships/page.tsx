import Link from "next/link";
import { Download, GraduationCap } from "lucide-react";
import { Badge, Card, EmptyState, PageHeader, StatCard, type BadgeTone } from "@/components/admin/ui";
import { requireLearnerPage } from "@/lib/learn/account-status/admin-auth";
import { canAward } from "@/lib/learn/scholarship/guard";
import { listScholarships, sponsorSummaries, type ScholarshipRow } from "@/lib/learn/scholarship/admin";
import { applicationsOpen, listApplications } from "@/lib/learn/scholarship/applications";
import { donationSummary } from "@/lib/learn/scholarship/donations";
import { liveTracks } from "@/lib/learn/scholarship/service";
import { scholarshipTablesReady } from "@/lib/learn/scholarship/db";
import ScholarSeal from "@/components/learn/scholarship/ScholarSeal";
import { LEARN_TABS } from "../tabs";
import { ApplicationActions, ApplicationsToggle, ApproveAll, ApproveButton, AwardActions, AwardForm, DeleteDraft, EditScholarship, SponsorReportButton } from "./ScholarshipsAdmin";

export const dynamic = "force-dynamic";

// The Tilo Vision Scholarship: award it (one or more people), review the
// drafts and approve them (that sends the congratulations email), then follow
// every scholar: what they chose, what it was worth, and how they are doing.

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const day = (d: Date | null) => (d ? d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }) : "–");
const usd = (c: number) => `$${(c / 100).toLocaleString("en-US", { minimumFractionDigits: c % 100 ? 2 : 0, maximumFractionDigits: 2 })}`;
const coverage = (pct: number) => (pct >= 100 ? "100% · Free" : `${pct}%`);
const LANG: Record<string, string> = { en: "English", fr: "French", sw: "Swahili" };
const fieldInput =
  "h-9 rounded-[var(--a-radius-control)] border border-[var(--a-border-strong)] bg-[var(--a-surface)] px-3 font-dm text-[13.5px] text-[var(--a-ink)]";

function statusOf(r: ScholarshipRow): { label: string; tone: BadgeTone } {
  if (r.status === "draft") return { label: "Draft · to review", tone: "warn" };
  if (r.status === "revoked") return { label: "Revoked", tone: "danger" };
  if (r.status === "claimed") return { label: "Accepted", tone: "success" };
  return r.expired ? { label: "Offer expired", tone: "danger" } : { label: "Sent · waiting", tone: "info" };
}

export default async function ScholarshipsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await requireLearnerPage("read");
  const award = canAward(session);
  const sp = await searchParams;
  const status = one(sp.status) || null;
  const q = one(sp.q) || null;
  const ready = await scholarshipTablesReady();
  const [rows, tracks, everything] = ready
    ? await Promise.all([listScholarships({ status, q }), liveTracks().catch(() => []), status || q ? listScholarships() : null])
    : [[], [], null];
  const all = everything ?? rows;
  const drafts = all.filter((r) => r.status === "draft");
  const listed = rows.filter((r) => r.status !== "draft" || status === "draft");
  const trackOptions = tracks.map((t) => ({ id: t.id, title: t.title, priceCents: t.priceCents }));
  const scholars = all.filter((r) => r.status === "claimed");
  const qs = new URLSearchParams([...(status ? [["status", status]] : []), ...(q ? [["q", q]] : [])]);
  const appFilter = one(sp.apps) || "open";
  const [apps, appsOpen] = ready ? await Promise.all([listApplications(), applicationsOpen()]) : [[], true];
  const appsShown = apps.filter((a) => (appFilter === "all" ? true : appFilter === "open" ? a.status === "new" || a.status === "shortlisted" : a.status === appFilter));
  const sponsors = sponsorSummaries(all);
  const donations = ready ? await donationSummary().catch(() => null) : null;
  const editable = (r: ScholarshipRow) => ({
    id: r.id, status: r.status, name: r.name, email: r.email, locale: r.locale, trackCount: r.trackCount, coveragePct: r.coveragePct, trackIds: r.trackIds,
    message: r.message, note: r.note, offerDays: r.offerDays, used: r.picks.length, sponsorName: r.sponsorName, sponsorEmail: r.sponsorEmail, pickDays: r.pickDays, completeDays: r.completeDays,
    partnerName: r.partnerName, partnerRole: r.partnerRole,
  });
  const terms = (r: ScholarshipRow) =>
    [r.partnerName ? `${r.partnerRole === "nominated" ? "Nominated by" : r.partnerRole === "through" ? "Awarded through" : "In partnership with"} ${r.partnerName}` : null, r.sponsorName ? `Sponsor: ${r.sponsorName}` : null, r.pickDays ? `Choose within ${r.pickDays} days` : null, r.completeDays ? `Complete within ${r.completeDays} days` : null].filter(Boolean).join(" · ");

  return (
    <div className="space-y-5">
      <PageHeader
        title="Scholarships"
        subtitle="The Tilo Vision Scholarship: award tracks at a chosen coverage (up to 100%, free). Individual tracks only, never team plans or the monthly plan."
        breadcrumb={[{ label: "ARFA · AI Academy", href: "/admin_pro/learn" }, { label: "Scholarships" }]}
        tabs={LEARN_TABS}
        activeTab="/admin_pro/learn/scholarships"
        actions={
          <a href={`/api/admin/learn/scholarships/export?${qs}`} className="inline-flex h-9 items-center gap-1.5 rounded-[var(--a-radius-control)] border border-[var(--a-border-strong)] px-3 font-dm text-[13px] font-semibold text-[var(--a-ink)] hover:bg-[var(--a-surface-2)]" data-testid="scholarships-csv">
            <Download size={14} aria-hidden /> Download CSV
          </a>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <StatCard label="New applications" value={apps.filter((a) => a.status === "new").length} />
        <StatCard label="To review" value={drafts.length} />
        <StatCard label="Awarded" value={all.filter((r) => r.status === "approved" || r.status === "claimed").length} />
        <StatCard label="Accepted (scholars)" value={scholars.length} />
        <StatCard label="Tracks unlocked" value={all.reduce((n, r) => n + r.picks.length, 0)} />
        <StatCard label="Value covered" value={usd(all.reduce((n, r) => n + r.coveredCents, 0))} />
      </div>

      <div id="applications" className="scroll-mt-24">
        <Card
          title={`Applications (${apps.filter((a) => a.status === "new" || a.status === "shortlisted").length} to review)`}
          subtitle={
            <>
              From the public page{" "}
              <a href="/tilo-vision-scholarship" target="_blank" rel="noreferrer" className="font-semibold text-[var(--a-blue)] hover:underline">/tilo-vision-scholarship</a>. Applications are{" "}
              <strong>{appsOpen ? "open" : "closed"}</strong>.
            </>
          }
          action={award ? <ApplicationsToggle open={appsOpen} /> : null}
        >
          <div className="mb-3 flex flex-wrap gap-2 font-dm text-[12.5px]">
            {[["open", "To review"], ["shortlisted", "Shortlisted"], ["awarded", "Awarded"], ["declined", "Declined"], ["all", "All"]].map(([k, l]) => (
              <Link
                key={k}
                href={`/admin_pro/learn/scholarships?${new URLSearchParams({ ...(status ? { status } : {}), ...(q ? { q } : {}), apps: k })}#applications`}
                className={`rounded-full border px-3 py-1 font-semibold ${appFilter === k ? "border-[var(--a-orange-text)] bg-[#FFF1E3] text-[var(--a-orange-text)]" : "border-[var(--a-border-strong)] text-[var(--a-ink-2)]"}`}
              >
                {l} ({k === "all" ? apps.length : k === "open" ? apps.filter((a) => a.status === "new" || a.status === "shortlisted").length : apps.filter((a) => a.status === k).length})
              </Link>
            ))}
          </div>
          {appsShown.length === 0 ? (
            <p className="font-dm text-[13.5px] text-[var(--a-ink-3)]">No applications here.</p>
          ) : (
            <ul className="space-y-3" data-testid="applications">
              {appsShown.map((a) => (
                <li key={a.id} className="rounded-lg border border-[var(--a-border)] p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="break-words font-dm text-[14px] font-semibold text-[var(--a-ink)]">{a.name}</span>
                    <Badge tone={a.status === "new" ? "info" : a.status === "shortlisted" ? "orange" : a.status === "awarded" ? "success" : "neutral"}>{a.status === "new" ? "New" : a.status[0].toUpperCase() + a.status.slice(1)}</Badge>
                    <span className="font-mono text-[11.5px] text-[var(--a-ink-3)]">{a.reference}</span>
                  </div>
                  <p className="break-all font-dm text-[12.5px] text-[var(--a-ink-2)]">
                    {a.email} · {a.country ?? "Country not given"} · {a.background ? a.background[0].toUpperCase() + a.background.slice(1) : "Background not given"} · {LANG[a.locale] ?? a.locale} · {day(a.createdAt)}
                    {a.hasAccount ? " · Has an ARFA account" : ""}
                  </p>
                  <details className="mt-2">
                    <summary className="cursor-pointer font-dm text-[13px] font-semibold text-[var(--a-ink)]">Motivation and goals</summary>
                    <p className="mt-2 whitespace-pre-line rounded-md bg-[var(--a-surface-2)] px-3 py-2 font-dm text-[13px] text-[var(--a-ink)]">{a.motivation}</p>
                    {a.goals && <p className="mt-2 whitespace-pre-line font-dm text-[13px] text-[var(--a-ink-2)]"><strong>Goals:</strong> {a.goals}</p>}
                    {a.links && <p className="mt-1 break-all font-dm text-[12.5px] text-[var(--a-ink-2)]"><strong>Links:</strong> {a.links}</p>}
                  </details>
                  {a.trackTitles.length > 0 && <p className="mt-1 font-dm text-[12.5px] text-[var(--a-ink-2)]">Interested in: {a.trackTitles.join(", ")}</p>}
                  {a.reviewedAt && <p className="mt-1 font-dm text-[11.5px] text-[var(--a-ink-3)]">Reviewed {day(a.reviewedAt)} by {a.reviewedBy ?? "staff"}</p>}
                  {award && <ApplicationActions id={a.id} name={a.name} status={a.status} tracks={trackOptions} suggested={a.trackIds.filter((id) => trackOptions.some((t) => t.id === id))} />}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {award ? (
        <Card title="Award the Tilo Vision Scholarship" subtitle="Create one or more awards. Each is saved as a draft for you to check, then approve to send the congratulations email.">
          <AwardForm tracks={trackOptions} />
        </Card>
      ) : (
        <Card>
          <p className="font-dm text-[13.5px] text-[var(--a-ink-2)]">You can view scholarships. Awarding them needs the “Grant free access” permission (Team &amp; Roles).</p>
        </Card>
      )}

      {drafts.length > 0 && (
        <Card title={`Waiting for your review (${drafts.length})`} subtitle="Check each recipient and the terms. Approving sends the congratulations email with their link." action={award ? <ApproveAll ids={drafts.map((d) => d.id)} /> : null}>
          <ul className="space-y-3" data-testid="drafts">
            {drafts.map((d) => (
              <li key={d.id} className="rounded-lg border border-[var(--a-border)] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="break-words font-dm text-[14px] font-semibold text-[var(--a-ink)]">{d.name}</p>
                    <p className="break-all font-dm text-[13px] text-[var(--a-ink-2)]">{d.email}</p>
                    <dl className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 font-dm text-[12.5px] sm:grid-cols-4">
                      <div><dt className="text-[var(--a-ink-3)]">Coverage</dt><dd className="font-semibold">{coverage(d.coveragePct)}</dd></div>
                      <div><dt className="text-[var(--a-ink-3)]">Tracks</dt><dd className="font-semibold">{d.trackCount}</dd></div>
                      <div><dt className="text-[var(--a-ink-3)]">Email language</dt><dd className="font-semibold">{LANG[d.locale] ?? d.locale}</dd></div>
                      <div><dt className="text-[var(--a-ink-3)]">Offer valid</dt><dd className="font-semibold">{d.offerDays} days</dd></div>
                    </dl>
                    <p className="mt-2 font-dm text-[12.5px] text-[var(--a-ink-2)]">
                      {d.trackIds.length ? `Only: ${d.trackTitles.join(", ")}` : "Any live track"}
                      {d.accountId ? " · Has an ARFA account" : " · No ARFA account yet"}
                    </p>
                    {d.message && <p className="mt-2 whitespace-pre-line rounded-md bg-[var(--a-surface-2)] px-3 py-2 font-dm text-[12.5px] text-[var(--a-ink)]">“{d.message}”</p>}
                    {terms(d) && <p className="mt-1 font-dm text-[12.5px] text-[var(--a-ink-2)]">{terms(d)}</p>}
                    {d.note && <p className="mt-1 font-dm text-[12px] text-[var(--a-ink-3)]">Note: {d.note}</p>}
                    <p className="mt-1 font-dm text-[11.5px] text-[var(--a-ink-3)]">
                      {d.code} · created {day(d.createdAt)} by {d.createdBy ?? "staff"}
                      {d.applicationId ? " · from an application" : ""} ·{" "}
                      <a href={`/api/admin/learn/scholarships/${d.id}/letter`} target="_blank" rel="noreferrer" className="font-semibold text-[var(--a-blue)] hover:underline" data-testid="letter-preview">
                        Preview award letter
                      </a>
                    </p>
                  </div>
                  {award && (
                    <div className="flex flex-wrap items-start gap-2">
                      <ApproveButton id={d.id} name={d.name} />
                      <DeleteDraft id={d.id} />
                    </div>
                  )}
                </div>
                {award && (
                  <EditScholarship
                    s={editable(d)}
                    tracks={trackOptions}
                  />
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card title="Scholars and awards" subtitle="Everyone awarded, what they chose, and their progress on those tracks." padded={false}>
        <form method="get" className="flex flex-wrap items-end gap-2 border-b border-[var(--a-border)] p-4">
          <label className="font-dm text-[12px] text-[var(--a-ink-3)]">
            Status
            <select name="status" defaultValue={status ?? ""} className={`${fieldInput} mt-1 block`}>
              <option value="">All</option>
              <option value="draft">To review</option>
              <option value="approved">Sent, waiting</option>
              <option value="claimed">Accepted</option>
              <option value="revoked">Revoked</option>
            </select>
          </label>
          <label className="min-w-0 flex-1 font-dm text-[12px] text-[var(--a-ink-3)]">
            Search
            <input name="q" defaultValue={q ?? ""} placeholder="Name, email or code" className={`${fieldInput} mt-1 block w-full`} />
          </label>
          <button type="submit" className="inline-flex h-9 items-center rounded-[var(--a-radius-control)] bg-[var(--a-ink)] px-4 font-dm text-[13px] font-semibold text-white">Filter</button>
        </form>
        {listed.length === 0 ? (
          <div className="p-5">
            <EmptyState icon={GraduationCap} title="No scholarships here yet" body="Awards appear here once approved; drafts wait in the review list above." />
          </div>
        ) : (
          <ul className="divide-y divide-[var(--a-border)]" data-testid="scholars">
            {listed.map((r) => {
              const st = statusOf(r);
              const free = r.picks.filter((p) => p.paidCents === 0).length;
              return (
                <li key={r.id} className="p-4">
                  <div className="flex flex-wrap items-start gap-3">
                    {r.status === "claimed" ? <ScholarSeal size={36} /> : null}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {r.accountId ? (
                          <Link href={`/admin_pro/learn/learners/${r.accountId}`} className="break-words font-dm text-[14px] font-semibold text-[var(--a-blue)] hover:underline">{r.name}</Link>
                        ) : (
                          <span className="break-words font-dm text-[14px] font-semibold text-[var(--a-ink)]">{r.name}</span>
                        )}
                        <Badge tone={st.tone} dot>{st.label}</Badge>
                        <span className="font-mono text-[11.5px] text-[var(--a-ink-3)]">{r.code}</span>
                      </div>
                      <p className="break-all font-dm text-[12.5px] text-[var(--a-ink-2)]">{r.email}</p>
                      <dl className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 font-dm text-[12.5px] sm:grid-cols-3 lg:grid-cols-6">
                        <div><dt className="text-[var(--a-ink-3)]">Coverage</dt><dd className="font-semibold">{coverage(r.coveragePct)}</dd></div>
                        <div><dt className="text-[var(--a-ink-3)]">Tracks chosen</dt><dd className="font-semibold">{r.picks.length} of {r.trackCount}</dd></div>
                        <div><dt className="text-[var(--a-ink-3)]">Progress</dt><dd className="font-semibold">{r.progress != null ? `${r.progress}%` : "–"}</dd></div>
                        <div><dt className="text-[var(--a-ink-3)]">Covered / paid</dt><dd className="font-semibold">{usd(r.coveredCents)} / {usd(r.paidCents)}</dd></div>
                        <div>
                          <dt className="text-[var(--a-ink-3)]">{r.status === "claimed" ? "Accepted" : r.status === "approved" ? "Offer ends" : "Approved"}</dt>
                          <dd className="font-semibold">{day(r.status === "claimed" ? r.claimedAt : r.status === "approved" ? r.offerExpiresAt : r.approvedAt)}</dd>
                        </div>
                        <div><dt className="text-[var(--a-ink-3)]">Last sign-in</dt><dd className="font-semibold">{day(r.student?.lastLoginAt ?? null)}</dd></div>
                      </dl>
                      {r.trackIds.length > 0 && <p className="mt-1 font-dm text-[12px] text-[var(--a-ink-3)]">Only: {r.trackTitles.join(", ")}</p>}
                      {terms(r) && <p className="mt-1 font-dm text-[12.5px] text-[var(--a-ink-2)]">{terms(r)}</p>}
                      {(r.pickBy || r.completeBy) && (
                        <p className="mt-0.5 font-dm text-[12px] text-[var(--a-ink-3)]">
                          {r.pickBy ? `Choose tracks by ${day(r.pickBy)}${r.pickBy.getTime() < Date.now() ? " (passed)" : ""}` : ""}
                          {r.pickBy && r.completeBy ? " · " : ""}
                          {r.completeBy ? `Complete by ${day(r.completeBy)}` : ""}
                        </p>
                      )}
                      {r.note && <p className="mt-1 font-dm text-[12px] text-[var(--a-ink-3)]">Note: {r.note}</p>}
                      {r.picks.length > 0 && (
                        <div className="mt-3 overflow-x-auto">
                          <table className="w-full min-w-[560px] font-dm text-[12.5px]">
                            <thead>
                              <tr className="text-left text-[var(--a-ink-3)]">
                                <th className="py-1 pr-3 font-semibold">Track</th>
                                <th className="py-1 pr-3 font-semibold">Unlocked</th>
                                <th className="py-1 pr-3 font-semibold">Paid</th>
                                <th className="py-1 pr-3 font-semibold">Lessons</th>
                                <th className="py-1 pr-3 font-semibold">Best exam</th>
                                <th className="py-1 font-semibold">Certificate</th>
                              </tr>
                            </thead>
                            <tbody>
                              {r.picks.map((p) => (
                                <tr key={p.trackId} className="border-t border-[var(--a-border)]">
                                  <td className="py-1.5 pr-3 font-semibold text-[var(--a-ink)]">{p.trackTitle}</td>
                                  <td className="py-1.5 pr-3">{day(p.at)}</td>
                                  <td className="py-1.5 pr-3">{p.paidCents ? `${usd(p.paidCents)} of ${usd(p.listCents)}` : "Free"}</td>
                                  <td className="py-1.5 pr-3">{p.lessonsDone}/{p.lessonsTotal}</td>
                                  <td className="py-1.5 pr-3">{p.examBest != null ? `${p.examBest}%${p.examPassed ? " · passed" : ""}` : "–"}</td>
                                  <td className="py-1.5">{p.certificate ? <a href={`/certificates/${p.certificate}`} className="text-[var(--a-blue)] hover:underline" target="_blank" rel="noreferrer">Issued</a> : "–"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                      <p className="mt-2 font-dm text-[11.5px] text-[var(--a-ink-3)]">
                        Created {day(r.createdAt)} by {r.createdBy ?? "staff"}
                        {r.approvedAt ? ` · approved ${day(r.approvedAt)} by ${r.approvedBy ?? "staff"}` : ""}
                        {r.emailedAt ? ` · emailed ${day(r.emailedAt)}` : r.status === "approved" ? " · email not sent" : ""}
                        {r.revokedAt ? ` · revoked ${day(r.revokedAt)}` : ""}
                        {r.status !== "revoked" ? (
                          <>
                            {" · "}
                            <a href={`/api/admin/learn/scholarships/${r.id}/letter`} target="_blank" rel="noreferrer" className="font-semibold text-[var(--a-blue)] hover:underline">Award letter</a>
                          </>
                        ) : null}
                      </p>
                    </div>
                    {award && r.status !== "draft" && r.status !== "revoked" && (
                      <div className="w-full sm:w-auto">
                        <AwardActions id={r.id} status={r.status} freeTracks={free} />
                      </div>
                    )}
                  </div>
                  {award && (r.status === "approved" || r.status === "claimed") && (
                    <EditScholarship
                      s={editable(r)}
                      tracks={trackOptions}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>
      <div id="donations" className="scroll-mt-24">
        <Card
          title="Donations to the scholarship fund"
          subtitle="Gifts from the donate box (ARFA, the scholarship page, Partners, About). Each donor gets a thank-you email; payment receipts come from Stripe."
          padded={false}
        >
          {!donations || donations.recent.length === 0 ? (
            <p className="p-5 font-dm text-[13.5px] text-[var(--a-ink-3)]">No donations yet.</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 p-4 lg:grid-cols-4">
                <StatCard label="Raised" value={usd(donations.raisedCents)} />
                <StatCard label="Donors" value={donations.donors} />
                <StatCard label="Monthly donors" value={donations.monthlyActive} />
                <StatCard label="Monthly pledged" value={usd(donations.monthlyCents)} />
              </div>
              <ul className="divide-y divide-[var(--a-border)]" data-testid="donations">
                {donations.recent.map((d) => (
                  <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 font-dm text-[13px]">
                    <span className="min-w-0 break-words">
                      <strong className="text-[var(--a-ink)]">{d.name ?? "Donor"}</strong>
                      {d.email ? <span className="text-[var(--a-ink-3)]"> · {d.email}</span> : null}
                    </span>
                    <span className="flex flex-wrap items-center gap-2">
                      <Badge tone={d.frequency === "monthly" ? (d.canceled ? "neutral" : "orange") : "info"}>
                        {d.frequency === "monthly" ? (d.stage === "renewal" ? "Monthly renewal" : d.canceled ? "Monthly (stopped)" : "Monthly") : "One time"}
                      </Badge>
                      <strong>{usd(d.amountCents)}</strong>
                      <span className="text-[var(--a-ink-3)]">{day(d.at)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>
      </div>

      <Card title="Sponsors" subtitle="Who funds the awards, and the impact of their support. Reports show scholars by first name and initial only." padded={false}>
        {sponsors.length === 0 ? (
          <p className="p-5 font-dm text-[13.5px] text-[var(--a-ink-3)]">No sponsor named on an award yet. Add one in the award form.</p>
        ) : (
          <ul className="divide-y divide-[var(--a-border)]" data-testid="sponsors">
            {sponsors.map((x) => (
              <li key={x.name} className="flex flex-wrap items-start justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="break-words font-dm text-[14px] font-semibold text-[var(--a-ink)]">{x.name}</p>
                  <p className="font-dm text-[12.5px] text-[var(--a-ink-2)]">
                    {x.awarded} awarded · {x.accepted} scholars · {x.tracksUnlocked} tracks · {usd(x.coveredCents)} covered · progress {x.progress != null ? `${x.progress}%` : "–"} · {x.certificates} certificates
                  </p>
                  <Link href={`/admin_pro/learn/scholarships/impact?sponsor=${encodeURIComponent(x.name)}`} className="font-dm text-[12.5px] font-semibold text-[var(--a-blue)] hover:underline">
                    Open impact report
                  </Link>
                </div>
                {award && <SponsorReportButton sponsor={x.name} email={x.email} />}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
