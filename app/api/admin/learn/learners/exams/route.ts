import { NextRequest, NextResponse } from "next/server";
import { learnerStaff } from "@/lib/learn/account-status/admin-auth";
import { auditFromRequest } from "@/lib/admin/audit";
import { examResults, OUTCOME_LABEL } from "@/lib/learn/admin/assessments";

// Staff (learners read): every final exam attempt as CSV, with the same
// filters as Admin > AI Academy > Exams. A bulk export of personal data, so
// it is written to the audit log.

const cell = (v: unknown) => {
  const s = v == null ? "" : String(v);
  // Quote everything, double quotes doubled; a leading = + - @ is neutralised
  // so a spreadsheet never runs a learner's name as a formula.
  const safe = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
};

export async function GET(req: NextRequest) {
  const { error } = await learnerStaff("read");
  if (error) return error;
  const sp = req.nextUrl.searchParams;
  const { rows } = await examResults({
    trackId: sp.get("track"),
    outcome: sp.get("outcome"),
    q: sp.get("q"),
    days: Number(sp.get("days")) || null,
    take: 5000,
  });
  const header = ["Learner", "Email", "Track", "Attempt", "Started (UTC)", "Minutes", "Score %", "Outcome"];
  const lines = rows.map((r) =>
    [r.name, r.email, r.trackTitle, r.attempt, r.startedAt.toISOString(), r.minutes ?? "", r.score ?? "", OUTCOME_LABEL[r.outcome]].map(cell).join(","),
  );
  await auditFromRequest("learners.export", { type: "exam-results" }, { filters: Object.fromEntries(sp) }).catch(() => {});
  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse([header.map(cell).join(","), ...lines].join("\r\n") + "\r\n", {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="arfa-exam-results-${date}.csv"`,
      "Cache-Control": "no-store, private",
    },
  });
}
