import { ImageResponse } from "next/og";
import { readFile } from "fs/promises";
import path from "path";
import { ogFonts, OG_SIZE } from "@/lib/og/brand-card";

// A share preview unique to each AI Times article: its own title, category
// and date over its cover photo (or a category colour when it has none).
// Many articles reuse the same stock covers, and covers can be missing, so a
// plain cover-image preview made different articles look identical.

export const runtime = "nodejs";
export const revalidate = 86400;

const CATEGORY: Record<string, { label: string; color: string }> = {
  breaking: { label: "Breaking", color: "#EF4444" },
  "ai-business": { label: "AI for Business", color: "#F47C20" },
  tips: { label: "Tips", color: "#22C55E" },
  tools: { label: "Tools", color: "#60A5FA" },
  "case-studies": { label: "Case Study", color: "#A78BFA" },
  industry: { label: "Industry", color: "#F472B6" },
  "advanced-tech": { label: "Advanced Tech", color: "#22D3EE" },
};

// Cover photos are fetched only from known image hosts or this site's own
// files: never from an arbitrary URL stored on a post.
const ALLOWED_HOSTS = new Set(["images.unsplash.com", "source.unsplash.com", "tiblogics.com", "www.tiblogics.com"]);

async function coverDataUrl(cover: string | null): Promise<string | null> {
  if (!cover) return null;
  try {
    if (cover.startsWith("/") && !cover.startsWith("//")) {
      const file = path.join(process.cwd(), "public", path.normalize(cover).replace(/^(\.\.[/\\])+/, ""));
      if (!file.startsWith(path.join(process.cwd(), "public"))) return null;
      const buf = await readFile(file);
      if (buf.length > 4_000_000) return null;
      const ext = path.extname(file).slice(1).toLowerCase();
      const type = ext === "jpg" ? "jpeg" : ext;
      if (!["png", "jpeg", "webp"].includes(type)) return null;
      return `data:image/${type};base64,${buf.toString("base64")}`;
    }
    const url = new URL(cover);
    if (url.protocol !== "https:" || !ALLOWED_HOSTS.has(url.hostname)) return null;
    if (url.hostname === "images.unsplash.com") {
      url.searchParams.set("auto", "format");
      url.searchParams.set("fm", "jpg");
      url.searchParams.set("fit", "crop");
      url.searchParams.set("w", "1200");
      url.searchParams.set("h", "630");
      url.searchParams.set("q", "70");
    }
    // Redirects are followed by hand, and each hop must stay on an allowed
    // host: a redirect is never a way to reach another server.
    const signal = AbortSignal.timeout(4000);
    let res = await fetch(url, { signal, redirect: "manual" });
    for (let hop = 0; hop < 3 && res.status >= 300 && res.status < 400; hop++) {
      const next = new URL(res.headers.get("location") ?? "", url);
      if (next.protocol !== "https:" || !ALLOWED_HOSTS.has(next.hostname)) return null;
      res = await fetch(next, { signal, redirect: "manual" });
    }
    if (!res.ok) return null;
    const type = res.headers.get("content-type") ?? "";
    if (!/^image\/(png|jpe?g|webp)/.test(type)) return null;
    if (Number(res.headers.get("content-length") ?? 0) > 4_000_000) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > 4_000_000) return null;
    return `data:${type.split(";")[0]};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

async function markDataUrl(): Promise<string | null> {
  try {
    const buf = await readFile(path.join(process.cwd(), "public", "logo-mark.png"));
    return `data:image/png;base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { prisma } = await import("@/lib/prisma");
  const post = /^[\w-]{1,200}$/.test(slug)
    ? await prisma.blogPost
        .findFirst({ where: { slug, published: true }, select: { title: true, category: true, coverImage: true, createdAt: true, readingTime: true } })
        .catch(() => null)
    : null;
  if (!post) return new Response("Not found", { status: 404 });

  const [cover, mark, fonts] = await Promise.all([coverDataUrl(post.coverImage), markDataUrl(), ogFonts()]);
  const cat = CATEGORY[post.category ?? ""] ?? { label: "AI Times", color: "#F47C20" };
  const date = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(post.createdAt);
  const title = post.title.length > 120 ? `${post.title.slice(0, 117).trimEnd()}…` : post.title;
  const titleSize = title.length > 90 ? 50 : title.length > 60 ? 58 : 66;

  return new ImageResponse(
    (
      <div style={{ width: OG_SIZE.width, height: OG_SIZE.height, display: "flex", position: "relative", fontFamily: "Instrument Sans, sans-serif", background: "#0D1B2A" }}>
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} width={1200} height={630} style={{ position: "absolute", inset: 0, width: 1200, height: 630, objectFit: "cover" }} alt="" />
        ) : null}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            background: cover
              ? "linear-gradient(90deg, rgba(13,27,42,0.96) 0%, rgba(13,27,42,0.86) 55%, rgba(13,27,42,0.55) 100%)"
              : `linear-gradient(135deg, #0D1B2A 0%, #132C52 60%, ${cat.color}55 100%)`,
          }}
        />
        <div style={{ position: "relative", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "56px 64px", width: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {mark ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={mark} width={84} height={50} alt="" />
            ) : null}
            <div style={{ display: "flex", fontSize: 30, fontWeight: 700, color: "#FFFFFF" }}>
              AI <span style={{ color: "#F47C20", marginLeft: 8 }}>Times</span>
            </div>
            <div style={{ display: "flex", marginLeft: 12, padding: "6px 16px", borderRadius: 999, background: cat.color, color: "#0D1B2A", fontSize: 22, fontWeight: 700 }}>
              {cat.label}
            </div>
          </div>
          <div style={{ display: "flex", fontSize: titleSize, fontWeight: 700, lineHeight: 1.12, color: "#FFFFFF", maxWidth: 1000 }}>{title}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 24, color: "rgba(255,255,255,0.78)" }}>
            <span>{date}</span>
            {post.readingTime ? <span>· {post.readingTime} min read</span> : null}
            <span style={{ marginLeft: "auto", color: "#FFFFFF", fontWeight: 700 }}>tiblogics.com</span>
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts, headers: { "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800" } },
  );
}
