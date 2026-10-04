import { NextRequest, NextResponse } from "next/server";
import { getStudent } from "@/lib/learn/session";
import { checkRateLimit } from "@/lib/rate-limit";
import { cleanCertificateName, findCertificate } from "@/lib/learn/cert/ref";
import { certData } from "@/lib/learn/cert/data";
import { certificatePng } from "@/lib/learn/cert/render";
import { getLocale } from "@/lib/i18n/server";

// GET /api/learn/certificates/<ref>/preview?name=... : the learner's own
// certificate with the name they are typing (marked SAMPLE), before they
// confirm it. Owner only; rate limited (it is drawn on the server).
export const runtime = "nodejs";

export async function GET(req: NextRequest, ctx: { params: Promise<{ ref: string }> }) {
  const student = await getStudent();
  if (!student) return NextResponse.json({ error: "Sign in" }, { status: 401 });
  const { ref } = await ctx.params;
  const c = await findCertificate(ref).catch(() => null);
  if (!c || c.studentId !== student.id || c.revoked) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!(await checkRateLimit(`cert-preview:${student.id}`, 60, 10 * 60_000))) return NextResponse.json({ error: "Too many previews, wait a few minutes." }, { status: 429 });
  const typed = req.nextUrl.searchParams.get("name") ?? "";
  const name = cleanCertificateName(typed) ?? (typed.trim().slice(0, 70) || c.recipientName);
  const png = await certificatePng(certData(c, await getLocale(), { name, sample: !c.nameConfirmedAt }));
  return new Response(new Uint8Array(png), { headers: { "content-type": "image/png", "cache-control": "private, no-store" } });
}
