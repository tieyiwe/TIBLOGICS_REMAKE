import { NextResponse } from "next/server";
import { getToolkitAccess, type ToolkitAccess } from "./access";
import { getT } from "@/lib/i18n/server";

/**
 * The route-level check: a signed-in TIBLOGICS account with an active plan,
 * and (for the prompt library) the plan that includes it.
 */
export async function requireToolkit(
  opts: { generate?: boolean } = {},
): Promise<{ access: ToolkitAccess; error?: undefined } | { error: NextResponse; access?: undefined }> {
  const access = await getToolkitAccess();
  if (!access) return { error: NextResponse.json({ error: (await getT())("toolkit.api.signInToolkit") }, { status: 401 }) };
  if (!access.plan) return { error: NextResponse.json({ error: (await getT())("toolkit.api.needSub") }, { status: 402 }) };
  if (opts.generate && !access.plan.generate) {
    return { error: NextResponse.json({ error: (await getT())("toolkit.api.libraryPlan") }, { status: 403 }) };
  }
  return { access };
}
