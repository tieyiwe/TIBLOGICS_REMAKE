import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { email, firstName, source } = await req.json();
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    const existing = await prisma.newsletterSubscriber.findUnique({ where: { email } });
    if (existing) {
      if (!existing.active) {
        await prisma.newsletterSubscriber.update({
          where: { email },
          data: { active: true, unsubscribedAt: null, firstName: firstName ?? existing.firstName },
        });
        return NextResponse.json({ message: "Welcome back! You're re-subscribed." });
      }
      return NextResponse.json({ message: "You're already subscribed!" });
    }

    await prisma.newsletterSubscriber.create({
      data: { email, firstName: firstName ?? null, source: source ?? "blog", active: true },
    });

    return NextResponse.json({ message: "Subscribed! Welcome to the TIBLOGICS AI newsletter." });
  } catch (err) {
    console.error("Subscribe error:", err);
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { email } = await req.json();
    await prisma.newsletterSubscriber.update({
      where: { email },
      data: { active: false, unsubscribedAt: new Date() },
    });
    return NextResponse.json({ message: "Unsubscribed successfully." });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
