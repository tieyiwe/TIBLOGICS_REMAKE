import Link from "next/link";
import { Check, Mail } from "lucide-react";
import { SYNE } from "@/lib/fonts/brand";
import { C, STORE_CSS } from "@/components/shop/theme";
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
    <div className="st-page" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "clamp(124px,15vw,200px) 16px 80px", background: `radial-gradient(60% 50% at 50% 0%, rgba(27,58,107,.55), transparent 70%), ${C.bg}` }}>
      <style>{STORE_CSS}</style>
      <ClearCartOnMount />
      <div style={{ maxWidth: "540px", width: "100%", background: C.surface, border: `1px solid ${C.line}`, borderRadius: "24px", padding: "clamp(28px, 7vw, 48px) clamp(20px, 6vw, 40px)", textAlign: "center", boxShadow: "0 40px 80px -40px rgba(0,0,0,.8)" }}>
        <div aria-hidden="true" style={{ width: "64px", height: "64px", borderRadius: "50%", background: C.orangeSoft, border: `1px solid ${C.orangeLine}`, margin: "0 auto 22px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Check size={30} color={C.orange} strokeWidth={2.5} />
        </div>
        <h1 className="st-h" style={{ fontSize: "clamp(1.6rem,4vw,2rem)", marginBottom: "12px" }}>{t("pages.store.success.title")}</h1>
        <p style={{ color: C.text, fontSize: ".98rem", lineHeight: 1.7, margin: "0 0 26px" }}>
          {t("pages.store.success.thanks")}{" "}
          {order ? (
            <span dangerouslySetInnerHTML={{ __html: t("pages.store.success.withOrder", { order: order.orderNumber.replace(/[<>&"']/g, "") }) }} />
          ) : (
            t("pages.store.success.noOrder")
          )}
        </p>

        {items.length > 0 && (
          <div style={{ textAlign: "left", background: C.bg, border: `1px solid ${C.line}`, borderRadius: "16px", padding: "8px 20px", marginBottom: "22px" }}>
            {items.map((it, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: "12px", padding: "12px 0", borderBottom: i < items.length - 1 ? `1px solid ${C.line}` : "none", fontSize: ".92rem" }}>
                <span style={{ minWidth: 0 }}>{it.name} {it.quantity && it.quantity > 1 ? <span style={{ color: C.muted }}>× {it.quantity}</span> : ""}</span>
                <span style={{ fontWeight: 700, whiteSpace: "nowrap" }}>{formatMoney((it.price ?? 0) * (it.quantity ?? 1), order?.currency ?? "USD", locale)}</span>
              </div>
            ))}
            {order && (
              <div style={{ display: "flex", justifyContent: "space-between", padding: "14px 0 12px", borderTop: `1px solid ${C.lineStrong}`, fontFamily: SYNE, fontWeight: 700, fontSize: "1.05rem" }}>
                <span>{t("pages.store.success.total")}</span><span>{formatMoney(order.total, order.currency, locale)}</span>
              </div>
            )}
          </div>
        )}

        <p style={{ display: "flex", alignItems: "flex-start", gap: "10px", textAlign: "left", color: C.muted, fontSize: ".86rem", lineHeight: 1.6, margin: "0 0 26px", padding: "14px 16px", border: `1px solid ${C.line}`, borderRadius: "14px" }}>
          <Mail size={16} color={C.orange} aria-hidden="true" style={{ flexShrink: 0, marginTop: "2px" }} />
          <span>{t("pages.store.success.downloadNote")}</span>
        </p>

        <Link href="/store" className="st-btn st-btn-primary">
          {t("pages.store.success.continue")}
        </Link>
      </div>
    </div>
  );
}
