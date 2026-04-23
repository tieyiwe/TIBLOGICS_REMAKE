import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const { leadIds } = await req.json();
  if (!Array.isArray(leadIds) || leadIds.length === 0) {
    return NextResponse.json({ error: "No leads provided" }, { status: 400 });
  }

  const now = new Date();

  await prisma.agentLead.updateMany({
    where: { id: { in: leadIds } },
    data: { assignedTo: "rex", status: "TRANSFERRED", transferredAt: now },
  });

  const leads = await prisma.agentLead.findMany({
    where: { id: { in: leadIds } },
    select: { id: true, companyName: true, location: true },
  });

  await prisma.agentMessage.create({
    data: {
      fromAgent: "aria",
      toAgent: "rex",
      type: "lead_transfer",
      subject: `${leads.length} new lead${leads.length !== 1 ? "s" : ""} transferred from Aria`,
      payload: {
        leadIds,
        leads: leads.map((l) => ({ id: l.id, companyName: l.companyName, location: l.location })),
        transferredAt: now,
      },
    },
  });

  return NextResponse.json({ success: true, count: leads.length });
}
