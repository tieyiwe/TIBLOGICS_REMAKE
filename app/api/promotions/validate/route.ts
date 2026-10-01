import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getT } from "@/lib/i18n/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { getStudent } from "@/lib/learn/session";
import { checkCode, CodeRejected } from "@/lib/promotions/service";
import { linesFor, Target } from "@/lib/promotions/lines";
import { rejectionMessage } from "@/lib/promotions/http";

// Checks a promo code a customer typed before checkout, against server
// prices for what they are buying. Display only: the checkout route checks
// the code again and decides. Rate limited per IP and per learner, so codes
// cannot be guessed by brute force.
const Body = z.object({
  code: z.string().trim().min(1).max(40),
  targets: z.array(Target).min(1).max(4),
  email: z.string().trim().email().max(320).optional(),
});

export async function POST(req: NextRequest) {
  const t = await getT();
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? req.headers.get("x-real-ip") ?? "unknown";
  if (!(await checkRateLimit(`promo-validate:ip:${ip}`, ip === "unknown" ? 300 : 30, 10 * 60_000))) {
    return NextResponse.json({ ok: false, error: t("promo.error.tooMany") }, { status: 429 });
  }
  const student = await getStudent().catch(() => null);
  if (student && !(await checkRateLimit(`promo-validate:student:${student.id}`, 20, 10 * 60_000))) {
    return NextResponse.json({ ok: false, error: t("promo.error.tooMany") }, { status: 429 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ ok: false, error: t("promo.error.invalid") }, { status: 400 });

  const buyer = { studentId: student?.id ?? null, email: student?.email ?? parsed.data.email ?? null };
  const results: Array<{ ok: boolean; originalCents?: number; discountCents?: number; totalCents?: number; error?: string; reason?: string }> = [];
  let firstError: CodeRejected | null = null;
  let code = "";
  try {
    for (const target of parsed.data.targets) {
      const lines = await linesFor(target);
      if (!lines) {
        results.push({ ok: false, reason: "scope", error: t("promo.error.scope") });
        continue;
      }
      try {
        const { promo, quote } = await checkCode(parsed.data.code, lines, buyer);
        code = promo.code ?? code;
        results.push({ ok: true, originalCents: quote.subtotalCents, discountCents: quote.discountCents, totalCents: quote.subtotalCents - quote.discountCents });
      } catch (err) {
        if (!(err instanceof CodeRejected)) throw err;
        firstError ??= err;
        results.push({ ok: false, reason: err.reason, error: rejectionMessage(t, err) });
      }
    }
  } catch (err) {
    console.error("[promotions/validate]", err instanceof Error ? err.message : err);
    return NextResponse.json({ ok: false, error: t("promo.error.generic") }, { status: 500 });
  }
  if (results.some((r) => r.ok)) return NextResponse.json({ ok: true, code, results });
  return NextResponse.json(
    { ok: false, error: firstError ? rejectionMessage(t, firstError) : t("promo.error.scope"), reason: firstError?.reason ?? "scope", results },
    { status: 400 },
  );
}
