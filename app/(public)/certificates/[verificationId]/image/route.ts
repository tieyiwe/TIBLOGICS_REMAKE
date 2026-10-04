import { NextRequest } from "next/server";
import { findCertificate } from "@/lib/learn/cert/ref";
import { certData, certFileName } from "@/lib/learn/cert/data";
import { certificatePng } from "@/lib/learn/cert/render";
import { getLocale } from "@/lib/i18n/server";

// GET /certificates/<reference>/image[?download=1&lang=fr] : the certificate as a PNG.
// Public like the verification page, once the learner has confirmed the
// name (never before) and while it is not revoked.
export const runtime = "nodejs";

export async function GET(req: NextRequest, ctx: { params: Promise<{ verificationId: string }> }) {
  const { verificationId } = await ctx.params;
  const c = await findCertificate(verificationId).catch(() => null);
  if (!c || c.revoked || !c.nameConfirmedAt) return new Response("Not found", { status: 404 });
  const lang = req.nextUrl.searchParams.get("lang");
  const png = await certificatePng(certData(c, lang && ["en", "fr", "sw"].includes(lang) ? lang : await getLocale()));
  const download = req.nextUrl.searchParams.get("download") === "1";
  return new Response(new Uint8Array(png), {
    headers: {
      "content-type": "image/png",
      "cache-control": "public, max-age=3600",
      ...(download ? { "content-disposition": `attachment; filename="${certFileName(c, "png")}"` } : {}),
    },
  });
}
