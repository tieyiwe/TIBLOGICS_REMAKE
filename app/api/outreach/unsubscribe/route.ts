import { NextRequest, NextResponse } from "next/server";
import { outreachTablesReady } from "@/lib/growth/outreach/db";
import { suppress, verifyUnsubscribeToken } from "@/lib/growth/outreach/suppression";
import { escapeHtml } from "@/lib/require-admin";

export const dynamic = "force-dynamic";

// One-click unsubscribe for outreach emails. The token is signed (no login,
// no form, no "are you sure"): opening the link suppresses the address at
// once, and POST serves RFC 8058 List-Unsubscribe-Post from mail clients.
// CASL allows 10 business days; we honour it on the click.

function page(title: string, body: string, status = 200) {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;font-family:Arial,Helvetica,sans-serif;background:#F4F7FB;color:#0D1B2A">
<main style="max-width:520px;margin:12vh auto;padding:32px;background:#fff;border-radius:16px;box-shadow:0 4px 20px rgba(0,0,0,.06)">
<p style="margin:0 0 8px;font-weight:700;color:#1B3A6B">TIB<span style="color:#F47C20">LOGICS</span></p>
<h1 style="font-size:22px;margin:0 0 12px">${escapeHtml(title)}</h1><p style="line-height:1.6;color:#3A4A5C">${body}</p></main></body></html>`;
  return new NextResponse(html, { status, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store", "x-robots-tag": "noindex" } });
}

async function handle(token: string | null): Promise<{ ok: boolean; email?: string }> {
  const email = verifyUnsubscribeToken(token);
  if (!email) return { ok: false };
  if (!(await outreachTablesReady())) throw new Error("db");
  await suppress(email, "unsubscribe", "link");
  return { ok: true, email };
}

export async function GET(req: NextRequest) {
  try {
    const r = await handle(req.nextUrl.searchParams.get("t"));
    if (!r.ok) return page("Link not recognised", "This unsubscribe link is incomplete or was altered. Reply to the email with “unsubscribe” and we will remove you by hand.", 400);
    return page("You're unsubscribed", `${escapeHtml(r.email!)} will not receive any more outreach emails from TIBLOGICS. This took effect immediately. Sorry for the interruption.`);
  } catch {
    return page("Something went wrong", "We could not record that just now. Please reply to the email with “unsubscribe” and we will remove you by hand.", 503);
  }
}

export async function POST(req: NextRequest) {
  try {
    const r = await handle(req.nextUrl.searchParams.get("t"));
    return r.ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Invalid token" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  }
}
