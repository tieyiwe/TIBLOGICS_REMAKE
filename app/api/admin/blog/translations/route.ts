import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/require-admin";
import { articleTranslationStatus, translateArticlesSoon } from "@/lib/i18n/sources/blog";

// Admin: how many articles are stored in French and Swahili, and a button to
// translate every article that is missing or out of date (runs in the
// background; poll GET for progress).
export async function GET() {
  const unauth = await requireAdmin();
  if (unauth) return unauth;
  return NextResponse.json(await articleTranslationStatus());
}

export async function POST() {
  const unauth = await requireAdmin();
  if (unauth) return unauth;
  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: "ANTHROPIC_API_KEY is not set" }, { status: 503 });
  void translateArticlesSoon(400);
  return NextResponse.json({ started: true, ...(await articleTranslationStatus()) });
}
