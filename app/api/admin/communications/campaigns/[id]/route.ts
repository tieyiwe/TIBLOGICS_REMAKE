import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { csrfGuard, learnerStaff } from "@/lib/learn/account-status/admin-auth";
import { cancelCampaign } from "@/lib/learn/inbox/campaigns";

export const dynamic = "force-dynamic";

const Body = z.object({ action: z.literal("cancel") });

// Cancel a scheduled message before it starts.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const csrf = csrfGuard(req);
  if (csrf) return csrf;
  const { session, error } = await learnerStaff("manage", "communications");
  if (error) return error;
  const { id } = await params;
  if (!Body.safeParse(await req.json().catch(() => ({}))).success) return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  const ok = await cancelCampaign(session, id);
  return ok ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Only a scheduled message that has not started can be cancelled." }, { status: 409 });
}
