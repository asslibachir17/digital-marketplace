"use client";
// src/components/Navbar.tsx
import { useState, useEffect } from "react";
import Link from "next/link";
import { ShoppingBag, Menu, X, Zap } from "lucide-react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "/products", label: "Products" },
    { href: "/products?category=Design+Assets", label: "Design" },
    { href: "/products?category=Code+Templates", label: "Code" },
    { href: "/products?category=Courses", label: "Courses" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#06060e]/90 backdrop-blur-xl border-b border-white/5 shadow-[0_1px_0_rgba(245,158,11,0.05)]"
          : "bg-transparent"
      }`}
    >
      <nav className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.4)] group-hover:shadow-[0_0_30px_rgba(245,158,11,0.6)] transition-shadow">
            <Zap className="w-4 h-4 text-black fill-black" />
          </div>
          <span
            className="font-display font-800 text-lg tracking-tight text-white"
            style={{ fontFamily: "var(--font-display)", fontWeight: 800 }}
          >
            VAULT
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="btn-ghost text-sm font-medium"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          <Link href="/products" className="hidden sm:flex btn-secondary text-sm py-2 px-5">
            Browse
          </Link>
          <Link
            href="/admin"
            className="hidden md:flex items-center gap-1.5 text-xs text-amber-500/60 hover:text-amber-500 transition-colors font-mono"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500/60 inline-block animate-pulse" />
            Admin
          </Link>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden btn-ghost p-2"
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-[#0e0e1e]/98 backdrop-blur-xl border-b border-white/5 px-5 pb-6 pt-2">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="py-3 px-2 text-sm text-white/70 hover:text-white border-b border-white/5 last:border-0 transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/admin"
              className="py-3 px-2 text-sm text-amber-500/60 hover:text-amber-500 transition-colors font-mono"
              onClick={() => setMobileOpen(false)}
            >
              Admin Dashboard →
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
