import prisma from "@/lib/prisma";
import { labOpenWithoutDrafts } from "@/lib/learn/progress";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireEntitledStudent, requireStudent } from "@/lib/learn/session";
import { checkRateLimit } from "@/lib/require-admin";
import { getT } from "@/lib/i18n/server";
import { deleteDrafts, getDraft, ownerTag, saveDraft } from "@/lib/learn/drafts/server";
import { DRAFT_KEY_RE, DRAFT_MAX_BYTES, draftBytes } from "@/lib/learn/drafts/shared";

// Learner drafts: work in progress kept on the server so it follows the
// learner to any device. Keyed on the signed-in student, never on anything the
// client sends. Reading and clearing need a session; saving needs an active
// subscription (it is what the drafts are for, and it bounds storage).

const Key = z.string().max(160).regex(DRAFT_KEY_RE);
const Body = z.object({ key: Key, value: z.unknown() });

const noStore = { "Cache-Control": "no-store" };

export async function GET(req: NextRequest) {
  const { error, student } = await requireStudent();
  if (error) return error;
  const t = await getT();
  if (!(await checkRateLimit(`drafts-read:${student.id}`, 600, 600_000))) {
    return NextResponse.json({ error: t("learn.api.tooManyLater") }, { status: 429 });
  }
  const key = Key.safeParse(req.nextUrl.searchParams.get("key"));
  if (!key.success) return NextResponse.json({ error: t("learn.api.invalidRequest") }, { status: 400 });
  try {
    const row = await getDraft(student.id, key.data);
    return NextResponse.json(
      {
        owner: ownerTag(student.id),
        draft: row ? { value: row.value, updatedAt: row.updatedAt.toISOString() } : null,
      },
      { headers: noStore },
    );
  } catch (err) {
    console.error("[GET /api/learn/drafts]", err);
    return NextResponse.json({ error: t("method.api.failed") }, { status: 500 });
  }
}

async function save(req: NextRequest) {
  const { error, student } = await requireEntitledStudent();
  if (error) return error;
  const t = await getT();
  // Autosave fires ~1.5 s after typing stops: generous for a person, a cap
  // for a script.
  if (!(await checkRateLimit(`drafts-write:${student.id}`, 600, 600_000))) {
    return NextResponse.json({ error: t("learn.api.tooManyLater") }, { status: 429 });
  }
  const text = await req.text().catch(() => "");
  if (text.length > DRAFT_MAX_BYTES * 2) {
    return NextResponse.json({ error: t("learn.api.invalidRequest"), tooLarge: true }, { status: 413 });
  }
  let raw: unknown = null;
  try {
    raw = JSON.parse(text);
  } catch {
    /* falls to the 400 below */
  }
  const parsed = Body.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: t("learn.api.invalidRequest") }, { status: 400 });
  if (draftBytes(parsed.data.value) > DRAFT_MAX_BYTES) {
    return NextResponse.json({ error: t("learn.api.invalidRequest"), tooLarge: true }, { status: 413 });
  }
  // A NEW lab draft can only be started once the lab itself is open, so a
  // draft can never be used to unlock a lab early. Existing drafts (work saved
  // before a lesson was added to the module) can still be updated.
  const labKey = /^(?:lab|code):(.+)$/.exec(parsed.data.key);
  if (labKey && parsed.data.value != null) {
    const existing = await prisma.learnerDraft
      .count({ where: { studentId: student.id, key: parsed.data.key } })
      .catch(() => 0);
    if (existing === 0 && !(await labOpenWithoutDrafts(student.id, labKey[1]))) {
      return NextResponse.json({ error: t("labs.api.finishLessonsFirst"), locked: true }, { status: 403 });
    }
  }
  try {
    const out = await saveDraft(student.id, parsed.data.key, parsed.data.value ?? null);
    return NextResponse.json(
      { ok: true, owner: ownerTag(student.id), updatedAt: out.updatedAt.toISOString(), kept: out.kept },
      { headers: noStore },
    );
  } catch (err) {
    console.error("[PUT /api/learn/drafts]", err);
    return NextResponse.json({ error: t("method.api.failed") }, { status: 500 });
  }
}

export const PUT = save;
/** navigator.sendBeacon can only POST; same as PUT. */
export const POST = save;

export async function DELETE(req: NextRequest) {
  const { error, student } = await requireStudent();
  if (error) return error;
  const t = await getT();
  if (!(await checkRateLimit(`drafts-write:${student.id}`, 600, 600_000))) {
    return NextResponse.json({ error: t("learn.api.tooManyLater") }, { status: 429 });
  }
  const key = Key.safeParse(req.nextUrl.searchParams.get("key"));
  if (!key.success) return NextResponse.json({ error: t("learn.api.invalidRequest") }, { status: 400 });
  try {
    await deleteDrafts(student.id, [key.data]);
    return NextResponse.json({ ok: true }, { headers: noStore });
  } catch (err) {
    console.error("[DELETE /api/learn/drafts]", err);
    return NextResponse.json({ error: t("method.api.failed") }, { status: 500 });
  }
}
