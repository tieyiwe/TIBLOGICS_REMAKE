import Anthropic from "@anthropic-ai/sdk";
import { logAiUsage } from "@/lib/ai-usage";
import { assertAiBudget, assertAiBudgetCached } from "@/lib/ai-spend-guard";

export { AiBudgetExceeded, isAiBudgetError, assertAiBudget, aiBudgetBlock } from "@/lib/ai-spend-guard";

// The Anthropic client honours ANTHROPIC_BASE_URL (the local e2e mock uses it).
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  maxRetries: 3,
  timeout: 120_000, // 2 min — generous for blog generation
});

// ── Model routing ───────────────────────────────────────────────────────────
//
// Every Claude call names a task. The task picks the cheapest model that does
// the job well, whether the model thinks first, and the output budget. See
// the cost plan for the reasoning behind each row:
//   - Haiku 4.5: short, high-volume or mechanical work (sales chat, practice
//     pad, sandbox, extraction, short translations, tips, summaries).
//   - Sonnet: grading, Tutor, Code Studio, long translations, writing.
//   - Opus: only the paid Automation Blueprint.
//
// Everything is overridable from the environment without a deploy:
//   CLAUDE_HAIKU_MODEL / CLAUDE_SONNET_MODEL / CLAUDE_OPUS_MODEL  – per tier
//   CLAUDE_MODEL_<TASK>       e.g. CLAUDE_MODEL_CODE_ASSIST=claude-opus-5-5
//   CLAUDE_THINKING_<TASK>    off | adaptive
//   CLAUDE_EFFORT_<TASK>      low | medium | high
//   CLAUDE_MAX_TOKENS_<TASK>  e.g. CLAUDE_MAX_TOKENS_TUTOR=900
// (<TASK> is the task name in capitals with "-" as "_".)
//
// The helper only sends parameters the chosen model accepts: Haiku gets no
// thinking or effort fields; Claude Sonnet 5.5 turns thinking off with
// {type:"between_tools"}; Claude Opus 5.5 cannot turn thinking off, so "off"
// becomes low effort there; older adaptive models take {type:"disabled"}.

export type AiTask =
  // Haiku
  | "chat-sales"
  | "chat-advisor"
  | "estimate"
  | "practice"
  | "sandbox"
  | "classify"
  | "social"
  | "lead-search"
  | "translate-short"
  | "tips"
  | "tutor-summary"
  | "moderation"
  | "lead-score"
  | "outreach-personalise"
  | "growth-post"
  | "growth-rewrite"
  | "growth-ideas"
  | "comms-translate"
  | "promo-translate"
  | "video-select"
  | "lesson-recap"
  | "explain-simple"
  | "scanner-report"
  // Sonnet
  | "code-assist"
  | "grade-code"
  | "grade-prompt"
  | "grade-work"
  | "review-draft"
  | "toolkit-write"
  | "compliance-review"
  | "article"
  | "article-admin"
  | "admin-chat"
  | "brief"
  | "translate-long"
  | "tutor"
  | "video-script"
  | "video-scenes"
  | "outreach-strategy"
  | "growth-kit"
  | "growth-campaign"
  | "acquire-magnet"
  | "acquire-page"
  // Opus
  | "blueprint";

type Tier = "haiku" | "sonnet" | "opus";
type Effort = "low" | "medium" | "high";
type Thinking = "off" | "adaptive";

interface Route {
  tier: Tier;
  /** Default output budget (callers may pass their own). */
  maxTokens: number;
  thinking?: Thinking;
  effort?: Effort;
  /** Mark the system prompt for prompt caching. */
  cacheSystem?: boolean;
  /** Also cache the conversation so far (multi-turn chats). */
  cacheHistory?: boolean;
}

const TIER_MODEL: Record<Tier, string> = {
  haiku: process.env.CLAUDE_HAIKU_MODEL || process.env.CLAUDE_FAST_MODEL || "claude-haiku-4-5-20251001",
  sonnet: process.env.CLAUDE_SONNET_MODEL || "claude-sonnet-5-5",
  opus: process.env.CLAUDE_OPUS_MODEL || process.env.CLAUDE_MODEL || "claude-opus-5-5",
};

