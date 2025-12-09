import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/db";
import User from "@/lib/models/users/user";
import Product from "@/lib/models/products/product";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth";

export async function GET() {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const userId = session.user.id;

    await connectToDatabase();

    // Fetch user
    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const validProducts = [];
    let wishlistChanged = false;

    // Iterate wishlist, fetch full product details
    for (const productId of user.wishlist) {
      const product = await Product.findById(productId);
      if (product) {
        validProducts.push(product);
      } else {
        wishlistChanged = true; // product no longer exists
      }
    }

    // Remove deleted products from user wishlist
    if (wishlistChanged) {
      user.wishlist = validProducts.map(p => p._id);
      await user.save();
    }

    return NextResponse.json({ wishlist: validProducts }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch wishlist" }, { status: 500 });
  }
}
