import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireStudent } from "@/lib/learn/session";
import { getT } from "@/lib/i18n/server";
import { translator } from "@/lib/learn/i18n";
import { getReminderSettings, saveReminderSettings, stopAllReminders } from "@/lib/learn/reminders/store";

// The learner's study reminder settings (account page).
//   GET    current settings (and whether WhatsApp is available at all)
//   PATCH  save; WhatsApp needs a valid E.164 number and the consent box
//   DELETE stop every reminder at once

const Body = z.object({
  whatsappOn: z.boolean(),
  phone: z.string().max(40).nullable(),
  emailOn: z.boolean(),
  timeLocal: z.string().max(5),
  timezone: z.string().min(1).max(64),
  days: z.array(z.number().int().min(0).max(6)).max(7),
  language: z.enum(["en", "fr"]),
  consent: z.boolean().optional().default(false),
});

export async function GET() {
  const { error, student } = await requireStudent();
  if (error) return error;
  try {
    return NextResponse.json(await getReminderSettings(student.id, student.locale));
  } catch (err) {
    console.error("[GET /api/learn/reminders]", err);
    return NextResponse.json({ error: (await getT())("learn.api.saveFailed") }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const { error, student } = await requireStudent();
  if (error) return error;
  const t = await getT();
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: t("learn.api.invalidRequest") }, { status: 400 });
  const d = parsed.data;
  try {
    // The wording the learner agreed to, in the language of the messages.
    const consentText = translator(d.language)("pwa.reminders.consent");
    const r = await saveReminderSettings(student.id, { ...d, phone: d.phone?.trim() || null, consentText });
    if (!r.ok) return NextResponse.json({ error: t(`pwa.reminders.err.${r.error}`), code: r.error }, { status: 400 });
    return NextResponse.json(await getReminderSettings(student.id, student.locale));
  } catch (err) {
    console.error("[PATCH /api/learn/reminders]", err);
    return NextResponse.json({ error: t("learn.api.saveFailed") }, { status: 500 });
  }
}

export async function DELETE() {
  const { error, student } = await requireStudent();
  if (error) return error;
  try {
    await stopAllReminders(student.id);
    return NextResponse.json(await getReminderSettings(student.id, student.locale));
  } catch (err) {
    console.error("[DELETE /api/learn/reminders]", err);
    return NextResponse.json({ error: (await getT())("learn.api.saveFailed") }, { status: 500 });
  }
}
