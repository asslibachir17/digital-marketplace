# ⚡ VAULT — Digital Products Marketplace

A full-stack digital products marketplace built on **Next.js 14 + Cloudflare Pages + D1 + R2 + Stripe**.

---

## Architecture Overview

```
Browser → Cloudflare Pages (Next.js Edge)
                 │
    ┌────────────┼──────────────┐
    ▼            ▼              ▼
Cloudflare D1  R2 Bucket   Stripe API
(product meta) (files)     (payments)
```

## Security Model — Download Flow

```
1. Customer pays → Stripe Checkout
2. Stripe fires webhook → /api/webhooks/stripe
3. Worker verifies Stripe signature (HMAC)
4. Worker generates download token (HMAC-SHA256 signed)
5. Token + expiry saved to D1 order record
6. Download link emailed to customer
7. Customer clicks link → /api/download/[token]
8. Worker validates token (signature + expiry + count)
9. Worker generates R2 presigned URL (30-min TTL)
10. Browser redirects to R2 → file downloads
```

**R2 bucket is fully private.** Files are never publicly accessible.
All downloads route through the edge worker for audit logging.

---

## Quick Start

### 1. Prerequisites

```bash
node -v          # >= 18
npx wrangler -v  # >= 3.x
```

### 2. Clone & install

```bash
git clone <repo> digital-marketplace
cd digital-marketplace
npm install
```

### 3. Create Cloudflare resources

```bash
# Create D1 database
npx wrangler d1 create marketplace-db
# → Copy the database_id into wrangler.toml

# Create R2 bucket
npx wrangler r2 bucket create marketplace-files

# Run migrations
npx wrangler d1 migrations apply marketplace-db

# Seed sample data (optional)
npx wrangler d1 execute marketplace-db --file=./migrations/0002_seed.sql
```

### 4. Set secrets

```bash
npx wrangler secret put STRIPE_SECRET_KEY
npx wrangler secret put STRIPE_WEBHOOK_SECRET
npx wrangler secret put R2_ACCESS_KEY_ID
npx wrangler secret put R2_SECRET_ACCESS_KEY
npx wrangler secret put R2_ACCOUNT_ID
npx wrangler secret put R2_BUCKET_NAME
npx wrangler secret put DOWNLOAD_TOKEN_SECRET
npx wrangler secret put ADMIN_SECRET_KEY
npx wrangler secret put RESEND_API_KEY   # or EMAIL_* vars
```

### 5. Local development

```bash
cp .env.local.example .env.local
# Fill in your .env.local values
npm run dev
```

### 6. Set up Stripe webhook

```bash
# Install Stripe CLI
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# Copy the webhook signing secret → STRIPE_WEBHOOK_SECRET
```

### 7. Deploy

```bash
npm run deploy
# Sets up: next build + wrangler pages deploy
```

---

## Project Structure

```
digital-marketplace/
├── migrations/
│   ├── 0001_schema.sql          # D1 schema (products, orders, logs)
│   └── 0002_seed.sql            # Sample data
├── src/
│   ├── app/
│   │   ├── page.tsx             # Home: hero + categories + featured
│   │   ├── products/
│   │   │   ├── page.tsx         # Gallery with filters + search
│   │   │   └── [id]/page.tsx    # Product detail + buy button
│   │   ├── success/page.tsx     # Post-payment download page
│   │   ├── admin/page.tsx       # Admin dashboard + upload form
│   │   └── api/
│   │       ├── products/        # GET /api/products + /api/products/[id]
│   │       ├── checkout/        # POST (create session) + GET status
│   │       ├── webhooks/stripe/ # POST — payment fulfillment
│   │       ├── download/
│   │       │   ├── [token]/     # GET — secure file delivery ⭐
│   │       │   └── validate/    # GET — token check (no counter)
│   │       └── admin/
│   │           ├── upload/      # POST — R2 upload + D1 insert
│   │           └── stats/       # GET — dashboard metrics
│   ├── components/
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   └── ProductCard.tsx
│   └── lib/
│       ├── db.ts                # D1 typed queries
│       ├── r2.ts                # R2 + presigned URL generation ⭐
│       ├── stripe.ts            # Stripe session + webhook helpers
│       ├── tokens.ts            # HMAC-SHA256 token generation ⭐
│       ├── email.ts             # Resend/SMTP email delivery
│       └── types.ts             # TypeScript interfaces
├── wrangler.toml                # Cloudflare config
├── tailwind.config.js           # Custom dark theme tokens
└── next.config.js
```

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `src/lib/r2.ts` | R2 client, presigned upload/download URL generation |
| `src/lib/tokens.ts` | HMAC-SHA256 download token, forge-proof |
| `src/app/api/webhooks/stripe/route.ts` | Full payment fulfillment pipeline |
| `src/app/api/download/[token]/route.ts` | 6-layer secure download endpoint |
| `migrations/0001_schema.sql` | D1 schema: products, orders, download_logs |

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/products` | List products (filter: category, featured, search) |
| `GET` | `/api/products/[id]` | Get product by ID |
| `POST` | `/api/checkout` | Create Stripe Checkout session |
| `GET` | `/api/checkout/status` | Poll order fulfillment status |
| `POST` | `/api/webhooks/stripe` | Stripe webhook receiver |
| `GET` | `/api/download/[token]` | Secure file delivery (redirects to R2) |
| `GET` | `/api/download/validate` | Validate token without downloading |
| `POST` | `/api/admin/upload` | Upload product (auth required) |
| `GET` | `/api/admin/stats` | Dashboard metrics (auth required) |

---

## R2 Download Security Details

```typescript
// src/app/api/download/[token]/route.ts

// Layer 1: Verify HMAC token (prevents forgery)
const verified = await verifyDownloadToken(token, secret);

// Layer 2: Load order from D1
const order = await getOrderByToken(db, token);

// Layer 3: Check order.status === 'paid'
// Layer 4: Check download_expires < now
// Layer 5: Check download_count < max_downloads (3)
// Layer 6: Check product exists

// Generate short-lived R2 URL (30 min)
const { url } = await getPresignedDownloadUrl(r2Client, bucket, fileKey, fileName, 1800);

// Log download for audit
await logDownload(db, order.id, ip, userAgent);

// Redirect to R2 (no file proxying = no bandwidth cost)
return NextResponse.redirect(signedUrl, { status: 302 });
```

---

## Environment Variables

See `.env.local.example` for all required variables.

## License

MIT — see LICENSE.
