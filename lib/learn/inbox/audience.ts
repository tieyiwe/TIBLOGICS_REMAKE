// Who a message goes to: one learner, a hand-picked selection, or a segment
// of the Learners list (the same filters as /admin_pro/learn/learners, plus
// progress range, inactivity, tag, language and team).
import { z } from "zod";
import prisma from "@/lib/prisma";
import { matchingStudentIds, parseFilters, PLAN_FILTERS, type LearnerFilters } from "@/lib/learn/admin/learners";

export const SegmentSchema = z.object({
  plan: z.enum(PLAN_FILTERS).optional().nullable(),
  track: z.string().regex(/^[\w-]{1,64}$/).optional().nullable(),
  progressMin: z.number().int().min(0).max(100).optional().nullable(),
  progressMax: z.number().int().min(0).max(100).optional().nullable(),
  inactiveDays: z.number().int().min(1).max(3650).optional().nullable(),
  tag: z.string().max(32).optional().nullable(),
  lang: z.enum(["en", "fr", "sw"]).optional().nullable(),
  team: z.string().regex(/^[\w-]{1,64}$/).optional().nullable(),
  q: z.string().max(100).optional().nullable(),
});
export type Segment = z.infer<typeof SegmentSchema>;

export const AudienceSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("one"), studentId: z.string().min(1).max(64) }),
  z.object({ type: z.literal("ids"), ids: z.array(z.string().min(1).max(64)).min(1).max(5000) }),
  z.object({ type: z.literal("segment"), segment: SegmentSchema }),
]);
export type Audience = z.infer<typeof AudienceSchema>;

export function segmentFilters(s: Segment): LearnerFilters {
  const p = new URLSearchParams();
  if (s.q) p.set("q", s.q);
  if (s.plan) p.set("plan", s.plan);
  if (s.track) p.set("track", s.track);
  if (s.tag) p.set("tag", s.tag);
  if (s.lang) p.set("lang", s.lang);
  if (s.team) p.set("team", s.team);
  if (s.inactiveDays) p.set("inactive", String(s.inactiveDays));
  if (s.progressMin != null) p.set("pmin", String(s.progressMin));
  if (s.progressMax != null) p.set("pmax", String(s.progressMax));
  // Segments never include blocked or deleted accounts.
  return parseFilters(p);
}

/** Learner ids for an audience (existing accounts only, de-duplicated). */
export async function resolveAudience(a: Audience): Promise<string[]> {
  if (a.type === "one") {
    const s = await prisma.student.findUnique({ where: { id: a.studentId }, select: { id: true } });
    return s ? [s.id] : [];
  }
  if (a.type === "ids") {
    const rows = await prisma.student.findMany({ where: { id: { in: [...new Set(a.ids)] } }, select: { id: true } });
    return rows.map((r) => r.id);
  }
  return matchingStudentIds(segmentFilters(a.segment));
}

/** Short human description, stored on the campaign for the history list. */
export async function describeAudience(a: Audience): Promise<string> {
  if (a.type === "one") {
    const s = await prisma.student.findUnique({ where: { id: a.studentId }, select: { name: true, email: true } });
    return s ? `${s.name} <${s.email}>` : "One learner";
  }
  if (a.type === "ids") return `${a.ids.length} selected learner${a.ids.length === 1 ? "" : "s"}`;
  const s = a.segment;
  const parts: string[] = [];
  if (s.plan) parts.push(`plan ${s.plan}`);
  if (s.track) {
    const t = await prisma.learnTrack.findUnique({ where: { id: s.track }, select: { title: true } }).catch(() => null);
    parts.push(`track ${t?.title ?? s.track}`);
  }
  if (s.progressMin != null || s.progressMax != null) parts.push(`progress ${s.progressMin ?? 0}% to ${s.progressMax ?? 100}%`);
  if (s.inactiveDays) parts.push(`inactive ${s.inactiveDays}+ days`);
  if (s.tag) parts.push(`tag ${s.tag}`);
  if (s.lang) parts.push(`language ${s.lang.toUpperCase()}`);
  if (s.team) {
    const t = await prisma.team.findUnique({ where: { id: s.team }, select: { name: true } }).catch(() => null);
    parts.push(`team ${t?.name ?? s.team}`);
  }
  if (s.q) parts.push(`search "${s.q}"`);
  return parts.length ? `Segment: ${parts.join(", ")}` : "All learners";
}
