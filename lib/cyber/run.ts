import { randomBytes } from "crypto";
import prisma from "@/lib/prisma";
import { checkTargetUrl, BLOCK_MESSAGES } from "@/lib/ssrf";
import { extraAudit } from "@/lib/scanner/extra";
import type { CyberContext, ModuleOutput, PageInfo } from "./context";
import { liveContext } from "./context";
import { stackOf } from "./fixes";
import { tipFor } from "./tips";
import { categoryScores, counts, gradeOf, planOf, scoreOf, sortFindings } from "./score";
import type { Category, CyberResult } from "./types";
import { transport } from "./checks/transport";
import { headers } from "./checks/headers";
import { email } from "./checks/email";
import { dns } from "./checks/dns";
import { surface } from "./checks/surface";
import { detectPlatform, osvLive, software, type OsvLookup } from "./checks/software";
import { content } from "./checks/content";
import { exposure } from "./checks/exposure";
import { pentest } from "./checks/pentest";
import { ensureCyberTables } from "./db";
import { newId } from "./engagement";

/** Requests one scan may send to the site (keeps the load on a client's site small). */
export const REQUEST_BUDGET = 150;
/** Pause between active requests, in ms. */
export const ACTIVE_DELAY_MS = 120;

/** A context that counts requests, stops at the budget and spaces active ones out. */
export function budgeted(ctx: CyberContext, budget = REQUEST_BUDGET, delay = 0): CyberContext & { used(): number } {
  let used = 0;
  return {
    ...ctx,
    async http(url, opts) {
      if (++used > budget) throw new Error("request budget reached");
      if (delay) await new Promise((r) => setTimeout(r, delay));
      return ctx.http(url, opts);
    },
    used: () => used,
  };
}

export interface RunOptions {
  deep: boolean;
  osv?: OsvLookup;
  onProgress?: (step: string) => void;
}

/** The whole scan; no database. Throws a readable Error when the site cannot be reached. */
export async function runCyber(baseCtx: CyberContext, rawUrl: string, opts: RunOptions): Promise<CyberResult> {
  const started = new Date();
  const ctx = budgeted(baseCtx);
  const progress = opts.onProgress ?? (() => {});
  progress("Loading the site");
  let first;
  try {
    first = await ctx.http(rawUrl, { follow: true, max: 1_500_000, timeoutMs: 15_000 });
  } catch (err) {
    throw new Error(`Could not reach the site: ${err instanceof Error ? err.message : String(err)}`.slice(0, 300));
  }
  const fin = new URL(first.url || rawUrl);
  const hdrs: Record<string, string> = {};
  first.headers.forEach((v, k) => (hdrs[k.toLowerCase()] = v));
  const page: PageInfo = {
    requested: rawUrl,
    finalUrl: fin.toString(),
    status: first.status,
    headers: hdrs,
    setCookies: first.setCookies,
    html: first.body.slice(0, 900_000),
    host: fin.hostname.toLowerCase(),
    apex: fin.hostname.toLowerCase().replace(/^www\./, ""),
    https: fin.protocol === "https:",
  };
  const tech = extraAudit({ html: page.html, finalUrl: page.finalUrl, headers: hdrs, dns: null, security: null }).tech;
  const platform = detectPlatform(page, { cms: tech.cms, cmsVersion: tech.cmsVersion, libraries: tech.libraries });
  const stack = stackOf(platform);

  progress("Checking encryption, headers, email, DNS, software and subdomains");
  const passive = await Promise.all([
    transport(ctx, page, stack),
    Promise.resolve(headers(page, stack)),
    email(ctx, page),
    dns(ctx, page),
    software(page, platform, opts.osv ?? osvLive),
    content(ctx, page),
    surface(ctx, page),
  ]);
  const outputs: ModuleOutput[] = [...passive];
  const notes: string[] = [];
  if (opts.deep) {
    progress("Authorised tests: exposed files and admin areas");
    const active = budgeted(ctx, REQUEST_BUDGET, ACTIVE_DELAY_MS);
    outputs.push(await exposure(active, page).catch((e) => ({ findings: [], checks: [], notes: [`Exposure checks stopped: ${e instanceof Error ? e.message : e}`] })));
    progress("Authorised tests: input handling");
    outputs.push(await pentest(active, page).catch((e) => ({ findings: [], checks: [], notes: [`Input tests stopped: ${e instanceof Error ? e.message : e}`] })));
  } else {
    notes.push("Passive scan: exposed files, admin areas and input handling were not tested (they need the owner's authorisation).");
  }

  const seen = new Set<string>();
  const findings = sortFindings(
    outputs.flatMap((o) => o.findings).filter((f) => (seen.has(f.id) ? false : (seen.add(f.id), true))),
  ).map((f) => ({ ...f, tip: f.tip ?? tipFor(f.id) }));
  const checks = outputs.flatMap((o) => o.checks);
  for (const o of outputs) notes.push(...(o.notes ?? []));
  const c = counts(findings);
  const score = scoreOf(findings);
  const present = [...new Set(checks.map((x) => x.category))] as Category[];
  return {
    url: rawUrl,
    finalUrl: page.finalUrl,
    domain: page.apex,
    startedAt: started.toISOString(),
    finishedAt: new Date().toISOString(),
    deep: opts.deep,
    score,
    grade: gradeOf(score, c),
    counts: c,
    categoryScores: categoryScores(findings, present),
    findings,
    checks,
    platform,
    subdomains: outputs.flatMap((o) => o.subdomains ?? []),
    plan: planOf(findings),
    notes,
  };
}

