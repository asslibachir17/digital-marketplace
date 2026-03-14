// src/app/page.tsx
import Link from "next/link";
import { ArrowRight, Zap, Shield, Globe, Download, Star, Package, Code, Palette, Video, FileText } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { getAllProducts, parseProduct } from "@/lib/db";
import type { Product } from "@/lib/types";

export const runtime = "edge";
export const revalidate = 60; // ISR: revalidate every 60s

// ─── Server-side data ─────────────────────────────────────────────────────────
async function getFeaturedProducts(): Promise<Product[]> {
  try {
    const env = process.env as unknown as { DB: D1Database };
    const rows = await getAllProducts(env.DB, { featured: true, limit: 6 });
    return rows.map(parseProduct);
  } catch {
    return [];
  }
}

// ─── Static category tiles ────────────────────────────────────────────────────
const categories = [
  { name: "Design Assets", icon: Palette, count: "UI Kits, Figma, Icons", color: "from-violet-500/20 to-violet-500/5", border: "border-violet-500/20", text: "text-violet-400" },
  { name: "Code Templates", icon: Code, count: "Next.js, React, APIs", color: "from-cyan-500/20 to-cyan-500/5", border: "border-cyan-500/20", text: "text-cyan-400" },
  { name: "Animation Packs", icon: Package, count: "CSS, Framer Motion", color: "from-pink-500/20 to-pink-500/5", border: "border-pink-500/20", text: "text-pink-400" },
  { name: "eBooks", icon: FileText, count: "Guides, Architecture", color: "from-emerald-500/20 to-emerald-500/5", border: "border-emerald-500/20", text: "text-emerald-400" },
  { name: "Courses", icon: Video, count: "Video, Workshops", color: "from-amber-500/20 to-amber-500/5", border: "border-amber-500/20", text: "text-amber-400" },
];

const features = [
  { icon: Zap, title: "Instant Delivery", desc: "Files delivered via secure R2 links within seconds of payment." },
  { icon: Shield, title: "Secure Downloads", desc: "HMAC-signed tokens, 48h expiry, and per-purchase download limits." },
  { icon: Globe, title: "Edge Powered", desc: "Served from Cloudflare's 300+ global PoPs for <50ms latency." },
  { icon: Download, title: "Lifetime Access", desc: "Purchase once, re-download anytime from your order history." },
];

