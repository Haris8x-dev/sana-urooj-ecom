import mongoose, { Schema, model } from "mongoose";

export interface iOrder {
  userId: mongoose.Types.ObjectId;
  userFullName: string;
  userEmail: string;
  items: {
    product: mongoose.Types.ObjectId;
    name: string;
    qty: number;
    price: number;
    totalPrice: number;
  }[];
  finalPrice: number;
  paymentInfo: {
    stripePaymentId: string;
    status: "paid" | "failed";
    method: "stripe";
  };
  status: "pending" | "completed";
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<iOrder>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    userFullName: { type: String, required: true },
    userEmail: { type: String, required: true },
    items: [
      {
        product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
        name: { type: String, required: true },
        qty: { type: Number, required: true },
        price: { type: Number, required: true },
        totalPrice: { type: Number, required: true },
      },
    ],
    finalPrice: { type: Number, required: true },
    paymentInfo: {
      stripePaymentId: { type: String, required: true },
      status: { type: String, enum: ["paid", "failed"], required: true },
      method: { type: String, enum: ["stripe"], default: "stripe" },
    },
    status: { type: String, enum: ["pending", "completed"], default: "pending" },
  },
  { timestamps: true }
);

const Order = mongoose.models?.Order || model<iOrder>("Order", orderSchema);
export default Order;
