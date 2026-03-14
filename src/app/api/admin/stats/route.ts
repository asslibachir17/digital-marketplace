// src/app/api/admin/stats/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAdminStats, getAllProducts, parseProduct } from "@/lib/db";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const env = process.env as unknown as {
    DB: D1Database;
    ADMIN_SECRET_KEY: string;
  };

  if (authHeader !== `Bearer ${env.ADMIN_SECRET_KEY}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [stats, productRows] = await Promise.all([
      getAdminStats(env.DB),
      getAllProducts(env.DB, { limit: 50 }),
    ]);

    const products = productRows.map(parseProduct);

    return NextResponse.json({ stats, products });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json({ error: "Failed to load stats" }, { status: 500 });
  }
}
