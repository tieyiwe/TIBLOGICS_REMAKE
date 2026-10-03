import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { canAccessTrack, getAccess, getStudent } from "@/lib/learn/session";
import { getAsset, readRange, type AssetRow } from "@/lib/learn/video/storage";

// A generated lesson video file (lib/learn/video/storage.ts), streamed with
// HTTP Range support so the player can seek. Same access as the lesson page:
// a learner who can open the lesson's track (or any member for a free-preview
// lesson); staff always. Asset ids change with every regeneration, so the
// file is cacheable for a long time (privately: it is members-only).
//
//   GET/HEAD /api/learn/video/asset/<id>.mp4   (or .webm)

export const dynamic = "force-dynamic";

/** Open-ended ranges ("bytes=N-") are answered with at most this much. */
const MAX_OPEN_RANGE = 4 * 1024 * 1024;

async function allowed(asset: AssetRow): Promise<{ ok: true } | { ok: false; status: number }> {
  const student = await getStudent();
  if (student) {
    const lesson = await prisma.lesson.findUnique({ where: { id: asset.lessonId }, select: { isPreview: true, module: { select: { trackId: true } } } });
    if (!lesson) return { ok: false, status: 404 };
    if (lesson.isPreview || canAccessTrack(await getAccess(student.id), lesson.module.trackId)) return { ok: true };
    return { ok: false, status: 403 };
  }
  const denied = await requireAdmin();
  if (!denied) return { ok: true };
  return { ok: false, status: denied.status === 403 ? 403 : 401 };
}

function parseRange(header: string | null, size: number): { start: number; end: number } | "invalid" | null {
  if (!header) return null;
  const m = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!m || (!m[1] && !m[2])) return "invalid";
  let start: number, end: number;
  if (!m[1]) {
    // Suffix: the last N bytes.
    const n = Number(m[2]);
    if (n <= 0) return "invalid";
    start = Math.max(0, size - n);
    end = size - 1;
  } else {
    start = Number(m[1]);
    end = m[2] ? Math.min(Number(m[2]), size - 1) : Math.min(size - 1, start + MAX_OPEN_RANGE - 1);
  }
  if (start >= size || end < start) return "invalid";
  return { start, end };
}

async function serve(req: NextRequest, params: Promise<{ id: string }>, head: boolean) {
  const { id: raw } = await params;
  const id = raw.replace(/\.(mp4|webm)$/i, "");
  if (!/^[a-f0-9]{16,40}$/.test(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const asset = await getAsset(id).catch(() => null);
  if (!asset) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const access = await allowed(asset);
  if (!access.ok) return NextResponse.json({ error: access.status === 401 ? "Sign in to watch this video." : "Not available" }, { status: access.status });

  const headers = new Headers({
    "Content-Type": asset.contentType,
    "Accept-Ranges": "bytes",
    ETag: asset.etag,
    "Last-Modified": asset.createdAt.toUTCString(),
    "Cache-Control": "private, max-age=31536000, immutable",
    "X-Content-Type-Options": "nosniff",
    Vary: "Cookie",
  });

  const inm = req.headers.get("if-none-match");
  if (inm && inm.split(",").map((s) => s.trim()).includes(asset.etag)) return new NextResponse(null, { status: 304, headers });

  // If-Range: a range only applies while the file is the one the client has.
  const ifRange = req.headers.get("if-range");
  const range = ifRange && ifRange !== asset.etag ? null : parseRange(req.headers.get("range"), asset.size);
  if (range === "invalid") {
    headers.set("Content-Range", `bytes */${asset.size}`);
    return new NextResponse(null, { status: 416, headers });
  }
  const { start, end } = range ?? { start: 0, end: asset.size - 1 };
  headers.set("Content-Length", String(end - start + 1));
  if (range) headers.set("Content-Range", `bytes ${start}-${end}/${asset.size}`);
  const status = range ? 206 : 200;
  if (head) return new NextResponse(null, { status, headers });
  try {
    const body = await readRange(asset, start, end);
    return new NextResponse(body, { status, headers });
  } catch (err) {
    console.error("[learn/video/asset]", id, err);
    return NextResponse.json({ error: "Could not read the video." }, { status: 500 });
  }
}

export function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return serve(req, ctx.params, false);
}

export function HEAD(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return serve(req, ctx.params, true);
}
