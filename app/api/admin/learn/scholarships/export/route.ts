import { NextRequest, NextResponse } from "next/server";
import { learnerStaff } from "@/lib/learn/account-status/admin-auth";
import { auditFromRequest } from "@/lib/admin/audit";
import { listScholarships } from "@/lib/learn/scholarship/admin";

// Staff (learners read): every Tilo Vision Scholarship as CSV, one row per
// scholarship track (or one row when none is chosen yet), with progress. A
// bulk export of personal data, so it is written to the audit log.

const cell = (v: unknown) => {
  const s = v == null ? "" : String(v);
  // Quote everything; a leading = + - @ is neutralised (spreadsheet formulas).
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
};
const iso = (d: Date | null) => (d ? d.toISOString() : "");
const usd = (c: number) => (c / 100).toFixed(2);

export async function GET(req: NextRequest) {
  const { error } = await learnerStaff("read");
  if (error) return error;
  const sp = req.nextUrl.searchParams;
  const rows = await listScholarships({ status: sp.get("status"), q: sp.get("q") });
  const header = [
    "Code", "Name", "Email", "Partner", "Sponsor", "Status", "Coverage %", "Tracks awarded", "Tracks chosen", "Approved (UTC)", "Accepted (UTC)",
    "Learner account", "Last sign-in (UTC)", "Track", "List price USD", "Paid USD", "Covered USD", "Lessons done", "Lessons total", "Best exam %", "Certificate",
  ];
  const lines: string[] = [];
  for (const r of rows) {
    const base = [
      r.code, r.name, r.email, r.partnerName ?? "", r.sponsorName ?? "", r.expired ? "expired" : r.status, r.coveragePct, r.trackCount, r.picks.length, iso(r.approvedAt), iso(r.claimedAt),
      r.accountId ?? "", iso(r.student?.lastLoginAt ?? null),
    ];
    if (!r.picks.length) lines.push([...base, "", "", "", "", "", "", "", ""].map(cell).join(","));
    for (const p of r.picks) {
      lines.push(
        [...base, p.trackTitle, usd(p.listCents), usd(p.paidCents), usd(p.coveredCents), p.lessonsDone, p.lessonsTotal, p.examBest ?? "", p.certificate ? "Issued" : ""]
          .map(cell)
          .join(","),
      );
    }
  }
  await auditFromRequest("learners.export", { type: "scholarships" }, { filters: Object.fromEntries(sp) }).catch(() => {});
  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse([header.map(cell).join(","), ...lines].join("\r\n") + "\r\n", {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="tilo-vision-scholarships-${date}.csv"`,
      "Cache-Control": "no-store, private",
    },
  });
}
