"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ShoppingBag, Plus, Pencil, Trash2, X, Star, Tag, Eye, EyeOff,
  Package, DollarSign, Loader2, ExternalLink,
} from "lucide-react";

type Product = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string;
  price: number;
  compareAtPrice: number | null;
  currency: string;
  images: string[];
  category: string;
  tags: string[];
  stock: number | null;
  digital: boolean;
  featured: boolean;
  published: boolean;
  onSale: boolean;
  sku: string | null;
  soldCount: number;
};

type Order = {
  id: string;
  orderNumber: string;
  email: string;
  customerName: string | null;
  phone: string | null;
  items: Array<{ name?: string; price?: number; quantity?: number }>;
  subtotal: number;
  total: number;
  currency: string;
  status: string;
  createdAt: string;
};

const BLANK = {
  name: "", tagline: "", description: "", price: "", compareAtPrice: "",
  category: "General", images: "", tags: "", stock: "", sku: "",
  digital: true, featured: false, published: true, onSale: false,
};

const money = (c: number, cur = "USD") => `${cur === "USD" ? "$" : cur + " "}${(c / 100).toFixed(2)}`;

const ORDER_STATUS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  paid: "bg-emerald-100 text-emerald-700",
  fulfilled: "bg-blue-100 text-blue-700",
  cancelled: "bg-gray-200 text-gray-600",
  refunded: "bg-red-100 text-red-700",
};

