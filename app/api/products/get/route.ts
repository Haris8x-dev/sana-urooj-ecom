import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/db";
import Product from "@/lib/models/products/product";

export async function GET() {
  try {
    await connectToDatabase();

    // newest first + populate reviews.userId with fullName and profileImage
    const products = await Product.find()
      .sort({ createdAt: -1 })
      .populate({
        path: "reviews.userId",
        model: "User",
        select: "fullName profileImage",
      });

    return NextResponse.json({ products }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
