import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { requireAdminPage } from "../../_lib/admin-page-auth";
import { ensureScannerColumns } from "@/lib/scanner/db";
import { allFindings, readExtra } from "@/lib/scanner/view";
import { findingText } from "@/lib/scanner/i18n";
import { translatorFor } from "@/lib/i18n/server";
import { readFixPlan } from "@/lib/scanner/fix-plan";
import FixPlanPanel from "./FixPlanPanel";
import UnlockButton from "../UnlockButton";
import { scanLogsForLead } from "@/lib/analytics/scan-log";
import { countryName, flag } from "@/lib/geo";

// One scan, for the team: the visitor's report in full (whatever they paid
// for), the booking it led to, and the INTERNAL fix plan (never shown to the
// customer; lib/scanner/fix-plan.ts).
export const dynamic = "force-dynamic";

const AREA: Record<string, string> = { seo: "SEO", perf: "Speed", ux: "Usability", ai: "AI readiness", growth: "Lead capture", security: "Security" };
const tone = (type: string) => (type === "bad" ? "text-red-700 bg-red-50" : type === "warning" ? "text-amber-800 bg-amber-50" : "text-green-800 bg-green-50");

export default async function ScanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();
  const { id } = await params;
  if (!/^[a-z0-9]{10,40}$/i.test(id)) notFound();
  await ensureScannerColumns();
  const lead = await prisma.scannerLead.findUnique({ where: { id } });
  if (!lead) notFound();
  const extra = readExtra(lead.extra);
  const t = translatorFor("en");
  const findings = allFindings(lead);
  const problems = findings.filter((f) => f.type !== "good");
  const appointment = lead.appointmentId
    ? await prisma.appointment.findUnique({ where: { id: lead.appointmentId }, select: { id: true, date: true, timeSlot: true, serviceType: true, firstName: true, lastName: true, status: true } }).catch(() => null)
    : null;
  const plan = readFixPlan(lead.report);
  // Where and on what device it was scanned (the scan log, lib/analytics/scan-log.ts).
  const origin = (await scanLogsForLead(lead.id))[0] ?? null;
  const scores: Array<[string, number | null]> = [
    ["Overall", lead.overallScore], ["SEO", lead.seoScore], ["Speed", lead.perfScore], ["Usability", lead.uxScore], ["AI readiness", lead.aiScore],
    ["Lead capture", extra?.growthScore ?? null], ["Security", extra?.securityScore ?? null],
  ];
  const card = "rounded-2xl border border-[var(--a-border)] bg-[var(--a-surface)] p-5";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href="/admin_pro/scanner-leads" className="text-xs font-dm text-[var(--a-blue)] hover:underline">← Scanner leads</Link>
          <h1 className="mt-1 break-all font-syne text-2xl font-bold text-[var(--a-ink)]">{lead.domain ?? lead.url}</h1>
          <p className="mt-1 font-dm text-sm text-[var(--a-ink-3)]">
            Scanned {lead.createdAt.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
            {lead.email ? ` · ${lead.email}` : " · no email"}
            {lead.unlockedAt ? ` · unlocked (${lead.unlockSource})` : " · free view"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {lead.token && (
            <Link href={`/tools/scanner/report/${lead.token}`} target="_blank" className="rounded-lg border border-[var(--a-border)] px-3 py-2 text-sm font-semibold text-[var(--a-ink)] hover:border-[var(--a-blue)]">
              Customer view ↗
            </Link>
          )}
          {!lead.unlockedAt && <UnlockButton id={lead.id} />}
        </div>
      </div>

      <div className={card} data-testid="scan-origin">
        <h2 className="font-syne text-base font-bold text-[var(--a-ink)]">Where it was scanned</h2>
        {origin ? (
          <dl className="mt-3 grid gap-x-6 gap-y-1 font-dm text-sm sm:grid-cols-2">
            {[
              ["Location", origin.country ? `${flag(origin.country)} ${[origin.city, origin.region, origin.countryName ?? countryName(origin.country) ?? origin.country].filter(Boolean).join(", ")}` : "Unknown"],
              ["Device", [origin.device, origin.browser, origin.os].filter(Boolean).join(" · ")],
              ["Started from", origin.fromPage === "/" ? "Home page quick scan" : origin.fromPage === "/tools/scanner" ? "Scanner page" : origin.fromPage ?? "–"],
              ["Language", origin.locale?.toUpperCase() ?? "–"],
              ["Outcome", `${origin.outcome}${origin.staff ? " (staff scan)" : ""}`],
            ].map(([k, v]) => (
              <div key={k} className="flex gap-2"><dt className="text-[var(--a-ink-3)]">{k}:</dt><dd className="text-[var(--a-ink)]">{v}</dd></div>
            ))}
          </dl>
        ) : (
          <p className="mt-2 font-dm text-sm text-[var(--a-ink-3)]">Not recorded: this scan is older than the scan log.</p>
        )}
        <Link href={`/admin_pro/scanner-leads/scan-log?q=${encodeURIComponent(lead.domain ?? "")}&range=90`} className="mt-3 inline-block font-dm text-xs font-semibold text-[var(--a-blue)] hover:underline">Every scan of this site →</Link>
      </div>

      {(appointment || lead.bookedCallAt) && (
        <div className={`${card} border-[var(--a-blue)]`} data-testid="scan-booking">
          <p className="font-dm text-sm font-semibold text-[var(--a-ink)]">📅 Booked a call from this report</p>
          {appointment ? (
            <p className="mt-1 font-dm text-sm text-[var(--a-ink-2)]">
              {appointment.firstName} {appointment.lastName} · {appointment.serviceType} · {appointment.date.toLocaleDateString("en-US", { dateStyle: "medium" })} {appointment.timeSlot} · {appointment.status}{" "}
              · <Link href={`/admin_pro/appointments?open=${appointment.id}`} className="text-[var(--a-blue)] hover:underline">Open booking</Link>
            </p>
          ) : (
            <p className="mt-1 font-dm text-sm text-[var(--a-ink-2)]">{lead.bookedCallAt?.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}</p>
          )}
        </div>
      )}

      <div className={card}>
        <h2 className="font-syne text-base font-bold text-[var(--a-ink)]">Scores</h2>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {scores.map(([k, v]) => (
            <div key={k} className="rounded-xl bg-[var(--a-surface-2)] px-3 py-2">
              <p className="font-dm text-[11px] text-[var(--a-ink-3)]">{k}</p>
              <p className="font-syne text-lg font-bold text-[var(--a-ink)]">{v ?? "–"}</p>
            </div>
          ))}
        </div>
      </div>

      <FixPlanPanel id={lead.id} initial={plan} />

      <div className={card}>
        <h2 className="font-syne text-base font-bold text-[var(--a-ink)]">Problems found ({problems.length})</h2>
        <ul className="mt-3 space-y-2">
          {problems.map((f, i) => (
            <li key={`${f.check}-${i}`} className="flex gap-3 font-dm text-sm">
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${tone(f.type)}`}>{AREA[f.area] ?? f.area}</span>
              <span className="text-[var(--a-ink-2)]">{findingText(t, "en", f)}</span>
            </li>
          ))}
          {!problems.length && <li className="font-dm text-sm text-[var(--a-ink-3)]">No problems found.</li>}
        </ul>
        <details className="mt-4">
          <summary className="cursor-pointer font-dm text-sm font-semibold text-[var(--a-blue)]">Passed checks ({findings.length - problems.length})</summary>
          <ul className="mt-2 space-y-1">
            {findings.filter((f) => f.type === "good").map((f, i) => (
              <li key={`${f.check}-g${i}`} className="font-dm text-xs text-[var(--a-ink-3)]">✓ {findingText(t, "en", f)}</li>
            ))}
          </ul>
        </details>
      </div>

      {extra?.tech && (
        <div className={card}>
          <h2 className="font-syne text-base font-bold text-[var(--a-ink)]">What the site runs on</h2>
          <dl className="mt-3 grid gap-x-6 gap-y-1 font-dm text-sm sm:grid-cols-2">
            {[
              ["Platform", [extra.tech.cms, extra.tech.cmsVersion].filter(Boolean).join(" ")],
              ["Shop", extra.tech.shop ?? ""],
              ["Analytics", [...extra.tech.analytics, ...extra.tech.pixels].join(", ")],
              ["Booking", extra.tech.booking ?? ""],
              ["Chat", extra.tech.chat.join(", ")],
              ["Languages", extra.tech.languages.join(", ")],
              ["Libraries", extra.tech.libraries.map((x) => `${x.name}${x.version ? ` ${x.version}` : ""}${x.outdated ? " (outdated)" : ""}`).join(", ")],
            ].map(([k, v]) => (
              <div key={k} className="flex gap-2"><dt className="text-[var(--a-ink-3)]">{k}:</dt><dd className="text-[var(--a-ink)]">{v || "–"}</dd></div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}
