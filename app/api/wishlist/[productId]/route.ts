import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/db";
import User from "@/lib/models/users/user";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth";

// POST → add product to wishlist
export async function POST(req: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const userId = session.user.id;

    const { productId } = await req.json();
    if (!productId) return NextResponse.json({ error: "Product ID is required" }, { status: 400 });

    await connectToDatabase();
    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (user.wishlist.includes(productId as any)) {
      return NextResponse.json({ message: "Product already in wishlist" }, { status: 200 });
    }

    user.wishlist.push(productId as any);
    await user.save();

    return NextResponse.json({ message: "Product added to wishlist", wishlist: user.wishlist }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to add to wishlist" }, { status: 500 });
  }
}

// DELETE → remove product from wishlist
export async function DELETE(req: NextRequest) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const userId = session.user.id;

    const { productId } = await req.json();
    if (!productId) return NextResponse.json({ error: "Product ID is required" }, { status: 400 });

    await connectToDatabase();
    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    user.wishlist = user.wishlist.filter((id: any) => id.toString() !== productId);
    await user.save();

    return NextResponse.json({ message: "Product removed from wishlist", wishlist: user.wishlist }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to remove from wishlist" }, { status: 500 });
  }
}
