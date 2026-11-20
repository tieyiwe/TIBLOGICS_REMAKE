import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import mailer from "@/lib/resend";
import { escapeHtml, secretEquals } from "@/lib/require-admin";
import { ensureFinanceTables, ensurePmTables } from "@/lib/admin/command-center/db";
import { addDays, dayToDate, keyOf } from "@/lib/admin/command-center/dates";
import { budgetLines, generateRecurringExpenses, monthlyTotals, raiseBudgetAlerts } from "@/lib/admin/command-center/finance";
import { monthKey } from "@/lib/admin/command-center/money";
import { listStaff, notify, taskHref } from "@/lib/admin/command-center/pm";

// Command Center housekeeping. Safe to run hourly; every step is idempotent.
//   1. Recurring expenses: creates the expense for each period that came due
//      (unique per charge and period, so never twice).
//   2. Invoices past their due date are marked overdue.
//   3. Budget alerts at 80% / 100% (once per category, month and level).
//   4. In-app reminders for tasks due today and overdue (once per task per due date).
//   5. Daily email digest to each assignee with work due today or overdue,
//      unless they turned it off in My work. At most one per person per day:
//      the day is claimed before sending. Skipped when SMTP is not configured.
//   npm run cron pm
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const SITE = (process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "https://tiblogics.com").replace(/\/$/, "");

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const bearer = req.headers.get("authorization")?.replace(/^Bearer /, "") ?? null;
  if (!secretEquals(bearer, cronSecret)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await ensurePmTables();
  await ensureFinanceTables();
  const now = new Date();
  const today = keyOf(now)!;
  const result: Record<string, unknown> = {};
  const errors: string[] = [];

  try {
    result.recurringCreated = await generateRecurringExpenses(now);
  } catch (err) {
    errors.push(`recurring: ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const flipped = await prisma.finIncome.updateMany({
      where: { status: "invoiced", dueDate: { lt: dayToDate(today) } },
      data: { status: "overdue", updatedAt: now },
    });
    result.invoicesOverdue = flipped.count;
  } catch (err) {
    errors.push(`invoices: ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const m = monthKey(now);
    const [totals] = await monthlyTotals(m, m);
    result.budgetAlerts = await raiseBudgetAlerts(m, budgetLines(await prisma.finBudget.findMany(), totals.expensesByCategory));
  } catch (err) {
    errors.push(`budgets: ${err instanceof Error ? err.message : String(err)}`);
  }

  const staff = await listStaff();
  const open = await prisma.projectTask.findMany({
    where: {
      assigneeId: { not: null },
      done: false,
      status: { not: "done" },
      dueDate: { lte: dayToDate(addDays(today, 1)) },
      project: { archived: false },
    },
    select: { id: true, text: true, projectId: true, assigneeId: true, dueDate: true, project: { select: { name: true } } },
    take: 3000,
  });

  let reminders = 0;
  for (const t of open) {
    const due = keyOf(t.dueDate)!;
    if (due > today) continue;
    await notify([t.assigneeId], {
      kind: due < today ? "overdue" : "due",
      title: due < today ? `Overdue: "${t.text}"` : `Due today: "${t.text}"`,
      body: t.project.name,
      href: taskHref(t.projectId, t.id),
      dedupeKey: `${due < today ? "overdue" : "due"}:${t.id}:${due}`,
    });
    reminders++;
  }
  result.reminders = reminders;

  let digests = 0;
  if (process.env.TITAN_SMTP_PASS && req.nextUrl.searchParams.get("digest") !== "0") {
    const startOfDay = new Date(`${today}T00:00:00.000Z`);
    for (const person of staff) {
      const mine = open.filter((t) => t.assigneeId === person.id);
      if (!mine.length) continue;
      await prisma.pmPrefs.upsert({ where: { staffId: person.id }, create: { staffId: person.id }, update: {} });
      const claim = await prisma.pmPrefs.updateMany({
        where: { staffId: person.id, emailDigest: true, OR: [{ lastDigestAt: null }, { lastDigestAt: { lt: startOfDay } }] },
        data: { lastDigestAt: now },
      });
      if (claim.count !== 1) continue;
      const overdue = mine.filter((t) => keyOf(t.dueDate)! < today);
      const dueToday = mine.filter((t) => keyOf(t.dueDate) === today);
      const dueTomorrow = mine.filter((t) => keyOf(t.dueDate)! > today);
      const list = (title: string, rows: typeof mine) =>
        rows.length
          ? `<h3 style="font:600 14px Arial,sans-serif;color:#0D1B2A;margin:18px 0 6px">${title}</h3><ul style="margin:0;padding-left:18px">${rows
              .map(
                (r) =>
                  `<li style="font:14px/1.6 Arial,sans-serif;color:#3A4A5C"><a href="${SITE}${taskHref(r.projectId, r.id)}" style="color:#2251A3">${escapeHtml(r.text)}</a> <span style="color:#5A6E84">· ${escapeHtml(r.project.name)}</span></li>`,
              )
              .join("")}</ul>`
          : "";
      const html = `<div style="max-width:560px;margin:0 auto;padding:24px">
        <p style="font:600 16px Arial,sans-serif;color:#0D1B2A">Good morning ${escapeHtml(person.name.split(" ")[0])},</p>
        <p style="font:14px/1.6 Arial,sans-serif;color:#3A4A5C">Here is your work in the TIBLOGICS Command Center.</p>
        ${list(`Overdue (${overdue.length})`, overdue)}${list(`Due today (${dueToday.length})`, dueToday)}${list(`Due tomorrow (${dueTomorrow.length})`, dueTomorrow)}
        <p style="margin-top:22px"><a href="${SITE}/admin_pro/command-center/my-work" style="display:inline-block;background:#1B3A6B;color:#fff;padding:10px 16px;border-radius:10px;font:600 14px Arial,sans-serif;text-decoration:none">Open My work</a></p>
        <p style="font:12px/1.6 Arial,sans-serif;color:#5A6E84;margin-top:22px">You get this email because tasks are assigned to you. Turn it off under My work, Email digest.</p>
      </div>`;
      try {
        await mailer.emails.send({
          to: person.email,
          subject: `Your work today: ${overdue.length ? `${overdue.length} overdue, ` : ""}${dueToday.length} due today`,
          html,
        });
        digests++;
      } catch (err) {
        errors.push(`digest ${person.id}: ${err instanceof Error ? err.message.slice(0, 120) : String(err)}`);
      }
    }
  }
  result.digests = digests;
  return NextResponse.json({ ok: errors.length === 0, ...result, errors });
}

export const POST = GET;
