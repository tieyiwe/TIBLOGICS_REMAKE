import { NextResponse } from "next/server";
import { CUSTOM_COVERS } from "@/lib/og/covers";

// Custom article covers drawn in code (lib/og/covers). Unknown names: 404.
export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  if (!Object.hasOwn(CUSTOM_COVERS, name)) return new NextResponse("Not found", { status: 404 });
  return CUSTOM_COVERS[name]();
}
