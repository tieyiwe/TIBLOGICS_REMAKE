import { NextResponse } from "next/server";
import { getToolkitAccess, type ToolkitAccess } from "./access";

/**
 * The route-level check: a signed-in TIBLOGICS account with an active plan,
 * and (for the prompt library) the plan that includes it.
 */
export async function requireToolkit(
  opts: { generate?: boolean } = {},
): Promise<{ access: ToolkitAccess; error?: undefined } | { error: NextResponse; access?: undefined }> {
  const access = await getToolkitAccess();
  if (!access) return { error: NextResponse.json({ error: "Sign in to use Toolkit Live." }, { status: 401 }) };
  if (!access.plan) return { error: NextResponse.json({ error: "This needs an active subscription." }, { status: 402 }) };
  if (opts.generate && !access.plan.generate) {
    return { error: NextResponse.json({ error: "The prompt library is part of Toolkit Live. Your plan includes Compliance Guard." }, { status: 403 }) };
  }
  return { access };
}
