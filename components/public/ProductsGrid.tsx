
import Link from "next/link";
import { getT } from "@/lib/i18n/server";

interface Product {
  /** Product names stay in English. */
  name: string;
  /** Dictionary keys: description home.productsGrid.<key> (or home.products.careflow). */
  descKey: string;
  color: string;
  emoji: string;
  tag: string;
}

const products: Product[] = [
  { name: "InStory", descKey: "home.productsGrid.instory", color: "#2251A3", emoji: "📚", tag: "edtech" },
  { name: "CareFlow AI", descKey: "home.products.careflow", color: "#0F6E56", emoji: "❤️", tag: "healthtech" },
  { name: "ShipFrica", descKey: "home.productsGrid.shipfrica", color: "#F47C20", emoji: "📦", tag: "logistics" },
  { name: "AI Academy", descKey: "home.productsGrid.academy", color: "#7c3aed", emoji: "🎓", tag: "platform" },
  { name: "Amber", descKey: "home.productsGrid.amber", color: "#D97706", emoji: "🔔", tag: "communication" },
  { name: "GeoStrat", descKey: "home.productsGrid.geostrat", color: "#0F6E56", emoji: "🌍", tag: "geo" },
];

export default async function ProductsGrid() {
  const t = await getT();
  return (
    <section className="py-20 bg-[#F4F7FB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-10">
          <span className="section-tag">{t("home.productsGrid.tag")}</span>
          <h2 className="font-syne font-extrabold text-3xl text-[#0D1B2A] mt-2">
            {t("home.products.title")}
          </h2>
        </div>

        {/* Product cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div
              key={product.name}
              className="bg-white border border-[#D2DCE8] rounded-2xl p-6 flex flex-col gap-3 card-hover"
            >
              {/* Emoji in 48px circle — color at 15% opacity */}
              <div
                aria-hidden="true"
                className="w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
                style={{ backgroundColor: `${product.color}26` }}
              >
                {product.emoji}
              </div>

              {/* Tag */}
              <span className="section-tag">{t(`home.productsGrid.tag.${product.tag}`)}</span>

              {/* Name */}
              <h3 className="font-syne font-bold text-lg text-[#0D1B2A]">
                {product.name}
              </h3>

              {/* Description */}
              <p className="font-dm text-sm text-[#7A8FA6] flex-1 leading-relaxed">
                {t(product.descKey)}
              </p>

              {/* CTA */}
              <Link
                href={`/products/${product.name.toLowerCase().replace(/\s+/g, "-")}`}
                className="text-[#2251A3] font-medium text-sm hover:text-[#1B3A6B] transition-colors duration-200"
              >
                {t("home.productsGrid.learnMore")}
              </Link>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
