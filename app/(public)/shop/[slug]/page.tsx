import { notFound } from "next/navigation";
import type { Metadata } from "next";
import prisma from "@/lib/prisma";
import ProductDetail from "@/components/shop/ProductDetail";
import type { ShopProduct } from "@/components/shop/types";

export const revalidate = 30;

interface Props {
  params: Promise<{ slug: string }>;
}

function toShopProduct(p: {
  id: string; slug: string; name: string; tagline: string | null; description: string;
  price: number; compareAtPrice: number | null; currency: string; images: string[];
  category: string; tags: string[]; stock: number | null; digital: boolean;
  featured: boolean; onSale: boolean; soldCount: number;
}): ShopProduct {
  return {
    id: p.id, slug: p.slug, name: p.name, tagline: p.tagline, description: p.description,
    price: p.price, compareAtPrice: p.compareAtPrice, currency: p.currency, images: p.images,
    category: p.category, tags: p.tags, stock: p.stock, digital: p.digital,
    featured: p.featured, onSale: p.onSale, soldCount: p.soldCount,
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await prisma.product.findUnique({ where: { slug } }).catch(() => null);
  if (!p || !p.published) return {};
  return {
    title: `${p.name} | TIBLOGICS Shop`,
    description: (p.tagline ?? p.description).slice(0, 160),
    openGraph: {
      title: p.name,
      description: (p.tagline ?? p.description).slice(0, 160),
      images: p.images?.[0] ? [{ url: p.images[0] }] : undefined,
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const p = await prisma.product.findUnique({ where: { slug } }).catch(() => null);
  if (!p || !p.published) return notFound();

  const related = await prisma.product
    .findMany({
      where: { published: true, category: p.category, NOT: { id: p.id } },
      orderBy: { createdAt: "desc" },
      take: 4,
    })
    .catch(() => []);

  return <ProductDetail product={toShopProduct(p)} related={related.map(toShopProduct)} />;
}
