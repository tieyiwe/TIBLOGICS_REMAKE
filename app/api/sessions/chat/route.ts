import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { checkRateLimit } from "@/lib/require-admin";

// Anonymous visitors persist their advisor transcript here, so this is an
// unauthenticated write into AdminSettings. Both the key and the value need
// bounds: `sessionId` and `messages` were used verbatim, which let one caller
// create unlimited rows of unlimited size in a table the admin UI reads.
const MAX_TRANSCRIPT_BYTES = 128_000;
/** Session ids are client-generated; accept only an opaque id shape. */
const SESSION_ID = /^[A-Za-z0-9_-]{1,64}$/;

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
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
