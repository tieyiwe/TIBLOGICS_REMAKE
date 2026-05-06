import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { email, product } = await req.json();
  if (!email || !product) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  await prisma.waitlistEntry.upsert({
    where: { email_product: { email, product } },
    update: {},
    create: { email, product },
  });

  return NextResponse.json({ success: true });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const product = searchParams.get("product");
  const entries = await prisma.waitlistEntry.findMany({
    where: product ? { product } : undefined,
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(entries);
}
