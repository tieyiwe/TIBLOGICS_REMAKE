import { publicCourse } from "@/lib/seo/courses";
import { isPublicSlug, publicJson, publicNotFound, publicOptions } from "@/lib/seo/public-response";

// GET /api/public/courses/<slug>: one ARFA track as JSON (see ../route.ts).
export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!isPublicSlug(slug)) return publicNotFound("json");
  try {
    const course = await publicCourse(slug);
    return course ? publicJson(course) : publicNotFound("json");
  } catch (err) {
    console.error("[GET /api/public/courses/:slug]", err);
    return publicJson({ error: "Catalog unavailable, try again shortly." }, 503);
  }
}

export const OPTIONS = publicOptions;
