// OpenAI plugin domain verification for the AGR MCP server: served at
// https://mcp.tiblogics.com/.well-known/openai-apps-challenge (and on the
// main domain) through a rewrite in next.config.js. Returns exactly the token
// from the OPENAI_APPS_CHALLENGE secret, as plain text and nothing else, as
// OpenAI's submission portal requires; 404 until the secret is set.

export const dynamic = "force-dynamic";

export function GET(): Response {
  const token = (process.env.OPENAI_APPS_CHALLENGE ?? "").trim();
  if (!token) return new Response("Not found", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  return new Response(token, { status: 200, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
}
