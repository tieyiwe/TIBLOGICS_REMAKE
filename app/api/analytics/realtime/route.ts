import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [liveSessions, recentViews, dailyStats] = await Promise.all([
      // Active in last 5 minutes
      prisma.activeSession.findMany({
        where: { lastSeen: { gte: fiveMinutesAgo } },
        orderBy: { lastSeen: "desc" },
        take: 50,
      }),
      // Last 100 page views
      prisma.pageView.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      // Views per hour for last 24h
      prisma.pageView.findMany({
        where: { createdAt: { gte: oneDayAgo } },
        select: { createdAt: true },
      }),
    ]);

    // Aggregate hourly visits
    const hourlyMap: Record<number, number> = {};
    for (let h = 0; h < 24; h++) hourlyMap[h] = 0;
    dailyStats.forEach((v: { createdAt: Date }) => {
      const hour = new Date(v.createdAt).getHours();
      hourlyMap[hour] = (hourlyMap[hour] ?? 0) + 1;
    });
    const hourly = Object.entries(hourlyMap).map(([h, count]) => ({
      hour: parseInt(h),
      count,
    }));

    // Top pages
    const pageMap: Record<string, number> = {};
    recentViews.forEach((v: { page: string; origin: string; device: string }) => { pageMap[v.page] = (pageMap[v.page] ?? 0) + 1; });
    const topPages = Object.entries(pageMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([page, count]) => ({ page, count }));

    // Top origins
    const originMap: Record<string, number> = {};
    recentViews.forEach((v: { page: string; origin: string; device: string }) => { originMap[v.origin] = (originMap[v.origin] ?? 0) + 1; });
    const topOrigins = Object.entries(originMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([origin, count]) => ({ origin, count }));

    // Device breakdown
    const deviceMap: Record<string, number> = {};
    recentViews.forEach((v: { page: string; origin: string; device: string }) => { deviceMap[v.device] = (deviceMap[v.device] ?? 0) + 1; });

    const totalViews = recentViews.length;

    return NextResponse.json({
      liveCount: liveSessions.length,
      liveSessions,
      recentViews: recentViews.slice(0, 40),
      topPages,
      topOrigins,
      deviceBreakdown: {
        desktop: deviceMap["desktop"] ?? 0,
        mobile: deviceMap["mobile"] ?? 0,
        tablet: deviceMap["tablet"] ?? 0,
        total: totalViews,
      },
      hourly,
    });
  } catch {
    return NextResponse.json({
      liveCount: 0,
      liveSessions: [],
      recentViews: [],
      topPages: [],
      topOrigins: [],
      deviceBreakdown: { desktop: 0, mobile: 0, tablet: 0, total: 0 },
      hourly: [],
    });
  }
}
