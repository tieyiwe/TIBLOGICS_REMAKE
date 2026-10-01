// Verified skill badges: evaluation, awarding and status. Server only.
//
// Unlike the gamification badges (lib/learn/badges.ts, derived on the fly),
// a skill badge is a stored, signed credential: once the conditions are met
// a SkillBadgeAward row is written with its Open Badges 3.0 credential, and
// it never silently disappears. Revocation is separate: an admin revoking a
// certificate revokes, on the verify page, every badge tied to that track.
//
// awardSkillBadges() is idempotent (unique studentId + badgeKey) and is called
// where XP is awarded (quiz, lab, exam, Studio, capstone review) and lazily
// as a backfill when the learner opens their badges.
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { dictionary } from "@/lib/i18n/messages";
import { STUDIO_TOOLS } from "@/lib/learn/studio/catalog";
import { studioProgress, type StudioProgress } from "@/lib/learn/studio/progress";
import {
  CAPSTONE_DISTINCTION_SCORE,
  FAMILY_LABEL_EN,
  SKILL_BADGES,
  capstoneBadgeKey,
  glyphFor,
  moduleBadgeKey,
  skillBadgeKey,
  studioBadgeKey,
  type BadgeGlyph,
  type QuizRef,
  type SkillBadgeFamily,
} from "./catalog";
import {
  buildCredential,
  newAwardId,
  newSalt,
  publicDisplayName,
  type AlignmentItem,
  type EvidenceItem,
} from "./credential";
import { ensureSkillBadgeTables } from "./db";
import { getSigningKey, siteBase, signDocument, verifyDocument, issuerDid } from "./signing";

// ── Structure (what can be earned) ──────────────────────────────────────────

interface LabInfo {
  slug: string;
  title: string;
  trackSlug: string;
  moduleRef: QuizRef | null;
}

interface ModuleInfo {
  ref: QuizRef;
  trackSlug: string;
  sortOrder: number;
  title: string;
  quizPassScore: number | null;
  labs: LabInfo[];
}

interface TrackInfo {
  slug: string;
  title: string;
  live: boolean;
  hasCapstone: boolean;
  modules: ModuleInfo[];
}

interface Structure {
  tracks: Map<string, TrackInfo>;
  labs: Map<string, LabInfo>;
  modules: Map<QuizRef, ModuleInfo>;
}

let structureCache: { at: number; value: Promise<Structure> } | null = null;
const STRUCTURE_TTL = 5 * 60_000;

async function loadStructure(): Promise<Structure> {
  const [tracks, labs] = await Promise.all([
    prisma.learnTrack.findMany({
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        slug: true,
        title: true,
        status: true,
        capstone: { select: { id: true } },
        modules: {
          orderBy: { sortOrder: "asc" },
          select: { id: true, sortOrder: true, title: true, quiz: { select: { passScore: true } } },
        },
      },
    }),
    prisma.lab.findMany({
      where: { isPublished: true },
      orderBy: { sortOrder: "asc" },
      select: { slug: true, title: true, trackId: true, moduleId: true, lesson: { select: { moduleId: true } } },
    }),
  ]);
  const out: Structure = { tracks: new Map(), labs: new Map(), modules: new Map() };
  const moduleById = new Map<string, ModuleInfo>();
  const slugByTrackId = new Map<string, string>();
  for (const t of tracks) {
    slugByTrackId.set(t.id, t.slug);
    const info: TrackInfo = { slug: t.slug, title: t.title, live: t.status === "live", hasCapstone: !!t.capstone, modules: [] };
    for (const m of t.modules) {
      const ref = `${t.slug}:${m.sortOrder}` as QuizRef;
      const mi: ModuleInfo = { ref, trackSlug: t.slug, sortOrder: m.sortOrder, title: m.title, quizPassScore: m.quiz?.passScore ?? null, labs: [] };
      info.modules.push(mi);
      moduleById.set(m.id, mi);
      out.modules.set(ref, mi);
    }
    out.tracks.set(t.slug, info);
  }
  for (const l of labs) {
    const trackSlug = slugByTrackId.get(l.trackId);
    if (!trackSlug) continue;
    const mod = moduleById.get(l.moduleId ?? l.lesson?.moduleId ?? "");
    const li: LabInfo = { slug: l.slug, title: l.title, trackSlug, moduleRef: mod?.ref ?? null };
    out.labs.set(l.slug, li);
    mod?.labs.push(li);
  }
  return out;
}

