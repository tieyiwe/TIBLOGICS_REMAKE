import { NextRequest, NextResponse } from "next/server";
import { requireToolkit } from "@/lib/toolkit/guard-request";
import { getPrompt } from "@/lib/toolkit/library";

// One prompt's full text, for subscribers whose plan includes the library.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requireToolkit({ generate: true });
  if (gate.error) return gate.error;
  const p = getPrompt((await params).id);
  if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ prompt: p });
}
