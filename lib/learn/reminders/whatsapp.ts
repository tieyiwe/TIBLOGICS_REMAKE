// WhatsApp Cloud API (Meta Graph API) for study reminders.
//
// Environment:
//   WHATSAPP_TOKEN               permanent system-user access token
//   WHATSAPP_PHONE_NUMBER_ID     the sending number's id (not the number itself)
//   WHATSAPP_TEMPLATE_REMINDER   approved template name, with an "en" and a "fr"
//                                translation (body variables {{1}} name,
//                                {{2}} next lesson, {{3}} streak in days)
//   WHATSAPP_APP_SECRET          signs webhook deliveries (X-Hub-Signature-256)
//   WHATSAPP_VERIFY_TOKEN        echoed back when Meta verifies the webhook
// Optional:
//   WHATSAPP_TEMPLATE_LANG_EN / _FR   template language codes (default en, fr)
//   WHATSAPP_API_VERSION              default v21.0
//   WHATSAPP_API_BASE                 default https://graph.facebook.com (tests
//                                     point it at a local stand-in)
//
// Without the first three the feature is hidden in account settings and the
// scheduler sends no WhatsApp messages.
import { createHmac, timingSafeEqual } from "crypto";
import type { ReminderLanguage } from "./shared";

export function whatsappConfigured(): boolean {
  return !!(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID && process.env.WHATSAPP_TEMPLATE_REMINDER);
}

function endpoint(): string {
  const base = (process.env.WHATSAPP_API_BASE || "https://graph.facebook.com").replace(/\/$/, "");
  const version = process.env.WHATSAPP_API_VERSION || "v21.0";
  return `${base}/${version}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
}

export type SendResult = { ok: true; id: string } | { ok: false; error: string };

async function post(body: unknown): Promise<SendResult> {
  try {
    const res = await fetch(endpoint(), {
      method: "POST",
      headers: { authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
    });
    const data = (await res.json().catch(() => ({}))) as { messages?: Array<{ id?: string }>; error?: { message?: string; code?: number } };
    const id = data.messages?.[0]?.id;
    if (!res.ok || !id) return { ok: false, error: `${res.status} ${data.error?.code ?? ""} ${data.error?.message ?? ""}`.trim().slice(0, 300) };
    return { ok: true, id };
  } catch (err) {
    return { ok: false, error: (err instanceof Error ? err.message : String(err)).slice(0, 300) };
  }
}

/** Graph API recipients are digits only. */
const toDigits = (e164: string) => e164.replace(/^\+/, "");

/** WhatsApp template parameters may not contain new lines, tabs or 4+ spaces. */
const param = (s: string, max = 60) => {
  const x = s.replace(/[\r\n\t]+/g, " ").replace(/ {2,}/g, " ").trim();
  return x.length > max ? `${x.slice(0, max - 1)}…` : x || "-";
};

/** The approved reminder template (business-initiated, outside the 24h window). */
export function sendReminderTemplate(
  to: string,
  language: ReminderLanguage,
  vars: { name: string; lesson: string; streak: number },
): Promise<SendResult> {
  const code = language === "fr" ? process.env.WHATSAPP_TEMPLATE_LANG_FR || "fr" : process.env.WHATSAPP_TEMPLATE_LANG_EN || "en";
  return post({
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: toDigits(to),
    type: "template",
    template: {
      name: process.env.WHATSAPP_TEMPLATE_REMINDER,
      language: { code },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: param(vars.name, 40) },
            { type: "text", text: param(vars.lesson, 80) },
            { type: "text", text: String(Math.max(0, Math.floor(vars.streak))) },
          ],
        },
      ],
    },
  });
}

/** Free text, only inside the 24 hour window a learner's own message opens (STOP and START replies). */
export function sendText(to: string, body: string): Promise<SendResult> {
  return post({ messaging_product: "whatsapp", recipient_type: "individual", to: toDigits(to), type: "text", text: { body, preview_url: false } });
}

/** Checks X-Hub-Signature-256 ("sha256=<hex>") against the raw request body. */
export function validSignature(raw: string, header: string | null): boolean {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret || !header || !header.startsWith("sha256=")) return false;
  const expected = Buffer.from(createHmac("sha256", secret).update(raw, "utf8").digest("hex"), "utf8");
  const given = Buffer.from(header.slice(7).trim().toLowerCase(), "utf8");
  return given.length === expected.length && timingSafeEqual(given, expected);
}
