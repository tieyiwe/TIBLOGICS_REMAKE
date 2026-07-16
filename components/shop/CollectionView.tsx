"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import ProductCard, { SHOP_CARD_STYLES } from "./ProductCard";
import type { ShopProduct, ShopCollection } from "./types";

const S = { darker: "#0C1112", muted: "#8A9BA0" };
const syne = "'Syne', sans-serif";
const dm = "'DM Sans', sans-serif";

export default function CollectionView({ collection, products }: { collection: ShopCollection; products: ShopProduct[] }) {
  return (
    <div style={{ background: S.darker, color: "#fff", fontFamily: dm, minHeight: "100vh" }}>
      <style>{SHOP_CARD_STYLES}</style>

      <section style={{ position: "relative", overflow: "hidden", padding: "132px 24px 40px", background: "radial-gradient(120% 80% at 50% -10%, rgba(244,124,76,.16), transparent 60%)" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <Link href="/shop" style={{ color: S.muted, textDecoration: "none", fontSize: ".88rem" }}>← Back to shop</Link>
          <h1 style={{ fontFamily: syne, fontWeight: 800, fontSize: "clamp(2rem,4vw,3.2rem)", lineHeight: 1.1, margin: "16px 0 10px" }}>{collection.name}</h1>
          {collection.description && <p style={{ color: "#B0C4CC", fontSize: "1.02rem", lineHeight: 1.6, maxWidth: "620px" }}>{collection.description}</p>}
        </div>
      </section>

      <section style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px 24px 100px" }}>
        {products.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: S.muted }}>
            <ShoppingBag size={44} style={{ margin: "0 auto 18px", opacity: 0.4 }} />
            <p style={{ fontSize: "1.05rem", fontFamily: syne, fontWeight: 700, color: "#fff" }}>No products in this collection yet.</p>
          </div>
        ) : (
          <div className="shop-grid">
            {products.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        )}
      </section>
    </div>
  );
}
