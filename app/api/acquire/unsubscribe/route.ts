import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { escapeHtml } from "@/lib/require-admin";
import { getLocale, translatorFor } from "@/lib/i18n/server";
import { outreachTablesReady } from "@/lib/growth/outreach/db";
import { suppress, verifyUnsubscribeToken } from "@/lib/growth/outreach/suppression";

// One-click unsubscribe from lead magnet emails. The token is signed (same
// scheme as outreach), so opening the link is enough: the newsletter
// subscription is switched off and the address is suppressed for outreach.
// POST serves RFC 8058 List-Unsubscribe-Post from mail clients.
export const dynamic = "force-dynamic";

async function handle(token: string | null): Promise<string | null> {
  const email = verifyUnsubscribeToken(token);
  if (!email) return null;
  await prisma.newsletterSubscriber.updateMany({ where: { email, active: true }, data: { active: false, unsubscribedAt: new Date() } });
  if (await outreachTablesReady()) await suppress(email, "unsubscribe", "acquire");
  return email;
}

function page(lang: string, title: string, body: string, status = 200) {
  const html = `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;font-family:Arial,Helvetica,sans-serif;background:#F4F7FB;color:#0D1B2A">
<main style="max-width:520px;margin:12vh auto;padding:32px;background:#fff;border-radius:16px;box-shadow:0 4px 20px rgba(0,0,0,.06)">
<p style="margin:0 0 8px;font-weight:700;color:#1B3A6B">TIB<span style="color:#F47C20">LOGICS</span></p>
<h1 style="font-size:22px;margin:0 0 12px">${escapeHtml(title)}</h1><p style="line-height:1.6;color:#3A4A5C">${escapeHtml(body)}</p></main></body></html>`;
  return new NextResponse(html, { status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex" } });
}

export async function GET(req: NextRequest) {
  const locale = await getLocale();
  const t = translatorFor(locale);
  try {
    const email = await handle(req.nextUrl.searchParams.get("t"));
    if (!email) return page(locale, t("acquire.unsub.invalidTitle"), t("acquire.unsub.invalidBody"), 400);
    return page(locale, t("acquire.unsub.title"), t("acquire.unsub.body", { email }));
  } catch (err) {
    console.error("[api/acquire/unsubscribe]", err);
    return page(locale, t("acquire.unsub.invalidTitle"), t("acquire.unsub.invalidBody"), 503);
  }
}

export async function POST(req: NextRequest) {
  try {
    const email = await handle(req.nextUrl.searchParams.get("t"));
    return email ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Invalid token" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }
}
