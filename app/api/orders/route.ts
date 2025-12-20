import { NextResponse } from "next/server";
import {connectToDatabase} from "@/lib/db/db"; // Ensure you have your DB connection util
import Order from "@/lib/models/orders/Order";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();

    // Create the order in MongoDB
    const newOrder = await Order.create(body);

    return NextResponse.json({ success: true, order: newOrder }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}