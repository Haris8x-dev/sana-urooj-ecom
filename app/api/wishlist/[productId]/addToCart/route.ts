import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/db";
import User from "@/lib/models/users/user";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth";

export async function POST(req: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const userId = session.user.id;

    // Get productId from request body
    const { productId } = await req.json();
    if (!productId) return NextResponse.json({ error: "Product ID is required" }, { status: 400 });

    await connectToDatabase();
    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const alreadyInCart = user.cart.items.some(
      (item: any) => item.product.toString() === productId
    );
    if (alreadyInCart) return NextResponse.json({ message: "Product already in cart" }, { status: 200 });

    // Add product to cart
    user.cart.items.push({
      product: productId as any,
      name: "",      // optionally fill in product info if needed
      price: 0,      // optionally fill in product info if needed
      qty: 1,
      totalPrice: 0, // will update when fetching product info
    });

    // Remove product from wishlist
    user.wishlist = user.wishlist.filter((item: any) => item.toString() !== productId);

    // Recalculate finalPrice (optional, in case you want it accurate)
    user.cart.finalPrice = user.cart.items.reduce(
      (sum: number, x: any) => sum + (x.totalPrice || 0),
      0
    );

    await user.save();

    return NextResponse.json({ message: "Product moved from wishlist to cart", cart: user.cart }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to add product to cart" }, { status: 500 });
  }
}
