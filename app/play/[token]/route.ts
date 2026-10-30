import type { NextRequest } from "next/server";
import { getLocale, getT } from "@/lib/i18n/server";
import { checkRateLimit } from "@/lib/rate-limit";
import { playShare } from "@/lib/learn/game-forge/db";
import { gameCsp, gameDocument } from "@/lib/learn/game-forge/engine";
import { engineLabels, newNonce } from "@/lib/learn/game-forge/labels";
import { parseConfig } from "@/lib/learn/game-forge/schema";
import { getYouthProfile, isMinor, youthGate } from "@/lib/learn/youth-account";

// Game Forge "Share with family": /play/[token] plays a young learner's game
// full screen. Public by design (the unguessable token, 32 random bytes, is
// the only key), never indexed, and it shows nothing about who made it: no
// name, no account, no comments. The page is the game document itself,
// served with a CSP "sandbox" (an opaque origin: no cookies, no storage), no
// network (default-src 'none') and no framing. The policy browsers receive is
// the /play entry in next.config.js (config headers win over a route's); the
// nonce policy set here matches it and only tightens scripts further. A link stops working when the kid or a parent turns it off, or
// when the child's parental consent is pending or revoked.
export const dynamic = "force-dynamic";

function headers(nonce: string | null): HeadersInit {
  const csp = nonce
    ? `sandbox allow-scripts; ${gameCsp(nonce)}; frame-ancestors 'none'`
    : "sandbox; default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'";
  return {
    "Content-Type": "text/html; charset=utf-8",
    "Content-Security-Policy": csp,
    "Cache-Control": "no-store, max-age=0",
    "X-Robots-Tag": "noindex, nofollow, noarchive, nosnippet",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Cross-Origin-Resource-Policy": "same-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  };
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function gone(title: string, body: string, lang: string, status: number) {
  const html =
    `<!doctype html><html lang="${esc(lang)}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">` +
    `<meta name="robots" content="noindex,nofollow"><title>${esc(title)}</title><style>` +
    `body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0D1B2A;color:#fff;font-family:system-ui,sans-serif;padding:24px;text-align:center}` +
    `div{max-width:360px}p.b{font-size:56px;margin:0}h1{font-size:22px;margin:12px 0 8px}p{color:#C9D6E5;line-height:1.5}</style></head>` +
    `<body><div><p class="b">🎮</p><h1>${esc(title)}</h1><p>${esc(body)}</p></div></body></html>`;
  return new Response(html, { status, headers: headers(null) });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const [{ token }, t, locale] = await Promise.all([params, getT(), getLocale()]);
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (!(await checkRateLimit(`gf-play:${ip}`, 120, 600_000))) {
    return gone(t("studio.game-forge.play.busyTitle"), t("studio.game-forge.play.busyBody"), locale, 429);
  }
  const unavailable = () => gone(t("studio.game-forge.play.goneTitle"), t("studio.game-forge.play.goneBody"), locale, 404);
  let row: Awaited<ReturnType<typeof playShare>> = null;
  try {
    row = await playShare(token);
  } catch (err) {
    console.error("[play] lookup", err instanceof Error ? err.message : err);
  }
  if (!row) return unavailable();
  // A child's links pause while their parent's consent is pending or revoked,
  // and end with a deleted or deletion-requested account.
  const profile = await getYouthProfile(row.studentId);
  if (!profile || profile.email.endsWith("@deleted.arfa.invalid") || profile.parentDeleteRequestedAt) return unavailable();
  if (isMinor(profile) && youthGate(profile)) return unavailable();
  const parsed = parseConfig(row.config);
  if (!parsed.ok) return unavailable();

  const nonce = newNonce();
  const html = gameDocument(parsed.config, { labels: engineLabels(t), nonce, lang: locale, mode: "play" });
  return new Response(html, { status: 200, headers: headers(nonce) });
}
