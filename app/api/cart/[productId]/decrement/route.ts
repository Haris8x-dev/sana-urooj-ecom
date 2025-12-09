import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/db";
import User from "@/lib/models/users/user";
import Product from "@/lib/models/products/product";
import { Types } from "mongoose";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth";

export async function PATCH(
  request: Request,
  { params }: { params: { productId: string } }
) {
  try {
    // 1️⃣ Get user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const userId = session.user.id;

    const { productId } = await params;

    await connectToDatabase();

    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Find the cart item
    const item = user.cart.items.find(
      (i: { product: Types.ObjectId; qty: number; totalPrice: number }) =>
        i.product.toString() === productId
    );
    if (!item) return NextResponse.json({ error: "Product not in cart" }, { status: 404 });

    if (item.qty > 1) {
      // Fetch product to get latest price
      const product = await Product.findById(productId);
      if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

      // Decrement quantity
      item.qty -= 1;
      item.totalPrice = item.qty * product.price;

      // Recalculate finalPrice
      user.cart.finalPrice = user.cart.items.reduce((sum: number, x: any) => sum + x.totalPrice, 0);

      await user.save();
      return NextResponse.json({ message: "Quantity decremented", cart: user.cart }, { status: 200 });
    } else {
      return NextResponse.json({ error: "Quantity cannot be less than 1" }, { status: 400 });
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to decrement quantity" }, { status: 500 });
  }
}
