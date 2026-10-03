import { NextRequest, NextResponse } from "next/server";
import { createReadStream, statSync } from "fs";
import { Readable } from "stream";
import prisma from "@/lib/prisma";
import { checkGrant, recordDownload, resolveDownloadPath } from "@/lib/shop/delivery";

// Serves a purchased file. The token in the URL is the only credential — it
// is created after payment and is unguessable — so every failure mode is
// handled explicitly rather than falling through to a file read.
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;

  const result = await checkGrant(token);
  if (!result.ok) {
    const messages = {
      not_found: "This download link isn't valid. Check the link in your receipt email.",
      expired: "This download link has expired. Reply to your receipt email and we'll reissue it.",
      limit_reached: "This link has reached its download limit. Reply to your receipt email and we'll reissue it.",
    } as const;
    // 404 for an unknown token so a scanner cannot tell valid tokens from
    // invalid ones; 410 for links that genuinely existed and lapsed.
    const status = result.reason === "not_found" ? 404 : 410;
    return NextResponse.json({ error: messages[result.reason] }, { status });
  }

  const { grant } = result;
  const product = grant.product;

  // Hosted resources (Notion, Sheets): the URL is kept out of the product
  // page and only revealed here, after the purchase check.
  if (product.deliveryType === "external") {
    if (!product.externalUrl) {
      return NextResponse.json({ error: "This product has no destination set yet." }, { status: 503 });
    }
    await recordDownload(grant.id);
    return NextResponse.redirect(product.externalUrl, 302);
  }

  if (!product.fileKey) {
    return NextResponse.json({ error: "This product has no file attached yet." }, { status: 503 });
  }

  const filePath = resolveDownloadPath(product.fileKey);
  if (!filePath) {
    console.error("[shop/download] fileKey escapes download root:", product.fileKey);
    return NextResponse.json({ error: "This product is misconfigured." }, { status: 500 });
  }

  let size: number;
  try {
    size = statSync(filePath).size;
  } catch {
    console.error("[shop/download] file missing on disk:", product.fileKey);
    return NextResponse.json(
      { error: "The file is temporarily unavailable. Please contact support." },
      { status: 503 },
    );
  }

  // Counted before streaming: a partial download still consumes an attempt,
  // which is the conservative choice for a limited grant.
  await recordDownload(grant.id);

  const downloadName = product.fileName || `${product.slug}.download`;
  const stream = Readable.toWeb(createReadStream(filePath)) as unknown as ReadableStream;

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Length": String(size),
      // Quoted so filenames containing spaces are handled correctly.
      "Content-Disposition": `attachment; filename="${downloadName.replace(/"/g, "")}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

// Lets the success page and receipt show what a link is for, and how much of
// it is left, without spending a download.
export async function HEAD(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const result = await checkGrant(token);
  if (!result.ok) return new NextResponse(null, { status: result.reason === "not_found" ? 404 : 410 });

  const remaining = result.grant.maxDownloads - result.grant.downloadCount;
  return new NextResponse(null, {
    status: 200,
    headers: {
      "X-Downloads-Remaining": String(remaining),
      "X-Expires-At": result.grant.expiresAt.toISOString(),
    },
  });
}
