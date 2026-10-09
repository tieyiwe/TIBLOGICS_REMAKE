import { randomUUID } from "crypto";
import prisma from "@/lib/prisma";
import { isLocale } from "@/lib/i18n/config";
import { normEmail } from "@/lib/growth/outreach/normalize";
import { ensureScholarshipTables } from "./db";
import { approveScholarship, cleanText, createDrafts, liveTracks, ScholarshipError, type AwardInput } from "./service";
import { sendApplicationAlert, sendApplicationDeclined, sendApplicationReceived } from "./emails";

// Applications from the public page /tilo-vision-scholarship. Staff review
// them in Admin > AI Academy > Scholarships: shortlist, decline (with an
// optional kind email) or award (creates a draft award for the usual review
// and approval). Applications can be closed from the admin.

const SETTING = "scholarship.applications";
export const BACKGROUNDS = ["student", "jobseeker", "professional", "business", "educator", "other"] as const;
export type ApplicationStatus = "new" | "shortlisted" | "declined" | "awarded";

export async function applicationsOpen(): Promise<boolean> {
  const row = await prisma.adminSettings.findUnique({ where: { key: SETTING } }).catch(() => null);
  return row?.value !== "closed";
}

export async function setApplicationsOpen(open: boolean): Promise<void> {
  await prisma.adminSettings.upsert({ where: { key: SETTING }, create: { key: SETTING, value: open ? "open" : "closed" }, update: { value: open ? "open" : "closed" } });
}

/** "+233 24 123 4567" style: digits, spaces, +, -, (), dots; 7 to 15 digits. */
export function cleanPhone(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.replace(/[^0-9+()\-. ]/g, "").replace(/\s+/g, " ").trim().slice(0, 30);
  const digits = s.replace(/\D/g, "").length;
  return digits >= 7 && digits <= 15 ? s : null;
}

