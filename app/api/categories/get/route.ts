// app/api/categories/get/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/db";
import Category from "@/lib/models/categories/category";

function log(...args: any[]) {
  console.log("[/api/categories/get]", ...args);
}

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    
    // Fetch all categories
    const categories = await Category.find().sort({ createdAt: -1 }); // newest first

    return NextResponse.json({ categories }, { status: 200 });
  } catch (err) {
    log("GET error:", err);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}
