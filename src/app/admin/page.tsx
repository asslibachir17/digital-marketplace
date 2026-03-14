"use client";
// src/app/admin/page.tsx
import { useState, useEffect, useRef } from "react";
import {
  Upload, BarChart3, Package, DollarSign, Download,
  Plus, Loader2, CheckCircle, AlertCircle, X, Lock,
  FileText, Eye, EyeOff
} from "lucide-react";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/types";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Stats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalDownloads: number;
}

type UploadState = "idle" | "uploading" | "success" | "error";

const CATEGORIES = [
  "Design Assets", "Code Templates", "Animation Packs", "eBooks", "Courses", "Plugins", "Fonts"
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [adminKey, setAdminKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [authError, setAuthError] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<"upload" | "products" | "stats">("upload");
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [uploadError, setUploadError] = useState("");
  const [uploadedId, setUploadedId] = useState("");

  // Form state
  const [form, setForm] = useState({
    name: "", slug: "", description: "", short_desc: "",
    price: "", category: "Code Templates", tags: "", featured: false
  });
  const fileRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  const handleAuth = async () => {
    setAuthError("");
    try {
      const res = await fetch("/api/admin/stats", {
        headers: { Authorization: `Bearer ${adminKey}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setProducts(data.products);
        setAuthed(true);
        sessionStorage.setItem("admin_key", adminKey);
      } else {
        setAuthError("Invalid admin key. Please try again.");
      }
    } catch {
      setAuthError("Connection error. Please try again.");
    }
  };

  // Restore session
  useEffect(() => {
    const saved = sessionStorage.getItem("admin_key");
    if (saved) { setAdminKey(saved); }
  }, []);

  const autoSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const handleFormChange = (field: string, value: string | boolean) => {
    setForm((f) => ({
      ...f,
      [field]: value,
      ...(field === "name" && !f.slug ? { slug: autoSlug(value as string) } : {}),
    }));
  };

  const handleUpload = async () => {
    if (!form.name || !form.slug || !form.description || !form.short_desc || !form.price || !form.category) {
      setUploadError("Please fill in all required fields.");
      return;
    }
    if (!fileRef.current?.files?.[0]) {
      setUploadError("Please select a product file to upload.");
      return;
    }

    setUploadState("uploading");
    setUploadError("");

    const fd = new FormData();
    fd.append("file", fileRef.current.files[0]);
    if (coverRef.current?.files?.[0]) fd.append("cover", coverRef.current.files[0]);
    Object.entries(form).forEach(([k, v]) => {
      if (k === "tags") fd.append(k, JSON.stringify(v.toString().split(",").map(t => t.trim()).filter(Boolean)));
      else fd.append(k, String(v));
    });
    // Price in cents
    fd.set("price", String(Math.round(parseFloat(form.price) * 100)));

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${adminKey}` },
        body: fd,
      });
      const data = await res.json();
      if (res.ok) {
        setUploadState("success");
        setUploadedId(data.productId);
        // Reset form
        setForm({ name: "", slug: "", description: "", short_desc: "", price: "", category: "Code Templates", tags: "", featured: false });
        if (fileRef.current) fileRef.current.value = "";
        if (coverRef.current) coverRef.current.value = "";
      } else {
        setUploadState("error");
        setUploadError(data.error ?? "Upload failed.");
      }
    } catch {
      setUploadState("error");
      setUploadError("Network error during upload.");
    }
  };

  // ── Auth wall ──────────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <main className="min-h-screen bg-[#06060e] flex items-center justify-center px-5">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-6 h-6 text-amber-400" />
            </div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
              Admin Access
            </h1>
            <p className="text-sm text-white/40 mt-1">Enter your admin secret key</p>
          </div>
          <div className="card p-6 space-y-4">
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                placeholder="Admin secret key"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAuth()}
                className="input pr-10"
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {authError && (
              <p className="text-xs text-red-400 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                {authError}
              </p>
            )}
            <button onClick={handleAuth} className="btn-primary w-full justify-center">
              Authenticate
            </button>
            <Link href="/" className="btn-ghost w-full justify-center text-sm">
              ← Back to store
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // ── Dashboard ──────────────────────────────────────────────────────────────
  const statCards = stats ? [
    { icon: DollarSign, label: "Total Revenue", value: formatPrice(stats.totalRevenue), color: "text-emerald-400", bg: "bg-emerald-400/10" },
    { icon: Package, label: "Total Orders", value: stats.totalOrders.toLocaleString(), color: "text-blue-400", bg: "bg-blue-400/10" },
    { icon: BarChart3, label: "Products", value: stats.totalProducts.toLocaleString(), color: "text-violet-400", bg: "bg-violet-400/10" },
    { icon: Download, label: "Downloads", value: stats.totalDownloads.toLocaleString(), color: "text-amber-400", bg: "bg-amber-400/10" },
  ] : [];

  return (
    <main className="min-h-screen bg-[#06060e]">
      {/* Header */}
      <header className="border-b border-white/5 bg-[#0e0e1e]/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-amber-500 font-mono text-sm font-semibold">VAULT</span>
            <span className="text-white/20 text-sm">/</span>
            <span className="text-white/50 text-sm">Admin</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/products" target="_blank" className="btn-ghost text-xs">
              <Eye className="w-3.5 h-3.5" />
              View Store
            </Link>
            <button
              onClick={() => { setAuthed(false); sessionStorage.removeItem("admin_key"); }}
              className="btn-ghost text-xs text-red-400/60 hover:text-red-400"
            >
              <X className="w-3.5 h-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map(({ icon: Icon, label, value, color, bg }) => (
            <div key={label} className="card p-5">
              <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-4.5 h-4.5 ${color}`} />
              </div>
              <div className="text-2xl font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>{value}</div>
              <div className="text-xs text-white/35 font-mono mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-white/5">
          {(["upload", "products", "stats"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors capitalize -mb-px ${
                activeTab === tab
                  ? "border-amber-500 text-amber-400"
                  : "border-transparent text-white/40 hover:text-white"
              }`}
              style={{ fontFamily: "var(--font-display)" }}
            >
              {tab === "upload" ? "Upload Product" : tab === "products" ? `Products (${products.length})` : "Analytics"}
            </button>
          ))}
        </div>

        {/* Upload tab */}
        {activeTab === "upload" && (
          <div className="max-w-2xl space-y-6">
            {uploadState === "success" && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-500/8 border border-emerald-500/20 animate-fade-up">
                <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-emerald-400">Product uploaded successfully!</p>
                  <p className="text-xs text-white/40 mt-0.5">ID: <code className="font-mono">{uploadedId}</code></p>
                </div>
                <button onClick={() => setUploadState("idle")} className="ml-auto text-white/30 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="card p-6 space-y-5">
              <h2 className="text-lg font-semibold" style={{ fontFamily: "var(--font-display)" }}>
                New Product
              </h2>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-white/40 uppercase tracking-wider mb-1.5">Name *</label>
                  <input className="input" value={form.name} onChange={(e) => handleFormChange("name", e.target.value)} placeholder="Product name" />
                </div>
                <div>
                  <label className="block text-xs font-mono text-white/40 uppercase tracking-wider mb-1.5">Slug *</label>
                  <input className="input" value={form.slug} onChange={(e) => handleFormChange("slug", e.target.value)} placeholder="product-slug" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-white/40 uppercase tracking-wider mb-1.5">Short Description * (max 300 chars)</label>
                <input className="input" value={form.short_desc} onChange={(e) => handleFormChange("short_desc", e.target.value)} placeholder="One-line summary" maxLength={300} />
              </div>

              <div>
                <label className="block text-xs font-mono text-white/40 uppercase tracking-wider mb-1.5">Full Description *</label>
                <textarea
                  className="input min-h-[120px] resize-y"
                  value={form.description}
                  onChange={(e) => handleFormChange("description", e.target.value)}
                  placeholder="Full product description…"
                />
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-mono text-white/40 uppercase tracking-wider mb-1.5">Price (USD) *</label>
                  <input className="input" type="number" min="1" step="0.01" value={form.price} onChange={(e) => handleFormChange("price", e.target.value)} placeholder="49.00" />
                </div>
                <div>
                  <label className="block text-xs font-mono text-white/40 uppercase tracking-wider mb-1.5">Category *</label>
                  <select className="input cursor-pointer" value={form.category} onChange={(e) => handleFormChange("category", e.target.value)}>
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2.5 cursor-pointer p-3 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                    <input type="checkbox" checked={form.featured} onChange={(e) => handleFormChange("featured", e.target.checked)} className="w-4 h-4 accent-amber-500" />
                    <span className="text-sm text-white/60">Featured</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-white/40 uppercase tracking-wider mb-1.5">Tags (comma separated)</label>
                <input className="input" value={form.tags} onChange={(e) => handleFormChange("tags", e.target.value)} placeholder="react, typescript, ui-kit" />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-white/40 uppercase tracking-wider mb-1.5">Product File * (ZIP, PDF, etc.)</label>
                  <input ref={fileRef} type="file" className="input text-sm file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-amber-500/10 file:text-amber-400 file:text-xs file:font-medium cursor-pointer" />
                </div>
                <div>
                  <label className="block text-xs font-mono text-white/40 uppercase tracking-wider mb-1.5">Cover Image (optional)</label>
                  <input ref={coverRef} type="file" accept="image/*" className="input text-sm file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-white/5 file:text-white/40 file:text-xs file:font-medium cursor-pointer" />
                </div>
              </div>

              {uploadError && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/8 border border-red-500/20">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-400">{uploadError}</p>
                </div>
              )}

              <button
                onClick={handleUpload}
                disabled={uploadState === "uploading"}
                className="btn-primary w-full justify-center"
              >
                {uploadState === "uploading" ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Uploading to R2…</>
                ) : (
                  <><Upload className="w-4 h-4" /> Upload Product</>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Products tab */}
        {activeTab === "products" && (
          <div className="space-y-3">
            {products.length === 0 ? (
              <div className="text-center py-16 text-white/30">
                <Package className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>No products yet. Upload your first product.</p>
              </div>
            ) : (
              products.map((product) => (
                <div key={product.id} className="card p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-white truncate">{product.name}</p>
                      {product.featured && <span className="badge badge-gold text-[10px]">Featured</span>}
                    </div>
                    <p className="text-xs text-white/35 font-mono">{product.category} · {product.file_name}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold text-amber-400" style={{ fontFamily: "var(--font-display)" }}>
                      {formatPrice(product.price)}
                    </p>
                    <p className="text-xs text-white/25 font-mono">{product.downloads} dl</p>
                  </div>
                  <Link href={`/products/${product.slug}`} target="_blank" className="btn-ghost p-2">
                    <Eye className="w-4 h-4" />
                  </Link>
                </div>
              ))
            )}
          </div>
        )}

        {/* Analytics tab */}
        {activeTab === "stats" && (
          <div className="card p-8 text-center text-white/30">
            <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Detailed analytics coming soon.</p>
            <p className="text-xs mt-1">Connect Cloudflare Analytics Engine for real-time metrics.</p>
          </div>
        )}
      </div>
    </main>
  );
}
