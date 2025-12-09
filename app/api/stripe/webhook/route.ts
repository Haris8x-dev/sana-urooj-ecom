import { NextResponse } from "next/server";
import Stripe from "stripe";
import { connectToDatabase } from "@/lib/db/db";
import User from "@/lib/models/users/user";
import Order from "@/lib/models/orders/order";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  await connectToDatabase();

  const buf = await req.arrayBuffer();
  const rawBody = Buffer.from(buf);
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Webhook verification failed" }, { status: 400 });
  }

  switch (event.type) {
    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const userId = paymentIntent.metadata.userId;
      const cartItems = JSON.parse(paymentIntent.metadata.cart || "[]");

      try {
        const user = await User.findById(userId);
        if (!user) throw new Error("User not found");

        const finalPrice = cartItems.reduce(
          (sum: number, item: any) => sum + item.totalPrice,
          0
        );

        // 1️⃣ Create order in "orders" collection
        const order = await Order.create({
          userId: user._id,
          userFullName: user.fullName,
          userEmail: user.email,
          items: cartItems.map((item: any) => ({
            product: item.product,
            name: item.name,
            price: item.price,
            qty: item.qty,
            totalPrice: item.totalPrice,
          })),
          finalPrice,
          paymentInfo: {
            stripePaymentId: paymentIntent.id,
            status: "paid",
            method: "stripe",
          },
          status: "pending",
        });

        // 2️⃣ Push full order object to user.pendingOrders
        user.pendingOrders = user.pendingOrders || [];
        user.pendingOrders.push({
          _id: order._id,
          items: order.items,
          finalPrice: order.finalPrice,
          paymentInfo: order.paymentInfo,
          status: order.status,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          userId: order.userId,
          userFullName: order.userFullName,
          userEmail: order.userEmail,
        });

        // 3️⃣ Clear user's cart
        user.cart = { items: [], finalPrice: 0 };

        await user.save();

        console.log("Order created and pushed to user.pendingOrders:", order._id);
      } catch (error) {
        console.error("Error processing payment_intent.succeeded:", error);
        return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
      }

      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
