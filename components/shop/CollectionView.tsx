"use client";

import Link from "next/link";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import ProductCard from "./ProductCard";
import type { ShopProduct, ShopCollection } from "./types";
import { useT } from "@/lib/i18n/client";
import { C, STORE_CSS } from "./theme";

export default function CollectionView({ collection, products }: { collection: ShopCollection; products: ShopProduct[] }) {
  const t = useT();
  return (
    <div className="st-page">
      <style>{STORE_CSS}</style>

      <header
        style={{
          paddingTop: "clamp(124px,14vw,178px)",
          paddingBottom: "clamp(32px,5vw,48px)",
          background: "radial-gradient(70% 70% at 20% 0%, rgba(27,58,107,.55), transparent 70%)",
        }}
      >
        <div className="st-wrap">
          <nav aria-label={t("pages.store.detail.breadcrumb")} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: ".85rem", marginBottom: "22px" }}>
            <Link href="/store" className="st-link" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <ArrowLeft size={15} aria-hidden="true" /> {t("pages.store.backToStore").replace(/^←\s*/, "")}
            </Link>
          </nav>
          <div className="st-kicker" style={{ marginBottom: "14px" }}>{t("pages.store.collections.kicker")}</div>
          <h1 className="st-h" style={{ fontSize: "clamp(2rem,4.4vw,3.2rem)", lineHeight: 1.08 }}>{collection.name}</h1>
          {collection.description && (
            <p style={{ color: C.text, fontSize: "1.04rem", lineHeight: 1.7, maxWidth: "620px", margin: "14px 0 0" }}>{collection.description}</p>
          )}
          <p className="st-muted" style={{ fontSize: ".88rem", margin: "14px 0 0" }}>
            {products.length === 1 ? t("pages.store.grid.countOne") : t("pages.store.grid.count", { n: products.length })}
          </p>
        </div>
      </header>

      <section className="st-wrap" style={{ paddingTop: "12px", paddingBottom: "clamp(64px,9vw,110px)" }}>
        {products.length === 0 ? (
          <div style={{ textAlign: "center", padding: "72px 16px", border: `1px dashed ${C.line}`, borderRadius: "18px" }}>
            <ShoppingBag size={36} color={C.muted} style={{ margin: "0 auto 16px", opacity: 0.6 }} aria-hidden="true" />
            <p className="st-h" style={{ fontSize: "1.05rem" }}>{t("pages.store.empty.collection")}</p>
          </div>
        ) : (
          <div className="st-grid">
            {products.map((p, i) => <ProductCard key={p.id} p={p} priority={i < 3} />)}
          </div>
        )}
      </section>
    </div>
  );
}
