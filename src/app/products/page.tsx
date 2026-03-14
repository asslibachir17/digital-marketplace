"use client";
// src/app/products/page.tsx
import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, SlidersHorizontal, X, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@/lib/types";

const CATEGORIES = [
  "All",
  "Design Assets",
  "Code Templates",
  "Animation Packs",
  "eBooks",
  "Courses",
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "featured", label: "Featured" },
  { value: "price_asc", label: "Price: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
];

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [activeCategory, setActiveCategory] = useState(
    searchParams.get("category") ?? "All"
  );
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const fetchProducts = useCallback(
    async (reset = false) => {
      setLoading(true);
      const offset = reset ? 0 : page * 12;
      const params = new URLSearchParams({
        limit: "12",
        offset: String(offset),
      });

      if (activeCategory !== "All") params.set("category", activeCategory);
      if (search.trim()) params.set("search", search.trim());
      if (sort === "featured") params.set("featured", "true");

      try {
        const res = await fetch(`/api/products?${params}`);
        const data = await res.json();

        let fetched: Product[] = data.products ?? [];

        // Client-side sort
        if (sort === "price_asc")
          fetched = [...fetched].sort((a, b) => a.price - b.price);
        else if (sort === "price_desc")
          fetched = [...fetched].sort((a, b) => b.price - a.price);

        setProducts(reset ? fetched : (prev) => [...prev, ...fetched]);
        setHasMore(data.hasMore);
        if (reset) setPage(0);
      } finally {
        setLoading(false);
      }
    },
    [activeCategory, search, sort, page]
  );

  // Re-fetch when filters change
  useEffect(() => {
    fetchProducts(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory, sort]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => fetchProducts(true), 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Sync URL params
  useEffect(() => {
    const p = new URLSearchParams();
    if (activeCategory !== "All") p.set("category", activeCategory);
    if (search) p.set("search", search);
    router.replace(`/products?${p.toString()}`, { scroll: false });
  }, [activeCategory, search, router]);

  const clearFilters = () => {
    setSearch("");
    setActiveCategory("All");
    setSort("newest");
  };

  const hasFilters = search || activeCategory !== "All" || sort !== "newest";

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-20">

        {/* ── Page header ───────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden py-16 px-5 sm:px-8 border-b border-white/5">
          <div className="absolute inset-0 bg-grid opacity-40" />
          <div className="relative max-w-7xl mx-auto">
            <p className="text-xs font-mono uppercase tracking-widest text-amber-500/60 mb-2">
              Digital Store
            </p>
            <h1
              className="text-4xl sm:text-5xl font-bold mb-4"
              style={{ fontFamily: "var(--font-display)" }}
            >
              All Products
            </h1>
            <p className="text-white/40 max-w-lg">
              Browse our collection of premium digital assets, templates, and resources.
            </p>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-5 sm:px-8 py-10">

          {/* ── Filter bar ──────────────────────────────────────────────────── */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            {/* Search */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="text"
                placeholder="Search products…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-10 pr-10"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-white/30 shrink-0" />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="input py-2.5 text-sm w-auto pr-8 cursor-pointer"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            {hasFilters && (
              <button
                onClick={clearFilters}
                className="btn-ghost text-sm text-amber-500/70 hover:text-amber-500"
              >
                <X className="w-3.5 h-3.5" />
                Clear filters
              </button>
            )}
          </div>

          {/* ── Category pills ───────────────────────────────────────────────── */}
          <div className="flex items-center gap-2 flex-wrap mb-8">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-150 border ${
                  activeCategory === cat
                    ? "bg-amber-500/15 border-amber-500/40 text-amber-400"
                    : "bg-transparent border-white/8 text-white/40 hover:text-white hover:border-white/20"
                }`}
                style={{ fontFamily: "var(--font-display)" }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* ── Results count ────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-white/30 font-mono">
              {loading && products.length === 0 ? (
                <span className="skeleton inline-block w-24 h-4" />
              ) : (
                `${products.length} product${products.length !== 1 ? "s" : ""} found`
              )}
            </p>
          </div>

          {/* ── Product grid ─────────────────────────────────────────────────── */}
          {loading && products.length === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="card overflow-hidden">
                  <div className="skeleton aspect-[16/9] rounded-none" />
                  <div className="p-5 space-y-3">
                    <div className="skeleton h-4 w-20 rounded" />
                    <div className="skeleton h-5 w-3/4 rounded" />
                    <div className="skeleton h-4 w-full rounded" />
                    <div className="skeleton h-4 w-2/3 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-24">
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                <Search className="w-7 h-7 text-white/20" />
              </div>
              <h3 className="text-lg font-semibold text-white/60 mb-2" style={{ fontFamily: "var(--font-display)" }}>
                No products found
              </h3>
              <p className="text-sm text-white/30 mb-6">
                Try a different search term or category.
              </p>
              <button onClick={clearFilters} className="btn-secondary text-sm">
                Clear filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger">
                {products.map((product, i) => (
                  <div
                    key={product.id}
                    className="animate-fade-up"
                    style={{ animationDelay: `${(i % 6) * 60}ms` }}
                  >
                    <ProductCard product={product} featured={product.featured} />
                  </div>
                ))}
              </div>

              {/* Load more */}
              {hasMore && (
                <div className="flex justify-center mt-12">
                  <button
                    onClick={() => {
                      setPage((p) => p + 1);
                      fetchProducts(false);
                    }}
                    disabled={loading}
                    className="btn-secondary"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Load more"
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
