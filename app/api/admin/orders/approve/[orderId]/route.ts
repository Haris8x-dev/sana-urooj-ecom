import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/db";
import Order from "@/lib/models/orders/Order";
import User from "@/lib/models/users/user";
import mongoose from "mongoose";

export async function PATCH(req: Request, { params }: { params: { orderId: string } }) {
  await connectToDatabase();

  const { orderId } = await params; // unwrap promise

  if (!mongoose.Types.ObjectId.isValid(orderId)) {
    return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
  }

  try {
    const order = await Order.findById(orderId);
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const user = await User.findById(order.userId); // using userId
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Update order status
    order.status = "approved";

    // Remove from pendingOrders
    user.pendingOrders = (user.pendingOrders || []).filter(
      (id: any) => id.toString() !== orderId
    );

    // Push the entire order object to completedOrders
    user.completedOrders = user.completedOrders || [];
    user.completedOrders.push({
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

    await user.save();

    // Delete order from orders collection
    await order.deleteOne();

    return NextResponse.json({ message: "Order approved and moved to completedOrders" });
  } catch (error) {
    console.error("Error approving order:", error);
    return NextResponse.json({ error: "Failed to approve order" }, { status: 500 });
  }
}
