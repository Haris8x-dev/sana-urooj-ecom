// lib/models/products/productSchema.ts 
import { Document, Types, Schema, model, models } from "mongoose";

// --- Size Interfaces (No Change) ---
export interface iProductSize {
  name: string;
  quantity: number;
}

// --- Badge Interfaces (No Change) ---
interface iSaveRsBadge {
  active: boolean;
  amount: number;
}

interface iBadges {
  saveRs: iSaveRsBadge;
}

// Review interface (No Change)
export interface iReview {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  rating: number;
  comment?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Product interface (Updated)
export interface iProduct extends Document {
  _id: Types.ObjectId;
  title: string;
  description: string;
  images: { url: string; fileId: string }[];
  price: number;
  category?: Types.ObjectId | null;
  reviews: iReview[];
  badges: iBadges; 
  sizes: iProductSize[]; 
  // --- NEW FIELD ---
  priority: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}

// Review schema (No Change)
export const ReviewSchema = new Schema<iReview>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, trim: true },
  },
  { timestamps: true, _id: true }
);

const defaultSizes: iProductSize[] = [
    { name: 'XS', quantity: 0 },
    { name: 'S', quantity: 0 },
    { name: 'M', quantity: 0 },
    { name: 'L', quantity: 0 },
    { name: 'XL', quantity: 0 },
];

// Product schema (Updated)
const ProductSchema = new Schema<iProduct>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    images: {
      type: [
        { url: { type: String, required: true }, fileId: { type: String, required: true } }
      ],
      validate: {
        validator: (val: { url: string; fileId: string }[]) => val.length >= 1 && val.length <= 4,
        message: "You must add between 1 and 4 images",
      },
    },
    price: { type: Number, required: true, min: 0 },
    category: { type: Schema.Types.ObjectId, ref: "Category", default: null },
    reviews: { type: [ReviewSchema], default: [] },
    badges: {
      type: {
        saveRs: {
          type: { 
            active: { type: Boolean, default: false }, 
            amount: { type: Number, default: 0, min: 0 } 
          },
          required: true,
        },
      },
      required: true,
      default: () => ({ 
          saveRs: { active: false, amount: 0 } 
      }),
    },
    sizes: {
        type: [
            {
                name: { type: String, required: true, enum: ['XS', 'S', 'M', 'L', 'XL'] },
                quantity: { type: Number, required: true, default: 0, min: 0 },
            }
        ],
        required: true,
        default: defaultSizes, 
        validate: {
            validator: (v: iProductSize[]) => v.length > 0,
            message: 'Product must have at least one size defined.',
        },
    },
    // --- NEW PRODUCT PRIORITY FIELD ---
    priority: {
      type: Number,
      default: null, // Default to null, allowing us to sort non-prioritized items last
      min: 1,
      max: 999,
      index: true, // For faster query sorting
    },
    // --- END NEW PRODUCT PRIORITY FIELD ---
  },
  { timestamps: true }
);

// Export model
const Product = models?.Product || model<iProduct>("Product", ProductSchema);
export default Product;