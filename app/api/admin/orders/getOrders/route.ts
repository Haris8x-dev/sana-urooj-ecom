import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/db";
import Order from "@/lib/models/orders/Order";

export async function GET() {
  await connectToDatabase();

  try {
    const orders = await Order.find().sort({ createdAt: -1 }); // newest first
    return NextResponse.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}
