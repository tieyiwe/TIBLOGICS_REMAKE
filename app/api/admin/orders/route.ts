import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

// GET — list orders (admin)
export async function GET() {
  const authErr = await requireAdmin();
  if (authErr) return authErr;

  const orders = await prisma.order
    .findMany({ orderBy: { createdAt: "desc" }, take: 200 })
    .catch((err) => {
      console.error("[admin/orders GET]", err);
      return null;
    });

  if (orders === null) {
    return NextResponse.json({ error: "Database error — run Sync Database", orders: [] }, { status: 500 });
  }
  return NextResponse.json({ orders });
}

// PATCH — update order status ({ id, status })
export async function PATCH(req: NextRequest) {
  const authErr = await requireAdmin();
  if (authErr) return authErr;

  try {
    const { id, status } = await req.json();
    const allowed = ["pending", "paid", "fulfilled", "cancelled", "refunded"];
    if (!id || !allowed.includes(status)) {
      return NextResponse.json({ error: "Invalid id or status" }, { status: 400 });
    }
    const order = await prisma.order.update({ where: { id }, data: { status } });
    return NextResponse.json({ order });
  } catch (err) {
    console.error("[admin/orders PATCH]", err);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
