import { MetadataRoute } from "next";
import prisma from "@/lib/prisma";

const BASE = "https://tiblogics.com";

const STATIC_ROUTES: MetadataRoute.Sitemap = [
  { url: BASE, lastModified: new Date(), changeFrequency: "weekly", priority: 1.0 },
  { url: `${BASE}/services`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
  { url: `${BASE}/ai-times`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
  { url: `${BASE}/tools`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
  { url: `${BASE}/tools/scanner`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
  { url: `${BASE}/tools/advisor`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
  { url: `${BASE}/tools/calculator`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
  { url: `${BASE}/products`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
  { url: `${BASE}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
  { url: `${BASE}/contact`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
  { url: `${BASE}/book`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
  { url: `${BASE}/services/get-started`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let blogRoutes: MetadataRoute.Sitemap = [];

  try {
    const posts = await prisma.blogPost.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    blogRoutes = posts.map((p: { slug: string; updatedAt: Date }) => ({
      url: `${BASE}/ai-times/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch {
    // DB not available during build
  }

  return [...STATIC_ROUTES, ...blogRoutes];
}
