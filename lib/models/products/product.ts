// lib/models/products/product.ts 
import { Document, Types, Schema, model, models } from "mongoose";

// --- 1. NEW: AddOn Interface ---
export interface iAddOn {
    _id?: Types.ObjectId; // MongoDB will generate this
    detail: string;
    priceAdjustment: number; // e.g., 10 for a $10 increase, or 0
}

// --- 2. MODIFIED: Size Interface (now includes addOns) ---
export interface iProductSize {
  name: string;
  quantity: number;
  addOns: iAddOn[]; // <-- NEW FIELD
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

// --- 3. MODIFIED: Product Interface (ADDED: gender field) ---
export interface iProduct extends Document {
  _id: Types.ObjectId;
  title: string;
  description: string;
  images: { url: string; fileId: string }[];
  video?: { url: string; fileId: string } | null; 
  price: number;
  category?: Types.ObjectId | null;
  reviews: iReview[];
  badges?: iBadges; 
  sizes: iProductSize[]; 
  priority?: number | null;
  cartLimit: number; // FIXED: Was 'increment'
  // --- NEW FIELD ---
  gender: 'Male' | 'Female'; // <-- ADDED GENDER FIELD
  // -----------------
  createdAt?: Date;
  updatedAt?: Date;
}

// --- 4. NEW: AddOn Schema (No Change) ---
export const AddOnSchema = new Schema<iAddOn>(
    {
        detail: { type: String, required: true, trim: true },
        priceAdjustment: { type: Number, required: true, default: 0, min: 0 },
    },
    { _id: true } 
);

// Review schema (No Change)
export const ReviewSchema = new Schema<iReview>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, trim: true },
  },
  { timestamps: true, _id: true }
);

// --- 5. MODIFIED: Default Sizes (No Change) ---
const defaultSizes: iProductSize[] = [
    { name: 'XS', quantity: 0, addOns: [] }, 
    { name: 'S', quantity: 0, addOns: [] }, 
    { name: 'M', quantity: 0, addOns: [] }, 
    { name: 'L', quantity:  0, addOns: [] }, 
    { name: 'XL', quantity: 0, addOns: [] }, 
];

// --- 6. MODIFIED: Product Size Schema (No Change) ---
export const ProductSizeSchema = new Schema(
    {
        name: { type: String, required: true, enum: ['XS', 'S', 'M', 'L', 'XL'] },
        quantity: { type: Number, required: true, default: 0, min: 0 }, 
        addOns: { 
            type: [AddOnSchema],
            default: [],
        }
    }
);

// Product schema (Updated with gender field)
const ProductSchema = new Schema<iProduct>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    images: {
      type: [
        { url: { type: String, required: true }, fileId: { type: String, required: true } }
      ],
      validate: {
        validator: (val: { url: string; fileId: string }[]) => val.length >= 1 && val.length <= 12,
        message: "You must add between 1 and 12 images",
      },
    },
    video: {
        type: { url: { type: String, required: true }, fileId: { type: String, required: true } },
        default: null, 
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
    // --- Use the defined ProductSizeSchema ---
    sizes: {
        type: [ProductSizeSchema], 
        required: true,
        default: defaultSizes, 
        validate: {
            validator: (v: iProductSize[]) => v.length > 0,
            message: 'Product must have at least one size defined.',
        },
    },
    priority: {
      type: Number,
      default: null,
      min: 1,
      max: 999,
      index: true,
    },
    cartLimit: { 
      type: Number,
      default: 10, 
      min: 1,
      required: true,
    },
    // --- NEW FIELD ADDED HERE ---
    gender: {
        type: String,
        required: true,
        enum: ['Male', 'Female'], // Enforce only these two values
        default: 'Female', // Default value is Female
    },
    // ------------------------------------
  },
  { timestamps: true }
);

// Export model
const Product = models?.Product || model<iProduct>("Product", ProductSchema);
export default Product;