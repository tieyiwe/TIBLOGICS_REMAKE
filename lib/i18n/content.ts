import { createHash } from "crypto";
import { AsyncLocalStorage } from "node:async_hooks";
import prisma from "@/lib/prisma";
import anthropic, { buildParams, recordUsage, runClaude, textOf, type AiTask } from "@/lib/claude";
import { LANGUAGE_FOR_AI, type Locale } from "./config";

// Translation of long content (lessons, questions, labs, blog posts, prompts).
//
// Interface text lives in hand-written dictionaries (lib/i18n/messages). Long
// content is written in English and translated by the model once per locale,
// then cached here keyed by a hash of the English source, so an edit to the
// English re-translates it and nothing else is ever paid for twice.
//
// Pages never wait for a translation they don't have: they show English with
// a notice and queue the work (`mode: "queue"`), and the translate cron job
// pre-warms everything so visitors rarely see that notice.

export type Fields = Record<string, string>;

const TABLE = [
  `CREATE TABLE IF NOT EXISTS "ContentTranslation" (
    "key" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ContentTranslation_pkey" PRIMARY KEY ("key", "locale")
  )`,
];

let ready: Promise<void> | null = null;
function ensureTable(): Promise<void> {
  ready ??= (async () => {
    for (const sql of TABLE) await prisma.$executeRawUnsafe(sql);
  })().catch((err) => {
    ready = null;
    throw err;
  });
  return ready;
}

function hashOf(fields: Fields): string {
  const h = createHash("sha256");
  for (const k of Object.keys(fields).sort()) h.update(k).update("\0").update(fields[k] ?? "").update("\0");
  return h.digest("hex").slice(0, 32);
}

const SYSTEM = (locale: Locale) => `You are a professional translator for TIBLOGICS, a practical AI education and technology company. Translate the JSON values you receive from English into ${LANGUAGE_FOR_AI[locale]}.

Rules:
- ${locale === "fr" ? "Use clear, natural international French (vous form), as used across France and francophone Africa. Use French typography (espace before : ; ? !), and « » for quotes." : "Use clear, natural standard Kiswahili as used in East Africa. Where a technical term has no common Swahili word (for example prompt, chatbot, API, email), keep the English term and, the first time it appears in a text, add a short Swahili explanation in brackets."}
- Keep the meaning, tone and level exactly. Do not add, drop or summarise anything.
- Keep Markdown structure exactly: headings, lists, tables, bold, links (translate link text, never URLs), and fenced blocks.
- Inside \`\`\`playground and other code fences: keep all code exactly as it is; translate only human-readable text that a user would see on screen and code comments.
- Inside \`\`\`try, \`\`\`text and \`\`\`prompt fences: translate the prompt, and translate placeholders in [SQUARE BRACKETS] too, keeping the brackets and capitals.
- Keep these names untranslated: TIBLOGICS, Learning Box, Code Studio, Toolkit Live, Compliance Guard, In-Story, and product, company and tool names (ChatGPT, Claude, Git, HTML, JavaScript, etc.).
- Keep {placeholders} in curly braces unchanged.
- Use plain punctuation: no em dashes.
- Return ONLY a JSON object with exactly the same keys, each value translated. No commentary, no code fence.`;

function parseJson(raw: string): Fields | null {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
  const s = cleaned.indexOf("{"), e = cleaned.lastIndexOf("}");
  if (s === -1 || e <= s) return null;
  try {
    const v = JSON.parse(cleaned.slice(s, e + 1));
    return v && typeof v === "object" ? (v as Fields) : null;
  } catch {
    return null;
  }
}

/**
 * The request for one translation unit, or null when there is nothing to
 * translate. Short units (UI-like text: question banks, prompt chunks, titles)
 * go to the fast model; long ones (lesson bodies, labs, articles) to the
 * stronger one with thinking off. See lib/claude.ts.
 */
function translationRequest(fields: Fields, locale: Locale) {
  const keys = Object.keys(fields).filter((k) => fields[k]?.trim());
  if (keys.length === 0) return null;
  const input = Object.fromEntries(keys.map((k) => [k, fields[k]]));
  const json = JSON.stringify(input);
  const size = json.length;
  const task: AiTask = size < 3000 ? "translate-short" : "translate-long";
  return {
    keys,
    task,
    system: SYSTEM(locale),
    messages: [{ role: "user" as const, content: json }],
    maxTokens: Math.min(16_000, Math.max(1_000, Math.ceil(size / 2))),
  };
}

/** Checks a model reply and merges it over the English. Throws when it is unusable. */
function applyTranslation(fields: Fields, keys: string[], raw: string): Fields {
  const out = parseJson(raw);
  if (!out) throw new Error("Translation was not valid JSON");
  const missing = keys.filter((k) => typeof out[k] !== "string" || !out[k].trim());
  if (missing.length) throw new Error(`Translation missed ${missing.length} field(s)`);
  return { ...fields, ...Object.fromEntries(keys.map((k) => [k, out[k]])) };
}

