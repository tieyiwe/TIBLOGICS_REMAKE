"use client";

import Link from "next/link";

interface Product {
  name: string;
  desc: string;
  color: string;
  emoji: string;
  tag: string;
}

const products: Product[] = [
  {
    name: "InStory",
    desc: "AI-personalized K-8 learning stories. Built for schools and educators.",
    color: "#2251A3",
    emoji: "📚",
    tag: "EdTech SaaS",
  },
  {
    name: "CareFlow AI",
    desc: "Automated wellness check-ins for social work agencies via Twilio + AI voice.",
    color: "#0F6E56",
    emoji: "❤️",
    tag: "HealthTech SaaS",
  },
  {
    name: "ShipFrica",
    desc: "White-label shipping SaaS for African diaspora logistics businesses.",
    color: "#F47C20",
    emoji: "📦",
    tag: "Logistics SaaS",
  },
  {
    name: "AI Academy",
    desc: "90+ lessons across 3 AI implementation courses on Skool.",
    color: "#7c3aed",
    emoji: "🎓",
    tag: "EdTech Platform",
  },
];

export default function ProductsGrid() {
  return (
    <section className="py-20 bg-[#F4F7FB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-10">
          <span className="section-tag">Our Products</span>
          <h2 className="font-syne font-extrabold text-3xl text-[#0D1B2A] mt-2">
            Built in-house. Deployed globally.
          </h2>
        </div>

        {/* Product cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <div
              key={product.name}
              className="bg-white border border-[#D2DCE8] rounded-2xl p-6 flex flex-col gap-3 card-hover"
            >
              {/* Emoji in 48px circle — color at 15% opacity */}
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
                style={{ backgroundColor: `${product.color}26` }}
              >
                {product.emoji}
              </div>

              {/* Tag */}
              <span className="section-tag">{product.tag}</span>

              {/* Name */}
              <h3 className="font-syne font-bold text-lg text-[#0D1B2A]">
                {product.name}
              </h3>

              {/* Description */}
              <p className="font-dm text-sm text-[#7A8FA6] flex-1 leading-relaxed">
                {product.desc}
              </p>

              {/* CTA */}
              <Link
                href={`/products/${product.name.toLowerCase().replace(/\s+/g, "-")}`}
                className="text-[#2251A3] font-medium text-sm hover:text-[#1B3A6B] transition-colors duration-200"
              >
                Learn more →
              </Link>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
