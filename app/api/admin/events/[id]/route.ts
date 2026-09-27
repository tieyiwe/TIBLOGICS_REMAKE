import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

// Mirrors the create form in POST /api/admin/events. `id`, `slug` and
// `createdAt` are deliberately absent: slug is the key public pages and
// registrations join on, so letting the request name it would silently detach
// an event from its own registrations.
const EDITABLE_FIELDS = [
  "title", "description", "content", "type", "price", "currency", "capacity",
  "spots", "location", "timezone", "timeSlot", "coverImage", "tags", "featured",
  "published", "registrationOpen", "stripePaymentLink", "zoomLink",
] as const;

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Staff only. A bare session check passed here for TIBLOGICS Learn students
  // too, since learners share this NextAuth instance — requireAdmin rejects them.
  const unauth = await requireAdmin();
  if (unauth) return unauth;
  const { id } = await params;
  const body = await req.json();

  // Spreading the body let any Event column be written, including the primary
  // key and slug. Copy only the fields the editor is allowed to change.
  const data: Record<string, unknown> = { updatedAt: new Date() };
  for (const field of EDITABLE_FIELDS) {
    if (field in body) data[field] = body[field];
  }
  if (body.date !== undefined) data.date = body.date ? new Date(body.date) : null;
  if (body.endDate !== undefined) data.endDate = body.endDate ? new Date(body.endDate) : null;

  const event = await prisma.event.update({ where: { id }, data });
  return NextResponse.json({ event });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const unauth = await requireAdmin();
  if (unauth) return unauth;
  const { id } = await params;
  await prisma.event.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
