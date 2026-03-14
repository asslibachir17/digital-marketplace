// src/lib/types.ts

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  short_desc: string;
  price: number; // in cents
  category: string;
  tags: string[]; // parsed from JSON
  file_key: string;
  file_name: string;
  file_size: number;
  cover_url: string | null;
  preview_url: string | null;
  featured: boolean;
  active: boolean;
  downloads: number;
  created_at: string;
  updated_at: string;
}

export interface ProductRow {
  id: string;
  name: string;
  slug: string;
  description: string;
  short_desc: string;
  price: number;
  category: string;
  tags: string; // raw JSON string from D1
  file_key: string;
  file_name: string;
  file_size: number;
  cover_url: string | null;
  preview_url: string | null;
  featured: number; // 0 | 1
  active: number;
  downloads: number;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  stripe_session_id: string;
  stripe_payment_id: string | null;
  product_id: string;
  customer_email: string;
  customer_name: string | null;
  amount_paid: number;
  currency: string;
  status: "pending" | "paid" | "failed" | "refunded";
  download_token: string | null;
  download_expires: string | null;
  download_count: number;
  max_downloads: number;
  metadata: string;
  created_at: string;
  updated_at: string;
}

export interface CheckoutSessionPayload {
  productId: string;
  customerEmail?: string;
}

export interface DownloadLinkPayload {
  orderId: string;
  token: string;
  signedUrl: string;
  expiresAt: string;
  fileName: string;
}

export interface AdminUploadPayload {
  name: string;
  slug: string;
  description: string;
  short_desc: string;
  price: number;
  category: string;
  tags: string[];
  file_name: string;
  file_size: number;
  cover_url?: string;
}

export type ProductCategory =
  | "Design Assets"
  | "Code Templates"
  | "Animation Packs"
  | "eBooks"
  | "Courses"
  | "Plugins"
  | "Fonts"
  | "All";

// Cloudflare bindings
export interface Env {
  DB: D1Database;
  R2: R2Bucket;
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
  R2_ACCOUNT_ID: string;
  R2_BUCKET_NAME: string;
  R2_PUBLIC_URL?: string;
  DOWNLOAD_TOKEN_SECRET: string;
  ADMIN_SECRET_KEY: string;
  NEXT_PUBLIC_APP_URL: string;
  EMAIL_HOST?: string;
  EMAIL_PORT?: string;
  EMAIL_USER?: string;
  EMAIL_PASS?: string;
}

// Helper to parse product row from D1
export function parseProduct(row: ProductRow): Product {
  return {
    ...row,
    tags: JSON.parse(row.tags || "[]"),
    featured: row.featured === 1,
    active: row.active === 1,
  };
}

// Format price helper
export function formatPrice(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}
