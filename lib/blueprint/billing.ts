import type Stripe from "stripe";
import prisma from "@/lib/prisma";
import { ensureBlueprintTables } from "./db";
import { creditDays, formatMoney } from "./config";
import { blueprintLink } from "./token";
import { sendBlueprintPaidEmail } from "./email";
import { generateBlueprint } from "./generate";
import { isLocale } from "@/lib/i18n/config";

/** The language saved with the intake at purchase, if any. */
function localeOf(intake: unknown) {
  const l = (intake as { locale?: unknown } | null)?.locale;
  return isLocale(l) ? l : undefined;
}

/**
 * Checkout paid: mark the draft paid, email the link and credit code, and
 * start writing. Only a `draft` row moves to `paid`, in one conditional
 * update, so a retried webhook sends one email and starts one generation.
 */
export async function markBlueprintPaid(blueprintId: string, session: Stripe.Checkout.Session) {
  if (session.payment_status !== "paid") return;
  await ensureBlueprintTables();
  const paidAt = new Date();
  const updated = await prisma.blueprint.updateMany({
    where: { id: blueprintId, status: "draft" },
    data: {
      status: "paid",
      paidAt,
      amountPaid: session.amount_total ?? 0,
      // stripeSessionId was stored when checkout was created. Writing it
      // again here could only fail (it is unique), and a failure at this
      // point would leave a paying customer with nothing.
      creditExpiresAt: new Date(paidAt.getTime() + creditDays() * 86_400_000),
    },
  });
  if (updated.count === 0) return;

  const bp = await prisma.blueprint.findUniqueOrThrow({ where: { id: blueprintId } });
  await sendBlueprintPaidEmail({
    email: bp.email,
    name: bp.name,
    company: bp.company,
    link: await blueprintLink(bp),
    creditCode: bp.creditCode,
    credit: formatMoney(bp.amountPaid),
    creditUntil: bp.creditExpiresAt!.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
    locale: localeOf(bp.intake),
  }).catch((err) => console.error("[blueprint] paid email failed", blueprintId, err instanceof Error ? err.message : err));

  // Not awaited: Stripe needs a prompt answer. If this process dies first, the
  // blueprints cron job picks it up.
  generateBlueprint(blueprintId).catch((err) => console.error("[blueprint] first generation", blueprintId, err));
}
