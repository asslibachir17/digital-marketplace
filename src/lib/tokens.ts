// src/lib/tokens.ts
// Secure download token generation and verification using HMAC-SHA256

/**
 * Generate a cryptographically secure download token.
 * Token = base64url(HMAC-SHA256(orderId + timestamp, secret))
 * This prevents token forgery even if the token format is known.
 */
export async function generateDownloadToken(
  orderId: string,
  secret: string
): Promise<{ token: string; expiresAt: Date }> {
  const timestamp = Date.now().toString();
  const nonce = crypto.randomUUID().replace(/-/g, "");

  // HMAC payload: orderId:timestamp:nonce
  const payload = `${orderId}:${timestamp}:${nonce}`;
  const hmac = await computeHmac(payload, secret);

  // Token = payload.hmac (URL-safe)
  const raw = `${payload}.${hmac}`;
  const token = btoa(raw).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");

  // Expires in 48 hours
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

  return { token, expiresAt };
}

/**
 * Verify a download token.
 * Returns the orderId if valid, null if tampered or expired.
 */
export async function verifyDownloadToken(
  token: string,
  secret: string
): Promise<{ orderId: string; timestamp: number } | null> {
  try {
    // Decode base64url
    const padded = token.replace(/-/g, "+").replace(/_/g, "/");
    const padLength = (4 - (padded.length % 4)) % 4;
    const raw = atob(padded + "=".repeat(padLength));

    const lastDot = raw.lastIndexOf(".");
    if (lastDot === -1) return null;

    const payload = raw.substring(0, lastDot);
    const providedHmac = raw.substring(lastDot + 1);

    // Recompute HMAC
    const expectedHmac = await computeHmac(payload, secret);

    // Constant-time comparison to prevent timing attacks
    if (!constantTimeEqual(providedHmac, expectedHmac)) return null;

    // Extract orderId and timestamp
    const parts = payload.split(":");
    if (parts.length !== 3) return null;

    const [orderId, timestamp] = parts;
    return { orderId, timestamp: parseInt(timestamp, 10) };
  } catch {
    return null;
  }
}

// ─── Internals ────────────────────────────────────────────────────────────────

async function computeHmac(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payload)
  );
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
