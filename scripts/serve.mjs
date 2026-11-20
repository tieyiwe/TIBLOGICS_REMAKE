// Production server (npm run start): `next start`, without the gap.
//
// `next start` opens the port only once Next.js has finished booting, so for
// a few seconds after a Republish (or any restart) nothing answers, and the
// Replit proxy shows "Internal Server Error" to anyone who clicks or reloads
// right then. This opens the port at once and holds each request until the
// app is ready, so a visitor in that window waits a moment and gets the page.
//
// On shutdown (SIGTERM from Replit when a new version takes over), it stops
// accepting new connections and lets the requests already in progress finish
// (up to 10 seconds) instead of cutting them off.
//
// Same app, same build, same proxy.ts: Next.js documents this as a custom
// server (node_modules/next/dist/docs/01-app/02-guides/custom-server.md).

import http from "node:http";
import next from "next";

// Port 5000, as `next start -p 5000` used (.replit maps it to 80). SERVE_PORT
// overrides it for local testing only.
const port = Number(process.env.SERVE_PORT) || 5000;
const hostname = "0.0.0.0";
// How long a request may wait for the app to boot before it gets the
// "one moment" page (which reloads itself).
const HOLD_MS = 25_000;
const DRAIN_MS = 10_000;

const WAIT_PAGE = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="2"><title>One moment | TIBLOGICS</title><style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:system-ui,-apple-system,sans-serif;background:#F4F7FB;color:#0D1B2A}div{text-align:center;padding:24px}p{color:#3A4A5C}</style></head><body><div><h1>One moment…</h1><p>We're updating the site. This page reloads by itself.</p><p lang="fr">Mise à jour en cours, la page se recharge toute seule.</p></div></body></html>`;

const app = next({ dev: false, hostname, port });
let handle = null;
let upgrade = null;
const ready = app
  .prepare()
  .then(() => {
    handle = app.getRequestHandler();
    upgrade = typeof app.getUpgradeHandler === "function" ? app.getUpgradeHandler() : null;
    console.log(`✓ Ready on http://${hostname}:${port}`);
  })
  .catch((err) => {
    console.error("Next.js failed to start", err);
    process.exit(1);
  });

const server = http.createServer(async (req, res) => {
  if (!handle) {
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      res.writeHead(503, { "Content-Type": "text/html; charset=utf-8", "Retry-After": "2", "Cache-Control": "no-store" });
      res.end(WAIT_PAGE);
    }, HOLD_MS);
    await ready;
    clearTimeout(timer);
    if (timedOut || res.writableEnded) return;
  }
  handle(req, res);
});

server.on("upgrade", async (req, socket, head) => {
  await ready;
  if (upgrade) upgrade(req, socket, head);
  else socket.destroy();
});

server.listen(port, hostname, () => console.log(`> Listening on http://${hostname}:${port} (the app finishes booting behind it)`));

let closing = false;
function shutdown(signal) {
  if (closing) return;
  closing = true;
  console.log(`${signal}: finishing requests in progress`);
  server.close(() => process.exit(0));
  // Idle keep-alive connections would hold close() open.
  server.closeIdleConnections?.();
  setTimeout(() => process.exit(0), DRAIN_MS).unref();
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