function getStructure(): Promise<Structure> {
  if (structureCache && Date.now() - structureCache.at < STRUCTURE_TTL) return structureCache.value;
  const value = loadStructure();
  structureCache = { at: Date.now(), value };
  value.catch(() => (structureCache = null));
  return value;
}

// ── Facts (what this learner has done) ──────────────────────────────────────

interface Pass {
  score: number;
  at: Date;
}

interface Facts {
  quizzes: Map<QuizRef, Pass>;
  labs: Map<string, Pass>;
  studio: StudioProgress;
  capstones: Map<string, Pass>;
}

function keepBest(map: Map<string, Pass>, key: string, score: number, at: Date) {
  const cur = map.get(key);
  if (!cur) map.set(key, { score, at });
  else map.set(key, { score: Math.max(cur.score, score), at: at < cur.at ? at : cur.at });
}

async function loadFacts(studentId: string): Promise<Facts> {
  const [quizzes, labs, studio, capstones] = await Promise.all([
    prisma.quizAttempt.findMany({
      where: { studentId, passed: true },
      select: { score: true, createdAt: true, quiz: { select: { module: { select: { sortOrder: true, track: { select: { slug: true } } } } } } },
    }),
    prisma.labAttempt.findMany({
      where: { studentId, passed: true },
      select: { score: true, updatedAt: true, lab: { select: { slug: true } } },
    }),
    studioProgress(studentId),
    prisma.capstoneSubmission.findMany({
      where: { studentId, status: "passed" },
      select: { score: true, reviewedAt: true, updatedAt: true, capstone: { select: { track: { select: { slug: true } } } } },
    }),
  ]);
  const f: Facts = { quizzes: new Map(), labs: new Map(), studio, capstones: new Map() };
  for (const q of quizzes) keepBest(f.quizzes as Map<string, Pass>, `${q.quiz.module.track.slug}:${q.quiz.module.sortOrder}`, q.score, q.createdAt);
  for (const l of labs) keepBest(f.labs, l.lab.slug, l.score ?? 0, l.updatedAt);
  for (const c of capstones) keepBest(f.capstones, c.capstone.track.slug, c.score ?? 0, c.reviewedAt ?? c.updatedAt);
  return f;
}

// ── Badge definitions resolved against the structure ───────────────────────

export interface ReqItem {
  title: string;
  done: boolean;
  trackSlug: string;
}

export interface ReqProgress {
  /** "quiz" | "lab" | "labs" | "quizzes" | "challenges" | "capstone" | "tracks" */
  kind: string;
  need: number;
  have: number;
  items: ReqItem[];
}

export interface ResolvedBadge {
  key: string;
  family: SkillBadgeFamily;
  glyph: BadgeGlyph;
  /** Canonical English name. */
  name: string;
  description: string;
  criteria: string;
  trackSlugs: string[];
  alignments: AlignmentItem[];
  reqs: ReqProgress[];
  earned: boolean;
  evidence: EvidenceItem[];
  /** For grouping module badges. */
  trackSlug?: string;
  /** Module title or Studio tool id, for localised display. */
  subject?: string;
}