export const ROUTES: Record<AiTask, Route> = {
  "chat-sales": { tier: "haiku", maxTokens: 512 },
  "chat-advisor": { tier: "haiku", maxTokens: 1024 },
  estimate: { tier: "haiku", maxTokens: 2000 },
  practice: { tier: "haiku", maxTokens: 1400 },
  sandbox: { tier: "haiku", maxTokens: 1200 },
  classify: { tier: "haiku", maxTokens: 1500 },
  social: { tier: "haiku", maxTokens: 600 },
  "lead-search": { tier: "haiku", maxTokens: 2500 },
  "translate-short": { tier: "haiku", maxTokens: 2000 },
  tips: { tier: "haiku", maxTokens: 600 },
  "tutor-summary": { tier: "haiku", maxTokens: 300 },
  moderation: { tier: "haiku", maxTokens: 150 },
  // Growth outreach: per-lead fit score + opener, and per-email personalisation.
  "lead-score": { tier: "haiku", maxTokens: 700 },
  "outreach-personalise": { tier: "haiku", maxTokens: 700 },
  // Growth: repurposed social posts for new articles/tracks/products/events.
  "growth-post": { tier: "haiku", maxTokens: 1800 },
  // Growth: per-item kit rewrites (shorter, punchier, local, A/B variants, EN<->FR).
  "growth-rewrite": { tier: "haiku", maxTokens: 1800 },
  // Growth: trend post ideas from AI Times articles, and the mission control summary.
  "growth-ideas": { tier: "haiku", maxTokens: 1200 },
  // Communications center: an admin message (subject + body) into French.
  "comms-translate": { tier: "haiku", maxTokens: 4000 },
  // Promotions: a site banner (one line) into French and Swahili.
  "promo-translate": { tier: "haiku", maxTokens: 600 },
  // Narrated lesson videos: does this lesson benefit from a video? (cached per content hash)
  "video-select": { tier: "haiku", maxTokens: 300 },
  // Lesson recaps: key takeaways and recall cards from one lesson (stored per content hash).
  "lesson-recap": { tier: "haiku", maxTokens: 900 },
  // Lessons: "Explain simpler" on one paragraph (cached per paragraph and language).
  "explain-simple": { tier: "haiku", maxTokens: 400 },

  "code-assist": { tier: "sonnet", maxTokens: 8000, thinking: "adaptive", effort: "medium", cacheSystem: true },
  "grade-code": { tier: "sonnet", maxTokens: 4000, thinking: "adaptive", effort: "medium" },
  "grade-prompt": { tier: "sonnet", maxTokens: 4000, thinking: "adaptive", effort: "medium" },
  "grade-work": { tier: "sonnet", maxTokens: 4000, thinking: "adaptive", effort: "medium" },
  "review-draft": { tier: "sonnet", maxTokens: 4000, thinking: "adaptive", effort: "medium" },
  "toolkit-write": { tier: "sonnet", maxTokens: 4000, thinking: "off", effort: "low" },
  "compliance-review": { tier: "sonnet", maxTokens: 4000, thinking: "adaptive", effort: "medium" },
  article: { tier: "sonnet", maxTokens: 4000, thinking: "off", effort: "low" },
  "article-admin": { tier: "sonnet", maxTokens: 3000, thinking: "off", effort: "low" },
  "admin-chat": { tier: "sonnet", maxTokens: 2500, thinking: "off", effort: "low" },
  brief: { tier: "sonnet", maxTokens: 1500, thinking: "off", effort: "low" },
  "translate-long": { tier: "sonnet", maxTokens: 16000, thinking: "off" },
  tutor: { tier: "sonnet", maxTokens: 700, thinking: "off", effort: "low", cacheSystem: true, cacheHistory: true },
  "video-script": { tier: "sonnet", maxTokens: 6000, thinking: "off", effort: "low" },
  // Narrated lesson videos: the scene script (narration + slide content) as JSON.
  "video-scenes": { tier: "sonnet", maxTokens: 8000, thinking: "off", effort: "low" },
  // Growth outreach: drafting a whole multi-step sequence (strategy).
  "outreach-strategy": { tier: "sonnet", maxTokens: 2500, thinking: "off", effort: "low" },
  // Growth: a whole product marketing kit (posts, emails, ads, script, calendar) as JSON.
  "growth-kit": { tier: "sonnet", maxTokens: 9000, thinking: "off", effort: "low" },
  // Growth: Campaign Copilot plan (channel mix, cadence, outreach criteria, KPIs) as JSON.
  "growth-campaign": { tier: "sonnet", maxTokens: 5000, thinking: "off", effort: "low" },
  // Growth acquisition: a lead magnet (checklist, guide, quiz, template pack) and a landing page draft, as JSON.
  "acquire-magnet": { tier: "sonnet", maxTokens: 6000, thinking: "off", effort: "low" },
  "acquire-page": { tier: "sonnet", maxTokens: 4000, thinking: "off", effort: "low" },
  // Website scanner: the paid full report (fix steps and build ideas) as JSON, once per unlocked scan.
  "scanner-report": { tier: "sonnet", maxTokens: 7000, thinking: "off", effort: "low" },

  blueprint: { tier: "opus", maxTokens: 16000, thinking: "adaptive", effort: "medium" },
};

