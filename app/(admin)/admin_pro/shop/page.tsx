"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ShoppingBag, Plus, Pencil, Trash2, X, Star, Tag, Eye, EyeOff,
  Package, Loader2, ExternalLink, Layers, TrendingUp, Check,
} from "lucide-react";

type Product = {
  id: string; slug: string; name: string; tagline: string | null; description: string;
  price: number; compareAtPrice: number | null; currency: string; images: string[];
  category: string; collections: string[]; tags: string[]; stock: number | null;
  digital: boolean; featured: boolean; published: boolean; onSale: boolean; sku: string | null; soldCount: number;
};

type Collection = {
  id: string; slug: string; name: string; description: string; image: string | null;
  featured: boolean; published: boolean; sortOrder: number;
};

type Order = {
  id: string; orderNumber: string; email: string; customerName: string | null; phone: string | null;
  items: Array<{ name?: string; price?: number; quantity?: number }>;
  subtotal: number; total: number; currency: string; status: string; createdAt: string;
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
  const [tab, setTab] = useState<"products" | "collections" | "orders">("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Product | "new" | null>(null);
  const [editingCol, setEditingCol] = useState<Collection | "new" | null>(null);
  const [needsSync, setNeedsSync] = useState(false);
  const [syncing, setSyncing] = useState(false);

  async function load() {
    setLoading(true);
    const [pRes, cRes, oRes] = await Promise.all([
      fetch("/api/admin/products"),
      fetch("/api/admin/collections"),
      fetch("/api/admin/orders"),
    ]);
    if (pRes.status === 500) setNeedsSync(true);
    const p = await pRes.json().catch(() => ({ products: [] }));
    const c = await cRes.json().catch(() => ({ collections: [] }));
    const o = await oRes.json().catch(() => ({ orders: [] }));
    setProducts(p.products ?? []);
    setCollections(c.collections ?? []);
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
    return {
      products: products.length,
      published: products.filter((p) => p.published).length,
      orders: paid.length,
      revenue: paid.reduce((n, o) => n + o.total, 0),
    };
  }, [products, orders]);

  async function quickToggle(p: Product, key: "published" | "featured" | "onSale") {
    setProducts((prev) => prev.map((x) => (x.id === p.id ? { ...x, [key]: !x[key] } : x)));
    await fetch(`/api/admin/products/${p.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ [key]: !p[key] }),
    }).catch(() => load());
  }
  async function del(p: Product) {
    if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    setProducts((prev) => prev.filter((x) => x.id !== p.id));
    await fetch(`/api/admin/products/${p.id}`, { method: "DELETE" }).catch(() => load());
  }
  async function colToggle(c: Collection, key: "published" | "featured") {
    setCollections((prev) => prev.map((x) => (x.id === c.id ? { ...x, [key]: !x[key] } : x)));
    await fetch(`/api/admin/collections/${c.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ [key]: !c[key] }),
    }).catch(() => load());
  }
  async function delCol(c: Collection) {
    if (!confirm(`Delete collection "${c.name}"? Products stay, but lose this collection tag.`)) return;
    setCollections((prev) => prev.filter((x) => x.id !== c.id));
    await fetch(`/api/admin/collections/${c.id}`, { method: "DELETE" }).catch(() => load());
  }
  async function setOrderStatus(o: Order, status: string) {
    setOrders((prev) => prev.map((x) => (x.id === o.id ? { ...x, status } : x)));
    await fetch("/api/admin/orders", {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: o.id, status }),
    }).catch(() => load());
  }

  const productCountFor = (slug: string) => products.filter((p) => p.collections?.includes(slug)).length;

  return (
    <div className="max-w-6xl mx-auto pb-10">
      {/* Premium gradient header */}
      <div className="relative overflow-hidden rounded-3xl mb-6 p-7 md:p-8"
        style={{ background: "linear-gradient(135deg,#0C1112 0%,#131A1B 55%,#1C2526 100%)" }}>
        <div className="absolute -top-16 -right-10 w-64 h-64 rounded-full blur-3xl opacity-40" style={{ background: "radial-gradient(circle,#F47C4C,transparent 70%)" }} />
        <div className="relative flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-3" style={{ background: "rgba(244,124,76,.15)", border: "1px solid rgba(244,124,76,.3)" }}>
              <ShoppingBag size={13} className="text-[#F9A738]" />
              <span className="font-dm text-xs font-semibold text-[#F9A738]">Store Management</span>
            </div>
            <h1 className="font-syne font-extrabold text-2xl md:text-3xl text-white">TIBLOGICS Shop</h1>
            <p className="font-dm text-sm text-white/50 mt-1">Products, collections, sales & orders — everything in one place.</p>
          </div>
          <div className="flex items-center gap-2">
            <a href="/shop" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-dm font-semibold text-white/90 bg-white/10 hover:bg-white/15 transition-colors backdrop-blur">
              <ExternalLink size={15} /> View Store
            </a>
            <button onClick={() => (tab === "collections" ? setEditingCol("new") : setEditing("new"))}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-dm font-bold text-[#131A1B] transition-transform hover:-translate-y-0.5"
              style={{ background: "linear-gradient(135deg,#F47C4C,#F9A738)" }}>
              <Plus size={16} /> {tab === "collections" ? "New Collection" : "New Product"}
            </button>
          </div>
        </div>
      </div>

      {needsSync && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="font-syne font-bold text-[#0D1B2A]">Set up the shop database</p>
            <p className="font-dm text-sm text-[#7A8FA6]">Click Sync Database once to create the Product, Collection & Order tables.</p>
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
          { label: "Products", value: stats.products, icon: Package, from: "#2251A3" },
          { label: "Published", value: stats.published, icon: Eye, from: "#22A387" },
          { label: "Paid Orders", value: stats.orders, icon: ShoppingBag, from: "#8B5CF6" },
          { label: "Revenue", value: money(stats.revenue), icon: TrendingUp, from: "#F47C4C" },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-[#E4EBF3] rounded-2xl p-4 relative overflow-hidden">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 text-white" style={{ background: s.from }}>
              <s.icon size={17} />
            </div>
            <div className="font-syne font-extrabold text-2xl text-[#0D1B2A]">{s.value}</div>
            <div className="font-dm text-xs text-[#7A8FA6] uppercase tracking-wide mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 mb-5 bg-[#EEF2F7] p-1 rounded-xl w-fit">
        {([["products", "Products", products.length], ["collections", "Collections", collections.length], ["orders", "Orders", orders.length]] as const).map(([t, lbl, n]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg font-dm text-sm font-semibold transition-colors ${tab === t ? "bg-white text-[#0D1B2A] shadow-sm" : "text-[#7A8FA6] hover:text-[#0D1B2A]"}`}>
            {lbl} <span className="opacity-50">({n})</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="animate-pulse space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 bg-[#F4F7FB] rounded-xl" />)}</div>
      ) : tab === "products" ? (
        products.length === 0 ? (
          <Empty icon={Package} text="No products yet." sub="Click New Product to add your first listing." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((p) => {
              const onSale = p.onSale && p.compareAtPrice && p.compareAtPrice > p.price;
              return (
                <div key={p.id} className="bg-white border border-[#E4EBF3] rounded-2xl overflow-hidden group">
                  <div className="relative aspect-[16/10] bg-[#F4F7FB] flex items-center justify-center overflow-hidden">
                    {p.images[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                    ) : <Package size={30} className="text-[#B9C6D6]" />}
                    <div className="absolute top-2 left-2 flex gap-1.5">
                      {!p.published && <span className="text-[10px] font-dm font-semibold bg-gray-800/80 text-white px-2 py-0.5 rounded-full">Draft</span>}
                      {onSale && <span className="text-[10px] font-dm font-bold text-[#131A1B] px-2 py-0.5 rounded-full" style={{ background: "linear-gradient(135deg,#F47C4C,#F9A738)" }}>SALE</span>}
                      {p.featured && <span className="text-[10px] font-dm font-semibold bg-amber-400/90 text-[#131A1B] px-2 py-0.5 rounded-full">★</span>}
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-syne font-bold text-[#0D1B2A] truncate">{p.name}</div>
                        <div className="font-dm text-xs text-[#7A8FA6] mt-0.5">{p.category} · {p.stock == null ? "∞" : p.stock} stock · {p.soldCount} sold</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-syne font-extrabold text-[#0D1B2A]">{p.price === 0 ? "Free" : money(p.price, p.currency)}</div>
                        {onSale && <div className="font-dm text-[11px] text-[#7A8FA6] line-through">{money(p.compareAtPrice!, p.currency)}</div>}
                      </div>
                    </div>
                    {p.collections?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {p.collections.slice(0, 3).map((c) => <span key={c} className="text-[10px] font-dm bg-[#EBF0FA] text-[#2251A3] px-1.5 py-0.5 rounded">{c}</span>)}
                      </div>
                    )}
                    <div className="flex items-center gap-1 mt-3 pt-3 border-t border-[#F0F3F7]">
                      <IconBtn active={p.published} onClick={() => quickToggle(p, "published")} title={p.published ? "Published" : "Draft"}>{p.published ? <Eye size={15} /> : <EyeOff size={15} />}</IconBtn>
                      <IconBtn active={p.featured} activeColor="text-amber-500" onClick={() => quickToggle(p, "featured")} title="Featured"><Star size={15} /></IconBtn>
                      <IconBtn active={p.onSale} activeColor="text-[#F47C20]" onClick={() => quickToggle(p, "onSale")} title="On sale"><Tag size={15} /></IconBtn>
                      <div className="flex-1" />
                      <button onClick={() => setEditing(p)} className="p-2 rounded-lg hover:bg-[#F4F7FB] text-[#2251A3]"><Pencil size={15} /></button>
                      <button onClick={() => del(p)} className="p-2 rounded-lg hover:bg-red-50 text-red-400"><Trash2 size={15} /></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : tab === "collections" ? (
        collections.length === 0 ? (
          <Empty icon={Layers} text="No collections yet." sub="Group products into collections shoppers can browse." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {collections.map((c) => (
              <div key={c.id} className="bg-white border border-[#E4EBF3] rounded-2xl overflow-hidden">
                <div className="relative aspect-[16/9] bg-[#F4F7FB] flex items-center justify-center overflow-hidden">
                  {c.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.image} alt={c.name} className="w-full h-full object-cover" />
                  ) : <Layers size={28} className="text-[#B9C6D6]" />}
                  <div className="absolute top-2 left-2 flex gap-1.5">
                    {!c.published && <span className="text-[10px] font-dm font-semibold bg-gray-800/80 text-white px-2 py-0.5 rounded-full">Hidden</span>}
                    {c.featured && <span className="text-[10px] font-dm font-semibold bg-amber-400/90 text-[#131A1B] px-2 py-0.5 rounded-full">★ Featured</span>}
                  </div>
                </div>
                <div className="p-4">
                  <div className="font-syne font-bold text-[#0D1B2A]">{c.name}</div>
                  <div className="font-dm text-xs text-[#7A8FA6] mt-0.5">{productCountFor(c.slug)} product{productCountFor(c.slug) === 1 ? "" : "s"} · /{c.slug}</div>
                  {c.description && <p className="font-dm text-xs text-[#7A8FA6] mt-2 line-clamp-2">{c.description}</p>}
                  <div className="flex items-center gap-1 mt-3 pt-3 border-t border-[#F0F3F7]">
                    <IconBtn active={c.published} onClick={() => colToggle(c, "published")} title={c.published ? "Published" : "Hidden"}>{c.published ? <Eye size={15} /> : <EyeOff size={15} />}</IconBtn>
                    <IconBtn active={c.featured} activeColor="text-amber-500" onClick={() => colToggle(c, "featured")} title="Featured on store"><Star size={15} /></IconBtn>
                    <div className="flex-1" />
                    <button onClick={() => setEditingCol(c)} className="p-2 rounded-lg hover:bg-[#F4F7FB] text-[#2251A3]"><Pencil size={15} /></button>
                    <button onClick={() => delCol(c)} className="p-2 rounded-lg hover:bg-red-50 text-red-400"><Trash2 size={15} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : orders.length === 0 ? (
        <Empty icon={ShoppingBag} text="No orders yet." sub="Orders appear here once shoppers check out." />
      ) : (
        <div className="bg-white border border-[#E4EBF3] rounded-2xl overflow-x-auto">
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
        <ProductModal product={editing === "new" ? null : editing} collections={collections}
          onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load(); }} />
      )}
      {editingCol && (
        <CollectionModal collection={editingCol === "new" ? null : editingCol}
          onClose={() => setEditingCol(null)} onSaved={() => { setEditingCol(null); load(); }} />
      )}
    </div>
  );
}

function Empty({ icon: Icon, text, sub }: { icon: React.ElementType; text: string; sub: string }) {
  return (
    <div className="text-center py-16 text-[#7A8FA6] font-dm bg-white border border-[#E4EBF3] rounded-2xl">
      <Icon size={40} className="mx-auto mb-3 opacity-40" />
      <p className="font-syne font-bold text-[#0D1B2A]">{text}</p>
      <p className="text-sm mt-1">{sub}</p>
    </div>
  );
}

function IconBtn({ children, onClick, title, active, activeColor = "text-[#22A387]" }: { children: React.ReactNode; onClick: () => void; title: string; active?: boolean; activeColor?: string }) {
  return (
    <button onClick={onClick} title={title} className={`p-2 rounded-lg hover:bg-[#F4F7FB] transition-colors ${active ? activeColor : "text-[#B9C6D6]"}`}>
      {children}
    </button>
  );
}

const input = "w-full bg-[#F4F7FB] border border-[#D2DCE8] rounded-lg px-3 py-2 font-dm text-sm text-[#0D1B2A] focus:outline-none focus:border-[#2251A3]";
const label = "block font-dm text-xs font-semibold text-[#7A8FA6] uppercase tracking-wide mb-1.5";

function ProductModal({ product, collections, onClose, onSaved }: { product: Product | null; collections: Collection[]; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState(() =>
    product
      ? {
          name: product.name, tagline: product.tagline ?? "", description: product.description,
          price: (product.price / 100).toString(), compareAtPrice: product.compareAtPrice ? (product.compareAtPrice / 100).toString() : "",
          category: product.category, images: product.images.join("\n"), tags: product.tags.join(", "),
          stock: product.stock == null ? "" : product.stock.toString(), sku: product.sku ?? "",
          digital: product.digital, featured: product.featured, published: product.published, onSale: product.onSale,
        }
      : { name: "", tagline: "", description: "", price: "", compareAtPrice: "", category: "General", images: "", tags: "", stock: "", sku: "", digital: true, featured: false, published: true, onSale: false }
  );
  const [selCols, setSelCols] = useState<string[]>(product?.collections ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (k: string, v: string | boolean) => setF((p) => ({ ...p, [k]: v }));
  const toggleCol = (slug: string) => setSelCols((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));

  async function save() {
    if (!f.name.trim()) { setError("Name is required"); return; }
    setSaving(true); setError("");
    const payload = {
      name: f.name.trim(), tagline: f.tagline.trim(), description: f.description,
      price: Math.round((parseFloat(f.price) || 0) * 100),
      compareAtPrice: f.compareAtPrice ? Math.round(parseFloat(f.compareAtPrice) * 100) : null,
      category: f.category.trim() || "General",
      collections: selCols,
      images: f.images.split("\n").map((s) => s.trim()).filter(Boolean),
      tags: f.tags.split(",").map((s) => s.trim()).filter(Boolean),
      stock: f.stock === "" ? null : Math.max(0, Math.round(parseFloat(f.stock) || 0)),
      sku: f.sku.trim(), digital: f.digital, featured: f.featured, published: f.published, onSale: f.onSale,
    };
    const res = await fetch(product ? `/api/admin/products/${product.id}` : "/api/admin/products", {
      method: product ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
    });
    if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d.error || "Failed to save"); setSaving(false); return; }
    onSaved();
  }

  return (
    <Modal title={product ? "Edit Product" : "New Product"} onClose={onClose} onSave={save} saving={saving} error={error} saveLabel={product ? "Save Changes" : "Create Product"}>
      <Field label="Name *"><input className={input} value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. AI Prompt Pack" /></Field>
      <Field label="Tagline"><input className={input} value={f.tagline} onChange={(e) => set("tagline", e.target.value)} placeholder="One-line pitch shown on cards" /></Field>
      <Field label="Description"><textarea className={input + " min-h-[90px] resize-y"} value={f.description} onChange={(e) => set("description", e.target.value)} placeholder="Full details shown on the product page" /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Price (USD)"><input className={input} type="number" min="0" step="0.01" value={f.price} onChange={(e) => set("price", e.target.value)} placeholder="0.00" /></Field>
        <Field label="Compare-at (was)"><input className={input} type="number" min="0" step="0.01" value={f.compareAtPrice} onChange={(e) => set("compareAtPrice", e.target.value)} placeholder="Optional" /></Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Category"><input className={input} value={f.category} onChange={(e) => set("category", e.target.value)} placeholder="General" /></Field>
        <Field label="Stock (blank = ∞)"><input className={input} type="number" min="0" value={f.stock} onChange={(e) => set("stock", e.target.value)} placeholder="Unlimited" /></Field>
      </div>
      <Field label="Image URLs (one per line)"><textarea className={input + " min-h-[64px] resize-y"} value={f.images} onChange={(e) => set("images", e.target.value)} placeholder="https://…/image.jpg" /></Field>

      {collections.length > 0 && (
        <Field label="Collections">
          <div className="flex flex-wrap gap-2">
            {collections.map((c) => {
              const on = selCols.includes(c.slug);
              return (
                <button key={c.id} type="button" onClick={() => toggleCol(c.slug)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-dm font-semibold border transition-colors ${on ? "bg-[#EBF0FA] border-[#2251A3] text-[#2251A3]" : "bg-white border-[#D2DCE8] text-[#7A8FA6]"}`}>
                  {on && <Check size={12} />} {c.name}
                </button>
              );
            })}
          </div>
        </Field>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label="Tags (comma separated)"><input className={input} value={f.tags} onChange={(e) => set("tags", e.target.value)} placeholder="ai, template" /></Field>
        <Field label="SKU"><input className={input} value={f.sku} onChange={(e) => set("sku", e.target.value)} placeholder="Optional" /></Field>
      </div>
      <div className="flex flex-wrap gap-4 pt-1">
        {([["published", "Published"], ["featured", "Featured"], ["onSale", "On Sale"], ["digital", "Digital (no shipping)"]] as const).map(([k, lbl]) => (
          <label key={k} className="flex items-center gap-2 cursor-pointer font-dm text-sm text-[#0D1B2A]">
            <input type="checkbox" checked={f[k] as boolean} onChange={(e) => set(k, e.target.checked)} className="accent-[#F47C20] w-4 h-4" /> {lbl}
          </label>
        ))}
      </div>
    </Modal>
  );
}

function CollectionModal({ collection, onClose, onSaved }: { collection: Collection | null; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState(() =>
    collection
      ? { name: collection.name, description: collection.description, image: collection.image ?? "", sortOrder: collection.sortOrder.toString(), featured: collection.featured, published: collection.published }
      : { name: "", description: "", image: "", sortOrder: "0", featured: false, published: true }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (k: string, v: string | boolean) => setF((p) => ({ ...p, [k]: v }));

  async function save() {
    if (!f.name.trim()) { setError("Name is required"); return; }
    setSaving(true); setError("");
    const payload = { name: f.name.trim(), description: f.description, image: f.image.trim(), sortOrder: Math.round(parseFloat(f.sortOrder) || 0), featured: f.featured, published: f.published };
    const res = await fetch(collection ? `/api/admin/collections/${collection.id}` : "/api/admin/collections", {
      method: collection ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
    });
    if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d.error || "Failed to save"); setSaving(false); return; }
    onSaved();
  }

  return (
    <Modal title={collection ? "Edit Collection" : "New Collection"} onClose={onClose} onSave={save} saving={saving} error={error} saveLabel={collection ? "Save Changes" : "Create Collection"}>
      <Field label="Name *"><input className={input} value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. AI Starter Kits" /></Field>
      <Field label="Description"><textarea className={input + " min-h-[70px] resize-y"} value={f.description} onChange={(e) => set("description", e.target.value)} placeholder="Shown on the collection page & card" /></Field>
      <Field label="Cover Image URL"><input className={input} value={f.image} onChange={(e) => set("image", e.target.value)} placeholder="https://…/cover.jpg" /></Field>
      <Field label="Sort Order (lower shows first)"><input className={input} type="number" value={f.sortOrder} onChange={(e) => set("sortOrder", e.target.value)} /></Field>
      <div className="flex flex-wrap gap-4 pt-1">
        {([["published", "Published"], ["featured", "Feature on store home"]] as const).map(([k, lbl]) => (
          <label key={k} className="flex items-center gap-2 cursor-pointer font-dm text-sm text-[#0D1B2A]">
            <input type="checkbox" checked={f[k] as boolean} onChange={(e) => set(k, e.target.checked)} className="accent-[#F47C20] w-4 h-4" /> {lbl}
          </label>
        ))}
      </div>
    </Modal>
  );
}

function Modal({ title, children, onClose, onSave, saving, error, saveLabel }: { title: string; children: React.ReactNode; onClose: () => void; onSave: () => void; saving: boolean; error: string; saveLabel: string }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-start justify-center overflow-y-auto p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg my-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E4EBF3] sticky top-0 bg-white rounded-t-2xl z-10">
          <h2 className="font-syne font-extrabold text-lg text-[#0D1B2A]">{title}</h2>
          <button onClick={onClose} className="text-[#7A8FA6] hover:text-[#0D1B2A]"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-4">
          {children}
          {error && <p className="text-red-500 font-dm text-sm">{error}</p>}
        </div>
        <div className="flex gap-3 px-6 py-4 border-t border-[#E4EBF3]">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg font-dm text-sm font-semibold text-[#7A8FA6] bg-[#F4F7FB] hover:bg-[#EBF0FA]">Cancel</button>
          <button onClick={onSave} disabled={saving}
            className="flex-1 py-2.5 rounded-lg font-dm text-sm font-semibold text-white bg-[#F47C20] hover:bg-[#e06d15] flex items-center justify-center gap-2 disabled:opacity-60">
            {saving ? <><Loader2 size={16} className="animate-spin" /> Saving…</> : saveLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label: lbl, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className={label}>{lbl}</span>
      {children}
    </div>
  );
}
