import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/db";
import User from "@/lib/models/users/user";
import Stripe from "stripe";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-10-29",
});

export async function POST(request: NextRequest) {
  try {
    // 1️⃣ Get user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const userId = session.user.id;

    await connectToDatabase();

    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (!user.cart.items.length)
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });

    // Map cart items
    const orderItems = user.cart.items.map((item: any) => ({
      product: item.product,
      name: item.name,
      price: item.price,
      qty: item.qty,
      totalPrice: item.totalPrice,
    }));

    const finalPrice = user.cart.finalPrice;

    // Create Stripe PaymentIntent only
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(finalPrice * 100), // in cents
      currency: "usd",
      payment_method_types: ["card"],
      metadata: {
        userId: user._id.toString(),
        cart: JSON.stringify(orderItems),
      },
    });

    return NextResponse.json(
      {
        message: "Checkout initiated",
        clientSecret: paymentIntent.client_secret,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