const envKey = (task: AiTask) => task.toUpperCase().replace(/-/g, "_");

/** The resolved settings for a task, environment overrides applied. */
export function routeFor(task: AiTask): Route & { model: string } {
  const base = ROUTES[task];
  const k = envKey(task);
  const thinking = process.env[`CLAUDE_THINKING_${k}`];
  const effort = process.env[`CLAUDE_EFFORT_${k}`];
  const max = Number(process.env[`CLAUDE_MAX_TOKENS_${k}`]);
  return {
    ...base,
    model: process.env[`CLAUDE_MODEL_${k}`] || TIER_MODEL[base.tier],
    thinking: thinking === "off" || thinking === "adaptive" ? thinking : base.thinking,
    effort: effort === "low" || effort === "medium" || effort === "high" ? effort : base.effort,
    maxTokens: Number.isInteger(max) && max > 0 ? max : base.maxTokens,
  };
}

type ThinkingFamily = "always" | "between-tools" | "adaptive" | "none";

/** How a model takes thinking and effort settings. Unknown or older models get neither. */
function thinkingFamily(model: string): ThinkingFamily {
  const m = model.toLowerCase();
  if (/fable|mythos|opus-5-5/.test(m)) return "always"; // thinking cannot be disabled
  if (/sonnet-5-5/.test(m)) return "between-tools"; // {type:"disabled"} is a 400
  if (/opus-5|opus-4-[6-9]|sonnet-5|sonnet-4-6/.test(m)) return "adaptive";
  return "none"; // Haiku 4.5 and older: no adaptive thinking, no effort
}

/** Thinking and effort fields valid for `model`. */
function reasoningParams(model: string, thinking: Thinking | undefined, effort: Effort | undefined): Record<string, unknown> {
  const fam = thinkingFamily(model);
  if (fam === "none") return {};
  const out: Record<string, unknown> = {};
  if (thinking === "adaptive") {
    out.thinking = { type: "adaptive" };
  } else if (thinking === "off") {
    if (fam === "always") effort ??= "low";
    else if (fam === "between-tools") out.thinking = { type: "between_tools" };
    else out.thinking = { type: "disabled" };
  }
  if (effort) out.output_config = { effort };
  return out;
}

export interface ClaudeRequest {
  system: string | Anthropic.Messages.TextBlockParam[];
  messages: Anthropic.Messages.MessageParam[];
  /** Overrides the route's default output budget (an env override wins over both). */
  maxTokens?: number;
  meta?: { studentId?: string | null; ref?: string | null };
}

function withCachedSystem(system: ClaudeRequest["system"]): ClaudeRequest["system"] {
  if (typeof system !== "string") return system;
  return [{ type: "text", text: system, cache_control: { type: "ephemeral" } }];
}

/** Puts a cache breakpoint on the last message, so the next turn reads the conversation from cache. */
function withCachedHistory(messages: Anthropic.Messages.MessageParam[]): Anthropic.Messages.MessageParam[] {
  if (messages.length === 0) return messages;
  const out = messages.slice();
  const last = out[out.length - 1];
  const blocks: Anthropic.Messages.ContentBlockParam[] =
    typeof last.content === "string" ? [{ type: "text", text: last.content }] : last.content.slice();
  const i = blocks.length - 1;
  const b = blocks[i];
  if (b && (b.type === "text" || b.type === "image" || b.type === "document" || b.type === "tool_result" || b.type === "tool_use")) {
    blocks[i] = { ...b, cache_control: { type: "ephemeral" } } as typeof b;
  }
  out[out.length - 1] = { ...last, content: blocks };
  return out;
}

/**
 * Models whose API rejected our thinking/effort fields (400). Remembered for
 * the life of the process so one bad assumption about a model's settings
 * costs one retry, not every call.
 */
const reasoningRejected = new Set<string>();

function isReasoningRejection(err: unknown): boolean {
  const e = err as { status?: number; message?: string };
  return e?.status === 400 && /thinking|output_config|effort/i.test(String(e?.message ?? ""));
}

