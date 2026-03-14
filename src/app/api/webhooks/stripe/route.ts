// src/app/api/webhooks/stripe/route.ts
//
// ╔══════════════════════════════════════════════════════╗
// ║  STRIPE WEBHOOK — PAYMENT FULFILLMENT ENGINE         ║
// ║  Handles: checkout.session.completed                 ║
// ║  Triggers: D1 order update + R2 signed URL + Email   ║
// ╚══════════════════════════════════════════════════════╝

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import {
  getOrderBySessionId,
  fulfillOrder,
  getProductById,
  parseProduct,
  incrementDownloads,
} from "@/lib/db";
import {
  createStripeClient,
  constructWebhookEvent,
  getCheckoutSession,
} from "@/lib/stripe";
import { createR2Client, getPresignedDownloadUrl } from "@/lib/r2";
import { generateDownloadToken } from "@/lib/tokens";
import { sendDownloadEmail } from "@/lib/email";

export const runtime = "edge";

// Stripe sends raw body — we MUST NOT parse it before verification
export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const env = process.env as unknown as {
    DB: D1Database;
    STRIPE_SECRET_KEY: string;
    STRIPE_WEBHOOK_SECRET: string;
    R2_ACCOUNT_ID: string;
    R2_ACCESS_KEY_ID: string;
    R2_SECRET_ACCESS_KEY: string;
    R2_BUCKET_NAME: string;
    DOWNLOAD_TOKEN_SECRET: string;
    NEXT_PUBLIC_APP_URL: string;
    RESEND_API_KEY?: string;
    EMAIL_HOST?: string;
    EMAIL_PORT?: string;
    EMAIL_USER?: string;
    EMAIL_PASS?: string;
  };

  // ── Step 1: Verify webhook signature ───────────────────────────────────────
  let event: Stripe.Event;
  try {
    const stripe = createStripeClient(env.STRIPE_SECRET_KEY);
    event = constructWebhookEvent(
      stripe,
      body,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // ── Step 2: Handle relevant events ─────────────────────────────────────────
  if (event.type !== "checkout.session.completed") {
    // Acknowledge other events without processing
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  // Ignore unpaid sessions (shouldn't happen but be safe)
  if (session.payment_status !== "paid") {
    return NextResponse.json({ received: true });
  }

  try {
    // ── Step 3: Retrieve full session + product ───────────────────────────────
    const stripe = createStripeClient(env.STRIPE_SECRET_KEY);
    const fullSession = await getCheckoutSession(stripe, session.id);

    const productId =
      fullSession.metadata?.product_id ??
      (session.metadata?.product_id as string);

    if (!productId) {
      console.error("No product_id in session metadata:", session.id);
      return NextResponse.json({ error: "Missing product_id" }, { status: 400 });
    }

    const productRow = await getProductById(env.DB, productId);
    if (!productRow) {
      console.error("Product not found:", productId);
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }
    const product = parseProduct(productRow);

    // ── Step 4: Check if already processed (idempotency) ─────────────────────
    const existingOrder = await getOrderBySessionId(env.DB, session.id);
    if (existingOrder?.status === "paid") {
      console.log("Order already fulfilled:", session.id);
      return NextResponse.json({ received: true, already_processed: true });
    }

    // ── Step 5: Generate secure download token ────────────────────────────────
    const orderId = existingOrder?.id ?? crypto.randomUUID();
    const { token, expiresAt } = await generateDownloadToken(
      orderId,
      env.DOWNLOAD_TOKEN_SECRET
    );

    // ── Step 6: Generate R2 presigned download URL ────────────────────────────
    const r2Client = createR2Client({
      R2_ACCOUNT_ID: env.R2_ACCOUNT_ID,
      R2_ACCESS_KEY_ID: env.R2_ACCESS_KEY_ID,
      R2_SECRET_ACCESS_KEY: env.R2_SECRET_ACCESS_KEY,
    });

    const { url: signedR2Url, expiresAt: r2ExpiresAt } =
      await getPresignedDownloadUrl(
        r2Client,
        env.R2_BUCKET_NAME,
        product.file_key,
        product.file_name,
        48 * 60 * 60 // 48 hours R2 URL TTL
      );

    // ── Step 7: Fulfill order in D1 ───────────────────────────────────────────
    await fulfillOrder(env.DB, session.id, {
      stripe_payment_id:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id ?? "",
      download_token: token,
      download_expires: expiresAt.toISOString(),
    });

    // Increment product download counter
    await incrementDownloads(env.DB, productId);

    // ── Step 8: Build the app-level download URL (token-gated) ────────────────
    // This URL is what gets emailed — it routes through our API for logging
    // and enforces the download limit before issuing the R2 presigned URL.
    const customerEmail =
      fullSession.customer_details?.email ?? existingOrder?.customer_email ?? "";
    const customerName = fullSession.customer_details?.name ?? undefined;

    const downloadPageUrl = `${env.NEXT_PUBLIC_APP_URL}/success?token=${token}`;

    // ── Step 9: Send download email ───────────────────────────────────────────
    await sendDownloadEmail(
      {
        to: customerEmail,
        customerName,
        productName: product.name,
        downloadUrl: downloadPageUrl,
        expiresAt,
        appUrl: env.NEXT_PUBLIC_APP_URL,
        emailConfig: {
          host: env.EMAIL_HOST ?? "",
          port: parseInt(env.EMAIL_PORT ?? "587"),
          user: env.EMAIL_USER ?? "",
          pass: env.EMAIL_PASS ?? "",
        },
      },
      env.RESEND_API_KEY
    );

    console.log(`✓ Order fulfilled: ${session.id} → token issued to ${customerEmail}`);

    return NextResponse.json({
      received: true,
      fulfilled: true,
      order_id: orderId,
    });
  } catch (error) {
    console.error("Webhook fulfillment error:", error);
    // Return 200 to prevent Stripe retries for logic errors.
    // For infra errors, return 500 to trigger Stripe retry.
    return NextResponse.json(
      { error: "Fulfillment failed", details: String(error) },
      { status: 500 }
    );
  }
}
