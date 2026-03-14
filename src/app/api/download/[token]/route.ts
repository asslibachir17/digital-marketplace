// src/app/api/download/[token]/route.ts
//
// ╔══════════════════════════════════════════════════════════════╗
// ║  SECURE DOWNLOAD ENDPOINT                                    ║
// ║                                                              ║
// ║  Security layers:                                            ║
// ║  1. HMAC token verification (tamper-proof)                   ║
// ║  2. Token expiry check (48 hour window)                      ║
// ║  3. Download limit enforcement (max 3 per purchase)          ║
// ║  4. Order status validation (must be 'paid')                 ║
// ║  5. R2 presigned URL (30-min TTL, private bucket)            ║
// ║  6. Download audit logging (IP + user agent)                 ║
// ╚══════════════════════════════════════════════════════════════╝

import { NextRequest, NextResponse } from "next/server";
import {
  getOrderByToken,
  getProductById,
  parseProduct,
  incrementDownloadCount,
  logDownload,
} from "@/lib/db";
import { createR2Client, getPresignedDownloadUrl } from "@/lib/r2";
import { verifyDownloadToken } from "@/lib/tokens";

export const runtime = "edge";

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  const { token } = params;

  const env = process.env as unknown as {
    DB: D1Database;
    R2_ACCOUNT_ID: string;
    R2_ACCESS_KEY_ID: string;
    R2_SECRET_ACCESS_KEY: string;
    R2_BUCKET_NAME: string;
    DOWNLOAD_TOKEN_SECRET: string;
  };

  // ── Layer 1: Verify HMAC token ─────────────────────────────────────────────
  const verified = await verifyDownloadToken(token, env.DOWNLOAD_TOKEN_SECRET);
  if (!verified) {
    return buildErrorResponse(
      "Invalid or tampered download link.",
      "INVALID_TOKEN",
      403
    );
  }

  // ── Layer 2: Load order from D1 ───────────────────────────────────────────
  const order = await getOrderByToken(env.DB, token);
  if (!order) {
    return buildErrorResponse(
      "Download link not found.",
      "NOT_FOUND",
      404
    );
  }

  // ── Layer 3: Check order is paid ──────────────────────────────────────────
  if (order.status !== "paid") {
    return buildErrorResponse(
      "Payment not confirmed yet. Please wait a moment and try again.",
      "PAYMENT_PENDING",
      402
    );
  }

  // ── Layer 4: Check token expiry ───────────────────────────────────────────
  if (order.download_expires) {
    const expires = new Date(order.download_expires);
    if (expires < new Date()) {
      return buildErrorResponse(
        "This download link has expired. Please contact support.",
        "LINK_EXPIRED",
        410
      );
    }
  }

  // ── Layer 5: Enforce download limit ───────────────────────────────────────
  if (order.download_count >= order.max_downloads) {
    return buildErrorResponse(
      `Download limit reached (${order.max_downloads}/${order.max_downloads}). Please contact support.`,
      "LIMIT_EXCEEDED",
      429
    );
  }

  // ── Layer 6: Fetch product ─────────────────────────────────────────────────
  const productRow = await getProductById(env.DB, order.product_id);
  if (!productRow) {
    return buildErrorResponse(
      "Product file not found. Please contact support.",
      "PRODUCT_NOT_FOUND",
      404
    );
  }
  const product = parseProduct(productRow);

  // ── Layer 7: Generate R2 presigned URL (30 min TTL) ────────────────────────
  let signedUrl: string;
  try {
    const r2Client = createR2Client({
      R2_ACCOUNT_ID: env.R2_ACCOUNT_ID,
      R2_ACCESS_KEY_ID: env.R2_ACCESS_KEY_ID,
      R2_SECRET_ACCESS_KEY: env.R2_SECRET_ACCESS_KEY,
    });

    const result = await getPresignedDownloadUrl(
      r2Client,
      env.R2_BUCKET_NAME,
      product.file_key,
      product.file_name,
      30 * 60 // 30-minute URL TTL
    );
    signedUrl = result.url;
  } catch (error) {
    console.error("R2 presign error:", error);
    return buildErrorResponse(
      "Failed to generate download link. Please try again.",
      "R2_ERROR",
      500
    );
  }

  // ── Layer 8: Record the download ───────────────────────────────────────────
  const ip =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0] ??
    null;
  const userAgent = request.headers.get("user-agent") ?? null;

  await Promise.all([
    incrementDownloadCount(env.DB, order.id),
    logDownload(env.DB, order.id, ip, userAgent),
  ]);

  // ── Layer 9: Redirect to signed R2 URL ────────────────────────────────────
  // Using 302 redirect so the browser initiates the download directly from R2.
  // This avoids streaming the file through our worker (saves bandwidth + cost).
  return NextResponse.redirect(signedUrl, {
    status: 302,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "X-Download-Remaining": String(
        order.max_downloads - order.download_count - 1
      ),
    },
  });
}

function buildErrorResponse(
  message: string,
  code: string,
  status: number
): NextResponse {
  return NextResponse.json({ error: message, code }, { status });
}
