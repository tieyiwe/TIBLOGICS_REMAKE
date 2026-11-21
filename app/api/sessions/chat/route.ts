import { clientIp } from "@/lib/client-ip";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkRateLimit } from "@/lib/require-admin";

// Anonymous visitors persist their advisor transcript here, so this is an
// unauthenticated write into AdminSettings. Both the key and the value need
// bounds: `sessionId` and `messages` were used verbatim, which let one caller
// create unlimited rows of unlimited size in a table the admin UI reads.
const MAX_TRANSCRIPT_BYTES = 64_000;
/**
 * Session ids are made by the browser with crypto (components/public/EchelonFloat.tsx):
 * long and random, so one visitor cannot guess another's id and read or
 * overwrite their transcript. Short, guessable ids (older clients, the old
 * Date.now() fallback) are refused: that chat is simply not saved.
 */
const SESSION_ID = /^[A-Za-z0-9_-]{24,64}$/;

export async function POST(req: Request) {
  const ip = clientIp(req.headers);
  if (!(await checkRateLimit(`sessions-chat:${ip}`, 60, 60_000))) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const { sessionId, messages } = await req.json();
    if (typeof sessionId !== "string" || !SESSION_ID.test(sessionId) || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid" }, { status: 400 });
    }
    const value = JSON.stringify(messages);
    if (value.length > MAX_TRANSCRIPT_BYTES) {
      return NextResponse.json({ error: "Transcript too large" }, { status: 413 });
    }
    const key = `chat:${sessionId}`;
    await prisma.adminSettings.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  if (!(await checkRateLimit(`sessions-chat-read:${clientIp(req.headers)}`, 60, 60_000))) {
    return NextResponse.json({ messages: [] }, { status: 429 });
  }
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");
    // Validated on read too: without it an arbitrary `sessionId` could name any
    // AdminSettings row whose key happens to start with "chat:".
    if (!sessionId || !SESSION_ID.test(sessionId)) return NextResponse.json({ messages: [] });
    const record = await prisma.adminSettings.findUnique({ where: { key: `chat:${sessionId}` } });
    return NextResponse.json({ messages: record ? JSON.parse(record.value) : [] });
  } catch {
    return NextResponse.json({ messages: [] });
  }
}
