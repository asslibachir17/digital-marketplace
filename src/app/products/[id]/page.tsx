"use client";
// src/app/products/[id]/page.tsx
import { useState, useEffect } from "react";
import { useParams, notFound } from "next/navigation";
import Link from "next/link";
import {
  ShoppingCart, ArrowLeft, Shield, Download, CheckCircle,
  FileText, Star, Loader2, ChevronRight, Zap, Package
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/types";

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  useEffect(() => {
    const slug = params.id;
    fetch(`/api/products?search=${encodeURIComponent(slug)}&limit=1`)
      .then((r) => r.json())
      .then((data) => {
        const match = data.products?.find(
          (p: Product) => p.slug === slug || p.id === slug
        );
        setProduct(match ?? null);
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [params.id]);

  const handleBuyNow = async () => {
    if (!product) return;
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Please enter a valid email address.");
      return;
    }
    setEmailError("");
    setPurchasing(true);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          customerEmail: email || undefined,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Checkout failed. Please try again.");
      }
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen pt-20 px-5 sm:px-8 max-w-7xl mx-auto">
          <div className="py-16 grid lg:grid-cols-5 gap-12">
            <div className="lg:col-span-3 space-y-6">
              <div className="skeleton h-8 w-32 rounded" />
              <div className="skeleton h-12 w-3/4 rounded" />
              <div className="skeleton h-4 w-full rounded" />
              <div className="skeleton h-4 w-5/6 rounded" />
            </div>
            <div className="lg:col-span-2">
              <div className="skeleton h-64 rounded-2xl" />
            </div>
          </div>
        </main>
      </>
    );
  }

  if (!product) return notFound();

  const fileExt = product.file_name?.split(".").pop()?.toUpperCase() ?? "FILE";

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-20">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-12">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-white/30 mb-10">
            <Link href="/products" className="hover:text-white transition-colors flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              Products
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-white/50">{product.category}</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-white truncate max-w-[200px]">{product.name}</span>
          </nav>

          <div className="grid lg:grid-cols-5 gap-12 xl:gap-16">

            {/* ── Left: Content ─────────────────────────────────────────────── */}
            <div className="lg:col-span-3 space-y-8">
              {/* Header */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="badge">{product.category}</span>
                  {product.featured && (
                    <span className="badge badge-gold">
                      <Star className="w-2.5 h-2.5 mr-1 fill-amber-500" />
                      Featured
                    </span>
                  )}
                </div>
                <h1
                  className="text-4xl sm:text-5xl font-bold text-white leading-tight mb-4"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {product.name}
                </h1>
                <p className="text-lg text-white/50 leading-relaxed">
                  {product.short_desc}
                </p>
              </div>

              {/* Cover visual */}
              <div className="relative rounded-2xl overflow-hidden aspect-video bg-gradient-to-br from-[#18182e] to-[#0e0e1e] border border-white/5">
                <div className="absolute inset-0 bg-grid opacity-50" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4">
                      <Package className="w-9 h-9 text-amber-400" />
                    </div>
                    <p className="text-white/20 text-sm font-mono">{fileExt} · {product.file_name}</p>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h2 className="text-lg font-semibold text-white mb-3" style={{ fontFamily: "var(--font-display)" }}>
                  About this product
                </h2>
                <div className="text-white/55 leading-relaxed whitespace-pre-line text-[15px]">
                  {product.description}
                </div>
              </div>

              {/* Tags */}
              {product.tags.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-white/40 uppercase tracking-widest font-mono mb-3">
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {product.tags.map((tag) => (
                      <Link
                        key={tag}
                        href={`/products?search=${encodeURIComponent(tag)}`}
                        className="tag hover:border-amber-500/30 hover:text-amber-500/70 transition-colors"
                      >
                        {tag}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Delivery info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
                {[
                  { icon: Zap, title: "Instant Download", desc: "Delivered within seconds of payment" },
                  { icon: Shield, title: "Secure & Private", desc: "Signed URLs, no public access" },
                  { icon: Download, title: "3 Downloads", desc: "48-hour secure link window" },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex gap-3 p-4 rounded-xl bg-white/[0.03] border border-white/5">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Icon className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{title}</p>
                      <p className="text-xs text-white/35 mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Right: Purchase card ───────────────────────────────────────── */}
            <div className="lg:col-span-2">
              <div className="sticky top-24">
                <div className="card p-7 border-amber-500/15">
                  {/* Price */}
                  <div className="mb-6 pb-6 border-b border-white/5">
                    <p className="text-4xl font-bold text-amber-400" style={{ fontFamily: "var(--font-display)" }}>
                      {formatPrice(product.price)}
                    </p>
                    <p className="text-sm text-white/30 mt-1">One-time payment · Lifetime access</p>
                  </div>

                  {/* File info */}
                  <div className="flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.03] border border-white/5 mb-6">
                    <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                      <FileText className="w-4.5 h-4.5 text-white/40" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{product.file_name}</p>
                      <p className="text-xs text-white/30">
                        {fileExt}{product.file_size ? ` · ${formatFileSize(product.file_size)}` : ""}
                      </p>
                    </div>
                  </div>

                  {/* What's included */}
                  <div className="space-y-2.5 mb-6">
                    {[
                      "Full source files included",
                      "Lifetime license for personal & commercial use",
                      "Instant, secure download link via email",
                      "Free minor updates",
                    ].map((item) => (
                      <div key={item} className="flex items-start gap-2.5">
                        <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="text-sm text-white/60">{item}</span>
                      </div>
                    ))}
                  </div>

                  {/* Email input */}
                  <div className="mb-4">
                    <label className="block text-xs font-mono text-white/40 uppercase tracking-wider mb-2">
                      Email for delivery (optional)
                    </label>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
                      className="input text-sm"
                    />
                    {emailError && (
                      <p className="text-xs text-red-400 mt-1.5">{emailError}</p>
                    )}
                    <p className="text-xs text-white/25 mt-1.5">
                      You can also use the download link from the success page.
                    </p>
                  </div>

                  {/* Buy button */}
                  <button
                    onClick={handleBuyNow}
                    disabled={purchasing}
                    className="btn-primary w-full text-base py-4 justify-center"
                  >
                    {purchasing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Redirecting to Stripe…
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4" />
                        Buy Now — {formatPrice(product.price)}
                      </>
                    )}
                  </button>

                  <p className="text-center text-xs text-white/20 mt-3 flex items-center justify-center gap-1.5">
                    <Shield className="w-3 h-3" />
                    Secured by Stripe · SSL encrypted
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
