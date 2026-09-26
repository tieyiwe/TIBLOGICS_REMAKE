// Digital delivery for the shop.
//
// The rule this enforces: a file is only ever served against a DownloadGrant,
// and grants are created solely by the Stripe webhook after a payment
// settles. There is no public path to a paid file — nothing sellable lives
// under /public, because anything there is fetchable without paying.
import { randomBytes } from "crypto";
import path from "path";
import prisma from "@/lib/prisma";

/** Files live outside /public so the web server will not serve them directly. */
export const PRIVATE_DOWNLOAD_ROOT = path.join(process.cwd(), "private", "downloads");

export type DeliveryType = "none" | "download" | "external";

/** 32 bytes of randomness — long enough that guessing is not a threat model. */
export function newDownloadToken(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * Resolve a fileKey to an absolute path, refusing anything that escapes the
 * download root. fileKey is admin-authored rather than user input, but a
 * traversal here would expose arbitrary server files, so it is checked
 * regardless of who sets it.
 */
export function resolveDownloadPath(fileKey: string): string | null {
  const resolved = path.resolve(PRIVATE_DOWNLOAD_ROOT, fileKey);
  const root = path.resolve(PRIVATE_DOWNLOAD_ROOT);
  if (resolved !== root && !resolved.startsWith(root + path.sep)) return null;
  return resolved;
}

export interface GrantedItem {
  productName: string;
  token: string;
  deliveryType: DeliveryType;
  fileName: string | null;
  fileFormat: string | null;
  expiresAt: Date;
}

/**
 * Create one grant per deliverable product in a paid order.
 *
 * Idempotent: the Stripe webhook can be retried, and a replay must not mint a
 * second set of tokens. Existing grants for the order are returned as-is.
 */
export async function grantDownloadsForOrder(
  orderId: string,
  email: string,
): Promise<GrantedItem[]> {
  const existing = await prisma.downloadGrant
    .findMany({ where: { orderId }, include: { product: true } })
    .catch(() => []);

  if (existing.length > 0) {
    return existing.map((g) => ({
      productName: g.product.name,
      token: g.token,
      deliveryType: g.product.deliveryType as DeliveryType,
      fileName: g.product.fileName,
      fileFormat: g.product.fileFormat,
      expiresAt: g.expiresAt,
    }));
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } }).catch(() => null);
  if (!order) return [];

  const items = Array.isArray(order.items)
    ? (order.items as unknown as Array<{ productId?: string }>)
    : [];
  const productIds = [...new Set(items.map((i) => i.productId).filter(Boolean) as string[])];
  if (productIds.length === 0) return [];

  const products = await prisma.product
    .findMany({ where: { id: { in: productIds }, deliveryType: { not: "none" } } })
    .catch(() => []);

  const granted: GrantedItem[] = [];
  for (const product of products) {
    const expiresAt = new Date(Date.now() + product.downloadDays * 86_400_000);
    const token = newDownloadToken();
    try {
      await prisma.downloadGrant.create({
        data: {
          token,
          orderId,
          productId: product.id,
          email,
          maxDownloads: product.maxDownloads,
          expiresAt,
        },
      });
      granted.push({
        productName: product.name,
        token,
        deliveryType: product.deliveryType as DeliveryType,
        fileName: product.fileName,
        fileFormat: product.fileFormat,
        expiresAt,
      });
    } catch (err) {
      console.error("[shop/delivery] grant failed", product.slug, err);
    }
  }
  return granted;
}

export type RedeemResult =
  | { ok: true; grant: NonNullable<Awaited<ReturnType<typeof findGrant>>> }
  | { ok: false; reason: "not_found" | "expired" | "limit_reached" };

function findGrant(token: string) {
  return prisma.downloadGrant.findUnique({
    where: { token },
    include: { product: true, order: true },
  });
}

/**
 * Validate a token before serving anything. Checks, in order: the grant
 * exists, its order is actually paid, it has not expired, and the download
 * limit is not spent. A refunded or cancelled order stops working here.
 */
export async function checkGrant(token: string): Promise<RedeemResult> {
  const grant = await findGrant(token).catch(() => null);
  if (!grant) return { ok: false, reason: "not_found" };

  // A grant only exists post-payment, but re-check so a later refund or
  // cancellation revokes access without needing to delete rows.
  if (!["paid", "fulfilled"].includes(grant.order.status)) {
    return { ok: false, reason: "not_found" };
  }
  if (grant.expiresAt.getTime() < Date.now()) return { ok: false, reason: "expired" };
  if (grant.downloadCount >= grant.maxDownloads) return { ok: false, reason: "limit_reached" };

  return { ok: true, grant };
}

export async function recordDownload(grantId: string): Promise<void> {
  await prisma.downloadGrant
    .update({
      where: { id: grantId },
      data: { downloadCount: { increment: 1 }, lastDownloadAt: new Date() },
    })
    .catch((err) => console.error("[shop/delivery] recordDownload", err));
}
