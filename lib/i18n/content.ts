import { createHash } from "crypto";
import prisma from "@/lib/prisma";
import { streamChat } from "@/lib/claude";
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

/** One model call. Throws on failure so callers can decide what to show. */
async function translateNow(fields: Fields, locale: Locale): Promise<Fields> {
  const keys = Object.keys(fields).filter((k) => fields[k]?.trim());
  if (keys.length === 0) return { ...fields };
  const input = Object.fromEntries(keys.map((k) => [k, fields[k]]));
  const size = JSON.stringify(input).length;
  const raw = await streamChat(
    [{ role: "user", content: JSON.stringify(input) }],
    SYSTEM(locale),
    Math.min(16_000, Math.max(1_000, Math.ceil(size / 2))),
  );
  const out = parseJson(raw);
  if (!out) throw new Error("Translation was not valid JSON");
  const missing = keys.filter((k) => typeof out[k] !== "string" || !out[k].trim());
  if (missing.length) throw new Error(`Translation missed ${missing.length} field(s)`);
  return { ...fields, ...Object.fromEntries(keys.map((k) => [k, out[k]])) };
}

const inFlight = new Map<string, Promise<Fields | null>>();

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

  const job = `${key}\0${locale}\0${hash}`;
  let p = inFlight.get(job);
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