// ---------------------------------------------------------------------------
// Stored scans
// ---------------------------------------------------------------------------

let running = 0;
export const MAX_RUNNING = 2;

export type StartResult = { ok: true; id: string } | { ok: false; error: string; status: number };

export async function startScan(o: { url: string; deep: boolean; engagementId: string | null; company?: string | null; contactName?: string | null; by: string }, ctx: CyberContext = liveContext()): Promise<StartResult> {
  const checked = await checkTargetUrl(o.url);
  if (!checked.ok) return { ok: false, error: BLOCK_MESSAGES[checked.reason], status: 400 };
  if (running >= MAX_RUNNING) return { ok: false, error: "Two scans are already running. Try again in a minute.", status: 429 };
  await ensureCyberTables();
  const id = newId();
  const token = randomBytes(18).toString("base64url");
  const url = checked.url.toString();
  const domain = checked.url.hostname.toLowerCase().replace(/^www\./, "");
  await prisma.$executeRawUnsafe(
    `INSERT INTO "CyberScan" ("id","createdBy","token","url","domain","status","progress","deep","engagementId","company","contactName")
     VALUES ($1,$2,$3,$4,$5,'running','Starting',$6,$7,$8,$9)`,
    id, o.by, token, url, domain, o.deep, o.engagementId, o.company?.slice(0, 160) || null, o.contactName?.slice(0, 120) || null,
  );
  running++;
  // Runs after the answer; the page polls the status.
  void (async () => {
    try {
      const result = await runCyber(ctx, url, {
        deep: o.deep,
        onProgress: (step) => void prisma.$executeRawUnsafe(`UPDATE "CyberScan" SET "progress" = $2 WHERE "id" = $1`, id, step).catch(() => {}),
      });
      await prisma.$executeRawUnsafe(
        `UPDATE "CyberScan" SET "status"='done', "progress"=NULL, "score"=$2, "grade"=$3, "counts"=$4::jsonb, "result"=$5::jsonb, "finishedAt"=now(), "domain"=$6 WHERE "id"=$1`,
        id, result.score, result.grade, JSON.stringify(result.counts), JSON.stringify(result), result.domain,
      );
    } catch (err) {
      await prisma.$executeRawUnsafe(
        `UPDATE "CyberScan" SET "status"='failed', "progress"=NULL, "error"=$2, "finishedAt"=now() WHERE "id"=$1`,
        id, (err instanceof Error ? err.message : String(err)).slice(0, 400),
      ).catch(() => {});
    } finally {
      running--;
    }
  })();
  return { ok: true, id };
}

/** Scans stuck in "running" after a restart are marked failed. */
export async function failStale(): Promise<void> {
  await ensureCyberTables();
  await prisma.$executeRawUnsafe(`UPDATE "CyberScan" SET "status"='failed', "error"='Interrupted (server restarted)', "finishedAt"=now() WHERE "status"='running' AND "createdAt" < now() - interval '10 minutes'`);
}
