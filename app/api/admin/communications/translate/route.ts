import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { csrfGuard, learnerStaff } from "@/lib/learn/account-status/admin-auth";
import { runClaude } from "@/lib/claude";
import { BODY_MAX, SUBJECT_MAX } from "@/lib/learn/inbox/campaigns";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// AI draft of the French version (task "comms-translate", Haiku). The admin
// reviews it in the composer before sending.
const Body = z.object({ subject: z.string().trim().min(1).max(SUBJECT_MAX), body: z.string().trim().min(1).max(BODY_MAX) });

const SYSTEM = `You translate messages from ARFA (AI Readiness For All, the TIBLOGICS AI Academy) to its learners from English into natural, warm, professional French (France/Africa neutral, "vous").
Rules:
- Keep merge fields exactly as written, untranslated: {firstName}, {trackTitle}, {progress}, {loginLink}.
- Keep the light formatting exactly: **bold**, *italic*, [text](url) (translate the text, never the url), "- " list lines, blank lines between paragraphs.
- Keep brand and product names: ARFA, TIBLOGICS, AI Academy track titles.
- French typography: a narrow no-break space before : ; ? !
- No dashes as punctuation.
Answer with JSON only: {"subject": "...", "body": "..."}`;

export async function POST(req: NextRequest) {
  const csrf = csrfGuard(req);
  if (csrf) return csrf;
  const { session, error } = await learnerStaff("manage", "communications");
  if (error) return error;
  if (!(await checkRateLimit(`comms-translate:${session.user.email}`, 40, 3_600_000))) {
    return NextResponse.json({ error: "Too many translations in an hour." }, { status: 429 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Write the English subject and message first." }, { status: 400 });
  try {
    const { text } = await runClaude("comms-translate", {
      system: SYSTEM,
      messages: [{ role: "user", content: JSON.stringify(parsed.data) }],
    });
    const json = text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
    const out = z.object({ subject: z.string().min(1).max(SUBJECT_MAX), body: z.string().min(1).max(BODY_MAX) }).parse(JSON.parse(json));
    return NextResponse.json(out);
  } catch (err) {
    console.error("[comms/translate]", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "The translation did not work. Try again, or write the French version yourself." }, { status: 502 });
  }
}
