import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireStudent } from "@/lib/learn/session";
import { checkRateLimit } from "@/lib/rate-limit";
import { getT } from "@/lib/i18n/server";
import { acceptOffer, TOKEN_RE } from "@/lib/learn/scholarship/service";

const Body = z.object({ token: z.string().regex(TOKEN_RE) });
const STATUS: Record<string, number> = { invalid: 404, expired: 410, wrongEmail: 403, taken: 409 };

/** Accept a Tilo Vision Scholarship with its emailed link (the signed-in address must be the awarded one). */
export async function POST(req: NextRequest) {
  const t = await getT();
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  // Per learner, plus a looser per-network ceiling: scholars at one school
  // or office share an IP and must not block each other.
  if (!(await checkRateLimit(`learn-scholarship:accept:ip:${ip}`, 60, 60_000))) {
    return NextResponse.json({ error: t("learn.api.tooMany") }, { status: 429 });
  }
  const { error, student } = await requireStudent();
  if (error) return error;
  if (!(await checkRateLimit(`learn-scholarship:accept:${student.id}`, 10, 60_000))) {
    return NextResponse.json({ error: t("learn.api.tooMany") }, { status: 429 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: t("learn.scholar.error.invalid") }, { status: 400 });
  const r = await acceptOffer(parsed.data.token, student);
  if (r === "ok") return NextResponse.json({ ok: true });
  return NextResponse.json({ error: t(`learn.scholar.error.${r}`), reason: r }, { status: STATUS[r] ?? 400 });
}
