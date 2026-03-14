// src/components/Footer.tsx
import Link from "next/link";
import { Zap, Twitter, Github } from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();

  const links = {
    Products: [
      { label: "Design Assets", href: "/products?category=Design+Assets" },
      { label: "Code Templates", href: "/products?category=Code+Templates" },
      { label: "Courses", href: "/products?category=Courses" },
      { label: "eBooks", href: "/products?category=eBooks" },
    ],
    Company: [
      { label: "About", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Affiliates", href: "#" },
      { label: "Contact", href: "#" },
    ],
    Legal: [
      { label: "Terms of Service", href: "#" },
      { label: "Privacy Policy", href: "#" },
      { label: "Refund Policy", href: "#" },
      { label: "License", href: "#" },
    ],
  };

  return (
    <footer className="border-t border-white/5 bg-[#06060e]">
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-5 w-fit group">
              <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center group-hover:shadow-[0_0_20px_rgba(245,158,11,0.5)] transition-shadow">
                <Zap className="w-4 h-4 text-black fill-black" />
              </div>
              <span className="font-display font-800 text-lg tracking-tight" style={{ fontFamily: "var(--font-display)", fontWeight: 800 }}>
                VAULT
              </span>
            </Link>
            <p className="text-sm text-white/40 leading-relaxed max-w-xs">
              Premium digital products for creators and developers. Instant downloads, lifetime access.
            </p>
            <div className="flex items-center gap-3 mt-6">
              <a href="#" className="btn-ghost p-2 rounded-lg" aria-label="Twitter">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="btn-ghost p-2 rounded-lg" aria-label="GitHub">
                <Github className="w-4 h-4" />
              </a>
            </div>
            {/* Trust badges */}
            <div className="flex items-center gap-3 mt-6 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs text-white/30 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                Stripe Secured
              </div>
              <div className="flex items-center gap-1.5 text-xs text-white/30 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
                Edge Powered
              </div>
            </div>
          </div>

          {/* Links */}
          {Object.entries(links).map(([section, items]) => (
            <div key={section}>
              <h4 className="text-xs font-mono uppercase tracking-widest text-white/30 mb-4">
                {section}
              </h4>
              <ul className="space-y-2.5">
                {items.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="text-sm text-white/50 hover:text-white transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="divider my-10" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/25 font-mono">
            © {year} VAULT Digital Marketplace. All rights reserved.
          </p>
          <p className="text-xs text-white/20 font-mono">
            Built on Cloudflare Edge · D1 · R2 · Workers
          </p>
        </div>
      </div>
    </footer>
  );
}
