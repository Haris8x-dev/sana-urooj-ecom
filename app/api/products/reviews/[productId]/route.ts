import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/db";
import Product from "@/lib/models/products/product";
import { authOptions } from "@/lib/auth/auth"; // NextAuth options
import { getServerSession } from "next-auth/next";
import { Types } from "mongoose";

/* ---------- Helper ---------- */
function log(...args: any[]) {
  console.log("[/api/products/reviews/[productId]]", ...args);
}

/* ---------- POST a review ---------- */
export async function POST(
  req: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const resolvedParams = await params;
    const productId = resolvedParams.productId;
    log("POST review called for productId:", productId);

    if (!productId || !Types.ObjectId.isValid(productId)) {
      return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
    }

    // Fetch user from NextAuth session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    await connectToDatabase();

    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const body = (await req.json().catch(() => ({}))) as any;
    const { rating, comment } = body;

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }

    const newReview = {
      userId: new Types.ObjectId(userId),
      rating,
      comment: comment?.trim() || "",
    };

    product.reviews.push(newReview);
    await product.save();

    // Populate the user's fullName in reviews
    const populatedProduct = await Product.findById(productId).populate({
      path: "reviews.userId",
      model: "User",
      select: "fullName",
    });

    log("Review added successfully");
    return NextResponse.json({ message: "Review added", product: populatedProduct }, { status: 201 });
  } catch (err) {
    log("POST review error:", err);
    return NextResponse.json({ error: "Failed to add review" }, { status: 500 });
  }
}
