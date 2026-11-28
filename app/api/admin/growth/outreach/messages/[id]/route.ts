import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireGrowth } from "@/lib/growth/outreach/auth";
import { editMessage } from "@/lib/growth/outreach/sequences";

/** Edit an unsent email. Any edit puts it back to draft, so it needs approval again. */
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const deny = await requireGrowth();
  if (deny) return deny;
  const { id } = await ctx.params;
  const b = (await req.json().catch(() => null)) as { subject?: unknown; bodyText?: unknown } | null;
  const subject = typeof b?.subject === "string" ? b.subject.trim() : "";
  const body = typeof b?.bodyText === "string" ? b.bodyText.trim() : "";
  if (!subject || !body) return NextResponse.json({ error: "Subject and body required" }, { status: 400 });
  if (/^\s*(re|fwd?)\s*:/i.test(subject)) return NextResponse.json({ error: "Subjects may not pretend to be a reply or forward (CAN-SPAM: deceptive headers)" }, { status: 400 });
  if (!(await editMessage(id, subject, body))) return NextResponse.json({ error: "Only unsent emails can be edited" }, { status: 409 });
  return NextResponse.json({ ok: true });
}

/** Cancel one unsent email (the rest of the sequence continues). */
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const deny = await requireGrowth();
  if (deny) return deny;
  const { id } = await ctx.params;
  const r = await prisma.outreachMessage.updateMany({ where: { id, status: { in: ["draft", "approved"] } }, data: { status: "cancelled", error: "Cancelled by owner" } });
  return r.count ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Only unsent emails can be cancelled" }, { status: 409 });
}
