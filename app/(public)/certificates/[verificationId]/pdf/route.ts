import { NextRequest } from "next/server";
import { findCertificate } from "@/lib/learn/cert/ref";
import { certData, certFileName } from "@/lib/learn/cert/data";
import { certificatePdf } from "@/lib/learn/cert/render";
import { getLocale } from "@/lib/i18n/server";

// GET /certificates/<reference>/pdf[?lang=fr] : the certificate as an A4 PDF download.
// Same rules as the image: confirmed name, not revoked.
export const runtime = "nodejs";

export async function GET(req: NextRequest, ctx: { params: Promise<{ verificationId: string }> }) {
  const { verificationId } = await ctx.params;
  const c = await findCertificate(verificationId).catch(() => null);
  if (!c || c.revoked || !c.nameConfirmedAt) return new Response("Not found", { status: 404 });
  const lang = req.nextUrl.searchParams.get("lang");
  const pdf = await certificatePdf(certData(c, lang && ["en", "fr", "sw"].includes(lang) ? lang : await getLocale()));
  return new Response(new Uint8Array(pdf), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="${certFileName(c, "pdf")}"`,
      "cache-control": "private, max-age=600",
    },
  });
}
