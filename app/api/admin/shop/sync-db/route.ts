import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

// Creates the Product and Order tables (managed DB — no migrations).
export async function POST() {
  const authErr = await requireAdmin();
  if (authErr) return authErr;

  const log: string[] = [];

  const statements = [
    `CREATE TABLE IF NOT EXISTS "Product" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "slug" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "tagline" TEXT,
      "description" TEXT NOT NULL DEFAULT '',
      "price" INTEGER NOT NULL DEFAULT 0,
      "compareAtPrice" INTEGER,
      "currency" TEXT NOT NULL DEFAULT 'USD',
      "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
      "category" TEXT NOT NULL DEFAULT 'General',
      "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
      "stock" INTEGER,
      "digital" BOOLEAN NOT NULL DEFAULT true,
      "featured" BOOLEAN NOT NULL DEFAULT false,
      "published" BOOLEAN NOT NULL DEFAULT false,
      "onSale" BOOLEAN NOT NULL DEFAULT false,
      "sku" TEXT,
      "soldCount" INTEGER NOT NULL DEFAULT 0
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "Product_slug_key" ON "Product"("slug")`,
    `CREATE INDEX IF NOT EXISTS "Product_published_idx" ON "Product"("published")`,
    `CREATE INDEX IF NOT EXISTS "Product_category_idx" ON "Product"("category")`,
    `CREATE INDEX IF NOT EXISTS "Product_featured_idx" ON "Product"("featured")`,
    `CREATE TABLE IF NOT EXISTS "Order" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "orderNumber" TEXT NOT NULL,
      "email" TEXT NOT NULL DEFAULT '',
      "customerName" TEXT,
      "phone" TEXT,
      "items" JSONB NOT NULL DEFAULT '[]'::jsonb,
      "subtotal" INTEGER NOT NULL DEFAULT 0,
      "total" INTEGER NOT NULL DEFAULT 0,
      "currency" TEXT NOT NULL DEFAULT 'USD',
      "status" TEXT NOT NULL DEFAULT 'pending',
      "stripeSessionId" TEXT,
      "shippingAddress" JSONB,
      "notes" TEXT
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "Order_orderNumber_key" ON "Order"("orderNumber")`,
    `CREATE INDEX IF NOT EXISTS "Order_email_idx" ON "Order"("email")`,
    `CREATE INDEX IF NOT EXISTS "Order_status_idx" ON "Order"("status")`,
    `CREATE INDEX IF NOT EXISTS "Order_createdAt_idx" ON "Order"("createdAt")`,
    // Ensure columns exist on pre-existing tables (idempotent upgrades)
    `ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "soldCount" INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "onSale" BOOLEAN NOT NULL DEFAULT false`,
    `ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "compareAtPrice" INTEGER`,
  ];

  for (const sql of statements) {
    try {
      await prisma.$executeRawUnsafe(sql);
      log.push(`✅ ${sql.trim().split("\n")[0].slice(0, 70)}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      log.push(`⚠️  ${msg.slice(0, 120)}`);
    }
  }

  const count = await prisma.product.count().catch(() => -1);
  log.push(`✅ Products in DB: ${count}`);

  return NextResponse.json({ ok: true, log, count });
}
