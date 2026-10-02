// The staff gate run by proxy.ts on every admin page and admin API request
// made with a staff session:
//   1. reads the person's live access (lib/admin/team/state.ts), so a role
//      change, an override, a deactivation or a forced sign-out applies on
//      this very request, not when the cookie is next refreshed;
//   2. checks the path against lib/admin/access-map.ts (GET = view, writes =
//      manage, CSV exports also need data.export);
//   3. records the footprint: page views (throttled), API writes, exports.
// Returns a response to send instead, or null to let the request through.
import { NextResponse, type NextRequest } from "next/server";
import type { JWT } from "next-auth/jwt";
import { areaOf, decide, isExportPath } from "@/lib/admin/access-map";
import { featureOf, type Viewer } from "@/lib/admin/permissions";

const SESSION_COOKIES = ["next-auth.session-token", "__Secure-next-auth.session-token"];

function signedOut(req: NextRequest, api: boolean): NextResponse {
  const res = api
    ? NextResponse.json({ error: "Your session has ended. Sign in again." }, { status: 401 })
    : NextResponse.redirect(new URL("/admin_pro/login?ended=1", req.url));
  for (const name of SESSION_COOKIES) {
    if (req.cookies.has(name)) res.cookies.set(name, "", { path: "/", maxAge: 0 });
    // Chunked cookies (large tokens) are named .0, .1, ...
    for (const c of req.cookies.getAll()) if (c.name.startsWith(`${name}.`)) res.cookies.set(c.name, "", { path: "/", maxAge: 0 });
  }
  return res;
}

function needLabel(key: string): string {
  const base = key.split(/[:]/)[0];
  const f = featureOf(base);
  if (f) return key.endsWith(":manage") ? `${f.label} (manage)` : f.label;
  return key;
}

export async function staffGate(req: NextRequest, token: JWT, kind: "page" | "api"): Promise<NextResponse | null> {
  const path = req.nextUrl.pathname;
  const method = req.method.toUpperCase();
  let viewer: Viewer;
  const staffId = token.isOwner ? "owner" : token.collaboratorId ?? null;
  if (token.isOwner) {
    viewer = { isOwner: true, isAdmin: true, permissions: ["*"] };
  } else if (token.collaboratorId) {
    let state: Awaited<ReturnType<typeof import("./state").staffState>> = null;
    try {
      const { staffState } = await import("./state");
      state = await staffState(token.collaboratorId);
    } catch {
      state = null;
    }
    if (state === "gone" || (state && !state.active)) return signedOut(req, kind === "api");
    if (state && state.sessionVersion !== (token.ssv ?? 0)) return signedOut(req, kind === "api");
    viewer = state
      ? { isOwner: false, isAdmin: state.isAdmin, permissions: state.permissions }
      : { isOwner: false, isAdmin: !!token.isAdmin, permissions: token.permissions ?? [] };
  } else {
    viewer = { isOwner: false, isAdmin: !!token.isAdmin, permissions: token.permissions ?? [] };
  }

  const d = decide(viewer, kind, path, method);
  const email = String(token.email ?? "unknown");
  const area = areaOf(path);
  const write = !["GET", "HEAD", "OPTIONS"].includes(method);

  // Footprint (never awaited, never blocks).
  void import("./footprint")
    .then((fp) => {
      if (kind === "page") {
        const prefetch = req.headers.get("next-router-prefetch") === "1" || req.headers.get("purpose") === "prefetch";
        if (method === "GET" && !prefetch && d.ok) fp.recordPageView({ staffId, email, path, area, headers: req.headers });
      } else if (write) {
        fp.recordApiWrite({ staffId, email, path, method, area, headers: req.headers, allowed: d.ok });
      } else if (d.ok && isExportPath(path) && !path.startsWith("/api/admin/team/")) {
        fp.recordExport({ staffId, email, name: typeof token.name === "string" ? token.name : null, path, query: req.nextUrl.search.slice(1), area, headers: req.headers, isOwner: !!token.isOwner });
      }
    })
    .catch(() => {});

  if (d.ok) return null;
  if (kind === "api") {
    return NextResponse.json({ error: `You do not have access to this. It needs: ${needLabel(d.key)}. Ask the owner for access.`, need: d.key }, { status: 403 });
  }
  const url = new URL("/admin_pro/no-access", req.url);
  url.searchParams.set("need", d.key);
  url.searchParams.set("from", path);
  return NextResponse.rewrite(url, { status: 403 });
}
