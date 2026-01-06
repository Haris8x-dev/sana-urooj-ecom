import mongoose, { Schema, model, models } from "mongoose";

const OrderSchema = new Schema(
  {
    customer: {
      fullName: { type: String, required: true },
      email: { type: String },
      contactNumber: { type: String, required: true },
      whatsappNumber: { type: String, required: true },
      message: { type: String },
    },
    items: [
      {
        productId: { type: String, required: true },
        title: { type: String, required: true },
        price: { type: Number, required: true }, // Price of a single unit
        quantity: { type: Number, required: true },
        itemTotal: { type: Number, required: true }, // (price * quantity)
        selectedSize: { type: String, required: true },
        image: { type: String },
      },
    ],
    totalAmount: { type: Number, required: true }, // Final price of all items combined
    paymentMethod: { type: String, default: "Cash on Delivery" },
    orderStatus: { 
      type: String, 
      enum: ["pending", "packed", "shipped", "delivered", "cancelled"], 
      default: "pending" 
    },
  },
  { timestamps: true }
);

const Order = models.Order || model("Order", OrderSchema);
export default Order;