import { NextRequest, NextResponse } from "next/server";
import { secretEquals } from "@/lib/require-admin";
import type { Locale } from "@/lib/i18n/config";
import {
  collectPendingTranslations,
  collectTranslationBatch,
  openTranslationBatch,
  submitTranslationBatch,
} from "@/lib/i18n/content";
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
//
// By default the job uses the Message Batches API (half price;
// TRANSLATE_BATCH_API=0 switches back to direct calls): a run first collects the results of the batch it sent last
// time, then sends every unit still missing (up to TRANSLATE_BATCH, default
// 300 in this mode) as one new batch. The cache is the same either way.
export const maxDuration = 300;

const LOCALES: Locale[] = ["fr", "sw"];
// Articles first: they are public and read by anyone who switches language.
const SOURCES = [
  ["blog", warmBlog],
  ["learn", warmLearn],
  ["labs", warmLabs],
  ["toolkit", warmToolkit],
] as const;

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  const bearer = req.headers.get("authorization")?.replace(/^Bearer /, "") ?? null;
  if (!secretEquals(bearer, cronSecret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: "ANTHROPIC_API_KEY is not set" }, { status: 503 });

  const n = Number(process.env.TRANSLATE_BATCH);
  const useBatchApi = process.env.TRANSLATE_BATCH_API !== "0";

  if (useBatchApi) {
    try {
      const open = await openTranslationBatch();
      let collected: Awaited<ReturnType<typeof collectTranslationBatch>> | null = null;
      if (open) {
        collected = await collectTranslationBatch(open);
        if (!collected.ended) return NextResponse.json({ mode: "batch", batch: open.id, status: collected.status });
      }
      const budget = { left: Number.isInteger(n) && n > 0 ? Math.min(n, 2000) : 300 };
      const collectedAt = new Date();
      const errors: string[] = [];
      const units = await collectPendingTranslations(() => warmAll(budget, errors, Date.now()));
      const sent = await submitTranslationBatch(units, collectedAt);
      return NextResponse.json({
        mode: "batch",
        previous: collected ? { written: collected.written, failed: collected.failed } : null,
        submitted: sent,
        errors,
        complete: !sent && errors.length === 0,
      });
    } catch (err) {
      console.error("[cron/translate] batch mode failed, translating synchronously", err instanceof Error ? err.message : err);
      // Fall through to the synchronous path below.
    }
  }

  const budget = { left: Number.isInteger(n) && n > 0 ? Math.min(n, 200) : 20 };
  const errors: string[] = [];
  const done = await warmAll(budget, errors, Date.now());
  const translated = Object.values(done).reduce((a, b) => a + b, 0);
  return NextResponse.json({ translated, byArea: done, budgetLeft: budget.left, errors, complete: translated === 0 && errors.length === 0 });
}

async function warmAll(budget: { left: number }, errors: string[], started: number): Promise<Record<string, number>> {
  const done: Record<string, number> = {};
  outer: for (const locale of LOCALES) {
    for (const [name, warm] of SOURCES) {
      if (budget.left <= 0 || Date.now() - started > 240_000) break outer;
      // Learning Box content is English and French only: no Swahili course translation.
      if (locale === "sw" && (name === "learn" || name === "labs")) continue;
      try {
        done[`${name}:${locale}`] = await warm(locale, budget);
      } catch (err) {
        errors.push(`${name}:${locale}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }
  return done;
}
