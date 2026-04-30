import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Owner-only endpoint — clears all transactional/test data before going live
// Keeps: AdminSettings, Projects, ProjectTasks, BlogPosts, Collaborators, BlockedDates
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isOwner) {
    return NextResponse.json({ error: "Unauthorized — owner only" }, { status: 403 });
  }

  const { confirm } = await req.json();
  if (confirm !== "CLEAR_DEV_DATA") {
    return NextResponse.json({ error: "Missing confirmation string" }, { status: 400 });
  }

  const results: Record<string, number> = {};

  // Clear in dependency-safe order
  const tables = [
    { name: "agentMessages",           fn: () => prisma.agentMessage.deleteMany() },
    { name: "agentRuns",               fn: () => prisma.agentRun.deleteMany() },
    { name: "agentLeads",              fn: () => prisma.agentLead.deleteMany() },
    { name: "appointments",            fn: () => prisma.appointment.deleteMany() },
    { name: "prospects",               fn: () => prisma.prospect.deleteMany() },
    { name: "scannerLeads",            fn: () => prisma.scannerLead.deleteMany() },
    { name: "toolUsage",               fn: () => prisma.toolUsage.deleteMany() },
    { name: "pageViews",               fn: () => prisma.pageView.deleteMany() },
    { name: "activeSessions",          fn: () => prisma.activeSession.deleteMany() },
    { name: "serviceRequests",         fn: () => prisma.serviceRequest.deleteMany() },
    { name: "newsletterSubscribers",   fn: () => prisma.newsletterSubscriber.deleteMany() },
    { name: "collaboratorActivityLogs",fn: () => prisma.collaboratorActivityLog.deleteMany() },
    { name: "blogRefreshLogs",         fn: () => prisma.blogRefreshLog.deleteMany() },
    { name: "commandCenterSyncs",      fn: () => prisma.commandCenterSync.deleteMany() },
    { name: "waitlistEntries",         fn: () => prisma.waitlistEntry.deleteMany() },
    { name: "partnershipApplications", fn: () => prisma.partnershipApplication.deleteMany() },
    // Remove AI-generated stub posts but keep curated ones
    { name: "aiGeneratedBlogPosts",    fn: () => prisma.blogPost.deleteMany({ where: { aiGenerated: true } }) },
  ] as const;

  for (const table of tables) {
    try {
      const result = await table.fn();
      results[table.name] = result.count;
    } catch {
      results[table.name] = -1; // table may not exist yet
    }
  }

  const totalCleared = Object.values(results).filter((v) => v > 0).reduce((a, b) => a + b, 0);

  return NextResponse.json({
    success: true,
    message: `Cleared ${totalCleared} records. Ready for production.`,
    breakdown: results,
  });
}
