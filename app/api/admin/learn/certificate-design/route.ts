import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/require-admin";
import { makeReference } from "@/lib/learn/cert/ref";
import { verifyUrlFor } from "@/lib/learn/cert/data";
import { certificatePng } from "@/lib/learn/cert/render";

// Staff: a sample certificate for a track (name "Jane Doe", a sample
// reference), to check the design and wording. ?trackId=&distinction=1&lang=fr
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const denied = await requirePermission("events");
  if (denied) return denied;
  const q = req.nextUrl.searchParams;
  const track = await prisma.learnTrack.findUnique({
    where: { id: q.get("trackId") ?? "" },
    select: { slug: true, certificateName: true, title: true, tagline: true, level: true, levelEnd: true, accentColor: true, estimatedHours: true },
  });
  if (!track) return NextResponse.json({ error: "Track not found" }, { status: 404 });
  const lang = ["en", "fr", "sw"].includes(q.get("lang") ?? "") ? (q.get("lang") as string) : "en";
  const reference = makeReference(track.slug);
  const png = await certificatePng({
    name: (q.get("name") ?? "").trim().slice(0, 70) || "Jane Amani Doe",
    certificateName: track.certificateName || track.title,
    tagline: track.tagline,
    level: track.level,
    levelEnd: track.levelEnd,
    accentColor: track.accentColor,
    hours: track.estimatedHours,
    distinction: q.get("distinction") === "1",
    issuedAt: new Date(),
    reference,
    verifyUrl: verifyUrlFor(reference),
    locale: lang,
    sample: true,
  });
  return new Response(new Uint8Array(png), { headers: { "content-type": "image/png", "cache-control": "private, max-age=300" } });
}