const EN = () => dictionary("en");
const trackUrl = (slug: string) => `${siteBase()}/learning-box/${slug}`;
const fmtDay = (d: Date) => d.toISOString().slice(0, 10);
const listEn = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} or ${xs[xs.length - 1]}`);

function resolveAll(s: Structure, f: Facts): ResolvedBadge[] {
  const out: ResolvedBadge[] = [];
  const en = EN();

  // Module mastery: modules with a quiz and at least one lab.
  for (const t of s.tracks.values()) {
    for (const m of t.modules) {
      if (m.quizPassScore == null || m.labs.length === 0) continue;
      const quiz = f.quizzes.get(m.ref);
      const labDone = m.labs.map((l) => ({ l, p: f.labs.get(l.slug) })).filter((x) => x.p);
      const earned = !!quiz && labDone.length > 0;
      const evidence: EvidenceItem[] = [];
      if (quiz) evidence.push({ name: `Module quiz: ${m.title}`, description: `Passed with ${quiz.score}% (pass mark ${m.quizPassScore}%) on ${fmtDay(quiz.at)}.` });
      for (const { l, p } of labDone) evidence.push({ name: `Lab: ${l.title}`, description: `Passed with ${p!.score}% against the lab's published criteria on ${fmtDay(p!.at)}.` });
      out.push({
        key: moduleBadgeKey(t.slug, m.sortOrder),
        family: "module",
        glyph: "module",
        name: m.title,
        description: `Demonstrated mastery of "${m.title}" in the TIBLOGICS ${t.title} track: the module quiz and a hands-on lab, both passed.`,
        criteria:
          `Pass the module quiz for "${m.title}" (pass mark ${m.quizPassScore}%) and pass a hands-on lab in that module ` +
          `(${listEn(m.labs.map((l) => `"${l.title}"`))}), scored against published criteria. Part of the TIBLOGICS ${t.title} track.`,
        trackSlugs: [t.slug],
        alignments: [{ targetName: `${t.title}: ${m.title}`, targetUrl: trackUrl(t.slug), targetDescription: `Module ${m.sortOrder + 1} of the ${t.title} track.` }],
        reqs: [
          { kind: "quiz", need: 1, have: quiz ? 1 : 0, items: [{ title: m.title, done: !!quiz, trackSlug: t.slug }] },
          { kind: "lab", need: 1, have: labDone.length ? 1 : 0, items: m.labs.map((l) => ({ title: l.title, done: f.labs.has(l.slug), trackSlug: t.slug })) },
        ],
        earned,
        evidence,
        trackSlug: t.slug,
        subject: m.title,
      });
    }
  }

  // Studio challenge sets.
  for (const tool of STUDIO_TOOLS) {
    if (!tool.ready || tool.challenges.length === 0) continue;
    const name = en[`studio.${tool.id}.name`] ?? tool.id;
    const prog = f.studio[tool.id] ?? {};
    const done = tool.challenges.filter((c) => prog[c.id]?.done).length;
    const perfect = tool.challenges.filter((c) => prog[c.id]?.perfect).length;
    const n = tool.challenges.length;
    out.push({
      key: studioBadgeKey(tool.id),
      family: "studio",
      glyph: "studio",
      name: `${name} Challenge Set`,
      description: `Completed every challenge of the ${name} tool in the TIBLOGICS Learning Studio.`,
      criteria:
        `Complete all ${n} challenges of the ${name} tool in the TIBLOGICS Learning Studio. ` +
        `Studio challenges are practice exercises unlocked in order from easy to hard. Completion is recorded by the learner's browser and is not proctored or independently verified by TIBLOGICS; it shows practice, not assessed mastery.`,
      trackSlugs: [],
      alignments: [{ targetName: `TIBLOGICS Learning Studio: ${name}`, targetUrl: `${siteBase()}/learning-box` }],
      reqs: [{ kind: "challenges", need: n, have: done, items: [] }],
      earned: done >= n,
      evidence: [{ name: `${name} challenges`, description: `${done} of ${n} challenges completed, ${perfect} with all three stars.` }],
      subject: tool.id,
    });
  }

  // Capstone with distinction.
  for (const t of s.tracks.values()) {
    if (!t.hasCapstone) continue;
    const c = f.capstones.get(t.slug);
    const earned = !!c && c.score >= CAPSTONE_DISTINCTION_SCORE;
    out.push({
      key: capstoneBadgeKey(t.slug),
      family: "capstone",
      glyph: "capstone",
      name: `${t.title} Capstone`,
      description: `Passed the ${t.title} capstone project with distinction.`,
      criteria:
        `Pass the ${t.title} capstone project with a reviewer score of at least ${CAPSTONE_DISTINCTION_SCORE} out of 100. ` +
        `Capstones are real projects assessed by a TIBLOGICS reviewer against a published rubric.`,
      trackSlugs: [t.slug],
      alignments: [{ targetName: `${t.title}: capstone project`, targetUrl: trackUrl(t.slug) }],
      reqs: [{ kind: "capstone", need: CAPSTONE_DISTINCTION_SCORE, have: c ? Math.min(c.score, CAPSTONE_DISTINCTION_SCORE) : 0, items: [] }],
      earned,
      evidence: c ? [{ name: `Capstone project: ${t.title}`, description: `Passed with a reviewer score of ${c.score}/100 on ${fmtDay(c.at)}.` }] : [],
      trackSlug: t.slug,
    });
  }

  // Cross-track skills.
  for (const def of SKILL_BADGES) {
    const reqs: ReqProgress[] = [];
    const evidence: EvidenceItem[] = [];
    const usedTracks = new Set<string>();
    const allTracks = new Set<string>();
    const criteriaParts: string[] = [];
    let ok = true;
    for (const r of def.requirements) {
      const items: ReqItem[] = [];
      const passed: Array<{ trackSlug: string; ev: EvidenceItem }> = [];
      for (const slug of r.labs ?? []) {
        const lab = s.labs.get(slug);
        if (!lab) continue;
        const p = f.labs.get(slug);
        items.push({ title: lab.title, done: !!p, trackSlug: lab.trackSlug });
        allTracks.add(lab.trackSlug);
        if (p) passed.push({ trackSlug: lab.trackSlug, ev: { name: `Lab: ${lab.title}`, description: `Passed with ${p.score}% on ${fmtDay(p.at)} (${s.tracks.get(lab.trackSlug)?.title ?? lab.trackSlug}).` } });
      }
      for (const ref of r.quizzes ?? []) {
        const mod = s.modules.get(ref);
        if (!mod || mod.quizPassScore == null) continue;
        const p = f.quizzes.get(ref);
        items.push({ title: mod.title, done: !!p, trackSlug: mod.trackSlug });
        allTracks.add(mod.trackSlug);
        if (p) passed.push({ trackSlug: mod.trackSlug, ev: { name: `Module quiz: ${mod.title}`, description: `Passed with ${p.score}% on ${fmtDay(p.at)} (${s.tracks.get(mod.trackSlug)?.title ?? mod.trackSlug}).` } });
      }
      const need = Math.min(r.need, Math.max(items.length, 1));
      if (passed.length < need) ok = false;
      for (const x of passed) {
        usedTracks.add(x.trackSlug);
        evidence.push(x.ev);
      }
      reqs.push({ kind: r.labs ? "labs" : "quizzes", need, have: Math.min(passed.length, need), items });
      criteriaParts.push(
        `pass at least ${need} of these ${r.labs ? "labs" : "module quizzes"}: ${items.map((i) => `"${i.title}" (${s.tracks.get(i.trackSlug)?.title ?? i.trackSlug})`).join("; ")}`,
      );
    }
    const minTracks = Math.min(def.minTracks, Math.max(allTracks.size, 1));
    reqs.push({ kind: "tracks", need: minTracks, have: Math.min(usedTracks.size, minTracks), items: [] });
    if (usedTracks.size < minTracks) ok = false;
    // Alignments name every track the skill draws on; revocation follows only
    // the tracks whose passes count as evidence.
    const trackSlugs = [...allTracks];
    out.push({
      key: skillBadgeKey(def.slug),
      family: "skill",
      glyph: def.glyph,
      name: def.name,
      description: def.description,
      criteria: `Across the TIBLOGICS Learning Box, ${criteriaParts.join("; and ")}; with passes from at least ${minTracks} different tracks. Labs are hands-on tasks scored against published criteria.`,
      trackSlugs: [...usedTracks],
      alignments: trackSlugs.map((slug) => ({ targetName: s.tracks.get(slug)?.title ?? slug, targetUrl: trackUrl(slug) })),
      reqs,
      earned: ok,
      evidence,
    });
  }
  return out;
}

