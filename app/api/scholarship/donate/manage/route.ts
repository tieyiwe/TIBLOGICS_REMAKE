import { NextRequest, NextResponse } from "next/server";
import payments from "@/lib/payments";
import { checkRateLimit } from "@/lib/rate-limit";
import { manageLinkValid } from "@/lib/learn/scholarship/donations";

// The signed link in a monthly donor's thank-you email: opens Stripe's
// billing portal for their gift (change the card, change or stop the gift).
const SITE = (process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "https://tiblogics.com").replace(/\/$/, "");

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (!(await checkRateLimit(`scholarship-donate-manage:${ip}`, 20, 60_000))) return new NextResponse("Too many requests", { status: 429 });
  const c = req.nextUrl.searchParams.get("c") ?? "";
  const s = req.nextUrl.searchParams.get("s") ?? "";
  if (!manageLinkValid(c, s)) return NextResponse.redirect(`${SITE}/tilo-vision-scholarship`);
  try {
    const { url } = await payments.createBillingPortal(c, `${SITE}/tilo-vision-scholarship`);
    return NextResponse.redirect(url);
  } catch (err) {
    console.error("[donate/manage]", err);
    return NextResponse.redirect(`${SITE}/tilo-vision-scholarship`);
  }
}
