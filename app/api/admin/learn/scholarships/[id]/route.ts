import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { audit } from "@/lib/admin/audit";
import { scholarshipWriter } from "@/lib/learn/scholarship/guard";
import { ensureScholarshipTables } from "@/lib/learn/scholarship/db";
import {
  approveScholarship, deleteDraft, editScholarship, MAX_TRACKS, OFFER_DAYS, resendScholarship, revokeScholarship, ScholarshipError,
} from "@/lib/learn/scholarship/service";

// One scholarship: edit (PATCH), delete a draft (DELETE), and the actions
// approve (emails the congratulations), resend and revoke (POST).
const Id = z.string().trim().min(1).max(64).regex(/^[A-Za-z0-9_-]+$/);
const Edit = z.object({
  name: z.string().max(200).optional(),
  email: z.string().max(320).optional(),
  locale: z.enum(["en", "fr", "sw"]).optional(),
  trackCount: z.number().int().min(1).max(MAX_TRACKS).optional(),
  coveragePct: z.number().int().min(1).max(100).optional(),
  trackIds: z.array(Id).max(50).optional(),
  message: z.string().max(2000).nullable().optional(),
  note: z.string().max(2000).nullable().optional(),
  offerDays: z.number().int().min(OFFER_DAYS.min).max(OFFER_DAYS.max).optional(),
});
const Action = z.discriminatedUnion("action", [
  z.object({ action: z.literal("approve") }),
  z.object({ action: z.literal("resend") }),
  z.object({ action: z.literal("revoke"), removeFree: z.boolean().default(false) }),
]);

type Ctx = { params: Promise<{ id: string }> };

async function target(id: string) {
  await ensureScholarshipTables();
  const s = await prisma.scholarship.findUnique({ where: { id }, select: { id: true, email: true, code: true } });
  return s ? { type: "scholarship", id: s.id, label: `${s.code} ${s.email}` } : null;
}

const fail = (err: unknown, what: string) => {
  if (err instanceof ScholarshipError) return NextResponse.json({ error: err.message }, { status: err.status });
  console.error(`[admin/scholarships] ${what}`, err);
  return NextResponse.json({ error: `Could not ${what} the scholarship.` }, { status: 500 });
};

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { session, error } = await scholarshipWriter(req);
  if (error) return error;
  const { id } = await params;
  const parsed = Edit.safeParse(await req.json().catch(() => ({})));
  if (!Id.safeParse(id).success || !parsed.success) return NextResponse.json({ error: parsed.error?.issues[0]?.message ?? "Invalid details" }, { status: 400 });
  const tgt = await target(id);
  if (!tgt) return NextResponse.json({ error: "Scholarship not found." }, { status: 404 });
  try {
    await editScholarship(id, parsed.data);
    await audit(session, "scholarship.update", tgt, { changes: parsed.data });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return fail(err, "update");
  }
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const { session, error } = await scholarshipWriter(req);
  if (error) return error;
  const { id } = await params;
  if (!Id.safeParse(id).success) return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  const tgt = await target(id);
  if (!tgt) return NextResponse.json({ error: "Scholarship not found." }, { status: 404 });
  if (!(await deleteDraft(id))) return NextResponse.json({ error: "Only a draft can be deleted. Revoke an approved scholarship instead." }, { status: 409 });
  await audit(session, "scholarship.delete", tgt);
  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const { session, error } = await scholarshipWriter(req);
  if (error) return error;
  const { id } = await params;
  const parsed = Action.safeParse(await req.json().catch(() => ({})));
  if (!Id.safeParse(id).success || !parsed.success) return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  const tgt = await target(id);
  if (!tgt) return NextResponse.json({ error: "Scholarship not found." }, { status: 404 });
  const a = parsed.data;
  try {
    if (a.action === "approve") {
      const r = await approveScholarship(id, session.user.email ?? "staff");
      await audit(session, "scholarship.approve", tgt, { emailed: r.emailed });
      return NextResponse.json(r);
    }
    if (a.action === "resend") {
      const r = await resendScholarship(id);
      await audit(session, "scholarship.resend", tgt, { emailed: r.emailed });
      return NextResponse.json(r);
    }
    const r = await revokeScholarship(id, session.user.email ?? "staff", a.removeFree);
    await audit(session, "scholarship.revoke", tgt, { removeFree: a.removeFree, tracksRemoved: r.removed });
    return NextResponse.json(r);
  } catch (err) {
    return fail(err, a.action);
  }
}
