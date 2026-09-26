import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { isValidEmail, rateLimit } from "@/lib/require-admin";

// Saves / updates a shopper's cart keyed by email so we can send an
// abandonment reminder later. Called when a shopper opts in from the drawer.
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (!rateLimit(`shop-cart:${ip}`, 20, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const { email, items, subtotal, currency } = await req.json();
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanItems = items.slice(0, 50).map((it: Record<string, unknown>) => ({
      id: String(it.id ?? ""),
      slug: String(it.slug ?? ""),
      name: String(it.name ?? "").slice(0, 200),
      price: Math.max(0, Math.round(Number(it.price) || 0)),
      image: it.image ? String(it.image).slice(0, 500) : null,
      quantity: Math.max(1, Math.min(99, Math.floor(Number(it.quantity) || 1))),
    }));

    await prisma.abandonedCart.upsert({
      where: { email: cleanEmail },
      update: {
        items: cleanItems as unknown as Prisma.InputJsonValue,
        subtotal: Math.max(0, Math.round(Number(subtotal) || 0)),
        currency: currency || "USD",
        recoveredAt: null,           // re-opened cart is no longer "recovered"
        reminderCount: 0,            // reset reminder cadence on fresh activity
        lastReminderAt: null,
      },
      create: {
        email: cleanEmail,
        items: cleanItems as unknown as Prisma.InputJsonValue,
        subtotal: Math.max(0, Math.round(Number(subtotal) || 0)),
        currency: currency || "USD",
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[POST /api/shop/cart]", err);
    return NextResponse.json({ error: "Failed to save cart" }, { status: 500 });
  }
}