// ─── Page component ───────────────────────────────────────────────────────────
export default async function HomePage() {
  const featured = await getFeaturedProducts();

  return (
    <>
      <Navbar />
      <main>

        {/* ── Hero ──────────────────────────────────────────────────────────── */}
        <section className="relative min-h-[100svh] flex flex-col items-center justify-center overflow-hidden">
          {/* Background layers */}
          <div className="absolute inset-0 bg-grid" />
          <div className="absolute inset-0 bg-gradient-radial from-amber-500/8 via-transparent to-transparent" style={{ backgroundPosition: "60% 40%", backgroundSize: "80% 80%" }} />
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#06060e] to-transparent" />

          {/* Floating orbs */}
          <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "0s" }} />
          <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-violet-500/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "3s" }} />

          {/* Content */}
          <div className="relative max-w-5xl mx-auto px-5 sm:px-8 text-center pt-24 pb-20">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 badge badge-gold mb-8 animate-fade-up">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Premium Digital Products Marketplace
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            </div>

            {/* Headline */}
            <h1
              className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold leading-[1.05] tracking-tight mb-6 animate-fade-up"
              style={{ fontFamily: "var(--font-display)", animationDelay: "80ms" }}
            >
              Build faster with
              <br />
              <span className="gradient-text">premium assets</span>
            </h1>

            {/* Subhead */}
            <p
              className="text-lg sm:text-xl text-white/50 max-w-2xl mx-auto leading-relaxed mb-10 animate-fade-up"
              style={{ animationDelay: "160ms" }}
            >
              UI kits, code starters, video courses, and eBooks — all crafted for
              modern developers and designers. Instant, secure downloads.
            </p>

            {/* CTAs */}
            <div
              className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up"
              style={{ animationDelay: "240ms" }}
            >
              <Link href="/products" className="btn-primary text-base py-4 px-8">
                Browse Products
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/products?featured=true" className="btn-secondary text-base py-4 px-8">
                <Star className="w-4 h-4" />
                Featured Picks
              </Link>
            </div>

            {/* Social proof */}
            <div
              className="flex items-center justify-center gap-8 mt-14 animate-fade-up"
              style={{ animationDelay: "320ms" }}
            >
              {[
                { value: "500+", label: "Products" },
                { value: "12k+", label: "Customers" },
                { value: "98%", label: "Satisfaction" },
              ].map(({ value, label }) => (
                <div key={label} className="text-center">
                  <div className="text-2xl font-bold text-amber-400" style={{ fontFamily: "var(--font-display)" }}>{value}</div>
                  <div className="text-xs text-white/30 font-mono mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Categories ────────────────────────────────────────────────────── */}
        <section className="py-20 px-5 sm:px-8 max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-amber-500/60 mb-2">Browse by Type</p>
              <h2 className="text-3xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
                Categories
              </h2>
            </div>
            <Link href="/products" className="btn-ghost text-sm hidden sm:flex">
              All products <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.name}
                href={`/products?category=${encodeURIComponent(cat.name)}`}
                className={`group relative overflow-hidden rounded-2xl border ${cat.border} p-5 bg-gradient-to-br ${cat.color} hover:scale-[1.02] transition-all duration-200`}
              >
                <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-4 ${cat.text}`}>
                  <cat.icon className="w-5 h-5" />
                </div>
                <h3 className={`text-sm font-semibold ${cat.text} mb-1`} style={{ fontFamily: "var(--font-display)" }}>
                  {cat.name}
                </h3>
                <p className="text-xs text-white/30 line-clamp-1">{cat.count}</p>
                <ArrowRight className="absolute bottom-4 right-4 w-4 h-4 text-white/10 group-hover:text-white/30 transition-colors" />
              </Link>
            ))}
          </div>
        </section>

        {/* ── Featured products ─────────────────────────────────────────────── */}
        {featured.length > 0 && (
          <section className="py-20 px-5 sm:px-8 max-w-7xl mx-auto">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-xs font-mono uppercase tracking-widest text-amber-500/60 mb-2">Hand-picked</p>
                <h2 className="text-3xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
                  Featured Products
                </h2>
              </div>
              <Link href="/products?featured=true" className="btn-ghost text-sm hidden sm:flex">
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger">
              {featured.map((product) => (
                <div key={product.id} className="animate-fade-up">
                  <ProductCard product={product} featured={product.featured} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Features / Why us ─────────────────────────────────────────────── */}
        <section className="py-20 px-5 sm:px-8 max-w-7xl mx-auto">
          <div className="divider mb-20" />
          <div className="text-center mb-14">
            <p className="text-xs font-mono uppercase tracking-widest text-amber-500/60 mb-2">Why VAULT</p>
            <h2 className="text-3xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
              Built for the edge
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f) => (
              <div key={f.title} className="p-6 rounded-2xl border border-white/5 bg-[#0e0e1e] hover:border-amber-500/15 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-amber-400" />
                </div>
                <h3 className="text-sm font-semibold text-white mb-2" style={{ fontFamily: "var(--font-display)" }}>
                  {f.title}
                </h3>
                <p className="text-xs text-white/40 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA Banner ────────────────────────────────────────────────────── */}
        <section className="py-20 px-5 sm:px-8 max-w-7xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-500/15 via-[#18182e] to-violet-500/10 border border-amber-500/20 p-12 sm:p-16 text-center">
            <div className="absolute inset-0 bg-grid opacity-30" />
            <div className="relative">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4" style={{ fontFamily: "var(--font-display)" }}>
                Ready to ship faster?
              </h2>
              <p className="text-white/50 mb-8 max-w-lg mx-auto">
                Join thousands of developers and designers who use VAULT to accelerate their projects.
              </p>
              <Link href="/products" className="btn-primary text-base py-4 px-8 inline-flex">
                Explore All Products
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
