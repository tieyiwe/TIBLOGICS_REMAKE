import { NextResponse } from "next/server";
import { denyTrack, requireEntitledStudent, type StudentSession } from "@/lib/learn/session";
import { getT } from "@/lib/i18n/server";
import { examInProgress, loadTutorPage, TUTOR_KINDS, type TutorKind, type TutorPage } from "./context";
import { tutorTablesReady } from "./db";

// The checks every Tutor API runs: a learner with access, the page they are
// on (loaded from its id), access to that page's track, no exam running, and
// the tables in place.

export function parseKind(v: unknown): TutorKind | null {
  return typeof v === "string" && (TUTOR_KINDS as readonly string[]).includes(v) ? (v as TutorKind) : null;
}

export function parseRef(v: unknown): string | null {
  return typeof v === "string" && /^[A-Za-z0-9_-]{1,80}$/.test(v) ? v : null;
}

export type TutorGuard =
  | { error: NextResponse; student?: undefined; page?: undefined }
  | { error: null; student: StudentSession; page: TutorPage };

export async function tutorGuard(kindRaw: unknown, refRaw: unknown): Promise<TutorGuard> {
  const { error, student, access } = await requireEntitledStudent();
  if (error) return { error };
  const t = await getT();
  const kind = parseKind(kindRaw);
  if (!kind) return { error: NextResponse.json({ error: t("tutor.api.badRequest") }, { status: 400 }) };
  // Graded exams: no Tutor, on the exam page or anywhere while one runs.
  if (kind === "exam") return { error: NextResponse.json({ error: t("tutor.examOff"), disabled: "exam" }, { status: 403 }) };
  if (await examInProgress(student.id)) {
    return { error: NextResponse.json({ error: t("tutor.examRunning"), disabled: "exam" }, { status: 423 }) };
  }
  const page = await loadTutorPage(student.id, kind, parseRef(refRaw));
  if (!page) return { error: NextResponse.json({ error: t("tutor.api.notFound") }, { status: 404 }) };
  if (page.trackId && !page.isPreview) {
    const denied = await denyTrack(access, page.trackId);
    if (denied) return { error: denied };
  }
  if (!(await tutorTablesReady())) {
    return { error: NextResponse.json({ error: t("tutor.api.unavailable") }, { status: 503 }) };
  }
  return { error: null, student, page };
}
