// getCart API route - FIXED VERSION with TypeScript
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/db";
import User from "@/lib/models/users/user";
import Product from "@/lib/models/products/product";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth";
import { Types } from "mongoose";

// Define types for cart items
interface CartItem {
  product: string | Types.ObjectId;
  name: string;
  price: number;
  qty: number;
  totalPrice: number;
  _id?: Types.ObjectId;
}

interface ProductType {
  _id: Types.ObjectId;
  title: string;
  name?: string;
  description: string;
  price: number;
  images: Array<{ url: string; fileId?: string; _id?: Types.ObjectId }>;
  reviews: Array<{
    userId: Types.ObjectId;
    rating: number;
    comment: string;
    _id?: Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
  }>;
}

interface CartResponseItem {
  product: string;
  name: string;
  title: string;
  description: string;
  price: number;
  qty: number;
  totalPrice: number;
  images: Array<{ url: string; fileId?: string; _id?: Types.ObjectId }>;
  rating: number;
  reviewCount: number;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    await connectToDatabase();

    const user = await User.findById(session.user.id);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (!user.cart.items.length) {
      return NextResponse.json({ cart: [], finalPrice: 0 }, { status: 200 });
    }

    // Fetch products individually to avoid $in issues
    const cartItems: (CartResponseItem | null)[] = await Promise.all(
      user.cart.items.map(async (item: CartItem) => {
        try {
          const product = await Product.findById(item.product) as ProductType | null;
          
          if (!product) {
            console.warn("Product not found:", item.product);
            return null;
          }

          // Calculate average rating
          const avgRating = product.reviews && product.reviews.length > 0 
            ? product.reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / product.reviews.length
            : 0;

          return {
            product: item.product.toString(),
            name: product.name || item.name,
            title: product.title,
            description: product.description,
            price: product.price,
            qty: item.qty,
            totalPrice: item.totalPrice,
            images: product.images || [],
            rating: Number(avgRating.toFixed(1)),
            reviewCount: product.reviews?.length || 0
          };
        } catch (error) {
          console.error("Error fetching product:", item.product, error);
          return null;
        }
      })
    );

    const validItems = cartItems.filter((item): item is CartResponseItem => item !== null);

    return NextResponse.json(
      {
        cart: validItems,
        finalPrice: user.cart.finalPrice,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get cart error:", error);
    return NextResponse.json({ error: "Failed to fetch cart" }, { status: 500 });
  }
}