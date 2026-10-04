import { createHash, randomBytes } from "crypto";
import { createReadStream } from "fs";
import { open, stat } from "fs/promises";
import { Readable } from "stream";
import prisma from "@/lib/prisma";
import { ensureVideoTables } from "./db";

// Where generated lesson videos live, so they survive deploys and restarts
// (the Replit filesystem does not).
//
//   (a) Replit Object Storage (@replit/object-storage), when it answers at
//       runtime: the default bucket of the Repl/deployment. Byte ranges are
//       read straight from the bucket.
//   (b) Otherwise Postgres: the file in 1 MB BYTEA rows (LessonVideoChunk),
//       read back by range.
//
// VIDEO_STORAGE=object|db forces one; unset = object when available, else db.
// Both are served by /api/learn/video/asset/[id] (Range requests, ETag).

export const CHUNK = 1024 * 1024;

export interface AssetRow {
  id: string;
  lessonId: string;
  locale: string;
  contentType: string;
  size: number;
  etag: string;
  storage: string;
  objectKey: string | null;
  chunkSize: number;
  durationSec: number;
  createdAt: Date;
}

// ── Replit Object Storage ───────────────────────────────────────────────────

type ObjClient = {
  uploadFromFilename(name: string, src: string): Promise<{ ok: boolean; error?: unknown }>;
  downloadAsStream(name: string, opts?: Record<string, unknown>): Readable;
  delete(name: string, opts?: { ignoreNotFound?: boolean }): Promise<{ ok: boolean; error?: unknown }>;
  list(opts?: Record<string, unknown>): Promise<{ ok: boolean; error?: unknown }>;
};

let client: { at: number; c: ObjClient | null } | null = null;

async function objectClient(): Promise<ObjClient | null> {
  const mode = process.env.VIDEO_STORAGE?.toLowerCase();
  if (mode === "db") return null;
  if (client && Date.now() - client.at < 10 * 60_000) return client.c;
  let c: ObjClient | null = null;
  // Only on Replit (the storage sidecar), unless forced.
  if (mode === "object" || process.env.REPL_ID || process.env.REPLIT_DEPLOYMENT) {
    try {
      const mod = (await import("@replit/object-storage")) as unknown as { Client: new (o?: { bucketId?: string }) => ObjClient };
      const cand = new mod.Client(process.env.VIDEO_BUCKET_ID ? { bucketId: process.env.VIDEO_BUCKET_ID } : undefined);
      const r = await Promise.race([cand.list({ maxResults: 1, prefix: "lesson-videos/" }), new Promise<{ ok: false }>((res) => setTimeout(() => res({ ok: false }), 8000))]);
      if (r.ok) c = cand;
      else console.warn("[video/storage] Object Storage unavailable, using the database", (r as { error?: unknown }).error ?? "timeout");
    } catch (err) {
      console.warn("[video/storage] Object Storage unavailable, using the database", err instanceof Error ? err.message : err);
    }
  }
  client = { at: Date.now(), c };
  return c;
}

export async function storageMode(): Promise<"object" | "db"> {
  return (await objectClient()) ? "object" : "db";
}

// ── Write ───────────────────────────────────────────────────────────────────

async function fileEtag(file: string): Promise<string> {
  const h = createHash("sha256");
  await new Promise<void>((resolve, reject) => {
    createReadStream(file).on("data", (d) => h.update(d)).on("end", () => resolve()).on("error", reject);
  });
  return `"${h.digest("hex").slice(0, 32)}"`;
}

