import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { ZodError } from "zod";
import prisma from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { audit } from "@/lib/admin/audit";
import { AcceptBody, findInvite } from "@/lib/admin/team/service";
import { forgetStaffState } from "@/lib/admin/team/state";

export const dynamic = "force-dynamic";

// Accepting a staff invitation (or a password-reset link from Team & Roles):
// the emailed single-use token (stored hashed), a name and a password. Public
// by design; rate limited per address. The token is cleared on use.
function ipOf(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? req.headers.get("x-real-ip") ?? "unknown";
}

/** GET ?token=: who the invitation is for (name, email), to prefill the form. */
export async function GET(req: NextRequest) {
  if (!(await checkRateLimit(`collab-accept-peek:${ipOf(req)}`, 30, 900_000))) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }
  const token = req.nextUrl.searchParams.get("token") ?? "";
  const c = await findInvite(token).catch(() => null);
  if (!c || (c.inviteExpires && c.inviteExpires < new Date())) {
    return NextResponse.json({ error: "This link is invalid or has expired. Ask for a new one." }, { status: 404 });
  }
  return NextResponse.json({ name: c.name, email: c.email, reset: !!c.passwordHash });
}

export async function POST(req: NextRequest) {
  if (!(await checkRateLimit(`collab-accept:${ipOf(req)}`, 5, 900_000))) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }
  let body;
  try {
    body = AcceptBody.parse(await req.json().catch(() => ({})));
  } catch (err) {
    const msg = err instanceof ZodError ? err.issues[0]?.message : null;
    return NextResponse.json({ error: msg ?? "Invalid request" }, { status: 400 });
  }
  const collab = await findInvite(body.token);
  if (!collab) return NextResponse.json({ error: "This link is invalid or was already used." }, { status: 400 });
  if (collab.inviteExpires && collab.inviteExpires < new Date()) {
    return NextResponse.json({ error: "This link has expired. Ask for a new one." }, { status: 400 });
  }
  const reset = !!collab.passwordHash;
  if (!reset && !collab.active) return NextResponse.json({ error: "This invitation was withdrawn." }, { status: 400 });

  const passwordHash = await bcrypt.hash(body.password, 12);
  // Single use: the token is cleared in the same update, and only if it is
  // still the one we looked up (two tabs cannot both use it).
  const done = await prisma.collaborator.updateMany({
    where: { id: collab.id, inviteToken: collab.inviteToken },
    data: {
      passwordHash,
      inviteToken: null,
      inviteExpires: null,
      ...(body.name && !reset ? { name: body.name } : {}),
      ...(reset ? {} : { active: true }),
    },
  });
  if (!done.count) return NextResponse.json({ error: "This link is invalid or was already used." }, { status: 400 });
  forgetStaffState(collab.id);
  await audit({ email: collab.email, name: body.name ?? collab.name, role: "collaborator" }, reset ? "team.password_set" : "team.invite_accept", {
    type: "collaborator",
    id: collab.id,
    label: collab.email,
  });
  return NextResponse.json({ success: true, email: collab.email, reset });
}
