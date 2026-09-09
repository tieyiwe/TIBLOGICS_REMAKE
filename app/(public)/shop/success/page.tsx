import Link from "next/link";
import prisma from "@/lib/prisma";
import ClearCartOnMount from "@/components/shop/ClearCartOnMount";
import { formatMoney } from "@/components/shop/types";

interface Props {
  searchParams: Promise<{ order?: string }>;
}

export const dynamic = "force-dynamic";

export default async function OrderSuccessPage({ searchParams }: Props) {
  const { order: orderNumber } = await searchParams;
  const order = orderNumber
    ? await prisma.order.findUnique({ where: { orderNumber } }).catch(() => null)
    : null;

  const items = order && Array.isArray(order.items)
    ? (order.items as unknown as Array<{ name?: string; price?: number; quantity?: number }>)
    : [];

  return (
    <div style={{ background: "#0C1112", color: "#fff", minHeight: "100vh", fontFamily: "'DM Sans',sans-serif", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
      <ClearCartOnMount />
      <div style={{ maxWidth: "520px", width: "100%", background: "#1A2223", border: "1px solid rgba(255,255,255,.08)", borderRadius: "24px", padding: "48px 36px", textAlign: "center" }}>
        <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "linear-gradient(135deg,#F47C4C,#F9A738)", margin: "0 auto 24px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem" }}>🎉</div>
        <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "1.9rem", marginBottom: "12px" }}>Order confirmed!</h1>
        <p style={{ color: "#8A9BA0", fontSize: ".95rem", lineHeight: 1.7, marginBottom: "28px" }}>
          Thank you for your purchase. {order ? <>Your order <strong style={{ color: "#fff" }}>{order.orderNumber}</strong> is confirmed and a receipt is on its way to your inbox.</> : "A confirmation email is on its way to your inbox."}
        </p>

        {items.length > 0 && (
          <div style={{ textAlign: "left", background: "rgba(255,255,255,.03)", border: "1px solid rgba(255,255,255,.07)", borderRadius: "16px", padding: "20px", marginBottom: "28px" }}>
            {items.map((it, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: i < items.length - 1 ? "1px solid rgba(255,255,255,.06)" : "none", fontSize: ".9rem" }}>
                <span>{it.name} {it.quantity && it.quantity > 1 ? <span style={{ color: "#8A9BA0" }}>× {it.quantity}</span> : ""}</span>
                <span style={{ fontWeight: 700 }}>{formatMoney((it.price ?? 0) * (it.quantity ?? 1), order?.currency ?? "USD")}</span>
              </div>
            ))}
            {order && (
              <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "12px", marginTop: "4px", fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: "1.05rem" }}>
                <span>Total</span><span>{formatMoney(order.total, order.currency)}</span>
              </div>
            )}
          </div>
        )}

        <Link href="/shop" style={{ display: "inline-block", padding: "14px 32px", borderRadius: "50px", background: "linear-gradient(135deg,#F47C4C,#F9A738)", color: "#131A1B", fontFamily: "'Syne',sans-serif", fontWeight: 700, textDecoration: "none" }}>
          Continue Shopping →
        </Link>
      </div>
    </div>
  );
}
