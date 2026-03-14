// src/lib/r2.ts
// Cloudflare R2 storage client using S3-compatible API for presigned URLs

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// ─── Client factory ───────────────────────────────────────────────────────────

export function createR2Client(env: {
  R2_ACCOUNT_ID: string;
  R2_ACCESS_KEY_ID: string;
  R2_SECRET_ACCESS_KEY: string;
}): S3Client {
  return new S3Client({
    region: "auto",
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
  });
}

// ─── Upload ───────────────────────────────────────────────────────────────────

/**
 * Upload a file to R2. Used in the admin upload flow.
 * For large files, consider multipart upload instead.
 */
export async function uploadFileToR2(
  client: S3Client,
  bucket: string,
  key: string,
  body: Buffer | Uint8Array | ReadableStream,
  contentType: string,
  metadata?: Record<string, string>
): Promise<{ key: string; etag: string }> {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
    Metadata: metadata,
    // Block public access — files are only accessible via signed URLs
    ServerSideEncryption: "AES256",
  });

  const response = await client.send(command);
  return { key, etag: response.ETag ?? "" };
}

/**
 * Generate a presigned upload URL for direct client → R2 uploads.
 * Used to upload large files directly from the admin browser.
 */
export async function getPresignedUploadUrl(
  client: S3Client,
  bucket: string,
  key: string,
  contentType: string,
  expiresInSeconds = 3600 // 1 hour
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}

// ─── Download — Signed URL (Core security feature) ────────────────────────────

/**
 * Generate a time-limited presigned download URL for a purchased file.
 *
 * SECURITY MODEL:
 * - URL is tied to a specific object key in R2
 * - URL expires after `expiresInSeconds` (default: 30 minutes)
 * - URL is valid for exactly 1 object (principle of least privilege)
 * - The R2 bucket itself is private — no public access
 * - The URL contains an HMAC signature; it cannot be extended or modified
 *
 * @param client  - Authenticated S3Client configured for R2
 * @param bucket  - R2 bucket name
 * @param key     - Object key (e.g., "products/my-ebook.pdf")
 * @param fileName - Suggested download filename for Content-Disposition
 * @param expiresInSeconds - URL TTL (default: 1800 = 30 min)
 */
export async function getPresignedDownloadUrl(
  client: S3Client,
  bucket: string,
  key: string,
  fileName: string,
  expiresInSeconds = 1800
): Promise<{ url: string; expiresAt: Date }> {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
    ResponseContentDisposition: `attachment; filename="${encodeURIComponent(fileName)}"`,
    ResponseCacheControl: "no-store, no-cache, must-revalidate",
  });

  const url = await getSignedUrl(client, command, {
    expiresIn: expiresInSeconds,
  });

  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
  return { url, expiresAt };
}

// ─── Object metadata ─────────────────────────────────────────────────────────

export async function getObjectMetadata(
  client: S3Client,
  bucket: string,
  key: string
): Promise<{ size: number; contentType: string; lastModified: Date } | null> {
  try {
    const command = new HeadObjectCommand({ Bucket: bucket, Key: key });
    const response = await client.send(command);
    return {
      size: response.ContentLength ?? 0,
      contentType: response.ContentType ?? "application/octet-stream",
      lastModified: response.LastModified ?? new Date(),
    };
  } catch {
    return null;
  }
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteObject(
  client: S3Client,
  bucket: string,
  key: string
): Promise<void> {
  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

// ─── Key helpers ──────────────────────────────────────────────────────────────

/**
 * Generate a safe R2 object key from product info.
 * Pattern: products/{productId}/{sanitized-filename}
 */
export function buildProductKey(productId: string, fileName: string): string {
  const sanitized = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `products/${productId}/${sanitized}`;
}

/**
 * Generate a cover image key.
 * Pattern: covers/{productId}/cover.{ext}
 */
export function buildCoverKey(productId: string, ext: string): string {
  return `covers/${productId}/cover.${ext}`;
}
