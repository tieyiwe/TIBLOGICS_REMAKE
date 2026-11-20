import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getLocale } from "@/lib/i18n/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { activePlan, calculatorAccess, confirmReturn, cookieOptions, planDays, planKey, PLAN_COOKIE, priceLabel, crossSite } from "@/lib/calculator/plan";

// The calculator's Full Plan on this browser.
//   GET                      -> { full, via, expiresAt, price, days }
//   POST { sessionId }       back from Stripe: checks the session with Stripe, sets the cookie
//   POST { key }             the access link from the confirmation email: sets the cookie
//   DELETE                   forget the plan on this browser (a shared computer)

export const dynamic = "force-dynamic";

const Body = z.union([z.object({ sessionId: z.string().max(300) }), z.object({ key: z.string().max(120) })]);

async function status(cookie: string | undefined) {
  const a = await calculatorAccess(cookie);
  return { full: a.full, via: a.via, expiresAt: a.expiresAt, price: priceLabel(await getLocale()), days: planDays() };
}

export async function GET(req: NextRequest) {
  return NextResponse.json(await status(req.cookies.get(PLAN_COOKIE)?.value), { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: NextRequest) {
  if (crossSite(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (!(await checkRateLimit(`calc-plan:${ip}`, 30, 3_600_000))) {
    return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  }
  const body = Body.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const plan = "sessionId" in body.data ? await confirmReturn(body.data.sessionId) : await activePlan(body.data.key);
  if (!plan) return NextResponse.json({ full: false, error: "not_active" }, { status: 404 });
  const key = planKey(plan.id);
  if (!key) return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  const res = NextResponse.json({ full: true, via: "plan", expiresAt: plan.expiresAt.toISOString() });
  res.cookies.set(PLAN_COOKIE, key, cookieOptions(plan.expiresAt));
  return res;
}

export async function DELETE(req: NextRequest) {
  if (crossSite(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(PLAN_COOKIE, "", { ...cookieOptions(new Date(0)), maxAge: 0 });
  return res;
}
