import { getPublishedMagnet } from "@/lib/growth/acquire/store";
import { magnetView } from "@/lib/growth/acquire/public";
import { acquireOgImage } from "@/lib/growth/acquire/og";
import { fmt } from "@/lib/growth/acquire/fmt";
import { OG_SIZE } from "@/lib/og/brand-card";

// Share card for a lead magnet (link previews on WhatsApp, LinkedIn, X...).
export const runtime = "nodejs";
export const size = OG_SIZE;
export const contentType = "image/png";
export const alt = "TIBLOGICS free resource";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const m = await getPublishedMagnet(slug);
  if (!m) return acquireOgImage({ kicker: "Free resource", title: "TIBLOGICS" });
  const v = await magnetView(m);
  return acquireOgImage({
    kicker: `${fmt(v.labels, "acquire.tag")} · ${fmt(v.labels, `acquire.type.${m.type}`)}`,
    title: v.content.headline || m.title,
    subtitle: v.content.subheadline,
    badge: fmt(v.labels, "acquire.tag"),
  });
}
