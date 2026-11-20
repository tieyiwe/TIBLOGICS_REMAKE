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
  collections: string[];
  tags: string[];
  stock: number | null;
  digital: boolean;
  featured: boolean;
  onSale: boolean;
  soldCount: number;
  /** e.g. "PDF · 46 pages · 100 prompts" — rendered as spec chips. */
  fileFormat?: string | null;
}

export interface ShopCollection {
  slug: string;
  name: string;
  description: string;
  image: string | null;
  featured: boolean;
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

/**
 * Money for display. With a locale it is written the visitor's way (the
 * currency itself never changes); without one it keeps the original "$12.00".
 */
export function formatMoney(cents: number, currency = "USD", locale?: string): string {
  if (locale) {
    try {
      return new Intl.NumberFormat(locale, { style: "currency", currency: currency || "USD" }).format(cents / 100);
    } catch {
      /* unknown currency code: fall through */
    }
  }
  const symbol = currency === "USD" ? "$" : `${currency} `;
  return `${symbol}${(cents / 100).toFixed(2)}`;
}
