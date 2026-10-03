// Context attached to a support request, built on the server. The browser
// only sends the page path (and the viewport size); titles, the plan and the
// browser summary are looked up here, so a learner cannot plant misleading
// context, and nothing they type ends up in it unescaped.
import prisma from "@/lib/prisma";
import { getAccess } from "@/lib/learn/session";
import type { SupportContext } from "./shared";

/** Same-site path only, without the query string. */
export function cleanPath(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const p = raw.split(/[?#]/)[0].slice(0, 300);
  return /^\/[\w\-/.%~]*$/.test(p) && !p.startsWith("//") ? p : null;
}

/** "Chrome 129 · Android · mobile · 390×844" from the User-Agent header. */
export function deviceSummary(ua: string | null, viewport?: unknown): string | null {
  if (!ua) return null;
  const v = (re: RegExp) => ua.match(re)?.[1]?.split(".")[0];
  const browser =
    (v(/Edg(?:e|A|iOS)?\/([\d.]+)/) && `Edge ${v(/Edg(?:e|A|iOS)?\/([\d.]+)/)}`) ||
    (v(/OPR\/([\d.]+)/) && `Opera ${v(/OPR\/([\d.]+)/)}`) ||
    (v(/SamsungBrowser\/([\d.]+)/) && `Samsung Internet ${v(/SamsungBrowser\/([\d.]+)/)}`) ||
    (v(/Firefox\/([\d.]+)/) && `Firefox ${v(/Firefox\/([\d.]+)/)}`) ||
    (v(/CriOS\/([\d.]+)/) && `Chrome ${v(/CriOS\/([\d.]+)/)}`) ||
    (v(/Chrome\/([\d.]+)/) && `Chrome ${v(/Chrome\/([\d.]+)/)}`) ||
    (v(/Version\/([\d.]+).*Safari/) && `Safari ${v(/Version\/([\d.]+).*Safari/)}`) ||
    "Other browser";
  const os = /iPhone|iPad|iPod/.test(ua)
    ? "iOS"
    : /Android/.test(ua)
      ? "Android"
      : /CrOS/.test(ua)
        ? "ChromeOS"
        : /Windows/.test(ua)
          ? "Windows"
          : /Mac OS X|Macintosh/.test(ua)
            ? "macOS"
            : /Linux/.test(ua)
              ? "Linux"
              : "Other OS";
  const mobile = /Mobi|iPhone|Android.*Mobile/.test(ua) ? "mobile" : /iPad|Tablet/.test(ua) ? "tablet" : "desktop";
  const vp = typeof viewport === "string" && /^\d{2,5}x\d{2,5}$/.test(viewport) ? viewport.replace("x", "×") : null;
  return [browser, os, mobile, vp].filter(Boolean).join(" · ").slice(0, 120);
}

async function pageRefs(path: string): Promise<{ lesson?: string; track?: string; pageTitle?: string }> {
  const m = path.match(/^\/learn\/(lesson|lab|track|exam|quiz|capstone|studio)\/([\w-]{1,80})/);
  if (!m) return {};
  const [, kind, ref] = m;
  try {
    if (kind === "lesson") {
      const l = await prisma.lesson.findUnique({ where: { id: ref }, select: { title: true, module: { select: { track: { select: { title: true } } } } } });
      return l ? { lesson: `Lesson: ${l.title}`, track: l.module.track.title } : {};
    }
    if (kind === "lab") {
      const l = await prisma.lab.findUnique({ where: { slug: ref }, select: { title: true, track: { select: { title: true } } } });
      return l ? { lesson: `Lab: ${l.title}`, track: l.track.title } : {};
    }
    if (kind === "quiz") {
      const q = await prisma.quiz.findUnique({ where: { id: ref }, select: { module: { select: { title: true, track: { select: { title: true } } } } } });
      return q ? { lesson: `Quiz: ${q.module.title}`, track: q.module.track.title } : {};
    }
    if (kind === "track" || kind === "exam" || kind === "capstone") {
      const t = await prisma.learnTrack.findUnique({ where: { slug: ref }, select: { title: true } });
      return t ? { track: t.title, pageTitle: kind === "track" ? undefined : kind === "exam" ? "Final exam" : "Capstone" } : {};
    }
    if (kind === "studio") return { pageTitle: `Studio: ${ref}` };
  } catch (err) {
    console.error("[support] context refs", err);
  }
  return {};
}

export function planLabel(access: Awaited<ReturnType<typeof getAccess>>): string {
  const e = access.entitlement;
  if (e.team) return `Team plan: ${e.team.name} (${e.team.role})`;
  const parts: string[] = [];
  if (e.status) parts.push(`Subscription ${e.status}${e.inGrace ? " (payment grace)" : ""}${e.cancelAtPeriodEnd ? ", cancels at period end" : ""}`);
  if (access.purchased.length) parts.push(`${access.purchased.length} track${access.purchased.length === 1 ? "" : "s"} bought`);
  return parts.length ? parts.join(" · ") : "No plan";
}

export async function buildContext(opts: {
  studentId: string | null;
  path: unknown;
  viewport?: unknown;
  userAgent: string | null;
  locale: string;
}): Promise<SupportContext> {
  const path = cleanPath(opts.path);
  const [refs, access] = await Promise.all([
    path ? pageRefs(path) : Promise.resolve({} as Awaited<ReturnType<typeof pageRefs>>),
    opts.studentId ? getAccess(opts.studentId).catch(() => null) : Promise.resolve(null),
  ]);
  return {
    path,
    pageTitle: refs.pageTitle ?? null,
    lesson: refs.lesson ?? null,
    track: refs.track ?? null,
    device: deviceSummary(opts.userAgent, opts.viewport),
    plan: opts.studentId ? (access ? planLabel(access) : "Unknown") : "Signed out (visitor)",
    locale: opts.locale,
  };
}
