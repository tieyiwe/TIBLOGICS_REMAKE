import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { csrfGuard, learnerStaff, sameOrigin } from "@/lib/learn/account-status/admin-auth";
import { audit } from "@/lib/admin/audit";
import { deleteCanned, listCanned, saveCanned } from "@/lib/learn/support/tickets";

export const dynamic = "force-dynamic";

// Canned replies (saved snippets) for support answers.
//   GET     list (staff who can read learners)
//   POST    create or update (owner or admin)
//   DELETE  ?id= (owner or admin)
const Body = z.object({
  id: z.string().regex(/^[\w-]{1,64}$/).optional().nullable(),
  title: z.string().trim().min(1, "Give it a title").max(120),
  body: z.string().trim().min(1, "Write the reply").max(5000),
  bodyFr: z.string().trim().max(5000).optional().nullable(),
});

export async function GET() {
  const { error } = await learnerStaff("read");
  if (error) return error;
  return NextResponse.json({ items: await listCanned() });
}

export async function POST(req: NextRequest) {
  const csrf = csrfGuard(req);
  if (csrf) return csrf;
  const { session, error } = await learnerStaff("manage", "communications");
  if (error) return error;
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  const id = await saveCanned({ ...parsed.data, bodyFr: parsed.data.bodyFr || null, by: session.user.email });
  if (!id) return NextResponse.json({ error: "Canned reply not found" }, { status: 404 });
  await audit(session, parsed.data.id ? "support.canned.update" : "support.canned.create", { type: "support_canned", id, label: parsed.data.title }, null);
  return NextResponse.json({ ok: true, id });
}

export async function DELETE(req: NextRequest) {
  if (!sameOrigin(req)) return NextResponse.json({ error: "Cross-site request refused" }, { status: 403 });
  const { session, error } = await learnerStaff("manage", "communications");
  if (error) return error;
  const id = req.nextUrl.searchParams.get("id") ?? "";
  if (!/^[\w-]{1,64}$/.test(id)) return NextResponse.json({ error: "Canned reply not found" }, { status: 404 });
  if (!(await deleteCanned(id))) return NextResponse.json({ error: "Canned reply not found" }, { status: 404 });
  await audit(session, "support.canned.delete", { type: "support_canned", id }, null);
  return NextResponse.json({ ok: true });
}
