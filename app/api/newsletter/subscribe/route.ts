import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { isValidEmail } from "@/lib/require-admin";

export async function POST(req: NextRequest) {
  try {
    const { email, firstName, source } = await req.json();

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }
    const cleanEmail = email.trim().toLowerCase();
    const cleanFirst = typeof firstName === "string" ? firstName.slice(0, 100).trim() : null;

    const existing = await prisma.newsletterSubscriber.findUnique({ where: { email: cleanEmail } });
    if (existing) {
      if (!existing.active) {
        await prisma.newsletterSubscriber.update({
          where: { email: cleanEmail },
          data: { active: true, unsubscribedAt: null, firstName: cleanFirst ?? existing.firstName },
        });
        return NextResponse.json({ message: "Welcome back! You're re-subscribed." });
      }
      return NextResponse.json({ message: "You're already subscribed!" });
    }

    await prisma.newsletterSubscriber.create({
      data: {
        email: cleanEmail,
        firstName: cleanFirst,
        source: typeof source === "string" ? source.slice(0, 50) : "blog",
        active: true,
      },
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
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }
    await prisma.newsletterSubscriber.update({
      where: { email: email.trim().toLowerCase() },
      data: { active: false, unsubscribedAt: new Date() },
    });
    return NextResponse.json({ message: "Unsubscribed successfully." });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
