import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

function detectDevice(ua: string): string {
  if (/mobile|android|iphone|ipod|blackberry|windows phone/i.test(ua)) return "mobile";
  if (/ipad|tablet|playbook|silk/i.test(ua)) return "tablet";
  return "desktop";
}

function detectBrowser(ua: string): string {
  if (/edg\//i.test(ua)) return "Edge";
  if (/opr\//i.test(ua)) return "Opera";
  if (/chrome\/[\d.]+/i.test(ua) && !/chromium/i.test(ua)) return "Chrome";
  if (/firefox\/[\d.]+/i.test(ua)) return "Firefox";
  if (/safari\/[\d.]+/i.test(ua) && !/chrome/i.test(ua)) return "Safari";
  return "Other";
}

function detectOS(ua: string): string {
  if (/windows nt/i.test(ua)) return "Windows";
  if (/mac os x/i.test(ua)) return "macOS";
  if (/android/i.test(ua)) return "Android";
  if (/iphone|ipad|ipod/i.test(ua)) return "iOS";
  if (/linux/i.test(ua)) return "Linux";
  return "Other";
}

function extractOrigin(referrer: string | null): string {
  if (!referrer) return "direct";
  try {
    const h = new URL(referrer).hostname.replace("www.", "");
    if (h === "tiblogics.com") return "internal";
    if (h.includes("google")) return "google";
    if (h.includes("linkedin")) return "linkedin";
    if (h.includes("twitter") || h.includes("x.com")) return "twitter/X";
    if (h.includes("facebook") || h.includes("instagram")) return "meta";
    if (h.includes("youtube")) return "youtube";
    if (h.includes("bing")) return "bing";
    return h;
  } catch {
    return "direct";
  }
}

export async function POST(req: NextRequest) {
  try {
    const { page, referrer, sessionId } = await req.json();
    if (!page || !sessionId) return NextResponse.json({ ok: true });

    const ua = req.headers.get("user-agent") ?? "";
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
      req.headers.get("x-real-ip") ??
      "unknown";

    const device = detectDevice(ua);
    const browser = detectBrowser(ua);
    const os = detectOS(ua);
    const origin = extractOrigin(referrer ?? null);

    await Promise.all([
      prisma.pageView.create({
        data: { page, referrer: referrer || null, origin, device, browser, os, ip, sessionId },
      }),
      prisma.activeSession.upsert({
        where: { sessionId },
        create: { sessionId, page, device, browser, os, origin, ip, lastSeen: new Date() },
        update: { page, lastSeen: new Date() },
      }),
    ]);

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
