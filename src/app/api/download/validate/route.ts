// src/app/api/download/validate/route.ts
// Validates a download token without incrementing the counter — used by the UI.

import { NextRequest, NextResponse } from "next/server";
import { getOrderByToken, getProductById, parseProduct } from "@/lib/db";
import { verifyDownloadToken } from "@/lib/tokens";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Missing token" }, { status: 400 });
  }

  const env = process.env as unknown as {
    DB: D1Database;
    DOWNLOAD_TOKEN_SECRET: string;
  };

  // Verify HMAC
  const verified = await verifyDownloadToken(token, env.DOWNLOAD_TOKEN_SECRET);
  if (!verified) {
    return NextResponse.json({ error: "Invalid token", valid: false }, { status: 403 });
  }

  const order = await getOrderByToken(env.DB, token);
  if (!order) {
    return NextResponse.json({ error: "Order not found", valid: false }, { status: 404 });
  }

  if (order.status !== "paid") {
    return NextResponse.json({ status: "pending", valid: false }, { status: 202 });
  }

  // Check expiry
  if (order.download_expires && new Date(order.download_expires) < new Date()) {
    const product = await getProductById(env.DB, order.product_id);
    return NextResponse.json(
      { error: "Link expired", code: "LINK_EXPIRED", productName: product ? parseProduct(product).name : undefined },
      { status: 410 }
    );
  }

  // Check limit
  if (order.download_count >= order.max_downloads) {
    const product = await getProductById(env.DB, order.product_id);
    return NextResponse.json(
      { error: "Limit exceeded", code: "LIMIT_EXCEEDED", productName: product ? parseProduct(product).name : undefined },
      { status: 429 }
    );
  }

  const productRow = await getProductById(env.DB, order.product_id);
  const product = productRow ? parseProduct(productRow) : null;

  return NextResponse.json({
    valid: true,
    productName: product?.name ?? "Your Product",
    expiresAt: order.download_expires,
    downloadsLeft: order.max_downloads - order.download_count,
    customerEmail: order.customer_email,
  });
}
