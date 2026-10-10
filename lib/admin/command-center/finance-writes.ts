import prisma from "@/lib/prisma";
import { dayToDate } from "./dates";

// Field mapping shared by the income, expense and recurring routes: day keys
// to stored dates, and the USD amounts computed from the entry's own rate
// (USD entries always use 1).

const INT_MAX = 2_147_483_647;

export class FinanceInputError extends Error {}

export function usdFields(amountCents: number, currency: string, fxRate: number, taxCents: number) {
  const rate = currency === "USD" ? 1 : fxRate;
  const amountUsdCents = Math.round(amountCents * rate);
  const taxUsdCents = Math.round(taxCents * rate);
  if (amountUsdCents > INT_MAX || taxUsdCents > INT_MAX) throw new FinanceInputError("Amount is too large");
  return { fxRate: rate, amountUsdCents, taxUsdCents };
}

export async function assertProject(projectId: string | null | undefined) {
  if (!projectId) return;
  const p = await prisma.project.findUnique({ where: { id: projectId }, select: { id: true } });
  if (!p) throw new FinanceInputError("Project not found");
}

export async function assertReceipt(receiptId: string | null | undefined) {
  if (!receiptId) return;
  const r = await prisma.finReceipt.findUnique({ where: { id: receiptId }, select: { id: true } });
  if (!r) throw new FinanceInputError("Receipt not found");
}

export const dateOrNull = (k: string | null | undefined) => (k ? dayToDate(k) : null);

/** Keys of a patch that touch money, so USD amounts are recomputed. */
export const MONEY_KEYS = ["amountCents", "currency", "fxRate", "taxCents"] as const;
