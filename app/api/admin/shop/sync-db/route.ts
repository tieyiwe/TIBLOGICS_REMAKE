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
    `ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "collections" TEXT[] DEFAULT ARRAY[]::TEXT[]`,

    // ── Digital delivery ──────────────────────────────────────────────────
    `ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "deliveryType" TEXT NOT NULL DEFAULT 'none'`,
    `ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "fileKey" TEXT`,
    `ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "fileName" TEXT`,
    `ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "fileFormat" TEXT`,
    `ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "fileSizeBytes" INTEGER`,
    `ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "externalUrl" TEXT`,
    `ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "downloadDays" INTEGER NOT NULL DEFAULT 365`,
    `ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "maxDownloads" INTEGER NOT NULL DEFAULT 10`,

    `CREATE TABLE IF NOT EXISTS "DownloadGrant" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "token" TEXT NOT NULL,
      "orderId" TEXT NOT NULL REFERENCES "Order"("id") ON DELETE CASCADE,
      "productId" TEXT NOT NULL REFERENCES "Product"("id") ON DELETE CASCADE,
      "email" TEXT NOT NULL,
      "downloadCount" INTEGER NOT NULL DEFAULT 0,
      "maxDownloads" INTEGER NOT NULL DEFAULT 10,
      "expiresAt" TIMESTAMP(3) NOT NULL,
      "lastDownloadAt" TIMESTAMP(3)
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "DownloadGrant_token_key" ON "DownloadGrant"("token")`,
    `CREATE INDEX IF NOT EXISTS "DownloadGrant_orderId_idx" ON "DownloadGrant"("orderId")`,
    `CREATE INDEX IF NOT EXISTS "DownloadGrant_email_idx" ON "DownloadGrant"("email")`,

    // Collections
    `CREATE TABLE IF NOT EXISTS "Collection" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "slug" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "description" TEXT NOT NULL DEFAULT '',
      "image" TEXT,
      "featured" BOOLEAN NOT NULL DEFAULT false,
      "published" BOOLEAN NOT NULL DEFAULT true,
      "sortOrder" INTEGER NOT NULL DEFAULT 0
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "Collection_slug_key" ON "Collection"("slug")`,
    `CREATE INDEX IF NOT EXISTS "Collection_published_idx" ON "Collection"("published")`,

    // Abandoned carts (for reminder emails)
    `CREATE TABLE IF NOT EXISTS "AbandonedCart" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "email" TEXT NOT NULL,
      "items" JSONB NOT NULL DEFAULT '[]'::jsonb,
      "subtotal" INTEGER NOT NULL DEFAULT 0,
      "currency" TEXT NOT NULL DEFAULT 'USD',
      "reminderCount" INTEGER NOT NULL DEFAULT 0,
      "lastReminderAt" TIMESTAMP(3),
      "recoveredAt" TIMESTAMP(3)
    )`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "AbandonedCart_email_key" ON "AbandonedCart"("email")`,
    `CREATE INDEX IF NOT EXISTS "AbandonedCart_updatedAt_idx" ON "AbandonedCart"("updatedAt")`,
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
