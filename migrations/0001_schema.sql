-- Migration: 0001_schema.sql
-- Digital Marketplace Database Schema

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  short_desc  TEXT NOT NULL,
  price       INTEGER NOT NULL,         -- price in cents
  category    TEXT NOT NULL,
  tags        TEXT DEFAULT '[]',        -- JSON array
  file_key    TEXT NOT NULL,            -- R2 object key
  file_name   TEXT NOT NULL,            -- original filename
  file_size   INTEGER DEFAULT 0,        -- bytes
  cover_url   TEXT,                     -- public cover image URL
  preview_url TEXT,                     -- optional preview file
  featured    INTEGER DEFAULT 0,        -- boolean
  active      INTEGER DEFAULT 1,        -- boolean
  downloads   INTEGER DEFAULT 0,
  created_at  TEXT DEFAULT (datetime('now')),
  updated_at  TEXT DEFAULT (datetime('now'))
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id                TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  stripe_session_id TEXT NOT NULL UNIQUE,
  stripe_payment_id TEXT,
  product_id        TEXT NOT NULL,
  customer_email    TEXT NOT NULL,
  customer_name     TEXT,
  amount_paid       INTEGER NOT NULL,   -- in cents
  currency          TEXT DEFAULT 'usd',
  status            TEXT DEFAULT 'pending', -- pending | paid | failed | refunded
  download_token    TEXT UNIQUE,
  download_expires  TEXT,
  download_count    INTEGER DEFAULT 0,
  max_downloads     INTEGER DEFAULT 3,
  metadata          TEXT DEFAULT '{}',  -- JSON
  created_at        TEXT DEFAULT (datetime('now')),
  updated_at        TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Download log table
CREATE TABLE IF NOT EXISTS download_logs (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  order_id    TEXT NOT NULL,
  ip_address  TEXT,
  user_agent  TEXT,
  downloaded_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_products_slug     ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured);
CREATE INDEX IF NOT EXISTS idx_orders_session    ON orders(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_orders_token      ON orders(download_token);
CREATE INDEX IF NOT EXISTS idx_orders_email      ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_product    ON orders(product_id);
