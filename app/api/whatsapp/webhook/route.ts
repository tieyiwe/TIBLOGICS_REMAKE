import { NextRequest, NextResponse } from "next/server";
import { secretEquals } from "@/lib/require-admin";
import { validSignature } from "@/lib/learn/reminders/whatsapp";
import { handleWhatsappWebhook } from "@/lib/learn/reminders/inbound";

// WhatsApp Cloud API webhook (Meta App Dashboard, WhatsApp, Configuration):
//   GET   verification: echo hub.challenge when hub.verify_token matches
//         WHATSAPP_VERIFY_TOKEN.
//   POST  deliveries: X-Hub-Signature-256 must be the HMAC SHA-256 of the raw
//         body with WHATSAPP_APP_SECRET. Handles STOP / START and statuses.

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const token = process.env.WHATSAPP_VERIFY_TOKEN;
  if (!token) return new NextResponse("Not configured", { status: 503 });
  if (q.get("hub.mode") === "subscribe" && secretEquals(q.get("hub.verify_token"), token)) {
    return new NextResponse(q.get("hub.challenge") ?? "", { status: 200, headers: { "content-type": "text/plain" } });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(req: NextRequest) {
  if (!process.env.WHATSAPP_APP_SECRET) return new NextResponse("Not configured", { status: 503 });
  const raw = await req.text();
  if (raw.length > 1_000_000) return new NextResponse("Too large", { status: 413 });
  if (!validSignature(raw, req.headers.get("x-hub-signature-256"))) {
    return new NextResponse("Invalid signature", { status: 401 });
  }
  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return new NextResponse("Bad request", { status: 400 });
  }
  try {
    const report = await handleWhatsappWebhook(payload as Parameters<typeof handleWhatsappWebhook>[0]);
    return NextResponse.json({ ok: true, ...report });
  } catch (err) {
    // A 500 makes Meta retry the delivery later, which is what we want.
    console.error("[whatsapp/webhook]", err);
    return new NextResponse("Error", { status: 500 });
  }
}
