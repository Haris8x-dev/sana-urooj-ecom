import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/db";
import User from "@/lib/models/users/user";
import Product from "@/lib/models/products/product";
import { Types } from "mongoose";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth";

// POST → add product to cart
export async function POST(
  request: NextRequest, 
  { params }: { params: Promise<{ productId: string }> } // ← params is a Promise
) {
  try {
    // 1️⃣ AWAIT THE PARAMS FIRST
    const { productId } = await params; // ← This is the fix!
    
    // 2️⃣ Get session & userId
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const userId = session.user.id;

    console.log("🔍 Debug - Product ID from params:", productId);
    console.log("🔍 Debug - Product ID type:", typeof productId);

    await connectToDatabase();

    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Check if product already in cart
    const existing = user.cart.items.find(
      (i: { product: Types.ObjectId }) => i.product.toString() === productId
    );

    if (existing) {
      return NextResponse.json({ error: "Product already in cart" }, { status: 400 });
    }

    const product = await Product.findById(productId);
    if (!product) {
      console.log("❌ Product not found with ID:", productId);
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    console.log("✅ Product found:", product.title);

    // Push product with full info to cart
    user.cart.items.push({
      product: product._id,
      name: product.title,
      price: product.price,
      qty: 1,
      totalPrice: product.price,
    });

    // Recalculate final price
    user.cart.finalPrice = user.cart.items.reduce((sum: number, x: any) => sum + x.totalPrice, 0);

    await user.save();
    return NextResponse.json({ message: "Product added to cart", cart: user.cart }, { status: 200 });
  } catch (error) {
    console.error("❌ Add to cart error:", error);
    return NextResponse.json({ error: "Failed to add product" }, { status: 500 });
  }
}


// DELETE → remove product from cart
export async function DELETE(
  request: NextRequest, 
  { params }: { params: Promise<{ productId: string }> } // ← params is a Promise
) {
  try {
    // 1️⃣ AWAIT THE PARAMS FIRST
    const { productId } = await params; // ← This is the fix!
    
    // 2️⃣ Get session & userId
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const userId = session.user.id;

    await connectToDatabase();

    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Remove product
    user.cart.items = user.cart.items.filter(
      (i: { product: Types.ObjectId }) => i.product.toString() !== productId
    );

    // Recalculate final price
    user.cart.finalPrice = user.cart.items.reduce((sum: number, x: any) => sum + x.totalPrice, 0);

    await user.save();
    return NextResponse.json({ message: "Product removed from cart", cart: user.cart }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to remove product" }, { status: 500 });
  }
}