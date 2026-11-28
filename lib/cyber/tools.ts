import type { CyberContext, HttpResult } from "./context";
import { liveContext } from "./context";
import { checkTargetUrl, BLOCK_MESSAGES } from "@/lib/ssrf";
import { engagementFor } from "./engagement";
import { MARKER } from "./checks/pentest";

// Manual tools for authorised testing (Admin > Scanner Leads > Cyber > Tools).
// Each answers one question about one URL. The active ones (request
// inspector, CORS tester, path probe, reflection test) need an active
// engagement whose scope covers the host; the passive ones (DNS and email,
// TLS) work on any public domain. Every use is written to the audit log by
// the API route. GET, HEAD and OPTIONS only; paths and parameters are capped.

export type ToolName = "request" | "cors" | "paths" | "reflect" | "dns" | "tls";
export const ACTIVE_TOOLS: ToolName[] = ["request", "cors", "paths", "reflect"];

export type ToolResult = { ok: true; data: unknown } | { ok: false; error: string; status: number };

const pick = (r: HttpResult, bodyMax = 4000) => {
  const headers: Record<string, string> = {};
  r.headers.forEach((v, k) => (headers[k] = v.slice(0, 500)));
  return { status: r.status, url: r.url, headers, bodyPreview: r.body.slice(0, bodyMax), bodyBytes: r.body.length };
};

export async function runTool(tool: ToolName, input: Record<string, unknown>, ctx: CyberContext = liveContext()): Promise<ToolResult & { engagementId?: string }> {
  const target = String(input.url ?? input.domain ?? "").trim().slice(0, 500);
  if (tool === "dns" || tool === "tls") {
    const host = target.replace(/^[a-z]+:\/\//i, "").replace(/[/?#:].*$/, "").toLowerCase();
    if (!/^([a-z0-9-]+\.)+[a-z]{2,63}$/.test(host)) return { ok: false, error: "Enter a domain name.", status: 400 };
    const checked = await checkTargetUrl(`https://${host}`);
    if (!checked.ok) return { ok: false, error: BLOCK_MESSAGES[checked.reason], status: 400 };
    if (tool === "tls") return { ok: true, data: { tls: await ctx.tls(host), legacyTls: await ctx.legacyTls(host), httpRedirect: await ctx.httpRedirect(host) } };
    const apex = host.replace(/^www\./, "");
    const [a, mx, ns, txt, dmarc, caa, mtaSts] = await Promise.all([ctx.addresses(host), ctx.mx(apex), ctx.ns(apex), ctx.txt(apex), ctx.txt(`_dmarc.${apex}`), ctx.caa(apex), ctx.txt(`_mta-sts.${apex}`)]);
    return { ok: true, data: { addresses: a, mx, ns, spf: (txt ?? []).filter((t) => /^v=spf1/i.test(t)), dmarc: (dmarc ?? []).filter((t) => /^v=DMARC1/i.test(t)), caa, mtaSts } };
  }

  // Active tools: the URL must be public and inside an active engagement.
  const checked = await checkTargetUrl(target);
  if (!checked.ok) return { ok: false, error: BLOCK_MESSAGES[checked.reason], status: 400 };
  const url = checked.url;
  const eng = await engagementFor(url.hostname, typeof input.engagementId === "string" ? input.engagementId : null);
  if (!eng) return { ok: false, error: `No active engagement covers ${url.hostname}. Record the client's written authorisation (Engagements) first.`, status: 403 };

  if (tool === "request") {
    const method = String(input.method ?? "GET").toUpperCase();
    if (!["GET", "HEAD", "OPTIONS"].includes(method)) return { ok: false, error: "Only GET, HEAD and OPTIONS are allowed.", status: 400 };
    const headers: Record<string, string> = {};
    for (const line of String(input.headers ?? "").split("\n").slice(0, 10)) {
      const m = /^([A-Za-z0-9-]{1,60}):\s*(.{0,500})$/.exec(line.trim());
      if (m && !/^(host|content-length|transfer-encoding|connection)$/i.test(m[1])) headers[m[1]] = m[2];
    }
    const r = await ctx.http(url.toString(), { method, follow: input.follow === true, headers, max: 200_000 });
    return { ok: true, engagementId: eng.id, data: pick(r) };
  }
  if (tool === "cors") {
    const origin = String(input.origin ?? "https://evil.example").slice(0, 200);
    if (!/^(https?:\/\/[a-z0-9.-]+(:\d+)?|null)$/i.test(origin)) return { ok: false, error: "Origin must look like https://site.example or null.", status: 400 };
    const r = await ctx.http(url.toString(), { follow: false, headers: { Origin: origin }, max: 2000 });
    const acao = r.headers.get("access-control-allow-origin");
    const cred = r.headers.get("access-control-allow-credentials");
    const verdict = acao === origin && /true/i.test(cred ?? "") ? "VULNERABLE: the origin is trusted with credentials" : acao === origin ? "The origin is reflected (no credentials)" : acao === "*" ? "Any origin may read public responses (no credentials)" : "Not trusted";
    return { ok: true, engagementId: eng.id, data: { origin, acao, credentials: cred, verdict } };
  }
  if (tool === "paths") {
    const paths = String(input.paths ?? "").split("\n").map((p) => p.trim()).filter((p) => /^\/[A-Za-z0-9._~\-/%]{0,200}$/.test(p)).slice(0, 30);
    if (!paths.length) return { ok: false, error: "Enter up to 30 paths, one per line, each starting with /.", status: 400 };
    const rows = [];
    for (const p of paths) {
      const r = await ctx.http(new URL(p, url).toString(), { follow: false, max: 3000, timeoutMs: 6000 }).catch(() => null);
      rows.push(r ? { path: p, status: r.status, type: r.headers.get("content-type"), bytes: r.headers.get("content-length") ?? r.body.length, location: r.headers.get("location") } : { path: p, status: null, error: "no answer" });
      await new Promise((res) => setTimeout(res, 150));
    }
    return { ok: true, engagementId: eng.id, data: { rows } };
  }
  if (tool === "reflect") {
    const name = String(input.param ?? "").slice(0, 60);
    if (!/^[A-Za-z0-9_.[\]-]{1,60}$/.test(name)) return { ok: false, error: "Enter a parameter name.", status: 400 };
    const u = new URL(url);
    const probe = `${MARKER}"'<i>${MARKER}</i>`;
    u.searchParams.set(name, probe);
    const r = await ctx.http(u.toString(), { follow: false, max: 300_000 });
    const raw = r.body.includes(probe) || r.body.includes(`<i>${MARKER}</i>`);
    const quotes = r.body.includes(`${MARKER}"`) || r.body.includes(`${MARKER}'`);
    const at = r.body.indexOf(MARKER);
    return {
      ok: true, engagementId: eng.id,
      data: {
        status: r.status,
        verdict: raw ? "VULNERABLE: HTML in the parameter comes back live (cross-site scripting)" : quotes ? "Quotes come back unencoded (check attribute contexts)" : at >= 0 ? "Reflected, but encoded" : "Not reflected",
        context: at >= 0 ? r.body.slice(Math.max(0, at - 80), at + 120) : null,
      },
    };
  }
  return { ok: false, error: "Unknown tool", status: 400 };
}
