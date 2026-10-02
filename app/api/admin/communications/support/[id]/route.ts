import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { csrfGuard, hasCapability, learnerStaff } from "@/lib/learn/account-status/admin-auth";
import { audit } from "@/lib/admin/audit";
import { addNote, assignableStaff, setTicketFields, setTicketStatus, staffReply } from "@/lib/learn/support/tickets";
import { SUPPORT_PRIORITIES } from "@/lib/learn/support/shared";

export const dynamic = "force-dynamic";

// Staff actions on one support ticket. Viewing is open to staff who can read
// learners (pages); every action here needs the manage level (owner or
// admin), like the other learner communications. All audited.
const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("reply"), body: z.string().trim().min(1, "Write a reply").max(10_000), email: z.boolean().optional().default(true) }),
  z.object({ action: z.literal("note"), body: z.string().trim().min(1, "Write a note").max(5000) }),
  z.object({ action: z.literal("close") }),
  z.object({ action: z.literal("reopen") }),
  z.object({
    action: z.literal("update"),
    priority: z.enum(SUPPORT_PRIORITIES).optional(),
    assignee: z.string().trim().max(254).nullable().optional(),
  }),
]);

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const csrf = csrfGuard(req);
  if (csrf) return csrf;
  const { session, error } = await learnerStaff("manage", "communications");
  if (error) return error;
  const { id } = await params;
  if (!/^[\w-]{1,64}$/.test(id)) return NextResponse.json({ error: "Request not found" }, { status: 404 });
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  const d = parsed.data;
  const actor = { name: session.user.name ?? null, email: session.user.email };
  const target = { type: "support", id };

  try {
    if (d.action === "reply") {
      if (!hasCapability(session, "comms.send")) return NextResponse.json({ error: "You do not have permission to send messages." }, { status: 403 });
      if (!(await checkRateLimit(`support-reply:${session.user.email}`, 120, 3_600_000))) {
        return NextResponse.json({ error: "Too many replies in an hour." }, { status: 429 });
      }
      const r = await staffReply(id, d.body, actor, d.email);
      if (!r) return NextResponse.json({ error: "Request not found" }, { status: 404 });
      await audit(session, "support.reply", { ...target, label: r.ticket.email }, { emailed: r.emailed, kind: r.ticket.kind });
      return NextResponse.json({ ok: true, emailed: r.emailed });
    }
    if (d.action === "note") {
      if (!(await addNote(id, d.body, actor))) return NextResponse.json({ error: "Request not found" }, { status: 404 });
      await audit(session, "support.note", target, null);
      return NextResponse.json({ ok: true });
    }
    if (d.action === "close" || d.action === "reopen") {
      const tk = await setTicketStatus(id, d.action === "close" ? "closed" : "open");
      if (!tk) return NextResponse.json({ error: "Request not found" }, { status: 404 });
      await audit(session, `support.${d.action}`, { ...target, label: tk.email }, null);
      return NextResponse.json({ ok: true, status: tk.status });
    }
    // update
    let assignee: string | null | undefined = undefined;
    if (d.assignee !== undefined) {
      if (d.assignee === null || d.assignee === "") assignee = null;
      else {
        const staff = await assignableStaff();
        const hit = staff.find((s) => s.email.toLowerCase() === d.assignee!.toLowerCase());
        if (!hit) return NextResponse.json({ error: "Choose the owner or a staff member who can see learners." }, { status: 400 });
        assignee = hit.email;
      }
    }
    if (!(await setTicketFields(id, { priority: d.priority, assignee }))) return NextResponse.json({ error: "Request not found" }, { status: 404 });
    await audit(session, "support.update", target, { priority: d.priority ?? null, assignee: assignee === undefined ? "(unchanged)" : assignee });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/support]", err);
    return NextResponse.json({ error: "The change could not be saved." }, { status: 500 });
  }
}
