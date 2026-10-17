import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { agrInputSchema, dateMs, evaluateAgr } from "@/lib/agr/engine";

// The AI Graveyard Report (AGR Score™) MCP server: https://tiblogics.com/mcp
// (and https://mcp.tiblogics.com/mcp when that domain is attached to this
// deployment). Streamable HTTP, stateless, JSON responses, one read-only tool,
// calculate_agr_report (lib/agr/engine.ts). Ported from the owner's
// AGR-MCP-Service v1.0.0 to run inside the site instead of a second server.
//
// No sign-in: the tool reads nothing on our side and stores nothing; it
// only calculates from the facts in the call. Inputs are never logged. A
// body-size cap and a per-network burst limit (in memory, generous because
// every ChatGPT user's calls arrive from OpenAI's addresses) guard against
// floods.

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_BODY = 512 * 1024;
const BURST = 300; // requests per network per minute
const hits = new Map<string, { n: number; reset: number }>();

function limited(req: Request): boolean {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
  const now = Date.now();
  const h = hits.get(ip);
  if (!h || now > h.reset) {
    if (hits.size > 5000) hits.clear();
    hits.set(ip, { n: 1, reset: now + 60_000 });
    return false;
  }
  h.n += 1;
  return h.n > BURST;
}

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "content-type, accept, mcp-session-id, mcp-protocol-version, authorization",
  "Access-Control-Expose-Headers": "Mcp-Session-Id",
};

function withCors(res: Response): Response {
  const headers = new Headers(res.headers);
  for (const [k, v] of Object.entries(CORS)) headers.set(k, v);
  headers.set("Cache-Control", "no-store");
  headers.set("X-Robots-Tag", "noindex");
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}

const jsonRpcError = (status: number, message: string) =>
  withCors(Response.json({ jsonrpc: "2.0", error: { code: -32000, message }, id: null }, { status }));

function createAgrServer(): McpServer {
  const server = new McpServer(
    { name: "ai-graveyard-report", version: "1.0.0" },
    {
      instructions:
        "AGR is deterministic: facts in, scores out. Use calculate_agr_report only after project facts are supported by accessible evidence or explicit user confirmation. Never invent project facts. The tool does not access chat history or external systems.",
    },
  );
  server.registerTool(
    "calculate_agr_report",
    {
      title: "Calculate AGR report",
      description:
        "Calculate AI Graveyard Report project categories, Project Scores, overall AGR Score, tier, restart penalty, and core metrics from already-supported AGR project facts. Use after the AGR skill has identified and counted qualifying projects. This tool does not discover projects, read chat history, or infer missing facts.",
      inputSchema: agrInputSchema,
      annotations: { readOnlyHint: true, destructiveHint: false, openWorldHint: false },
    },
    async ({ asOf, projects }) => {
      if (projects.some((p) => dateMs(p.last) > dateMs(asOf))) {
        throw new Error("A project's last activity date cannot be after asOf.");
      }
      const result = evaluateAgr(projects, asOf);
      return {
        structuredContent: result,
        content: [{ type: "text" as const, text: `AGR Score ${result.agrScore}/100. Tier: ${result.tier}. Based on ${result.projectCount} scored projects.` }],
      };
    },
  );
  return server;
}

async function handle(req: Request): Promise<Response> {
  if (limited(req)) return jsonRpcError(429, "Too many requests. Try again in a minute.");
  const length = Number(req.headers.get("content-length") ?? 0);
  if (length > MAX_BODY) return jsonRpcError(413, "Request too large.");
  let request = req;
  if (req.method === "POST") {
    // Read the body once with a hard cap (content-length can be absent).
    const body = await req.arrayBuffer();
    if (body.byteLength > MAX_BODY) return jsonRpcError(413, "Request too large.");
    request = new Request(req.url, { method: "POST", headers: req.headers, body });
  }
  const server = createAgrServer();
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  try {
    await server.connect(transport);
    return withCors(await transport.handleRequest(request));
  } catch (err) {
    console.error("[mcp] request failed", err instanceof Error ? err.message : "error");
    return jsonRpcError(500, "Internal server error");
  } finally {
    void transport.close().catch(() => {});
    void server.close().catch(() => {});
  }
}

export const POST = handle;
export const GET = handle;
export const DELETE = handle;

export function OPTIONS(): Response {
  return new Response(null, { status: 204, headers: { ...CORS, "Access-Control-Max-Age": "86400" } });
}
