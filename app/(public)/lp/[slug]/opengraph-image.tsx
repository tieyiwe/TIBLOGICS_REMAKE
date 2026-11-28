import { getPublishedPage } from "@/lib/growth/acquire/store";
import { pageView } from "@/lib/growth/acquire/public";
import { acquireOgImage } from "@/lib/growth/acquire/og";
import { OG_SIZE } from "@/lib/og/brand-card";

// Share card per landing page: its hero headline and description.
export const runtime = "nodejs";
export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "TIBLOGICS";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getPublishedPage(slug);
  if (!p) return acquireOgImage({ kicker: "TIBLOGICS", title: "AI that works for your business" });
  const v = await pageView(p);
  const hero = v.content.sections.find((s) => s.type === "hero" && s.enabled);
  return acquireOgImage({
    kicker: v.product?.typeLabel ?? "TIBLOGICS",
    title: hero?.title || p.title,
    subtitle: v.content.description || hero?.body,
  });
}
