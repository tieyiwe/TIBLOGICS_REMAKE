import Link from "next/link";
import prisma from "@/lib/prisma";
import ClearCartOnMount from "@/components/shop/ClearCartOnMount";
import { formatMoney } from "@/components/shop/types";
import { getLocale, getT } from "@/lib/i18n/server";
import type { Metadata } from "next";
import { privateMetadata } from "@/lib/seo/meta";

// A confirmation page for one buyer: never in search results.
export const metadata: Metadata = privateMetadata();

interface Props {
  searchParams: Promise<{ order?: string }>;
}

export const dynamic = "force-dynamic";

export default async function OrderSuccessPage({ searchParams }: Props) {
  const { order: orderNumber } = await searchParams;
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  const order = orderNumber
    ? await prisma.order.findUnique({ where: { orderNumber } }).catch(() => null)
    : null;

  const items = order && Array.isArray(order.items)
    ? (order.items as unknown as Array<{ name?: string; price?: number; quantity?: number }>)
    : [];

  return (
    <div style={{ background: "#0C1112", color: "#fff", minHeight: "100vh", fontFamily: "'DM Sans',sans-serif", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
      <ClearCartOnMount />
      <div style={{ maxWidth: "520px", width: "100%", background: "#1A2223", border: "1px solid rgba(255,255,255,.08)", borderRadius: "24px", padding: "clamp(28px, 7vw, 48px) clamp(20px, 6vw, 36px)", textAlign: "center" }}>
        <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "linear-gradient(135deg,#F47C4C,#F9A738)", margin: "0 auto 24px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem" }}>🎉</div>
        <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "1.9rem", marginBottom: "12px" }}>{t("pages.store.success.title")}</h1>
        <p style={{ color: "#8A9BA0", fontSize: ".95rem", lineHeight: 1.7, marginBottom: "28px" }}>
          {t("pages.store.success.thanks")}{" "}
          {order ? (
            <span dangerouslySetInnerHTML={{ __html: t("pages.store.success.withOrder", { order: order.orderNumber.replace(/[<>&"']/g, "") }) }} />
          ) : (
            t("pages.store.success.noOrder")
          )}
        </p>

        {items.length > 0 && (
          <div style={{ textAlign: "left", background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.07)", borderRadius: "16px", padding: "20px", marginBottom: "28px" }}>
            {items.map((it, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: i < items.length - 1 ? "1px solid rgba(255,255,255,.06)" : "none", fontSize: ".9rem" }}>
                <span>{it.name} {it.quantity && it.quantity > 1 ? <span style={{ color: "#8A9BA0" }}>× {it.quantity}</span> : ""}</span>
                <span style={{ fontWeight: 700 }}>{formatMoney((it.price ?? 0) * (it.quantity ?? 1), order?.currency ?? "USD", locale)}</span>
              </div>
            ))}
            {order && (
              <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "12px", marginTop: "4px", fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "1.05rem" }}>
                <span>{t("pages.store.success.total")}</span><span>{formatMoney(order.total, order.currency, locale)}</span>
              </div>
            )}
          </div>
        )}

        <Link href="/store" style={{ display: "inline-block", padding: "14px 32px", borderRadius: "50px", background: "linear-gradient(135deg,#F47C4C,#F9A738)", color: "#131A1B", fontFamily: "'Syne',sans-serif", fontWeight: 700, textDecoration: "none" }}>
          {t("pages.store.success.continue")}
        </Link>
      </div>
    </div>
  );
}
