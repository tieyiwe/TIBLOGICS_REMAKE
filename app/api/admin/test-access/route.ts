import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { isValidEmail } from "@/lib/require-admin";
import { COMP_STATUS, ownerSession } from "@/lib/admin/test-access";
import { ensureToolkitTables } from "@/lib/toolkit/db";
import { ensureMonitorTables } from "@/lib/monitor/db";
import { validateSites } from "@/lib/monitor/sites";
import { hashMonitorToken, monitorLink, monitorToken, newTokenSalt } from "@/lib/monitor/token";
import { runMonitor } from "@/lib/monitor/run";
import { ensureBlueprintTables } from "@/lib/blueprint/db";
import { IntakeSchema } from "@/lib/blueprint/intake";
import { blueprintLink, blueprintToken, hashToken, newCreditCode, newSalt } from "@/lib/blueprint/token";
import { generateBlueprint } from "@/lib/blueprint/generate";

// Complimentary access to the paid tools, for the owner to test with. Nothing
// here touches Stripe: comped rows carry no Stripe ids, so no webhook can
// change them and they never count as revenue.

type Body = Record<string, unknown> & { tool?: unknown; action?: unknown };

export async function POST(req: NextRequest) {
  if (!(await ownerSession())) return NextResponse.json({ error: "Only the owner or an admin can do this." }, { status: 403 });
  const body = (await req.json().catch(() => ({}))) as Body;

  if (body.tool === "toolkit") return toolkit(body);
  if (body.tool === "monitor") return monitor(body);
  if (body.tool === "blueprint") return blueprint(body);
  return NextResponse.json({ error: "Unknown tool" }, { status: 400 });
}

async function toolkit(body: Body) {
  await ensureToolkitTables();
  if (!isValidEmail(body.email)) return NextResponse.json({ error: "Enter a valid email" }, { status: 400 });
  const email = body.email.trim().toLowerCase();
  const student = await prisma.student.findFirst({ where: { email: { equals: email, mode: "insensitive" } }, select: { id: true } });
  if (!student) {
    return NextResponse.json(
      { error: "No TIBLOGICS account uses that email. Create one at /learn/signup first, then grant access." },
      { status: 404 },
    );
  }
  const existing = await prisma.toolkitSubscription.findUnique({ where: { studentId: student.id } });

  if (body.action === "revoke") {
    if (existing?.status !== COMP_STATUS) return NextResponse.json({ error: "That account has no free access to revoke." }, { status: 409 });
    await prisma.toolkitSubscription.update({ where: { studentId: student.id }, data: { status: "canceled" } });
    return NextResponse.json({ ok: true });
  }

  const plan = body.plan === "guard" ? "guard" : "toolkit";
  if (existing?.stripeSubscriptionId && ["active", "trialing", "past_due"].includes(existing.status)) {
    return NextResponse.json({ error: "That account already has a paid subscription." }, { status: 409 });
  }
  await prisma.toolkitSubscription.upsert({
    where: { studentId: student.id },
    create: { studentId: student.id, plan, status: COMP_STATUS },
    update: { plan, status: COMP_STATUS, stripeSubscriptionId: null, cancelAtPeriodEnd: false, currentPeriodEnd: null },
  });
  return NextResponse.json({ ok: true });
}

async function monitor(body: Body) {
  await ensureMonitorTables();
  if (body.action === "revoke") {
    const id = typeof body.id === "string" ? body.id : "";
    const done = await prisma.monitorSubscription.updateMany({
      where: { id, stripeSubscriptionId: null, status: "active" },
      data: { status: "canceled" },
    });
    return done.count ? NextResponse.json({ ok: true }) : NextResponse.json({ error: "Not a free monitor" }, { status: 404 });
  }

  if (!isValidEmail(body.email)) return NextResponse.json({ error: "Enter a valid email" }, { status: 400 });
  const sites = await validateSites(body.siteUrl, body.competitors);
  if (!sites.ok) return NextResponse.json({ error: sites.error }, { status: 400 });

  const tokenSalt = newTokenSalt();
  const row = await prisma.monitorSubscription.create({
    data: {
      email: body.email.trim().toLowerCase(),
      name: "Admin test",
      siteUrl: sites.siteUrl,
      competitors: sites.competitors,
      status: "active",
      nextRunAt: new Date(),
      tokenSalt,
      tokenHash: hashMonitorToken(newTokenSalt()),
    },
  });
  const updated = await prisma.monitorSubscription.update({
    where: { id: row.id },
    data: { tokenHash: hashMonitorToken(monitorToken(row.id, tokenSalt)) },
  });
  runMonitor(row.id).catch((err) => console.error("[test-access] first scan", row.id, err instanceof Error ? err.message : err));
  return NextResponse.json({ ok: true, link: await monitorLink(updated) });
}

async function blueprint(body: Body) {
  await ensureBlueprintTables();
  const parsed = IntakeSchema.safeParse(body.intake ?? {});
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return NextResponse.json({ error: issue?.message ?? "Please check the form", path: issue?.path }, { status: 400 });
  }
  const intake = parsed.data;

  let bp;
  for (let attempt = 0; attempt < 3 && !bp; attempt++) {
    const salt = newSalt();
    try {
      bp = await prisma.blueprint.create({
        data: {
          email: intake.email, name: intake.name, company: intake.company,
          status: "paid", paidAt: new Date(), amountPaid: 0,
          intake: JSON.parse(JSON.stringify(intake)),
          creditCode: newCreditCode(), tokenSalt: salt, tokenHash: hashToken(newSalt()),
        },
      });
      bp = await prisma.blueprint.update({ where: { id: bp.id }, data: { tokenHash: hashToken(blueprintToken(bp.id, salt)) } });
    } catch (err) {
      if (!(err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002")) throw err;
    }
  }
  if (!bp) return NextResponse.json({ error: "Could not create it. Please try again." }, { status: 500 });

  const id = bp.id;
  generateBlueprint(id).catch((err) => console.error("[test-access] blueprint", id, err));
  return NextResponse.json({ ok: true, link: await blueprintLink(bp) });
}
