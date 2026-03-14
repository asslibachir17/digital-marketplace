// src/app/api/admin/upload/route.ts
//
// Admin-only endpoint for uploading new digital products.
// Accepts multipart/form-data with product metadata + file.
// Uploads file to R2, stores metadata in D1.

import { NextRequest, NextResponse } from "next/server";
import { createProduct } from "@/lib/db";
import { createR2Client, uploadFileToR2, buildProductKey } from "@/lib/r2";
import { z } from "zod";

export const runtime = "edge";

// Max file size: 500MB
const MAX_FILE_SIZE = 500 * 1024 * 1024;

const ProductMetaSchema = z.object({
  name: z.string().min(2).max(120),
  slug: z
    .string()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9-]+$/),
  description: z.string().min(10).max(5000),
  short_desc: z.string().min(10).max(300),
  price: z.coerce.number().int().min(100).max(100000), // cents
  category: z.string().min(2),
  tags: z.string().transform((s) => {
    try {
      return JSON.parse(s);
    } catch {
      return s.split(",").map((t) => t.trim());
    }
  }),
  featured: z.coerce.boolean().default(false),
});

export async function POST(request: NextRequest) {
  // ── Auth: simple bearer token check ───────────────────────────────────────
  const authHeader = request.headers.get("authorization");
  const env = process.env as unknown as {
    DB: D1Database;
    R2_ACCOUNT_ID: string;
    R2_ACCESS_KEY_ID: string;
    R2_SECRET_ACCESS_KEY: string;
    R2_BUCKET_NAME: string;
    ADMIN_SECRET_KEY: string;
  };

  if (authHeader !== `Bearer ${env.ADMIN_SECRET_KEY}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Parse multipart form data ──────────────────────────────────────────────
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid multipart form data" },
      { status: 400 }
    );
  }

  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
      { status: 413 }
    );
  }

  // ── Validate metadata ─────────────────────────────────────────────────────
  const rawMeta: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (key !== "file" && key !== "cover") rawMeta[key] = String(value);
  }

  const parsed = ProductMetaSchema.safeParse(rawMeta);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid metadata", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const meta = parsed.data;
  const productId = crypto.randomUUID();

  // ── Upload product file to R2 ─────────────────────────────────────────────
  const r2Client = createR2Client({
    R2_ACCOUNT_ID: env.R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID: env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: env.R2_SECRET_ACCESS_KEY,
  });

  const fileKey = buildProductKey(productId, file.name);
  const fileBuffer = await file.arrayBuffer();

  let coverUrl: string | undefined;

  try {
    await uploadFileToR2(
      r2Client,
      env.R2_BUCKET_NAME,
      fileKey,
      new Uint8Array(fileBuffer),
      file.type || "application/octet-stream",
      {
        "product-id": productId,
        "original-name": file.name,
        "uploaded-by": "admin",
      }
    );

    // Optional cover image upload
    const coverFile = formData.get("cover") as File | null;
    if (coverFile && coverFile.size > 0) {
      const ext = coverFile.name.split(".").pop() ?? "jpg";
      const coverKey = `covers/${productId}/cover.${ext}`;
      const coverBuffer = await coverFile.arrayBuffer();

      await uploadFileToR2(
        r2Client,
        env.R2_BUCKET_NAME,
        coverKey,
        new Uint8Array(coverBuffer),
        coverFile.type || "image/jpeg"
      );
      // R2 public URL (requires public bucket or custom domain)
      coverUrl = `/api/covers/${coverKey}`;
    }
  } catch (error) {
    console.error("R2 upload error:", error);
    return NextResponse.json(
      { error: "File upload failed" },
      { status: 500 }
    );
  }

  // ── Create product record in D1 ───────────────────────────────────────────
  try {
    const id = await createProduct(env.DB, {
      ...meta,
      file_key: fileKey,
      file_name: file.name,
      file_size: file.size,
      cover_url: coverUrl,
    });

    return NextResponse.json(
      {
        success: true,
        productId: id,
        fileKey,
        message: `Product "${meta.name}" created successfully.`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("D1 insert error:", error);
    return NextResponse.json(
      { error: "Failed to save product metadata" },
      { status: 500 }
    );
  }
}
