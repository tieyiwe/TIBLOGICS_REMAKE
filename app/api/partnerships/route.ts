import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { businessName, contactName, email, phone, website, address, description } = await req.json();

  if (!businessName || !contactName || !email || !phone || !description) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  await prisma.partnershipApplication.create({
    data: { businessName, contactName, email, phone, website: website || null, address: address || null, description },
  });

  return NextResponse.json({ success: true });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const applications = await prisma.partnershipApplication.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(applications);
}
