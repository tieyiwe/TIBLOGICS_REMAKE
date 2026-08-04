import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { requireAdmin } from "@/lib/require-admin";

const MAX_BYTES = 8 * 1024 * 1024; // 8MB
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]);

// Lets the admin (or the News Agent flow, via the admin UI) upload an actual
// image file as a post's cover/preview image, instead of only being able to
// paste an external URL.
export async function POST(req: NextRequest) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Image upload storage isn't configured. Attach a Blob store to this project in the Vercel dashboard (sets BLOB_READ_WRITE_TOKEN automatically)." },
      { status: 501 }
    );
  }

  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: "Unsupported file type. Use JPEG, PNG, WebP, GIF, or AVIF." }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "File too large — max 8MB." }, { status: 400 });
    }

    const ext = file.type.split("/")[1];
    const safeName = `blog-covers/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const blob = await put(safeName, file, {
      access: "public",
      contentType: file.type,
    });

    return NextResponse.json({ url: blob.url }, { status: 201 });
  } catch (err) {
    console.error("Blog image upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
