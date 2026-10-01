import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import {
  addAnnouncement,
  deleteAnnouncement,
  deleteCohort,
  getCohort,
  removeMember,
  setRecordings,
  updateCohort,
} from "@/lib/learn/community/cohorts";
import { parseCohortInput } from "@/lib/learn/community/admin-input";

type Ctx = { params: Promise<{ id: string }> };

/** Edit the cohort (the track cannot change). */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const authErr = await requireAdmin();
  if (authErr) return authErr;
  const id = (await params).id;
  const cohort = await getCohort(id);
  if (!cohort) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const raw = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const parsed = parseCohortInput({ ...raw, trackId: cohort.trackId });
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  await updateCohort(id, parsed.value);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const authErr = await requireAdmin();
  if (authErr) return authErr;
  await deleteCohort((await params).id);
  return NextResponse.json({ ok: true });
}

// POST { action: "announce", bodyMd } | { action: "deleteAnnouncement", announcementId }
//    | { action: "addRecording", title, url } | { action: "removeRecording", index }
//    | { action: "removeMember", studentId }
export async function POST(req: NextRequest, { params }: Ctx) {
  const authErr = await requireAdmin();
  if (authErr) return authErr;
  const id = (await params).id;
  const cohort = await getCohort(id);
  if (!cohort) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const s = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

  switch (b.action) {
    case "announce": {
      const bodyMd = s(b.bodyMd, 5000);
      if (bodyMd.length < 2) return NextResponse.json({ error: "Write the announcement first" }, { status: 400 });
      return NextResponse.json({ ok: true, id: await addAnnouncement(id, bodyMd) });
    }
    case "deleteAnnouncement":
      await deleteAnnouncement(s(b.announcementId, 64));
      return NextResponse.json({ ok: true });
    case "addRecording": {
      const title = s(b.title, 160);
      const url = s(b.url, 500);
      if (!title || !/^https:\/\//i.test(url)) return NextResponse.json({ error: "A title and an https:// link are required" }, { status: 400 });
      await setRecordings(id, [...cohort.recordings, { title, url, addedAt: new Date().toISOString() }]);
      return NextResponse.json({ ok: true });
    }
    case "removeRecording": {
      const index = Number(b.index);
      await setRecordings(id, cohort.recordings.filter((_, i) => i !== index));
      return NextResponse.json({ ok: true });
    }
    case "removeMember":
      await removeMember(id, s(b.studentId, 64));
      return NextResponse.json({ ok: true });
    default:
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }
}
