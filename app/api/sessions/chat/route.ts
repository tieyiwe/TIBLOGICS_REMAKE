import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { sessionId, messages } = await req.json();
    if (!sessionId || typeof sessionId !== "string" || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid" }, { status: 400 });
    }
    const key = `chat:${sessionId}`;
    await prisma.adminSettings.upsert({
      where: { key },
      update: { value: JSON.stringify(messages) },
      create: { key, value: JSON.stringify(messages) },
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
    if (!sessionId) return NextResponse.json({ messages: [] });
    const record = await prisma.adminSettings.findUnique({ where: { key: `chat:${sessionId}` } });
    return NextResponse.json({ messages: record ? JSON.parse(record.value) : [] });
  } catch {
    return NextResponse.json({ messages: [] });
  }
}