/** Stores a finished video file and returns its asset row. */
export async function storeVideoFile(
  file: string,
  meta: { lessonId: string; locale: string; contentType: string; durationSec: number },
): Promise<AssetRow> {
  await ensureVideoTables();
  const id = randomBytes(12).toString("hex");
  const { size } = await stat(file);
  const etag = await fileEtag(file);
  const ext = meta.contentType.includes("webm") ? "webm" : "mp4";
  // VIDEO_STORAGE=object: the bucket or nothing. A video never goes to the
  // database instead; the job fails with the reason and is tried again later.
  const strict = process.env.VIDEO_STORAGE?.toLowerCase() === "object";
  let obj = await objectClient();
  if (!obj && strict) {
    client = null; // ask the bucket again, it may have been slow to answer
    obj = await objectClient();
  }
  if (obj) {
    const objectKey = `lesson-videos/${meta.lessonId}/${id}.${ext}`;
    const r = await obj.uploadFromFilename(objectKey, file);
    if (r.ok) {
      return prisma.lessonVideoAsset.create({
        data: { id, lessonId: meta.lessonId, locale: meta.locale, contentType: meta.contentType, size, etag, storage: "object", objectKey, chunkSize: 0, durationSec: meta.durationSec },
      });
    }
    const why = r.error instanceof Error ? r.error.message : JSON.stringify(r.error ?? "").slice(0, 200);
    if (strict) throw new Error(`Upload to Object Storage failed: ${why}`);
    console.warn("[video/storage] upload failed, storing in the database", why);
  } else if (strict) {
    throw new Error("Object Storage did not answer (VIDEO_STORAGE=object). Check the bucket (VIDEO_BUCKET_ID) in Tools > Object Storage.");
  }
  // Database: the row first (chunks reference it), then 1 MB chunks.
  const row = await prisma.lessonVideoAsset.create({
    data: { id, lessonId: meta.lessonId, locale: meta.locale, contentType: meta.contentType, size, etag, storage: "db", objectKey: null, chunkSize: CHUNK, durationSec: meta.durationSec },
  });
  const fh = await open(file, "r");
  try {
    for (let idx = 0, pos = 0; pos < size; idx++, pos += CHUNK) {
      const buf = Buffer.alloc(Math.min(CHUNK, size - pos));
      await fh.read(buf, 0, buf.length, pos);
      await prisma.lessonVideoChunk.create({ data: { assetId: id, idx, data: buf } });
    }
  } catch (err) {
    await prisma.lessonVideoAsset.delete({ where: { id } }).catch(() => {});
    throw err;
  } finally {
    await fh.close();
  }
  return row;
}

export async function deleteAsset(id: string): Promise<void> {
  const row = await prisma.lessonVideoAsset.findUnique({ where: { id } }).catch(() => null);
  if (!row) return;
  if (row.storage === "object" && row.objectKey) {
    const obj = await objectClient();
    if (obj) await obj.delete(row.objectKey, { ignoreNotFound: true }).catch(() => {});
  }
  // Chunks go with the row (ON DELETE CASCADE).
  await prisma.lessonVideoAsset.delete({ where: { id } }).catch(() => {});
}

// ── Read ────────────────────────────────────────────────────────────────────

export async function getAsset(id: string): Promise<AssetRow | null> {
  await ensureVideoTables();
  return prisma.lessonVideoAsset.findUnique({ where: { id } });
}

/** Bytes start..end (inclusive) of an asset, as a web stream. */
export async function readRange(asset: AssetRow, start: number, end: number): Promise<ReadableStream<Uint8Array>> {
  if (asset.storage === "object" && asset.objectKey) {
    const obj = await objectClient();
    if (!obj) throw new Error("Object Storage is not available");
    // The options go to the bucket's createReadStream: start/end inclusive.
    const node = obj.downloadAsStream(asset.objectKey, { start, end, decompress: false });
    return Readable.toWeb(node) as unknown as ReadableStream<Uint8Array>;
  }
  const size = asset.chunkSize || CHUNK;
  const first = Math.floor(start / size);
  const last = Math.floor(end / size);
  let idx = first;
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      if (idx > last) {
        controller.close();
        return;
      }
      // A few chunks per query keeps memory flat and round trips few.
      const upto = Math.min(last, idx + 3);
      const rows = await prisma.lessonVideoChunk.findMany({
        where: { assetId: asset.id, idx: { gte: idx, lte: upto } },
        orderBy: { idx: "asc" },
      });
      if (rows.length !== upto - idx + 1) {
        controller.error(new Error("Video data is incomplete"));
        return;
      }
      for (const r of rows) {
        const base = r.idx * size;
        const from = Math.max(0, start - base);
        const to = Math.min(r.data.length, end - base + 1);
        controller.enqueue(new Uint8Array(r.data.subarray(from, to)));
      }
      idx = upto + 1;
    },
  });
}