/** Full request parameters for a task (also used to build Message Batches requests). */
export function buildParams(task: AiTask, req: ClaudeRequest): Anthropic.Messages.MessageCreateParamsNonStreaming {
  const r = routeFor(task);
  const envMax = Number(process.env[`CLAUDE_MAX_TOKENS_${envKey(task)}`]);
  const maxTokens = Number.isInteger(envMax) && envMax > 0 ? envMax : (req.maxTokens ?? r.maxTokens);
  const params = {
    model: r.model,
    max_tokens: maxTokens,
    system: r.cacheSystem ? withCachedSystem(req.system) : req.system,
    messages: r.cacheHistory ? withCachedHistory(req.messages) : req.messages,
    ...(reasoningRejected.has(r.model) ? {} : reasoningParams(r.model, r.thinking, r.effort)),
  };
  // thinking {adaptive|between_tools} and output_config are newer than the
  // pinned SDK's types; the API accepts them.
  return params as unknown as Anthropic.Messages.MessageCreateParamsNonStreaming;
}

/** Joins every text block (thinking blocks and others are skipped). */
export function textOf(msg: Pick<Anthropic.Messages.Message, "content">): string {
  return msg.content
    .filter((b): b is Anthropic.Messages.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
}

function record(task: AiTask, msg: Anthropic.Messages.Message, meta?: ClaudeRequest["meta"], batch = false) {
  const u = msg.usage;
  logAiUsage({
    task,
    model: msg.model || routeFor(task).model,
    batch,
    inputTokens: u?.input_tokens ?? 0,
    outputTokens: u?.output_tokens ?? 0,
    cacheReadTokens: u?.cache_read_input_tokens ?? 0,
    cacheWriteTokens: u?.cache_creation_input_tokens ?? 0,
    stopReason: msg.stop_reason ?? null,
    studentId: meta?.studentId ?? null,
    ref: meta?.ref ?? null,
  });
}

/** Records the usage of a finished message (for callers that already have one, e.g. batch results). */
export function recordUsage(task: AiTask, msg: Anthropic.Messages.Message, opts?: { batch?: boolean; meta?: ClaudeRequest["meta"] }) {
  record(task, msg, opts?.meta, opts?.batch);
}

export class ClaudeRefusal extends Error {
  constructor() {
    super("The model declined this request");
  }
}

/**
 * One call, streamed under the hood (so long outputs never hit an idle
 * timeout), returning the joined text. Throws on a refusal; returns the stop
 * reason so callers can treat "max_tokens" as truncated.
 */
export async function runClaude(
  task: AiTask,
  req: ClaudeRequest,
): Promise<{ text: string; stopReason: string | null; message: Anthropic.Messages.Message }> {
  // Platform spending caps (lib/ai-spend-guard.ts): throws AiBudgetExceeded
  // when this task may not run now.
  await assertAiBudget(task);
  let msg: Anthropic.Messages.Message;
  try {
    msg = await anthropic.messages.stream(buildParams(task, req)).finalMessage();
  } catch (err) {
    const model = routeFor(task).model;
    if (!isReasoningRejection(err) || reasoningRejected.has(model)) throw err;
    console.warn(`[claude] ${model} rejected thinking/effort settings; retrying without them`, err);
    reasoningRejected.add(model);
    msg = await anthropic.messages.stream(buildParams(task, req)).finalMessage();
  }
  record(task, msg, req.meta);
  if ((msg.stop_reason as string) === "refusal") throw new ClaudeRefusal();
  if (msg.stop_reason === "max_tokens") console.warn(`[claude] ${task} hit max_tokens`);
  return { text: textOf(msg), stopReason: msg.stop_reason, message: msg };
}

/**
 * A live stream for SSE endpoints (sales chat, Advisor, Tutor). Iterate it as
 * usual; usage is logged when it finishes.
 */
export function streamClaude(task: AiTask, req: ClaudeRequest) {
  // Synchronous, so it can only use the cached spend figure; the streaming
  // routes also await assertAiBudget(task) before calling this.
  assertAiBudgetCached(task);
  const stream = anthropic.messages.stream(buildParams(task, req));
  stream.finalMessage().then(
    (msg) => record(task, msg, req.meta),
    (err) => {
      // Errors and aborts are handled by whoever iterates the stream; a
      // settings rejection is remembered so the next request goes through.
      if (isReasoningRejection(err)) reasoningRejected.add(routeFor(task).model);
    },
  );
  return stream;
}

/**
 * Back-compat wrapper: the text of one call. Every caller names its task.
 */
export async function streamChat(
  messages: Anthropic.Messages.MessageParam[],
  systemPrompt: string,
  maxTokens: number | undefined,
  task: AiTask,
  meta?: ClaudeRequest["meta"],
): Promise<string> {
  return (await runClaude(task, { system: systemPrompt, messages, maxTokens, meta })).text;
}

export default anthropic;
