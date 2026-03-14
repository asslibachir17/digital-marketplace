// src/lib/db.ts
// Cloudflare D1 database client with typed query helpers

import type { Product, ProductRow, Order, Env, parseProduct } from "./types";
export { parseProduct } from "./types";

// ─── Products ────────────────────────────────────────────────────────────────

export async function getAllProducts(
  db: D1Database,
  options: {
    category?: string;
    featured?: boolean;
    limit?: number;
    offset?: number;
    search?: string;
  } = {}
): Promise<ProductRow[]> {
  const conditions: string[] = ["active = 1"];
  const bindings: (string | number | boolean)[] = [];

  if (options.category && options.category !== "All") {
    conditions.push("category = ?");
    bindings.push(options.category);
  }
  if (options.featured !== undefined) {
    conditions.push("featured = ?");
    bindings.push(options.featured ? 1 : 0);
  }
  if (options.search) {
    conditions.push("(name LIKE ? OR description LIKE ? OR tags LIKE ?)");
    const term = `%${options.search}%`;
    bindings.push(term, term, term);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const limit = options.limit ?? 20;
  const offset = options.offset ?? 0;

  const stmt = db
    .prepare(
      `SELECT * FROM products ${where} ORDER BY featured DESC, created_at DESC LIMIT ? OFFSET ?`
    )
    .bind(...bindings, limit, offset);

  const { results } = await stmt.all<ProductRow>();
  return results ?? [];
}

export async function getProductBySlug(
  db: D1Database,
  slug: string
): Promise<ProductRow | null> {
  const result = await db
    .prepare("SELECT * FROM products WHERE slug = ? AND active = 1")
    .bind(slug)
    .first<ProductRow>();
  return result ?? null;
}

export async function getProductById(
  db: D1Database,
  id: string
): Promise<ProductRow | null> {
  const result = await db
    .prepare("SELECT * FROM products WHERE id = ? AND active = 1")
    .bind(id)
    .first<ProductRow>();
  return result ?? null;
}

export async function createProduct(
  db: D1Database,
  data: {
    name: string;
    slug: string;
    description: string;
    short_desc: string;
    price: number;
    category: string;
    tags: string[];
    file_key: string;
    file_name: string;
    file_size: number;
    cover_url?: string;
  }
): Promise<string> {
  const id = crypto.randomUUID();
  await db
    .prepare(
      `INSERT INTO products (id, name, slug, description, short_desc, price, category, tags, file_key, file_name, file_size, cover_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      id,
      data.name,
      data.slug,
      data.description,
      data.short_desc,
      data.price,
      data.category,
      JSON.stringify(data.tags),
      data.file_key,
      data.file_name,
      data.file_size,
      data.cover_url ?? null
    )
    .run();
  return id;
}

export async function incrementDownloads(
  db: D1Database,
  productId: string
): Promise<void> {
  await db
    .prepare("UPDATE products SET downloads = downloads + 1 WHERE id = ?")
    .bind(productId)
    .run();
}

// ─── Orders ──────────────────────────────────────────────────────────────────

export async function createOrder(
  db: D1Database,
  data: {
    stripe_session_id: string;
    product_id: string;
    customer_email: string;
    customer_name?: string;
    amount_paid: number;
    currency?: string;
  }
): Promise<string> {
  const id = crypto.randomUUID();
  await db
    .prepare(
      `INSERT INTO orders (id, stripe_session_id, product_id, customer_email, customer_name, amount_paid, currency, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`
    )
    .bind(
      id,
      data.stripe_session_id,
      data.product_id,
      data.customer_email,
      data.customer_name ?? null,
      data.amount_paid,
      data.currency ?? "usd"
    )
    .run();
  return id;
}

export async function getOrderBySessionId(
  db: D1Database,
  sessionId: string
): Promise<Order | null> {
  const result = await db
    .prepare("SELECT * FROM orders WHERE stripe_session_id = ?")
    .bind(sessionId)
    .first<Order>();
  return result ?? null;
}

export async function getOrderByToken(
  db: D1Database,
  token: string
): Promise<Order | null> {
  const result = await db
    .prepare("SELECT * FROM orders WHERE download_token = ?")
    .bind(token)
    .first<Order>();
  return result ?? null;
}

export async function fulfillOrder(
  db: D1Database,
  sessionId: string,
  data: {
    stripe_payment_id: string;
    download_token: string;
    download_expires: string;
  }
): Promise<void> {
  await db
    .prepare(
      `UPDATE orders
       SET status = 'paid',
           stripe_payment_id = ?,
           download_token = ?,
           download_expires = ?,
           updated_at = datetime('now')
       WHERE stripe_session_id = ?`
    )
    .bind(
      data.stripe_payment_id,
      data.download_token,
      data.download_expires,
      sessionId
    )
    .run();
}

export async function incrementDownloadCount(
  db: D1Database,
  orderId: string
): Promise<void> {
  await db
    .prepare(
      "UPDATE orders SET download_count = download_count + 1, updated_at = datetime('now') WHERE id = ?"
    )
    .bind(orderId)
    .run();
}

export async function logDownload(
  db: D1Database,
  orderId: string,
  ip: string | null,
  userAgent: string | null
): Promise<void> {
  const id = crypto.randomUUID();
  await db
    .prepare(
      "INSERT INTO download_logs (id, order_id, ip_address, user_agent) VALUES (?, ?, ?, ?)"
    )
    .bind(id, orderId, ip, userAgent)
    .run();
}

export async function getAdminStats(db: D1Database) {
  const [revenue, orders, products, downloads] = await Promise.all([
    db
      .prepare(
        "SELECT COALESCE(SUM(amount_paid), 0) as total FROM orders WHERE status = 'paid'"
      )
      .first<{ total: number }>(),
    db
      .prepare("SELECT COUNT(*) as total FROM orders WHERE status = 'paid'")
      .first<{ total: number }>(),
    db
      .prepare("SELECT COUNT(*) as total FROM products WHERE active = 1")
      .first<{ total: number }>(),
    db
      .prepare(
        "SELECT COALESCE(SUM(download_count), 0) as total FROM orders WHERE status = 'paid'"
      )
      .first<{ total: number }>(),
  ]);

  return {
    totalRevenue: revenue?.total ?? 0,
    totalOrders: orders?.total ?? 0,
    totalProducts: products?.total ?? 0,
    totalDownloads: downloads?.total ?? 0,
  };
}
