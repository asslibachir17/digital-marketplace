// src/app/api/checkout/status/route.ts
// Polled by the success page to check if a Stripe session has been fulfilled.

import { NextRequest, NextResponse } from "next/server";
import { getOrderBySessionId } from "@/lib/db";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl.searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
  }

  const env = process.env as unknown as { DB: D1Database };

  const order = await getOrderBySessionId(env.DB, sessionId);
  if (!order) {
    return NextResponse.json({ status: "pending", message: "Order not found yet" });
  }

  if (order.status === "paid" && order.download_token) {
    return NextResponse.json({
      status: "paid",
      token: order.download_token,
      orderId: order.id,
    });
  }

  if (order.status === "failed") {
    return NextResponse.json({
      status: "failed",
      message: "Payment failed. Please contact support.",
    });
  }

  return NextResponse.json({ status: "pending" });
}
