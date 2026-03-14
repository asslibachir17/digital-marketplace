// src/components/ProductCard.tsx
import Link from "next/link";
import { Star, Download, ArrowUpRight, FileText, Code, Palette, Video, Package } from "lucide-react";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/types";

const categoryIcons: Record<string, React.ReactNode> = {
  "Design Assets": <Palette className="w-4 h-4" />,
  "Code Templates": <Code className="w-4 h-4" />,
  "Animation Packs": <Package className="w-4 h-4" />,
  "eBooks": <FileText className="w-4 h-4" />,
  "Courses": <Video className="w-4 h-4" />,
};

const categoryColors: Record<string, string> = {
  "Design Assets": "text-violet-400 bg-violet-400/10 border-violet-400/20",
  "Code Templates": "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
  "Animation Packs": "text-pink-400 bg-pink-400/10 border-pink-400/20",
  "eBooks": "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  "Courses": "text-amber-400 bg-amber-400/10 border-amber-400/20",
};

interface ProductCardProps {
  product: Product;
  featured?: boolean;
}

export default function ProductCard({ product, featured = false }: ProductCardProps) {
  const icon = categoryIcons[product.category] ?? <Package className="w-4 h-4" />;
  const colorClass = categoryColors[product.category] ?? "text-white/50 bg-white/5 border-white/10";

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <article className="card overflow-hidden h-full flex flex-col">
        {/* Cover / thumbnail area */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#18182e] to-[#0e0e1e] aspect-[16/9]">
          {/* Decorative background */}
          <div className="absolute inset-0 bg-grid opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent" />

          {/* Category icon centered */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className={`w-16 h-16 rounded-2xl border flex items-center justify-center ${colorClass} scale-100 group-hover:scale-110 transition-transform duration-300`}
              style={{ fontSize: "2rem" }}
            >
              {/* Big icon */}
              <span className="w-8 h-8 flex items-center justify-center">
                {React.cloneElement(icon as React.ReactElement, { className: "w-7 h-7" })}
              </span>
            </div>
          </div>

          {/* Featured badge */}
          {featured && (
            <div className="absolute top-3 left-3">
              <span className="badge badge-gold text-[10px]">
                <Star className="w-2.5 h-2.5 mr-1 fill-amber-500" />
                Featured
              </span>
            </div>
          )}

          {/* Quick action overlay */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
            <span className="btn-primary text-xs py-2.5 px-5 pointer-events-none">
              View Product
              <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col flex-1 gap-3">
          {/* Category badge */}
          <div className="flex items-center justify-between">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono border ${colorClass}`}>
              {icon}
              {product.category}
            </span>
            {product.downloads > 0 && (
              <span className="flex items-center gap-1 text-[11px] text-white/30 font-mono">
                <Download className="w-3 h-3" />
                {product.downloads.toLocaleString()}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-base font-semibold text-white leading-snug group-hover:text-amber-400 transition-colors line-clamp-2" style={{ fontFamily: "var(--font-display)" }}>
            {product.name}
          </h3>

          {/* Description */}
          <p className="text-sm text-white/50 line-clamp-2 leading-relaxed flex-1">
            {product.short_desc}
          </p>

          {/* Tags */}
          {product.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {product.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="tag text-[11px]">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Price row */}
          <div className="flex items-center justify-between pt-1 border-t border-white/5 mt-auto">
            <span className="text-xl font-bold text-amber-400" style={{ fontFamily: "var(--font-display)" }}>
              {formatPrice(product.price)}
            </span>
            <span className="text-xs text-white/30 font-mono">
              {product.file_name?.split(".").pop()?.toUpperCase() ?? "FILE"}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}

// Need React for cloneElement
import React from "react";