// ── Awarding ────────────────────────────────────────────────────────────────

export interface NewSkillBadge {
  id: string;
  key: string;
  name: string;
  family: SkillBadgeFamily;
}

async function createAward(
  student: { id: string; email: string; name: string },
  b: ResolvedBadge,
  notified: boolean,
): Promise<NewSkillBadge | null> {
  const key = getSigningKey();
  const id = newAwardId();
  const salt = newSalt();
  const issuedAt = new Date();
  const unsigned = buildCredential({
    awardId: id,
    badgeKey: b.key,
    family: b.family,
    name: b.name,
    description: b.description,
    criteria: b.criteria,
    alignments: b.alignments,
    evidence: b.evidence,
    issuedAt,
    email: student.email,
    salt,
    displayName: publicDisplayName(student.name),
  });
  const credential = signDocument(unsigned, key, issuedAt);
  try {
    await prisma.skillBadgeAward.create({
      data: {
        id,
        studentId: student.id,
        badgeKey: b.key,
        family: b.family,
        name: b.name,
        trackSlugs: b.trackSlugs,
        evidence: b.evidence as unknown as Prisma.InputJsonValue,
        issuedAt,
        salt,
        credential: credential as Prisma.InputJsonValue,
        keyFp: key?.fingerprint ?? "",
        signed: !!key && !key.ephemeral,
        notifiedAt: notified ? issuedAt : null,
      },
    });
    return { id, key: b.key, name: b.name, family: b.family };
  } catch {
    return null; // lost a race: already awarded
  }
}

