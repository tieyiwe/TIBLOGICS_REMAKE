import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/geo";

// POST (form) from /unsubscribe: turns the newsletter off for one address,
// then back to the page with the result. A button press, never a plain link
// visit, so mail scanners that open links cannot unsubscribe anyone.
export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  const email = String(form?.get("email") ?? "").trim().toLowerCase().slice(0, 320);
  const back = new URL("/unsubscribe", req.url);
  back.searchParams.set("email", email);
  if (!(await checkRateLimit(`newsletter-unsub:${clientIp(req.headers) ?? "unknown"}`, 20, 3_600_000))) {
    back.searchParams.set("result", "error");
    return NextResponse.redirect(back, 303);
  }
  let result = "notfound";
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    const r = await prisma.newsletterSubscriber
      .updateMany({ where: { email }, data: { active: false, unsubscribedAt: new Date() } })
      .catch(() => ({ count: -1 }));
    result = r.count > 0 ? "done" : r.count === 0 ? "notfound" : "error";
  }
  back.searchParams.set("result", result);
  return NextResponse.redirect(back, 303);
}
