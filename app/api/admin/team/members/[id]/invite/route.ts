import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { teamApi, teamError } from "@/lib/admin/team/guard";
import { resendInvite, revokeInvite } from "@/lib/admin/team/service";

export const dynamic = "force-dynamic";

const Body = z.object({ expiryDays: z.number().int().min(1).max(30).optional().default(7) });

// Resend (new single-use link, new expiry) or withdraw a pending invitation.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await teamApi(req, "manage");
  if (error) return error;
  const { id } = await params;
  try {
    const body = Body.parse(await req.json().catch(() => ({})));
    return NextResponse.json(await resendInvite(session.user, id, body.expiryDays));
  } catch (err) {
    return teamError(err, "invite.resend");
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, error } = await teamApi(req, "manage");
  if (error) return error;
  const { id } = await params;
  try {
    await revokeInvite(session.user, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return teamError(err, "invite.revoke");
  }
}