/**
 * Award every skill badge whose conditions are met and that the learner
 * does not hold yet. Idempotent. `backfill` marks the new rows as already
 * announced (no toast) for lazy catch-up on the badges page.
 */
export async function awardSkillBadges(studentId: string, opts: { backfill?: boolean } = {}): Promise<NewSkillBadge[]> {
  await ensureSkillBadgeTables();
  const [student, structure, facts, held] = await Promise.all([
    prisma.student.findUnique({ where: { id: studentId }, select: { id: true, email: true, name: true } }),
    getStructure(),
    loadFacts(studentId),
    prisma.skillBadgeAward.findMany({ where: { studentId }, select: { badgeKey: true } }),
  ]);
  if (!student) return [];
  const have = new Set(held.map((h) => h.badgeKey));
  const out: NewSkillBadge[] = [];
  for (const b of resolveAll(structure, facts)) {
    if (!b.earned || have.has(b.key)) continue;
    const made = await createAward(student, b, !!opts.backfill);
    if (made) out.push(made);
  }
  return out;
}

/** Never throws: badges must not break the flow they decorate. */
export async function awardSkillBadgesSafe(studentId: string): Promise<NewSkillBadge[]> {
  try {
    return await awardSkillBadges(studentId);
  } catch (err) {
    console.error("[skill-badges] award failed", err);
    return [];
  }
}

// ── Learner shelf ───────────────────────────────────────────────────────────

export interface ShelfAward {
  id: string;
  issuedAt: Date;
  isPublic: boolean;
  revoked: boolean;
  signed: boolean;
}

export interface ShelfBadge extends ResolvedBadge {
  award: ShelfAward | null;
  liveTrack: boolean;
}

/** Everything the /learn/badges page needs. Runs the lazy backfill first. */
export async function skillBadgeShelf(studentId: string): Promise<{ badges: ShelfBadge[]; tracks: Map<string, { title: string; live: boolean }> }> {
  await awardSkillBadges(studentId, { backfill: true }).catch((err) => console.error("[skill-badges] backfill", err));
  const [structure, facts, awards, revokedSlugs] = await Promise.all([
    getStructure(),
    loadFacts(studentId),
    prisma.skillBadgeAward.findMany({ where: { studentId } }).catch(() => []),
    revokedTrackSlugs(studentId),
  ]);
  const byKey = new Map(awards.map((a) => [a.badgeKey, a]));
  const resolved = resolveAll(structure, facts);
  const known = new Set(resolved.map((b) => b.key));
  const badges: ShelfBadge[] = resolved.map((b) => {
    const a = byKey.get(b.key);
    return {
      ...b,
      liveTrack: b.trackSlug ? !!structure.tracks.get(b.trackSlug)?.live : true,
      award: a
        ? {
            id: a.id,
            issuedAt: a.issuedAt,
            isPublic: a.isPublic,
            signed: a.signed,
            revoked: !!a.revokedAt || jsonStrings(a.trackSlugs).some((s) => revokedSlugs.has(s)),
          }
        : null,
    };
  });
  // Awards whose definition has gone (a module removed) still show.
  for (const a of awards) {
    if (known.has(a.badgeKey)) continue;
    badges.push({
      key: a.badgeKey,
      family: a.family as SkillBadgeFamily,
      glyph: glyphFor(a.badgeKey),
      name: a.name,
      description: "",
      criteria: "",
      trackSlugs: jsonStrings(a.trackSlugs),
      alignments: [],
      reqs: [],
      earned: true,
      evidence: [],
      liveTrack: true,
      award: { id: a.id, issuedAt: a.issuedAt, isPublic: a.isPublic, signed: a.signed, revoked: !!a.revokedAt },
    });
  }
  const tracks = new Map([...structure.tracks.values()].map((t) => [t.slug, { title: t.title, live: t.live }]));
  return { badges, tracks };
}

