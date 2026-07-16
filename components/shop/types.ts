export interface ShopProduct {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string;
  price: number;          // cents
  compareAtPrice: number | null;
  currency: string;
  images: string[];
  category: string;
  tags: string[];
  stock: number | null;
  digital: boolean;
  featured: boolean;
  onSale: boolean;
  soldCount: number;
}

export interface CartLine {
  id: string;
  slug: string;
  name: string;
  price: number;
  image: string | null;
  quantity: number;
  maxStock: number | null;
}

export function formatMoney(cents: number, currency = "USD"): string {
  const symbol = currency === "USD" ? "$" : `${currency} `;
  return `${symbol}${(cents / 100).toFixed(2)}`;
}