export default function AdminShopPage() {
  const [tab, setTab] = useState<"products" | "orders">("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Product | "new" | null>(null);
  const [needsSync, setNeedsSync] = useState(false);
  const [syncing, setSyncing] = useState(false);

  async function load() {
    setLoading(true);
    const [pRes, oRes] = await Promise.all([
      fetch("/api/admin/products"),
      fetch("/api/admin/orders"),
    ]);
    if (pRes.status === 500) setNeedsSync(true);
    const p = await pRes.json().catch(() => ({ products: [] }));
    const o = await oRes.json().catch(() => ({ orders: [] }));
    setProducts(p.products ?? []);
    setOrders(o.orders ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function syncDatabase() {
    setSyncing(true);
    await fetch("/api/admin/shop/sync-db", { method: "POST" }).catch(() => {});
    setNeedsSync(false);
    setSyncing(false);
    load();
  }

  const stats = useMemo(() => {
    const paid = orders.filter((o) => o.status === "paid" || o.status === "fulfilled");
    const revenue = paid.reduce((n, o) => n + o.total, 0);
    return {
      products: products.length,
      published: products.filter((p) => p.published).length,
      orders: paid.length,
      revenue,
    };
  }, [products, orders]);

  async function quickToggle(p: Product, key: "published" | "featured" | "onSale") {
    setProducts((prev) => prev.map((x) => (x.id === p.id ? { ...x, [key]: !x[key] } : x)));
    await fetch(`/api/admin/products/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: !p[key] }),
    }).catch(() => load());
  }

  async function del(p: Product) {
    if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    setProducts((prev) => prev.filter((x) => x.id !== p.id));
    await fetch(`/api/admin/products/${p.id}`, { method: "DELETE" }).catch(() => load());
  }

  async function setOrderStatus(o: Order, status: string) {
    setOrders((prev) => prev.map((x) => (x.id === o.id ? { ...x, status } : x)));
    await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: o.id, status }),
    }).catch(() => load());
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-syne font-extrabold text-2xl text-[#0D1B2A] flex items-center gap-2">
            <ShoppingBag size={22} className="text-[#F47C20]" /> Shop
          </h1>
          <p className="font-dm text-sm text-[#7A8FA6] mt-1">Manage products, listings, sales & orders</p>
        </div>
        <div className="flex items-center gap-2">
          <a href="/shop" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-dm font-semibold text-[#2251A3] bg-[#EBF0FA] hover:bg-[#dce6f6] transition-colors">
            <ExternalLink size={15} /> View Store
          </a>
          <button onClick={() => setEditing("new")}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-dm font-semibold text-white bg-[#F47C20] hover:bg-[#e06d15] transition-colors">
            <Plus size={16} /> New Product
          </button>
        </div>
      </div>

      {/* First-run DB sync banner */}
      {needsSync && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="font-syne font-bold text-[#0D1B2A]">Set up the shop database</p>
            <p className="font-dm text-sm text-[#7A8FA6]">Click Sync Database once to create the Product & Order tables.</p>
          </div>
          <button onClick={syncDatabase} disabled={syncing}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-dm font-semibold text-white bg-[#F47C20] hover:bg-[#e06d15] disabled:opacity-60">
            {syncing ? <><Loader2 size={16} className="animate-spin" /> Syncing…</> : "Sync Database"}
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Products", value: stats.products, icon: Package },
          { label: "Published", value: stats.published, icon: Eye },
          { label: "Paid Orders", value: stats.orders, icon: ShoppingBag },
          { label: "Revenue", value: money(stats.revenue), icon: DollarSign },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-[#D2DCE8] rounded-2xl p-4">
            <div className="flex items-center gap-2 text-[#7A8FA6] mb-1"><s.icon size={15} /><span className="font-dm text-xs uppercase tracking-wide">{s.label}</span></div>
            <div className="font-syne font-extrabold text-2xl text-[#0D1B2A]">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5 border-b border-[#E4EBF3]">
        {(["products", "orders"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2.5 font-dm text-sm font-semibold border-b-2 -mb-px transition-colors ${
              tab === t ? "border-[#F47C20] text-[#0D1B2A]" : "border-transparent text-[#7A8FA6] hover:text-[#0D1B2A]"
            }`}>
            {t === "products" ? `Products (${products.length})` : `Orders (${orders.length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 bg-[#F4F7FB] rounded-xl" />)}</div>
      ) : tab === "products" ? (
        products.length === 0 ? (
          <div className="text-center py-16 text-[#7A8FA6] font-dm">
            <Package size={40} className="mx-auto mb-3 opacity-40" />
            No products yet. Click <strong>New Product</strong> to add your first listing.
          </div>
        ) : (
          <div className="space-y-3">
            {products.map((p) => {
              const onSale = p.onSale && p.compareAtPrice && p.compareAtPrice > p.price;
              return (
                <div key={p.id} className="bg-white border border-[#D2DCE8] rounded-2xl p-4 flex items-center gap-4 flex-wrap">
                  <div className="w-16 h-16 rounded-xl bg-[#F4F7FB] overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {p.images[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                    ) : <Package size={22} className="text-[#B9C6D6]" />}
                  </div>
                  <div className="flex-1 min-w-[180px]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-syne font-bold text-[#0D1B2A]">{p.name}</span>
                      {!p.published && <span className="text-xs font-dm bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">Draft</span>}
                      {p.featured && <span className="text-xs font-dm bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">★ Featured</span>}
                      {onSale && <span className="text-xs font-dm bg-[#FDEEE6] text-[#F47C20] px-2 py-0.5 rounded-full">On Sale</span>}
                    </div>
                    <div className="font-dm text-xs text-[#7A8FA6] mt-0.5">
                      {p.category} · {p.stock == null ? "∞ stock" : `${p.stock} in stock`} · {p.soldCount} sold
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-syne font-extrabold text-[#0D1B2A]">{p.price === 0 ? "Free" : money(p.price, p.currency)}</div>
                    {onSale && <div className="font-dm text-xs text-[#7A8FA6] line-through">{money(p.compareAtPrice!, p.currency)}</div>}
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => quickToggle(p, "published")} title={p.published ? "Unpublish" : "Publish"}
                      className="p-2 rounded-lg hover:bg-[#F4F7FB] text-[#7A8FA6]">{p.published ? <Eye size={16} /> : <EyeOff size={16} />}</button>
                    <button onClick={() => quickToggle(p, "featured")} title="Toggle featured"
                      className={`p-2 rounded-lg hover:bg-[#F4F7FB] ${p.featured ? "text-amber-500" : "text-[#7A8FA6]"}`}><Star size={16} /></button>
                    <button onClick={() => quickToggle(p, "onSale")} title="Toggle sale"
                      className={`p-2 rounded-lg hover:bg-[#F4F7FB] ${p.onSale ? "text-[#F47C20]" : "text-[#7A8FA6]"}`}><Tag size={16} /></button>
                    <button onClick={() => setEditing(p)} title="Edit" className="p-2 rounded-lg hover:bg-[#F4F7FB] text-[#2251A3]"><Pencil size={16} /></button>
                    <button onClick={() => del(p)} title="Delete" className="p-2 rounded-lg hover:bg-red-50 text-red-400"><Trash2 size={16} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : orders.length === 0 ? (
        <div className="text-center py-16 text-[#7A8FA6] font-dm">
          <ShoppingBag size={40} className="mx-auto mb-3 opacity-40" />No orders yet.
        </div>
      ) : (
        <div className="bg-white border border-[#D2DCE8] rounded-2xl overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-[#F4F7FB]">
                {["Order", "Customer", "Items", "Total", "Status", "Date"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 font-dm text-xs text-[#7A8FA6] font-semibold uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((o, i) => (
                <tr key={o.id} className={i % 2 === 0 ? "bg-white" : "bg-[#FAFBFD]"}>
                  <td className="px-5 py-3 font-dm text-sm text-[#0D1B2A] font-semibold">{o.orderNumber}</td>
                  <td className="px-5 py-3 font-dm text-sm text-[#0D1B2A]">
                    <div>{o.customerName || "—"}</div>
                    <div className="text-xs text-[#7A8FA6]">{o.email || "—"}</div>
                  </td>
                  <td className="px-5 py-3 font-dm text-xs text-[#7A8FA6]">{(o.items ?? []).reduce((n, it) => n + (it.quantity ?? 0), 0)}</td>
                  <td className="px-5 py-3 font-dm text-sm font-bold text-[#0D1B2A]">{money(o.total, o.currency)}</td>
                  <td className="px-5 py-3">
                    <select value={o.status} onChange={(e) => setOrderStatus(o, e.target.value)}
                      className={`text-xs font-dm font-semibold px-2 py-1 rounded-full border-0 cursor-pointer ${ORDER_STATUS[o.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {Object.keys(ORDER_STATUS).map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-5 py-3 font-dm text-xs text-[#7A8FA6]">{new Date(o.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <ProductModal
          product={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
    </div>
  );
}

function ProductModal({ product, onClose, onSaved }: { product: Product | null; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState(() =>
    product
      ? {
          name: product.name,
          tagline: product.tagline ?? "",
          description: product.description,
          price: (product.price / 100).toString(),
          compareAtPrice: product.compareAtPrice ? (product.compareAtPrice / 100).toString() : "",
          category: product.category,
          images: product.images.join("\n"),
          tags: product.tags.join(", "),
          stock: product.stock == null ? "" : product.stock.toString(),
          sku: product.sku ?? "",
          digital: product.digital,
          featured: product.featured,
          published: product.published,
          onSale: product.onSale,
        }
      : { ...BLANK }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k: string, v: string | boolean) => setF((p) => ({ ...p, [k]: v }));

  async function save() {
    if (!f.name.trim()) { setError("Name is required"); return; }
    setSaving(true);
    setError("");
    const payload = {
      name: f.name.trim(),
      tagline: f.tagline.trim(),
      description: f.description,
      price: Math.round((parseFloat(f.price) || 0) * 100),
      compareAtPrice: f.compareAtPrice ? Math.round(parseFloat(f.compareAtPrice) * 100) : null,
      category: f.category.trim() || "General",
      images: f.images.split("\n").map((s) => s.trim()).filter(Boolean),
      tags: f.tags.split(",").map((s) => s.trim()).filter(Boolean),
      stock: f.stock === "" ? null : Math.max(0, Math.round(parseFloat(f.stock) || 0)),
      sku: f.sku.trim(),
      digital: f.digital,
      featured: f.featured,
      published: f.published,
      onSale: f.onSale,
    };
    const url = product ? `/api/admin/products/${product.id}` : "/api/admin/products";
    const res = await fetch(url, {
      method: product ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error || "Failed to save");
      setSaving(false);
      return;
    }
    onSaved();
  }

  const input = "w-full bg-[#F4F7FB] border border-[#D2DCE8] rounded-lg px-3 py-2 font-dm text-sm text-[#0D1B2A] focus:outline-none focus:border-[#2251A3]";
  const label = "block font-dm text-xs font-semibold text-[#7A8FA6] uppercase tracking-wide mb-1.5";

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center overflow-y-auto p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg my-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E4EBF3] sticky top-0 bg-white rounded-t-2xl">
          <h2 className="font-syne font-extrabold text-lg text-[#0D1B2A]">{product ? "Edit Product" : "New Product"}</h2>
          <button onClick={onClose} className="text-[#7A8FA6] hover:text-[#0D1B2A]"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className={label}>Name *</label>
            <input className={input} value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. AI Prompt Pack" />
          </div>
          <div>
            <label className={label}>Tagline</label>
            <input className={input} value={f.tagline} onChange={(e) => set("tagline", e.target.value)} placeholder="One-line pitch shown on cards" />
          </div>
          <div>
            <label className={label}>Description</label>
            <textarea className={input + " min-h-[90px] resize-y"} value={f.description} onChange={(e) => set("description", e.target.value)} placeholder="Full details shown on the product page" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>Price (USD)</label>
              <input className={input} type="number" min="0" step="0.01" value={f.price} onChange={(e) => set("price", e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <label className={label}>Compare-at (was)</label>
              <input className={input} type="number" min="0" step="0.01" value={f.compareAtPrice} onChange={(e) => set("compareAtPrice", e.target.value)} placeholder="Optional" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>Category</label>
              <input className={input} value={f.category} onChange={(e) => set("category", e.target.value)} placeholder="General" />
            </div>
            <div>
              <label className={label}>Stock (blank = ∞)</label>
              <input className={input} type="number" min="0" value={f.stock} onChange={(e) => set("stock", e.target.value)} placeholder="Unlimited" />
            </div>
          </div>
          <div>
            <label className={label}>Image URLs (one per line)</label>
            <textarea className={input + " min-h-[64px] resize-y"} value={f.images} onChange={(e) => set("images", e.target.value)} placeholder="https://…/image.jpg" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>Tags (comma separated)</label>
              <input className={input} value={f.tags} onChange={(e) => set("tags", e.target.value)} placeholder="ai, template" />
            </div>
            <div>
              <label className={label}>SKU</label>
              <input className={input} value={f.sku} onChange={(e) => set("sku", e.target.value)} placeholder="Optional" />
            </div>
          </div>

          <div className="flex flex-wrap gap-4 pt-2">
            {([
              ["published", "Published"],
              ["featured", "Featured"],
              ["onSale", "On Sale"],
              ["digital", "Digital (no shipping)"],
            ] as const).map(([k, lbl]) => (
              <label key={k} className="flex items-center gap-2 cursor-pointer font-dm text-sm text-[#0D1B2A]">
                <input type="checkbox" checked={f[k] as boolean} onChange={(e) => set(k, e.target.checked)} className="accent-[#F47C20] w-4 h-4" />
                {lbl}
              </label>
            ))}
          </div>

          {error && <p className="text-red-500 font-dm text-sm">{error}</p>}
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-[#E4EBF3]">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg font-dm text-sm font-semibold text-[#7A8FA6] bg-[#F4F7FB] hover:bg-[#EBF0FA]">Cancel</button>
          <button onClick={save} disabled={saving}
            className="flex-1 py-2.5 rounded-lg font-dm text-sm font-semibold text-white bg-[#F47C20] hover:bg-[#e06d15] flex items-center justify-center gap-2 disabled:opacity-60">
            {saving ? <><Loader2 size={16} className="animate-spin" /> Saving…</> : product ? "Save Changes" : "Create Product"}
          </button>
        </div>
      </div>
    </div>
  );
}
