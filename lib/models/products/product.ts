import { Document, Types, Schema, model, models } from "mongoose";

// Review interface
export interface iReview {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  rating: number;
  comment?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Product interface
export interface iProduct extends Document {
  _id: Types.ObjectId;
  title: string;
  description: string;
  images: { url: string; fileId: string }[];
  price: number;
  quantity: number;
  category?: Types.ObjectId | null;
  reviews: iReview[];
  createdAt?: Date;
  updatedAt?: Date;
}

// Review schema
export const ReviewSchema = new Schema<iReview>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, trim: true },
  },
  { timestamps: true, _id: true }
);

// Product schema
const ProductSchema = new Schema<iProduct>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    images: {
      type: [
        {
          url: { type: String, required: true },
          fileId: { type: String, required: true },
        }
      ],
      validate: {
        validator: (val: { url: string; fileId: string }[]) =>
          val.length >= 1 && val.length <= 4,
        message: "You must add between 1 and 4 images",
      },
    },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 0 },
    category: { type: Schema.Types.ObjectId, ref: "Category", default: null },
    reviews: { type: [ReviewSchema], default: [] },
  },
  { timestamps: true }
);

// Export model
const Product = models?.Product || model<iProduct>("Product", ProductSchema);
export default Product;