function jsonStrings(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

async function revokedTrackSlugs(studentId: string): Promise<Set<string>> {
  const rows = await prisma.learnCertificate
    .findMany({ where: { studentId, revoked: true }, select: { track: { select: { slug: true } } } })
    .catch(() => []);
  return new Set(rows.map((r) => r.track.slug));
}

// ── Verification (public page) ──────────────────────────────────────────────

export type BadgeVerification =
  | "verified" // signature valid with the published key
  | "unsigned" // no production key: development key or no proof
  | "invalid" // the stored credential does not match its signature
  | "unknown_key" // signed with a key this issuer no longer publishes
  | "revoked";

export interface VerifiedBadge {
  award: {
    id: string;
    studentId: string;
    badgeKey: string;
    family: SkillBadgeFamily;
    name: string;
    issuedAt: Date;
    isPublic: boolean;
    signed: boolean;
  };
  credential: Record<string, unknown>;
  status: BadgeVerification;
  /** True when the signature itself checks out (even if revoked). */
  signatureValid: boolean;
  reason: string | null;
}

/**
 * Loads an award and checks it server-side: the embedded eddsa-jcs-2022
 * proof against this issuer's key, the issuer DID, and revocation (its own,
 * or a revoked certificate for any track it depends on).
 */
export async function loadVerifiedBadge(id: string): Promise<VerifiedBadge | null> {
  if (!/^[A-Za-z0-9_-]{8,40}$/.test(id)) return null;
  try {
    await ensureSkillBadgeTables();
  } catch {
    return null;
  }
  let a = await prisma.skillBadgeAward.findUnique({ where: { id } }).catch(() => null);
  if (!a) return null;

  const key = getSigningKey();
  // A badge issued without a production key (dev, or before the key was
  // configured) is re-signed with the current key the next time it is
  // viewed. Signed badges are never re-signed here.
  if (!a.signed && key && a.keyFp !== key.fingerprint) {
    const { proof: _p, ...bare } = a.credential as Record<string, unknown>;
    void _p;
    const credential = signDocument(bare, key, a.issuedAt);
    a = await prisma.skillBadgeAward
      .update({ where: { id }, data: { credential: credential as Prisma.InputJsonValue, keyFp: key.fingerprint, signed: !key.ephemeral } })
      .catch(() => a);
    if (!a) return null;
  }

  const credential = a.credential as Record<string, unknown>;
  // A badge signed with a production key that is no longer the current one
  // cannot be checked here (the DID publishes only the current key).
  const check: ReturnType<typeof verifyDocument> =
    a.signed && (!key || a.keyFp !== key.fingerprint) ? { ok: false, reason: "unknown_key" } : verifyDocument(credential, key);
  const issuerOk = ((credential.issuer as { id?: string } | undefined)?.id ?? credential.issuer) === issuerDid();
  const revokedSlugs = await revokedTrackSlugs(a.studentId);
  const revoked = !!a.revokedAt || jsonStrings(a.trackSlugs).some((s) => revokedSlugs.has(s));

  let status: BadgeVerification;
  let reason: string | null = null;
  const signatureValid = check.ok && issuerOk;
  if (!check.ok && (check.reason === "bad_signature" || check.reason === "context_mismatch" || check.reason === "malformed")) {
    status = "invalid";
    reason = check.reason;
  } else if (check.ok && !issuerOk) {
    status = "invalid";
    reason = "issuer_mismatch";
  } else if (!check.ok && check.reason === "unknown_key" && a.signed) {
    status = "unknown_key";
    reason = check.reason;
  } else if (!check.ok || !a.signed || !key || key.ephemeral) {
    status = "unsigned";
    reason = check.ok ? "development_key" : check.reason;
  } else {
    status = "verified";
  }
  if (revoked && status !== "invalid") status = "revoked";

  return {
    award: {
      id: a.id,
      studentId: a.studentId,
      badgeKey: a.badgeKey,
      family: a.family as SkillBadgeFamily,
      name: a.name,
      issuedAt: a.issuedAt,
      isPublic: a.isPublic,
      signed: a.signed,
    },
    credential,
    status,
    signatureValid,
    reason,
  };
}

export const familyLabelEn = (f: SkillBadgeFamily) => FAMILY_LABEL_EN[f];
