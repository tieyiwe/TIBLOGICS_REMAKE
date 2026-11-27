import { clientIp } from "@/lib/client-ip";
import { NextRequest, NextResponse } from "next/server";
import { getLocale, translatorFor } from "@/lib/i18n/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { csrfGuard } from "@/lib/learn/account-status/admin-auth";
import { scanByToken, startCheckout } from "@/lib/agent-ready/service";

// POST { buy: "report" | "kit" }: Stripe checkout for this scan. The price
// comes from the server and what the scan already has, never the request.

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const bad = csrfGuard(req);
  if (bad) return bad;
  const locale = await getLocale();
  const t = translatorFor(locale);
  if (!(await checkRateLimit(`agent-ready-checkout:${clientIp(req.headers)}`, 10, 3_600_000))) {
    return NextResponse.json({ error: t("tools.agent.err.rate") }, { status: 429 });
  }
  const body = (await req.json().catch(() => null)) as { buy?: unknown } | null;
  const buy = body?.buy === "kit" ? "kit" : body?.buy === "report" ? "report" : null;
  if (!buy) return NextResponse.json({ error: t("tools.agent.err.invalid") }, { status: 400 });
  const row = await scanByToken((await params).token);
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const out = await startCheckout(row, buy, locale, req.headers.get("cookie"));
  if (!out.ok) return NextResponse.json({ error: t(`tools.agent.err.${out.error}`) }, { status: out.error === "owned" ? 409 : 502 });
  return NextResponse.json({ url: out.url });
}
