"use client";
// src/app/success/page.tsx
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle, Download, Clock, AlertTriangle, Loader2,
  Mail, ArrowRight, Shield, RefreshCw
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

type PageState =
  | { status: "loading" }
  | { status: "success"; productName: string; token: string; expiresAt: string; downloadsLeft: number; customerEmail?: string }
  | { status: "expired"; productName?: string }
  | { status: "limit"; productName?: string }
  | { status: "error"; message: string };

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const [state, setState] = useState<PageState>({ status: "loading" });
  const [downloading, setDownloading] = useState(false);

  const sessionId = searchParams.get("session_id");
  const token = searchParams.get("token");

  useEffect(() => {
    if (token) {
      // Direct token from email
      validateToken(token);
    } else if (sessionId) {
      // After Stripe redirect — poll for fulfillment
      pollForFulfillment(sessionId);
    } else {
      setState({ status: "error", message: "Invalid success URL. Missing token or session." });
    }
  }, [sessionId, token]);

  async function validateToken(t: string) {
    // Verify token is valid by fetching order info
    try {
      const res = await fetch(`/api/download/validate?token=${encodeURIComponent(t)}`);
      const data = await res.json();

      if (res.status === 410) {
        setState({ status: "expired", productName: data.productName });
      } else if (res.status === 429) {
        setState({ status: "limit", productName: data.productName });
      } else if (res.ok && data.valid) {
        setState({
          status: "success",
          productName: data.productName,
          token: t,
          expiresAt: data.expiresAt,
          downloadsLeft: data.downloadsLeft,
          customerEmail: data.customerEmail,
        });
      } else {
        setState({ status: "error", message: data.error ?? "Invalid download link." });
      }
    } catch {
      setState({ status: "error", message: "Network error. Please try again." });
    }
  }

  async function pollForFulfillment(sId: string, attempt = 0) {
    if (attempt > 10) {
      setState({ status: "error", message: "Payment processing taking longer than expected. Please check your email." });
      return;
    }

    try {
      const res = await fetch(`/api/checkout/status?session_id=${encodeURIComponent(sId)}`);
      const data = await res.json();

      if (data.status === "paid" && data.token) {
        await validateToken(data.token);
      } else if (data.status === "pending") {
        // Retry after delay
        setTimeout(() => pollForFulfillment(sId, attempt + 1), 2000);
      } else {
        setState({ status: "error", message: data.message ?? "Payment could not be confirmed." });
      }
    } catch {
      setTimeout(() => pollForFulfillment(sId, attempt + 1), 3000);
    }
  }

  const handleDownload = async () => {
    if (state.status !== "success") return;
    setDownloading(true);
    try {
      // Navigate to download route — it validates token and redirects to R2
      window.location.href = `/api/download/${encodeURIComponent(state.token)}`;
    } finally {
      setTimeout(() => setDownloading(false), 3000);
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-20 flex items-center justify-center px-5 py-16">
        <div className="w-full max-w-lg">

          {/* Loading state */}
          {state.status === "loading" && (
            <div className="card p-10 text-center">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-6">
                <Loader2 className="w-7 h-7 text-amber-400 animate-spin" />
              </div>
              <h2 className="text-xl font-semibold mb-2" style={{ fontFamily: "var(--font-display)" }}>
                Confirming your payment…
              </h2>
              <p className="text-white/40 text-sm">
                We're preparing your download. This takes just a moment.
              </p>
              <div className="flex items-center justify-center gap-1.5 mt-6">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="w-2 h-2 rounded-full bg-amber-500/50 animate-pulse"
                    style={{ animationDelay: `${i * 200}ms` }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Success state */}
          {state.status === "success" && (
            <div className="space-y-4 animate-fade-up">
              {/* Main card */}
              <div className="card p-8 border-emerald-500/20">
                {/* Success icon */}
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-8 h-8 text-emerald-400" />
                </div>

                <div className="text-center mb-8">
                  <p className="text-xs font-mono uppercase tracking-widest text-emerald-400/70 mb-2">
                    Payment Confirmed
                  </p>
                  <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: "var(--font-display)" }}>
                    Your download is ready
                  </h1>
                  <p className="text-white/40 text-sm">
                    <strong className="text-white/70">{state.productName}</strong> is ready to download.
                  </p>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {[
                    { label: "Downloads left", value: `${state.downloadsLeft}/3` },
                    { label: "Link expires", value: "48 hrs" },
                    { label: "File security", value: "R2 Signed" },
                  ].map(({ label, value }) => (
                    <div key={label} className="text-center p-3 rounded-xl bg-white/[0.03] border border-white/5">
                      <div className="text-base font-bold text-white" style={{ fontFamily: "var(--font-display)" }}>{value}</div>
                      <div className="text-[10px] text-white/30 font-mono mt-0.5">{label}</div>
                    </div>
                  ))}
                </div>

                {/* Download button */}
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="btn-primary w-full text-base py-4 justify-center"
                >
                  {downloading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Preparing download…</>
                  ) : (
                    <><Download className="w-4 h-4" /> Download Your File</>
                  )}
                </button>

                {/* Email notice */}
                {state.customerEmail && (
                  <div className="flex items-start gap-2.5 mt-4 p-3.5 rounded-xl bg-blue-500/5 border border-blue-500/15">
                    <Mail className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-white/50 leading-relaxed">
                      A download link was also emailed to{" "}
                      <span className="text-blue-400">{state.customerEmail}</span>.
                      Check your inbox.
                    </p>
                  </div>
                )}
              </div>

              {/* Warning card */}
              <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/15">
                <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-400/90 mb-0.5">Save your file now</p>
                  <p className="text-xs text-white/35 leading-relaxed">
                    This secure download link expires in 48 hours and is limited to 3 downloads.
                    Please save your file to a safe location immediately.
                  </p>
                </div>
              </div>

              {/* Security badge */}
              <div className="flex items-center justify-center gap-2 text-xs text-white/20">
                <Shield className="w-3.5 h-3.5" />
                <span>Secured by Cloudflare R2 · HMAC signed · Private bucket</span>
              </div>
            </div>
          )}

          {/* Expired state */}
          {state.status === "expired" && (
            <div className="card p-10 text-center border-red-500/15 animate-fade-up">
              <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
                <Clock className="w-7 h-7 text-red-400" />
              </div>
              <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: "var(--font-display)" }}>
                Link Expired
              </h2>
              <p className="text-white/40 text-sm mb-6">
                This download link has expired (48-hour window). Please contact support with your order details for assistance.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="mailto:support@vault.digital" className="btn-secondary text-sm">
                  Contact Support
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link href="/products" className="btn-ghost text-sm">
                  Browse Products
                </Link>
              </div>
            </div>
          )}

          {/* Limit exceeded state */}
          {state.status === "limit" && (
            <div className="card p-10 text-center border-orange-500/15 animate-fade-up">
              <div className="w-16 h-16 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-7 h-7 text-orange-400" />
              </div>
              <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: "var(--font-display)" }}>
                Download Limit Reached
              </h2>
              <p className="text-white/40 text-sm mb-6">
                You've used all 3 downloads for this purchase. Contact support if you need additional access.
              </p>
              <Link href="mailto:support@vault.digital" className="btn-secondary text-sm inline-flex">
                Request More Downloads
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {/* Error state */}
          {state.status === "error" && (
            <div className="card p-10 text-center border-red-500/15 animate-fade-up">
              <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-7 h-7 text-red-400" />
              </div>
              <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: "var(--font-display)" }}>
                Something went wrong
              </h2>
              <p className="text-white/40 text-sm mb-6">{state.message}</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button onClick={() => window.location.reload()} className="btn-secondary text-sm">
                  <RefreshCw className="w-3.5 h-3.5" />
                  Try Again
                </button>
                <Link href="/products" className="btn-ghost text-sm">
                  Browse Products
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
