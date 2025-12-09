import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/db";
import Product from "@/lib/models/products/product";
import { authOptions } from "@/lib/auth/auth";
import { getServerSession } from "next-auth/next";
import { Types } from "mongoose";

function log(...args: any[]) {
  console.log("[/api/reviews/delete/[reviewId]]", ...args);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { reviewId: string } }
) {
  try {
    await connectToDatabase();

    const resolvedParams = await params;
    const reviewId = resolvedParams.reviewId;
    log("DELETE review called for reviewId:", reviewId);

    if (!reviewId || !Types.ObjectId.isValid(reviewId)) {
      return NextResponse.json({ error: "Invalid review id" }, { status: 400 });
    }

    // Fetch user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;
    const isAdmin = (session.user as any).isAdmin || false; // set in session if applicable

    // Find the product containing this review
    const product = await Product.findOne({ "reviews._id": reviewId });
    if (!product) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // Find the review
    const review = product.reviews.id(reviewId);
    if (!review) {
      return NextResponse.json({ error: "Review not found in product" }, { status: 404 });
    }

    // Check permission: either admin or the owner
    if (!isAdmin && review.userId.toString() !== userId) {
      return NextResponse.json({ error: "Not authorized to delete this review" }, { status: 403 });
    }

    // Remove the review
    product.reviews.pull({ _id: reviewId });
    await product.save();

    log("Review deleted successfully");
    return NextResponse.json({ message: "Review deleted", product }, { status: 200 });

  } catch (err) {
    log("DELETE review error:", err);
    return NextResponse.json({ error: "Failed to delete review" }, { status: 500 });
  }
}
