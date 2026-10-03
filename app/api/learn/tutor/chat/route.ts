import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { aiBudgetBlock, streamClaude } from "@/lib/claude";
import { getLocale, getT } from "@/lib/i18n/server";
import { tutorGuard } from "@/lib/learn/tutor/guard";
import {
  buildSystem,
  consumeTutorMessage,
  getProfile,
  maybeSummarize,
  modelTurn,
  openOrCreateThread,
  recentTurns,
  REPLY_MAX_TOKENS,
  tutorRemaining,
} from "@/lib/learn/tutor/server";
import { redactSecrets, TUTOR_ACTIONS, TUTOR_MAX_INPUT, TUTOR_MAX_SELECTION } from "@/lib/learn/tutor/shared";

// One Tutor turn, streamed token by token as server-sent events:
//   data: {"type":"delta","text":"..."}      (many)
//   data: {"type":"done","remaining":N}      (once, at the end)
//   data: {"type":"error","error":"..."}     (instead of done)
// The learner's message is saved before the call and the reply after it, so
// the conversation is there when they come back.
export const maxDuration = 120;

const Body = z.object({
  kind: z.string().max(20),
  ref: z.string().max(80).nullable().optional(),
  message: z.string().max(TUTOR_MAX_INPUT).default(""),
  action: z.enum([...TUTOR_ACTIONS, "explain"]).nullable().optional(),
  // Long selections are cut rather than refused.
  selection: z.string().max(20_000).nullable().optional(),
});

export async function POST(req: NextRequest) {
  const raw = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(raw);
  const t = await getT();
  if (!parsed.success) {
    const tooLong = parsed.error.issues.some((i) => i.code === "too_big");
    return NextResponse.json({ error: t(tooLong ? "tutor.api.tooLong" : "tutor.api.badRequest") }, { status: 400 });
  }
  const g = await tutorGuard(parsed.data.kind, parsed.data.ref ?? null);
  if (g.error) return g.error;
  const { student, page } = g;

  const action = parsed.data.action ?? null;
  const selectionRaw = (parsed.data.selection ?? "").replace(/\s+/g, " ").trim().slice(0, TUTOR_MAX_SELECTION);
  if (action === "explain" && !selectionRaw) return NextResponse.json({ error: t("tutor.api.badRequest") }, { status: 400 });
  const msg = redactSecrets(parsed.data.message.trim());
  const sel = redactSecrets(selectionRaw);
  if (!msg.text && !action) return NextResponse.json({ error: t("tutor.api.empty") }, { status: 400 });

  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: t("tutor.api.off") }, { status: 503 });

  const limit = await consumeTutorMessage(student.id);
  if (!limit.ok) {
    const key = limit.reason === "burst" ? "tutor.api.slowDown" : limit.reason === "daily" ? "tutor.limitReached" : "common.aiDailyLimit";
    return NextResponse.json({ error: t(key), limit: limit.reason, remaining: limit.reason === "burst" ? undefined : 0 }, { status: 429 });
  }

  const locale = await getLocale();
  const thread = await openOrCreateThread(student.id, page);

  // What the learner sees in the conversation (their language, no hidden instructions).
  const shown: string[] = [];
  if (action === "explain") shown.push(`> ${sel.text}`, t("tutor.explainThis"));
  else if (action) shown.push(t(`tutor.chip.${action}`));
  if (msg.text) shown.push(msg.text);
  const display = shown.join("\n\n");

  await prisma.tutorMessage.create({ data: { threadId: thread.id, role: "user", content: display, action } });

  const [profile, history] = await Promise.all([getProfile(student.id), recentTurns(thread.id)]);
  // The stored turn is the visible text; the model gets the instruction and the data in tags.
  const turns = history.slice(0, -1);
  turns.push({
    role: "user",
    content: modelTurn({
      message: msg.text,
      action,
      selection: action === "explain" ? sel.text : null,
      tryItNow: page.tryItNow,
    }),
  });
  if (turns[0]?.role !== "user") turns.shift();

  const system = buildSystem(page, profile, thread.summary, locale);
  // Essential: only the platform's hard AI cap pauses the Tutor.
  const paused = await aiBudgetBlock("tutor", t("tutor.api.off"));
  if (paused) return paused;
  const stream = streamClaude("tutor", { system, messages: turns, maxTokens: REPLY_MAX_TOKENS, meta: { studentId: student.id, ref: page.kind } });
  req.signal.addEventListener("abort", () => stream.abort());

  const encoder = new TextEncoder();
  const send = (c: ReadableStreamDefaultController, data: object) => {
    try {
      c.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
    } catch {
      // The learner closed the panel; keep going so the reply is saved.
    }
  };

  const readable = new ReadableStream({
    async start(controller) {
      let reply = "";
      if (msg.redacted || sel.redacted) send(controller, { type: "notice", text: t("tutor.redacted") });
      try {
        for await (const ev of stream) {
          if (ev.type === "content_block_delta" && ev.delta.type === "text_delta") {
            reply += ev.delta.text;
            send(controller, { type: "delta", text: ev.delta.text });
          }
        }
        reply = reply.trim();
        if (reply) {
          await prisma.tutorMessage.create({ data: { threadId: thread.id, role: "assistant", content: reply } });
          await prisma.tutorThread.update({ where: { id: thread.id }, data: { updatedAt: new Date() } });
        }
        send(controller, { type: "done", remaining: await tutorRemaining(student.id) });
      } catch (err) {
        console.error("[POST /api/learn/tutor/chat]", err instanceof Error ? err.message : err);
        // Keep what arrived, so the conversation still reads sensibly.
        if (reply.trim()) {
          await prisma.tutorMessage
            .create({ data: { threadId: thread.id, role: "assistant", content: reply.trim() } })
            .catch(() => {});
        }
        send(controller, { type: "error", error: t("tutor.api.failed") });
      }
      // Fold older messages into the running summary (bounded context).
      await maybeSummarize(thread.id).catch((err) => console.error("[tutor] summary", err instanceof Error ? err.message : err));
      try {
        controller.close();
      } catch {
        // already closed
      }
    },
    cancel() {
      // The browser went away: nothing to clean up, the reply is still saved.
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