/** One model call. Throws on failure so callers can decide what to show. */
async function translateNow(fields: Fields, locale: Locale): Promise<Fields> {
  const req = translationRequest(fields, locale);
  if (!req) return { ...fields };
  const { text, stopReason } = await runClaude(req.task, { system: req.system, messages: req.messages, maxTokens: req.maxTokens });
  if (stopReason === "max_tokens") throw new Error("Translation was cut off");
  return applyTranslation(fields, req.keys, text);
}

const collector = new AsyncLocalStorage<PendingTranslation[]>();

const inFlight = new Map<string, Promise<Fields | null>>();
// A translation that just failed is not retried on every page view (each try
// is a paid model call). Page views wait out a cool-down; the cron job retries.
const failedAt = new Map<string, number>();
const RETRY_AFTER_MS = 15 * 60_000;
// Page views may start only a few translations at once; a page that lists many
// records (the prompt library, a course outline) must not fire a model call per
// record in one go. The rest stay "pending" and the translate job fills them in.
const MAX_QUEUED = 4;

/**
 * Translated fields for `key` in `locale`, or null if not available yet.
 *
 * mode "queue" (pages): return the cached translation, or null and start one.
 * mode "wait"  (cron):  translate now if needed and return it.
 */
export async function translated(
  key: string,
  locale: Locale,
  fields: Fields,
  mode: "queue" | "wait" = "queue",
): Promise<Fields | null> {
  if (locale === "en") return fields;
  const hash = hashOf(fields);
  try {
    await ensureTable();
    const rows = await prisma.$queryRawUnsafe<Array<{ hash: string; value: Fields }>>(
      `SELECT "hash", "value" FROM "ContentTranslation" WHERE "key" = $1 AND "locale" = $2`,
      key,
      locale,
    );
    if (rows[0]?.hash === hash) return { ...fields, ...rows[0].value };
  } catch (err) {
    console.error("[i18n] cache read failed", err instanceof Error ? err.message : err);
    return mode === "queue" ? null : fields;
  }
  if (!process.env.ANTHROPIC_API_KEY) return null;

  // Inside collectPendingTranslations() (the batch translate cron), "wait"
  // records the unit for a Message Batch instead of calling the model now.
  const pending = collector.getStore();
  if (pending && mode === "wait") {
    pending.push({ key, locale, hash, fields });
    return fields;
  }

  const job = `${key}\0${locale}\0${hash}`;
  if (mode === "queue" && Date.now() - (failedAt.get(job) ?? 0) < RETRY_AFTER_MS) return null;
  let p = inFlight.get(job);
  if (!p && mode === "queue" && inFlight.size >= MAX_QUEUED) return null;
  if (!p) {
    p = translateNow(fields, locale)
      .then(async (value) => {
        await prisma.$executeRawUnsafe(
          `INSERT INTO "ContentTranslation" ("key", "locale", "hash", "value", "updatedAt")
           VALUES ($1, $2, $3, $4::jsonb, NOW())
           ON CONFLICT ("key", "locale") DO UPDATE SET "hash" = $3, "value" = $4::jsonb, "updatedAt" = NOW()`,
          key,
          locale,
          hash,
          JSON.stringify(value),
        );
        return value;
      })
      .catch((err) => {
        console.error("[i18n] translation failed", key, locale, err instanceof Error ? err.message : err);
        if (failedAt.size > 5000) failedAt.clear();
        failedAt.set(job, Date.now());
        return null;
      })
      .finally(() => inFlight.delete(job));
    inFlight.set(job, p);
  }
  return mode === "wait" ? p : null;
}

/**
 * Convenience for pages: fields in the visitor's language when ready, else
 * English plus `pending: true` so the page can show a short notice.
 */
export async function localized<F extends Fields>(key: string, locale: Locale, fields: F): Promise<{ value: F; pending: boolean }> {
  if (locale === "en") return { value: fields, pending: false };
  const t = await translated(key, locale, fields, "queue");
  return t ? { value: t as F, pending: false } : { value: fields, pending: true };
}

/**
 * Translate a list of records that share a shape (questions, prompts) in one
 * cached unit. Each record's fields are flattened as "<index>.<field>".
 */
export async function localizedList<R extends Fields>(key: string, locale: Locale, list: R[]): Promise<{ value: R[]; pending: boolean }> {
  if (locale === "en" || list.length === 0) return { value: list, pending: false };
  const flat: Fields = {};
  list.forEach((r, i) => Object.entries(r).forEach(([k, v]) => { flat[`${i}.${k}`] = v; }));
  const t = await translated(key, locale, flat, "queue");
  if (!t) return { value: list, pending: true };
  return {
    value: list.map((r, i) => Object.fromEntries(Object.keys(r).map((k) => [k, t[`${i}.${k}`] ?? r[k]])) as R),
    pending: false,
  };
}

