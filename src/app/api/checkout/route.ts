// src/app/api/checkout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getProductById, parseProduct, createOrder } from "@/lib/db";
import { createStripeClient, createCheckoutSession } from "@/lib/stripe";
import { z } from "zod";

export const runtime = "edge";

const CheckoutSchema = z.object({
  productId: z.string().min(1),
  customerEmail: z.string().email().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = CheckoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { productId, customerEmail } = parsed.data;
    const env = process.env as unknown as {
      DB: D1Database;
      STRIPE_SECRET_KEY: string;
      NEXT_PUBLIC_APP_URL: string;
    };

    // Fetch product
    const productRow = await getProductById(env.DB, productId);
    if (!productRow) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    const product = parseProduct(productRow);

    // Create Stripe session
    const stripe = createStripeClient(env.STRIPE_SECRET_KEY);
    const session = await createCheckoutSession(stripe, product, {
      appUrl: env.NEXT_PUBLIC_APP_URL,
      customerEmail,
      metadata: { product_id: product.id },
    });

    // Pre-create order record in D1 (status: pending)
    await createOrder(env.DB, {
      stripe_session_id: session.id,
      product_id: product.id,
      customer_email: customerEmail ?? session.customer_details?.email ?? "",
      amount_paid: product.price,
      currency: "usd",
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
