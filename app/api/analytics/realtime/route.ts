import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export async function GET() {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [liveSessions, recentViews, dailyStats, topEvents] = await Promise.all([
      prisma.activeSession.findMany({
        where: { lastSeen: { gte: fiveMinutesAgo } },
        orderBy: { lastSeen: "desc" },
        take: 50,
      }),
      prisma.pageView.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
        select: { page: true, origin: true, device: true, country: true, browser: true, os: true, createdAt: true },
      }),
      prisma.pageView.findMany({
        where: { createdAt: { gte: oneDayAgo } },
        select: { createdAt: true },
      }),
      prisma.toolUsage.findMany({
        where: { createdAt: { gte: sevenDaysAgo } },
        orderBy: { createdAt: "desc" },
        take: 500,
        select: { tool: true },
      }),
    ]);

    const hourlyMap: Record<number, number> = {};
    for (let h = 0; h < 24; h++) hourlyMap[h] = 0;
    dailyStats.forEach((v) => { const hour = new Date(v.createdAt).getHours(); hourlyMap[hour] = (hourlyMap[hour] ?? 0) + 1; });
    const hourly = Object.entries(hourlyMap).map(([h, count]) => ({ hour: parseInt(h), count }));

    const pageMap: Record<string, number> = {};
    recentViews.forEach((v) => { pageMap[v.page] = (pageMap[v.page] ?? 0) + 1; });
    const topPages = Object.entries(pageMap).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([page, count]) => ({ page, count }));

    const originMap: Record<string, number> = {};
    recentViews.forEach((v) => { originMap[v.origin] = (originMap[v.origin] ?? 0) + 1; });
    const topOrigins = Object.entries(originMap).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([origin, count]) => ({ origin, count }));

    const deviceMap: Record<string, number> = {};
    recentViews.forEach((v) => { deviceMap[v.device] = (deviceMap[v.device] ?? 0) + 1; });

    const countryMap: Record<string, number> = {};
    recentViews.forEach((v) => {
      if (v.country) countryMap[v.country] = (countryMap[v.country] ?? 0) + 1;
    });
    const topCountries = Object.entries(countryMap).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([country, count]) => ({ country, count }));

    const eventMap: Record<string, number> = {};
    topEvents.forEach((e) => { eventMap[e.tool] = (eventMap[e.tool] ?? 0) + 1; });
    const topFeatures = Object.entries(eventMap).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([feature, count]) => ({ feature, count }));

    return NextResponse.json({
      liveCount: liveSessions.length,
      liveSessions,
      recentViews: recentViews.slice(0, 40),
      topPages,
      topOrigins,
      topCountries,
      topFeatures,
      deviceBreakdown: { desktop: deviceMap["desktop"] ?? 0, mobile: deviceMap["mobile"] ?? 0, tablet: deviceMap["tablet"] ?? 0, total: recentViews.length },
      hourly,
    });
  } catch {
    return NextResponse.json({ liveCount: 0, liveSessions: [], recentViews: [], topPages: [], topOrigins: [], topCountries: [], topFeatures: [], deviceBreakdown: { desktop: 0, mobile: 0, tablet: 0, total: 0 }, hourly: [] });
  }
}