export const applicationRef = (id: string) => `TVA-${id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;

export interface ApplicationInput {
  name: string;
  email: string;
  phone?: string | null;
  country?: string | null;
  locale?: string | null;
  background?: string | null;
  motivation: string;
  goals?: string | null;
  trackIds?: string[];
  links?: string | null;
}

/**
 * Stores an application and sends the confirmation (and the staff alert).
 * An address with an application still under review in the last 180 days is
 * not stored twice; the visitor sees the same thank-you (no address probing).
 */
export async function submitApplication(input: ApplicationInput, headers?: Headers | null): Promise<{ ok: true; reference: string | null }> {
  await ensureScholarshipTables();
  if (!(await applicationsOpen())) throw new ScholarshipError("closed", 409);
  const email = normEmail(input.email);
  const name = cleanText(input.name, 120);
  const motivation = cleanText(input.motivation, 2000);
  if (!email || !name || !motivation || motivation.length < 80 || !cleanPhone(input.phone)) throw new ScholarshipError("invalid", 400);
  const live = await liveTracks().catch(() => []);
  const trackIds = [...new Set(input.trackIds ?? [])].filter((id) => live.some((t) => t.id === id)).slice(0, 5);
  const background = BACKGROUNDS.includes(input.background as (typeof BACKGROUNDS)[number]) ? (input.background as string) : null;
  const locale = isLocale(input.locale) ? input.locale : "en";

  const dup = await prisma.scholarshipApplication.findFirst({
    where: { email, status: { in: ["new", "shortlisted"] }, createdAt: { gte: new Date(Date.now() - 180 * 86_400_000) } },
    select: { id: true },
  });
  if (dup) return { ok: true, reference: null };

  const id = randomUUID();
  await prisma.scholarshipApplication.create({
    data: {
      id,
      name,
      email,
      phone: cleanPhone(input.phone),
      country: cleanText(input.country, 80),
      locale,
      background,
      motivation,
      goals: cleanText(input.goals, 1000),
      trackIds,
      links: cleanText(input.links, 300),
    },
  });
  const reference = applicationRef(id);
  // Analytics: where the applicant came from (first and last touch). Never throws.
  if (headers) await import("@/lib/analytics/touch").then((m) => m.recordTouch({ kind: "scholarship_application", refId: id, headers })).catch(() => {});
  await sendApplicationReceived({ email, name, locale, reference }).catch((err) => console.error("[scholarship] application email", err instanceof Error ? err.message : err));
  await sendApplicationAlert({
    id,
    name,
    email,
    phone: cleanPhone(input.phone),
    country: cleanText(input.country, 80),
    background,
    motivation,
    tracks: live.filter((t) => trackIds.includes(t.id)).map((t) => t.title),
  }).catch((err) => console.error("[scholarship] application alert", err instanceof Error ? err.message : err));
  return { ok: true, reference };
}

export interface ApplicationRow {
  id: string;
  reference: string;
  name: string;
  email: string;
  phone: string | null;
  country: string | null;
  locale: string;
  background: string | null;
  motivation: string;
  goals: string | null;
  trackTitles: string[];
  trackIds: string[];
  links: string | null;
  status: ApplicationStatus;
  reviewNote: string | null;
  reviewedAt: Date | null;
  reviewedBy: string | null;
  scholarshipId: string | null;
  createdAt: Date;
  hasAccount: boolean;
}

export async function listApplications(status?: string | null): Promise<ApplicationRow[]> {
  await ensureScholarshipTables();
  const rows = await prisma.scholarshipApplication.findMany({
    where: status && ["new", "shortlisted", "declined", "awarded"].includes(status) ? { status } : {},
    orderBy: { createdAt: "desc" },
    take: 500,
  });
  const [live, accounts] = await Promise.all([
    liveTracks().catch(() => []),
    rows.length ? prisma.student.findMany({ where: { email: { in: rows.map((r) => r.email) } }, select: { email: true } }) : [],
  ]);
  const known = new Set(accounts.map((a) => a.email.toLowerCase()));
  return rows.map((r) => ({
    ...r,
    status: r.status as ApplicationStatus,
    reference: applicationRef(r.id),
    trackTitles: live.filter((t) => r.trackIds.includes(t.id)).map((t) => t.title),
    hasAccount: known.has(r.email),
  }));
}

/** Shortlist or decline (optionally emailing a kind no). */
export async function reviewApplication(id: string, action: "shortlist" | "decline", actorEmail: string, opts: { notify?: boolean; note?: string | null } = {}): Promise<void> {
  await ensureScholarshipTables();
  const a = await prisma.scholarshipApplication.findUnique({ where: { id } });
  if (!a) throw new ScholarshipError("Application not found.", 404);
  if (a.status === "awarded") throw new ScholarshipError("This application already has an award.", 409);
  const status = action === "shortlist" ? "shortlisted" : "declined";
  await prisma.scholarshipApplication.update({
    where: { id },
    data: { status, reviewedAt: new Date(), reviewedBy: actorEmail, ...(opts.note !== undefined ? { reviewNote: cleanText(opts.note, 1000) } : {}) },
  });
  if (action === "decline" && opts.notify && a.status !== "declined") {
    await sendApplicationDeclined({ email: a.email, name: a.name, locale: a.locale });
  }
}

/** Award: a draft scholarship for this applicant (then reviewed and approved as usual). */
export async function awardApplication(
  id: string,
  terms: Omit<AwardInput, "recipients" | "applicationId">,
  actorEmail: string,
  opts: { approveNow?: boolean } = {},
): Promise<{ scholarshipId: string; approved: boolean; emailed: boolean }> {
  await ensureScholarshipTables();
  const a = await prisma.scholarshipApplication.findUnique({ where: { id } });
  if (!a) throw new ScholarshipError("Application not found.", 404);
  if (a.status === "awarded") throw new ScholarshipError("This application already has an award.", 409);
  const r = await createDrafts({ ...terms, recipients: [{ name: a.name, email: a.email, locale: a.locale }], applicationId: id }, actorEmail);
  if (!r.created.length) throw new ScholarshipError(r.skipped[0]?.reason ?? "Could not create the award.", 409);
  await prisma.scholarshipApplication.update({ where: { id }, data: { status: "awarded", scholarshipId: r.created[0].id, reviewedAt: new Date(), reviewedBy: actorEmail } });
  // "Approve and send now": the congratulations email goes at once, to the
  // address on the application (the one the scholarship is linked to).
  if (opts.approveNow) {
    const a = await approveScholarship(r.created[0].id, actorEmail);
    return { scholarshipId: r.created[0].id, approved: true, emailed: a.emailed };
  }
  return { scholarshipId: r.created[0].id, approved: false, emailed: false };
}
