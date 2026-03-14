// src/lib/stripe.ts
// Stripe integration helpers

import Stripe from "stripe";
import type { Product } from "./types";

export function createStripeClient(secretKey: string): Stripe {
  return new Stripe(secretKey, {
    apiVersion: "2024-06-20",
    typescript: true,
  });
}

/**
 * Create a Stripe Checkout Session for a digital product.
 * Redirects to Stripe-hosted checkout page.
 */
export async function createCheckoutSession(
  stripe: Stripe,
  product: Product,
  options: {
    appUrl: string;
    customerEmail?: string;
    metadata?: Record<string, string>;
  }
): Promise<Stripe.Checkout.Session> {
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: options.customerEmail,
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: product.price,
          product_data: {
            name: product.name,
            description: product.short_desc,
            images: product.cover_url
              ? [`${options.appUrl}${product.cover_url}`]
              : [],
            metadata: { product_id: product.id },
          },
        },
        quantity: 1,
      },
    ],
    // Redirect URLs
    success_url: `${options.appUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${options.appUrl}/products/${product.slug}`,
    // Store product reference for webhook
    metadata: {
      product_id: product.id,
      product_name: product.name,
      ...options.metadata,
    },
    // Collect billing address for compliance
    billing_address_collection: "auto",
    // Allow promo codes
    allow_promotion_codes: true,
    // Automatic tax calculation (enable in Stripe dashboard)
    // automatic_tax: { enabled: true },
  });

  return session;
}

/**
 * Verify a Stripe webhook signature.
 * Must be called with the raw request body (not parsed JSON).
 */
export function constructWebhookEvent(
  stripe: Stripe,
  body: string,
  signature: string,
  webhookSecret: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(body, signature, webhookSecret);
}

/**
 * Retrieve a completed checkout session with line items.
 */
export async function getCheckoutSession(
  stripe: Stripe,
  sessionId: string
): Promise<Stripe.Checkout.Session> {
  return stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["line_items", "customer"],
  });
}
