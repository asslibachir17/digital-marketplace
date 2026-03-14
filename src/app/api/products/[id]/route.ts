// src/app/api/products/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getProductById, parseProduct } from "@/lib/db";

export const runtime = "edge";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = (process.env as unknown as { DB: D1Database }).DB;
    const row = await getProductById(db, params.id);

    if (!row) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ product: parseProduct(row) });
  } catch (error) {
    console.error("Product detail API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}
