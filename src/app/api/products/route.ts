// src/app/api/products/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAllProducts, parseProduct } from "@/lib/db";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") ?? undefined;
    const featured = searchParams.get("featured");
    const search = searchParams.get("search") ?? undefined;
    const limit = parseInt(searchParams.get("limit") ?? "20");
    const offset = parseInt(searchParams.get("offset") ?? "0");

    // Access D1 via Cloudflare bindings
    const db = (process.env as unknown as { DB: D1Database }).DB;

    const rows = await getAllProducts(db, {
      category,
      featured: featured === "true" ? true : featured === "false" ? false : undefined,
      search,
      limit: Math.min(limit, 100),
      offset,
    });

    const products = rows.map(parseProduct);

    return NextResponse.json({
      products,
      total: products.length,
      hasMore: products.length === limit,
    });
  } catch (error) {
    console.error("Products API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
