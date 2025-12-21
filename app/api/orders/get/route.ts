import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/db";
import Order from "@/lib/models/orders/Order";
import Product from "@/lib/models/products/product";

// GET all orders
export async function GET() {
  try {
    await connectToDatabase();
    const orders = await Order.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, orders }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE / RETURN logic (Reverts stock and removes order)
export async function DELETE(req: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ success: false, message: "ID required" }, { status: 400 });

    // 1. Find the order first to know what items to revert
    const order = await Order.findById(id);
    if (!order) return NextResponse.json({ success: false, message: "Order not found" }, { status: 404 });

    // 2. Revert the quantities back to the products
    for (const item of order.items) {
      await Product.updateOne(
        { _id: item.productId, "sizes.name": item.selectedSize },
        { $inc: { "sizes.$.quantity": Math.abs(item.quantity) } }
      );
    }

    // 3. Delete the order
    await Order.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: "Order processed and stock reverted" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PATCH method to update status (Mark as Shipped)
export async function PATCH(req: Request) {
  try {
    await connectToDatabase();
    const { id, status } = await req.json();
    
    const updatedOrder = await Order.findByIdAndUpdate(id, { orderStatus: status }, { new: true });
    return NextResponse.json({ success: true, order: updatedOrder });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}