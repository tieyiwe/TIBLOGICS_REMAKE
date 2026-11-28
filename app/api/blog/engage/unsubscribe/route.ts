import { NextRequest, NextResponse } from "next/server";
import { translatorFor } from "@/lib/i18n/server";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { escapeHtml as esc } from "@/lib/require-admin";
import { unsubscribeCommenter } from "@/lib/blog/engage/db";
import { verifyToken } from "@/lib/blog/engage/identity";
import { SITE } from "@/lib/reviews/emails";

export const dynamic = "force-dynamic";

// Stop "someone replied to your comment" emails. The link in the email opens
// a page with a button (GET changes nothing, so mail scanners that open links
// cannot unsubscribe anyone); the button, and mail apps' one-click
// unsubscribe (List-Unsubscribe-Post), POST here.

function read(req: NextRequest, t: string | null) {
  const data = verifyToken<{ e?: unknown; l?: unknown }>("unsub", t);
  if (!data || typeof data.e !== "string") return null;
  return { email: data.e, locale: (isLocale(data.l) ? data.l : "en") as Locale };
}

function page(locale: Locale, title: string, body: string, form = "") {
  const html = `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${esc(title)}</title></head>
<body style="margin:0;background:#F4F7FB;font-family:Arial,Helvetica,sans-serif;color:#0D1B2A;">
<main style="max-width:480px;margin:48px auto;padding:0 16px;"><div style="background:#fff;border:1px solid #D2DCE8;border-radius:16px;padding:28px;">
<div style="font-size:20px;font-weight:800;color:#1B3A6B;margin-bottom:16px;">TIB<span style="color:#F47C20;">LOGICS</span></div>
<h1 style="font-size:20px;margin:0 0 10px;">${esc(title)}</h1><p style="font-size:15px;line-height:1.6;color:#3A4A5C;margin:0 0 18px;">${esc(body)}</p>${form}
<p style="margin:18px 0 0;"><a href="${SITE}/ai-times" style="color:#2251A3;font-size:14px;">AI Times →</a></p></div></main></body></html>`;
  return new NextResponse(html, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });
}

export async function GET(req: NextRequest) {
  const tok = req.nextUrl.searchParams.get("t");
  const who = read(req, tok);
  const t = translatorFor(who?.locale ?? "en");
  if (!who) return page("en", t("engageMail.unsub.badTitle"), t("engageMail.unsub.badBody"));
  const form = `<form method="post"><input type="hidden" name="t" value="${esc(tok!)}"><button type="submit" style="background:#F47C20;color:#fff;border:0;border-radius:999px;padding:12px 24px;font-weight:700;font-size:15px;cursor:pointer;">${esc(t("engageMail.unsub.button"))}</button></form>`;
  return page(who.locale, t("engageMail.unsub.title"), t("engageMail.unsub.body"), form);
}

export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  const tok = (form?.get("t") as string | null) ?? req.nextUrl.searchParams.get("t");
  const who = read(req, tok);
  const t = translatorFor(who?.locale ?? "en");
  if (!who) return page("en", t("engageMail.unsub.badTitle"), t("engageMail.unsub.badBody"));
  await unsubscribeCommenter(who.email);
  return page(who.locale, t("engageMail.unsub.doneTitle"), t("engageMail.unsub.doneBody"));
}
