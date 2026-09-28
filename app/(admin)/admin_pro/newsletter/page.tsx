import prisma from "@/lib/prisma";
import { requireAdminPage } from "../_lib/admin-page-auth";
import NewsletterClient from "./NewsletterClient";

// Per-request and session-scoped: never cached or prerendered.
export const dynamic = "force-dynamic";

/** Newsletter campaigns, subscribers and the article picker, rendered on the server (was fetched on mount). */
export default async function NewsletterAdminPage() {
  await requireAdminPage();

  const [campaigns, subscriberCount, subscribers, articles] = await Promise.all([
    prisma.newsletterCampaign.findMany({ orderBy: { createdAt: "desc" }, take: 50 }).catch(() => []),
    prisma.newsletterSubscriber.count({ where: { active: true } }).catch(() => 0),
    prisma.newsletterSubscriber
      .findMany({ orderBy: { subscribedAt: "desc" }, take: 100 })
      .catch(() => []),
    prisma.blogPost
      .findMany({
        where: { published: true },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: { id: true, title: true, slug: true, excerpt: true, category: true, createdAt: true },
      })
      .catch(() => []),
  ]);

  return (
    <NewsletterClient
      campaigns={campaigns.map((c) => ({
        id: c.id,
        title: c.title,
        subject: c.subject,
        category: c.category,
        status: c.status,
        sentAt: c.sentAt?.toISOString() ?? null,
        recipientCount: c.recipientCount,
        sentBy: c.sentBy,
        createdAt: c.createdAt.toISOString(),
      }))}
      subscriberCount={subscriberCount}
      subscribers={subscribers.map((s) => ({
        id: s.id,
        email: s.email,
        firstName: s.firstName,
        source: s.source,
        subscribedAt: s.subscribedAt.toISOString(),
        active: s.active,
      }))}
      articles={articles.map((a) => ({ ...a, createdAt: a.createdAt.toISOString() }))}
    />
  );
}
