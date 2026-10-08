import prisma from "@/lib/prisma";
import { ensureStoreCatalog } from "@/lib/shop/ensure-catalog";
import { cleanCopy, cleanLine } from "@/lib/text/clean-copy";
import { MERCHANT_COUNTRIES } from "@/lib/seo/jsonld";
import { absUrl, SITE_NAME } from "@/lib/seo/site";
import { cardUrl } from "@/lib/seo/og-card";
import { trackPriceCents } from "@/lib/learn/pricing";

// Product feed for Google Merchant Center (Products > Add products > from a
// file > scheduled fetch of https://tiblogics.com/google-merchant.xml).
// Store products and the ARFA AI Academy tracks (one-time lifetime price).
// Digital items declare shipping 0 for each selling country and a digital
// category, so Google does not flag them for missing shipping.

export const dynamic = "force-dynamic";

const DIGITAL_CATEGORY = "Software > Digital Goods & Currency";
const COURSE_CATEGORY = "Software > Computer Software > Educational Software";

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c] as string)
    // Characters XML 1.0 does not allow.
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
const money = (cents: number, currency: string) => `${(cents / 100).toFixed(2)} ${(currency || "USD").toUpperCase()}`;

export async function GET() {
  await ensureStoreCatalog().catch(() => {});
  const products = await prisma.product.findMany({ where: { published: true }, orderBy: { createdAt: "asc" } }).catch(() => []);

  const items = products
    .filter((p) => p.price > 0)
    .map((p) => {
      const link = absUrl(`/store/${p.slug}`);
      const desc = cleanCopy(p.tagline ? `${p.tagline}\n\n${p.description}` : p.description).replace(/\s+/g, " ").slice(0, 4900);
      const onSale = p.compareAtPrice != null && p.compareAtPrice > p.price;
      const inStock = p.stock == null || p.stock > 0;
      const tags = [
        `<g:id>${esc(p.sku || p.slug)}</g:id>`,
        `<title>${esc(cleanLine(p.name).slice(0, 150))}</title>`,
        `<description>${esc(desc || cleanLine(p.name))}</description>`,
        `<link>${esc(link)}</link>`,
        ...(p.images[0] ? [`<g:image_link>${esc(absUrl(p.images[0]))}</g:image_link>`] : []),
        ...p.images.slice(1, 10).map((i) => `<g:additional_image_link>${esc(absUrl(i))}</g:additional_image_link>`),
        `<g:availability>${inStock ? "in_stock" : "out_of_stock"}</g:availability>`,
        `<g:price>${money(onSale ? (p.compareAtPrice as number) : p.price, p.currency)}</g:price>`,
        ...(onSale ? [`<g:sale_price>${money(p.price, p.currency)}</g:sale_price>`] : []),
        `<g:condition>new</g:condition>`,
        `<g:brand>${esc(SITE_NAME)}</g:brand>`,
        // Our own products have no GTIN or MPN.
        `<g:identifier_exists>no</g:identifier_exists>`,
        `<g:product_type>${esc(cleanLine(p.category))}</g:product_type>`,
        ...(p.digital
          ? [
              `<g:google_product_category>${esc(DIGITAL_CATEGORY)}</g:google_product_category>`,
              ...MERCHANT_COUNTRIES.map((c) => `<g:shipping><g:country>${c}</g:country><g:price>0.00 ${(p.currency || "USD").toUpperCase()}</g:price></g:shipping>`),
            ]
          : []),
      ];
      return `<item>\n  ${tags.join("\n  ")}\n</item>`;
    });

  // ARFA tracks: live ones, at the one-time price (lifetime access).
  const tracks = await prisma.learnTrack
    .findMany({ where: { status: "live" }, orderBy: { sortOrder: "asc" }, select: { slug: true, title: true, tagline: true, description: true, level: true, priceCents: true, heroImage: true } })
    .catch(() => []);
  for (const tr of tracks) {
    const price = trackPriceCents(tr.level, tr.priceCents);
    if (price <= 0) continue;
    const title = cleanLine(`${tr.title}: ARFA AI course`).slice(0, 150);
    const desc = cleanCopy([tr.tagline, tr.description, "Online AI course with lessons, videos, hands-on labs, quizzes and a verifiable certificate. One-time payment, lifetime access."].filter(Boolean).join("\n\n"))
      .replace(/\s+/g, " ")
      .slice(0, 4900);
    const image = tr.heroImage ? absUrl(tr.heroImage) : cardUrl({ title: tr.title, description: tr.tagline ?? undefined, kicker: "ARFA AI Academy", brand: "arfa" });
    const tags = [
      `<g:id>arfa-${esc(tr.slug)}</g:id>`,
      `<title>${esc(title)}</title>`,
      `<description>${esc(desc)}</description>`,
      `<link>${esc(absUrl(`/learning-box/${tr.slug}`))}</link>`,
      `<g:image_link>${esc(image)}</g:image_link>`,
      `<g:availability>in_stock</g:availability>`,
      `<g:price>${money(price, "USD")}</g:price>`,
      `<g:condition>new</g:condition>`,
      `<g:brand>ARFA by ${esc(SITE_NAME)}</g:brand>`,
      `<g:identifier_exists>no</g:identifier_exists>`,
      `<g:product_type>ARFA AI Academy &gt; Online courses</g:product_type>`,
      `<g:google_product_category>${esc(COURSE_CATEGORY)}</g:google_product_category>`,
      ...MERCHANT_COUNTRIES.map((c) => `<g:shipping><g:country>${c}</g:country><g:price>0.00 USD</g:price></g:shipping>`),
    ];
    items.push(`<item>\n  ${tags.join("\n  ")}\n</item>`);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
<title>${esc(SITE_NAME)} Store</title>
<link>${esc(absUrl("/store"))}</link>
<description>${esc(SITE_NAME)} digital products and ARFA AI Academy courses</description>
${items.join("\n")}
</channel>
</rss>
`;
  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=900" },
  });
}
