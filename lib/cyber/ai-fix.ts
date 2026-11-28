import prisma from "@/lib/prisma";
import { runClaude } from "@/lib/claude";
import type { CyberResult } from "./types";

// "Generate a tailored fix": a fix for one finding written for the client's
// own stack, with exact configuration, how to check it worked and how to undo
// it. Sends only the finding (title, evidence, generic steps) and the detected
// platform: never secrets (the scan stores none). Saved on the scan, so it is
// written once.

const SYSTEM = `You are a senior security engineer at TIBLOGICS, a web and cybersecurity agency. You write fix instructions for one security finding on a client's website, for the person who will apply them (often a small-business owner with a web developer or a hosting control panel).

Write in plain English, in Markdown, with these sections:
## What is wrong
Two or three sentences, no jargon.
## How to fix it
Numbered steps for the detected platform. Give exact configuration or code in fenced code blocks. If the platform is unknown, give the two most likely options (e.g. Apache and nginx, or the hosting control panel and Cloudflare).
## Check that it worked
How to verify, with a command (curl -I ...) or a free online tool.
## If something breaks
How to roll back, and what to watch for.

Rules: be specific and correct; never invent version numbers or CVE details that are not in the finding; do not include exploit code or instructions for attacking the site; keep it under 450 words. Plain punctuation, no em dashes.`;

export async function generateFix(scanId: string, findingId: string, actor: string): Promise<string> {
  const rows = await prisma.$queryRawUnsafe<Array<{ result: CyberResult | null }>>(`SELECT "result" FROM "CyberScan" WHERE "id" = $1`, scanId);
  const result = rows[0]?.result;
  if (!result) throw new Error("Scan not found");
  const f = result.findings.find((x) => x.id === findingId);
  if (!f) throw new Error("Finding not found");
  const existing = (result as CyberResult & { aiFixes?: Record<string, string> }).aiFixes?.[findingId];
  if (existing) return existing;
  const p = result.platform;
  const prompt = [
    `Website: ${result.domain}`,
    `Platform detected: ${[p.cms && `${p.cms}${p.cmsVersion ? ` ${p.cmsVersion}` : ""}`, p.server && `server: ${p.server}`, p.poweredBy && `powered by: ${p.poweredBy}`, p.cdn && `CDN/firewall: ${p.cdn}`].filter(Boolean).join("; ") || "unknown"}`,
    "",
    `Finding (${f.severity}): ${f.title}`,
    `Evidence: ${f.evidence}`,
    `Why it matters: ${f.impact}`,
    `Generic fix steps: ${f.fix.join(" / ")}`,
    f.snippets?.length ? `Generic snippets: ${f.snippets.map((s) => `${s.label}: ${s.code}`).join(" || ")}` : "",
  ].filter(Boolean).join("\n").slice(0, 6000);
  const out = await runClaude("cyber-fix", { system: SYSTEM, messages: [{ role: "user", content: prompt }], meta: { ref: `cyber:${scanId}:${actor}`.slice(0, 120) } });
  const text = out.text.replace(/[—–]/g, ", ").trim();
  await prisma.$executeRawUnsafe(
    `UPDATE "CyberScan" SET "result" = jsonb_set("result", '{aiFixes}', COALESCE("result"->'aiFixes', '{}'::jsonb) || jsonb_build_object($2::text, $3::text)) WHERE "id" = $1`,
    scanId, findingId, text,
  );
  return text;
}

