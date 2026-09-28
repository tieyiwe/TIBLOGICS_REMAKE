import { NextRequest, NextResponse } from "next/server";
import { secretEquals } from "@/lib/require-admin";
import type { Locale } from "@/lib/i18n/config";
import { warm as warmLearn } from "@/lib/i18n/sources/learn";
import { warm as warmLabs } from "@/lib/i18n/sources/labs";
import { warm as warmToolkit } from "@/lib/i18n/sources/toolkit";
import { warm as warmBlog } from "@/lib/i18n/sources/blog";

// Pre-translates long content (courses, labs and questions, the prompt
// library, articles) into French and Swahili, so visitors rarely see the
// "being translated" notice. Each run makes at most TRANSLATE_BATCH model
// calls (default 20), then stops; the next run carries on. Once everything is
// cached a run costs nothing. Run hourly:
//   npm run cron translate
export const maxDuration = 300;

const LOCALES: Locale[] = ["fr", "sw"];
const SOURCES = [
  ["learn", warmLearn],
  ["labs", warmLabs],
  ["toolkit", warmToolkit],
  ["blog", warmBlog],
] as const;

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const bearer = req.headers.get("authorization")?.replace(/^Bearer /, "") ?? null;
  if (!secretEquals(bearer, cronSecret) && !secretEquals(new URL(req.url).searchParams.get("secret"), cronSecret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: "ANTHROPIC_API_KEY is not set" }, { status: 503 });

  const n = Number(process.env.TRANSLATE_BATCH);
  const budget = { left: Number.isInteger(n) && n > 0 ? Math.min(n, 200) : 20 };
  const done: Record<string, number> = {};
  const errors: string[] = [];
  const started = Date.now();
  outer: for (const locale of LOCALES) {
    for (const [name, warm] of SOURCES) {
      if (budget.left <= 0 || Date.now() - started > 240_000) break outer;
      try {
        done[`${name}:${locale}`] = await warm(locale, budget);
      } catch (err) {
        errors.push(`${name}:${locale}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }
  const translated = Object.values(done).reduce((a, b) => a + b, 0);
  return NextResponse.json({ translated, byArea: done, budgetLeft: budget.left, errors, complete: translated === 0 && errors.length === 0 });
}
