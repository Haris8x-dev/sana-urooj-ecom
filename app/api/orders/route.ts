import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/db";
import Order from "@/lib/models/orders/Order";
import Product from "@/lib/models/products/product"; // Ensure you have a Product model

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();

    // 1. Create the order in MongoDB (Default status should be 'pending')
    const newOrder = await Order.create({
      ...body,
      orderStatus: "pending"
    });

    // 2. Deduct quantity from the specific product size
    // We use the positional operator "$" to find the correct size in the array
    for (const item of body.items) {
      await Product.updateOne(
        { 
          _id: item.productId, 
          "sizes.name": item.selectedSize 
        },
        { 
          $inc: { "sizes.$.quantity": -Math.abs(item.quantity) } 
        }
      );
    }

    return NextResponse.json({ success: true, order: newOrder }, { status: 201 });
  } catch (error: any) {
    console.error("Order Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}