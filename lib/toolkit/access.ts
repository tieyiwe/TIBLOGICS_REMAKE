import prisma from "@/lib/prisma";
import { OWNER_EMAIL } from "@/lib/auth";
import { getStudent, type StudentSession } from "@/lib/learn/session";
import { ensureToolkitTables } from "./db";
import { toolkitPlans, type PlanInfo, type ToolkitPlan } from "./config";

// Who may use Toolkit Live, and how much they have left this month.

export interface ToolkitAccess {
  student: StudentSession;
  plan: PlanInfo | null;
  status: string | null;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: Date | null;
  hasBilling: boolean;
}

// "comped" is free access granted from the admin Test access page.
const ENTITLED = new Set(["active", "trialing", "past_due", "comped"]);

export async function getToolkitAccess(): Promise<ToolkitAccess | null> {
  const student = await getStudent();
  if (!student) return null;
  await ensureToolkitTables();
  const sub = await prisma.toolkitSubscription.findUnique({ where: { studentId: student.id } });
  const plans = toolkitPlans();
  const entitled = !!sub && ENTITLED.has(sub.status);
  // The site owner's own learner account always has the full plan, for testing.
  const owner = !entitled && student.email.toLowerCase() === OWNER_EMAIL.toLowerCase();
  return {
    student,
    plan: entitled ? plans[sub!.plan as ToolkitPlan] ?? null : owner ? plans.toolkit : null,
    status: owner ? "comped" : sub?.status ?? null,
    cancelAtPeriodEnd: sub?.cancelAtPeriodEnd ?? false,
    currentPeriodEnd: sub?.currentPeriodEnd ?? null,
    hasBilling: !!sub?.stripeCustomerId,
  };
}

function monthStart(): Date {
  const n = new Date();
  return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), 1));
}

/** Metered runs used this calendar month (UTC). Rule-only checks are free and not counted. */
export async function runsUsed(studentId: string): Promise<number> {
  return prisma.toolkitRun.count({
    where: { studentId, kind: { in: ["generate", "deep-check"] }, createdAt: { gte: monthStart() } },
  });
}
