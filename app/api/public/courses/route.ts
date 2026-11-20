import { publicCatalog } from "@/lib/seo/courses";
import { publicJson, publicOptions } from "@/lib/seo/public-response";

// GET /api/public/courses: the ARFA course catalog as JSON, for AI agents,
// answer engines and anyone who wants to cite accurate facts (titles,
// levels, hours, prices, outlines, how certificates work). Public and
// read-only: no sign-in, no learner data, nothing that is not already on
// the track pages. Listed in /llms.txt.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return publicJson(await publicCatalog());
  } catch (err) {
    console.error("[GET /api/public/courses]", err);
    return publicJson({ error: "Catalog unavailable, try again shortly." }, 503);
  }
}

export const OPTIONS = publicOptions;
