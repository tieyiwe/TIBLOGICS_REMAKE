import { NextResponse } from "next/server";
import { requireGrowthAdmin } from "@/lib/growth/content-auth";
import { getCatalog, TYPE_LABEL } from "@/lib/growth/catalog";

export async function GET() {
  const denied = await requireGrowthAdmin();
  if (denied) return denied;
  return NextResponse.json({ items: await getCatalog(), types: TYPE_LABEL });
}
