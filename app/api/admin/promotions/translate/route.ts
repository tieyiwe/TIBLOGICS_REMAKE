import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { runClaude } from "@/lib/claude";
import { checkRateLimit } from "@/lib/rate-limit";
import { actorEmail, errorResponse, promoAdmin } from "@/lib/promotions/admin";

// AI draft of the French and Swahili banner text (task "promo-translate",
// Haiku). The owner reviews it before saving.
const Body = z.object({ text: z.string().trim().min(1, "Write the English banner first.").max(200) });

export async function POST(req: NextRequest) {
  const { session, error } = await promoAdmin(req);
  if (error) return error;
  if (!(await checkRateLimit(`promo-translate:${actorEmail(session)}`, 40, 3_600_000))) {
    return NextResponse.json({ error: "Too many translations this hour. Try again later." }, { status: 429 });
  }
  try {
    const { text } = Body.parse(await req.json().catch(() => ({})));
    if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: "AI translation is not configured (ANTHROPIC_API_KEY)." }, { status: 503 });
    const { text: out } = await runClaude("promo-translate", {
      system:
        "You translate short promotional banner text for TIBLOGICS, an AI training and consulting company. " +
        "Return JSON only: {\"fr\": \"...\", \"sw\": \"...\"}. French: natural international French, vous, French typography (space before : ; ? !). " +
        "Swahili: standard Kiswahili; keep AI, ARFA, TIBLOGICS, codes, prices and product names as written. " +
        "Keep it as short as the English. No em dashes. Never add facts.",
      messages: [{ role: "user", content: `Banner (English): ${text}` }],
    });
    const m = /\{[\s\S]*\}/.exec(out);
    const j = m ? (JSON.parse(m[0]) as { fr?: unknown; sw?: unknown }) : {};
    const clean = (v: unknown) => (typeof v === "string" ? v.replace(/[–—]/g, ",").trim().slice(0, 200) : "");
    const fr = clean(j.fr);
    const sw = clean(j.sw);
    if (!fr && !sw) return NextResponse.json({ error: "The translation came back empty. Try again." }, { status: 502 });
    return NextResponse.json({ fr, sw });
  } catch (err) {
    if (err instanceof SyntaxError) return NextResponse.json({ error: "The translation came back malformed. Try again." }, { status: 502 });
    return errorResponse(err, "translate");
  }
}