// ── Message Batches (translate cron, TRANSLATE_BATCH_API=1) ─────────────────
//
// The cron collects every unit that needs translating, sends them as one
// Message Batch (half price, results usually within the hour), and on a later
// run writes the results into the same ContentTranslation cache. Page views
// keep translating synchronously: a visitor is waiting.

export interface PendingTranslation {
  key: string;
  locale: Locale;
  hash: string;
  fields: Fields;
}

/** Runs `fn` (the warm-up loop) and returns the units it would have translated, without calling the model. */
export async function collectPendingTranslations(fn: () => Promise<unknown>): Promise<PendingTranslation[]> {
  const list: PendingTranslation[] = [];
  await collector.run(list, fn);
  return list;
}

const BATCH_STATE_KEY = "translate:batch";

interface BatchJob {
  key: string;
  locale: Locale;
  hash: string;
  task: AiTask;
  keys: string[];
  /** The source's blank fields, kept as they are (as translateNow does). */
  blanks: Fields;
}

interface BatchState {
  id: string;
  submittedAt: string;
  jobs: Record<string, BatchJob>;
}

export async function openTranslationBatch(): Promise<BatchState | null> {
  const row = await prisma.adminSettings.findUnique({ where: { key: BATCH_STATE_KEY } });
  if (!row) return null;
  try {
    return JSON.parse(row.value) as BatchState;
  } catch {
    return null;
  }
}

/** Submits one Message Batch for these units. Returns its id, or null when there was nothing to send. */
/** `collectedAt`: when the units were found missing; translations written after it are never overwritten. */
export async function submitTranslationBatch(units: PendingTranslation[], collectedAt: Date): Promise<{ id: string; count: number } | null> {
  const jobs: Record<string, BatchJob> = {};
  const requests: Array<{ custom_id: string; params: ReturnType<typeof buildParams> }> = [];
  const seen = new Set<string>();
  for (const u of units) {
    const dedupe = `${u.key}\0${u.locale}`;
    if (seen.has(dedupe)) continue;
    seen.add(dedupe);
    const req = translationRequest(u.fields, u.locale);
    if (!req) continue;
    const id = `t${requests.length}`;
    const blanks = Object.fromEntries(Object.keys(u.fields).filter((k) => !req.keys.includes(k)).map((k) => [k, u.fields[k]]));
    jobs[id] = { key: u.key, locale: u.locale, hash: u.hash, task: req.task, keys: req.keys, blanks };
    requests.push({
      custom_id: id,
      params: buildParams(req.task, { system: req.system, messages: req.messages, maxTokens: req.maxTokens }),
    });
  }
  if (requests.length === 0) return null;
  const batch = await anthropic.messages.batches.create({ requests });
  const state: BatchState = { id: batch.id, submittedAt: collectedAt.toISOString(), jobs };
  const value = JSON.stringify(state);
  await prisma.adminSettings.upsert({ where: { key: BATCH_STATE_KEY }, create: { key: BATCH_STATE_KEY, value }, update: { value } });
  return { id: batch.id, count: requests.length };
}

/**
 * Polls the open batch. When it has ended, writes every good result into the
 * cache (unless a newer translation was written meanwhile), logs usage and
 * clears the state.
 */
export async function collectTranslationBatch(
  state: BatchState,
): Promise<{ ended: boolean; status: string; written: number; failed: number }> {
  const batch = await anthropic.messages.batches.retrieve(state.id);
  if (batch.processing_status !== "ended") return { ended: false, status: batch.processing_status, written: 0, failed: 0 };

  await ensureTable();
  let written = 0, failed = 0;
  for await (const r of await anthropic.messages.batches.results(state.id)) {
    const job = state.jobs[r.custom_id];
    if (!job) continue;
    if (r.result.type !== "succeeded") {
      failed++;
      continue;
    }
    const msg = r.result.message;
    recordUsage(job.task, msg, { batch: true, meta: { ref: job.key } });
    try {
      if (msg.stop_reason === "max_tokens") throw new Error("cut off");
      const value = applyTranslation(job.blanks, job.keys, textOf(msg));
      await prisma.$executeRawUnsafe(
        `INSERT INTO "ContentTranslation" ("key", "locale", "hash", "value", "updatedAt")
         VALUES ($1, $2, $3, $4::jsonb, NOW())
         ON CONFLICT ("key", "locale") DO UPDATE SET "hash" = $3, "value" = $4::jsonb, "updatedAt" = NOW()
         WHERE "ContentTranslation"."updatedAt" < $5::timestamptz`,
        job.key,
        job.locale,
        job.hash,
        JSON.stringify(value),
        state.submittedAt,
      );
      written++;
    } catch (err) {
      failed++;
      console.error("[i18n] batch translation unusable", job.key, job.locale, err instanceof Error ? err.message : err);
    }
  }
  await prisma.adminSettings.delete({ where: { key: BATCH_STATE_KEY } }).catch(() => {});
  return { ended: true, status: "ended", written, failed };
}
