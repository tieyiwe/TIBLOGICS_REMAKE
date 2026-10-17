import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/require-admin";
import { audit } from "@/lib/admin/audit";
import { badRequest, currentStaff, jsonBody, writeGuard, zodMessage } from "@/lib/admin/command-center/guard";
import { getFinanceSettings, saveFinanceSettings } from "@/lib/admin/command-center/finance";
import { financeSettingsSchema } from "@/lib/admin/command-center/schemas";
import { PERM_FINANCE } from "@/lib/admin/command-center/permissions";

export const dynamic = "force-dynamic";

export async function GET() {
  const denied = await requirePermission(PERM_FINANCE);
  if (denied) return denied;
  return NextResponse.json({ settings: await getFinanceSettings() });
}

/** Stripe fee estimate, automatic expense switches and default exchange rates. */
export async function PATCH(req: NextRequest) {
  const denied = await requirePermission(PERM_FINANCE);
  if (denied) return denied;
  const staff = await currentStaff();
  if (!staff) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const blocked = await writeGuard(req, staff, "finance", { max: 20 });
  if (blocked) return blocked;
  const parsed = financeSettingsSchema.safeParse(await jsonBody(req));
  if (!parsed.success) return badRequest(zodMessage(parsed.error));
  const settings = await saveFinanceSettings(parsed.data);
  await audit(staff.session, "finance.settings.update", { type: "finance_settings" }, parsed.data as Record<string, unknown>);
  return NextResponse.json({ settings });
}
