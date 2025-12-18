// lib/models/products/product.ts 
import { Document, Types, Schema, model, models } from "mongoose";

// --- 1. NEW: AddOn Interface ---
export interface iAddOn {
    _id?: Types.ObjectId; 
    detail: string;
    priceAdjustment: number; 
}

// --- 2. Size Interface ---
export interface iProductSize {
  name: string;
  quantity: number;
  addOns: iAddOn[]; 
}

// --- Badge Interfaces ---
interface iSaveRsBadge {
  active: boolean;
  amount: number;
}

interface iBadges {
  saveRs: iSaveRsBadge;
}

// Review interface
export interface iReview {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  rating: number;
  comment?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// --- 3. MODIFIED: Product Interface ---
export interface iProduct extends Document {
  _id: Types.ObjectId;
  title: string;
  description: string;
  images: { url: string; fileId: string }[];
  video?: { url: string; fileId: string } | null; 
  price: number;        // Original/Base Price
  totalPrice: number;   // NEW: Calculated Final Price (Price - Discount)
  category?: Types.ObjectId | null;
  reviews: iReview[];
  badges: iBadges; 
  sizes: iProductSize[]; 
  priority?: number | null;
  cartLimit: number; 
  gender: 'Male' | 'Female';
  createdAt?: Date;
  updatedAt?: Date;
}

// --- 4. AddOn Schema ---
export const AddOnSchema = new Schema<iAddOn>(
    {
        detail: { type: String, required: true, trim: true },
        priceAdjustment: { type: Number, required: true, default: 0, min: 0 },
    },
    { _id: true } 
);

// Review schema
export const ReviewSchema = new Schema<iReview>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, trim: true },
  },
  { timestamps: true, _id: true }
);

// --- 5. Default Sizes ---
const defaultSizes: iProductSize[] = [
    { name: 'XS', quantity: 0, addOns: [] }, 
    { name: 'S', quantity: 0, addOns: [] }, 
    { name: 'M', quantity: 0, addOns: [] }, 
    { name: 'L', quantity:  0, addOns: [] }, 
    { name: 'XL', quantity: 0, addOns: [] }, 
];

// --- 6. Product Size Schema ---
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

// Product schema
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
    // --- NEW FIELD ADDED HERE ---
    totalPrice: { type: Number, required: true, min: 0, default: 0 },
    // ----------------------------
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
    gender: {
        type: String,
        required: true,
        enum: ['Male', 'Female'],
        default: 'Female',
    },
  },
  { timestamps: true }
);

/**
 * PRE-SAVE MIDDLEWARE
 * We use a synchronous function without the 'next' parameter 
 * to avoid the TypeScript overload conflict.
 */
ProductSchema.pre<iProduct>("save", function () {
  // 'this' is correctly typed as iProduct because of the generic <iProduct>
  const product = this;

  if (product.badges?.saveRs?.active) {
    const discount = product.badges.saveRs.amount || 0;
    // Ensure totalPrice is never less than 0
    product.totalPrice = Math.max(0, product.price - discount);
  } else {
    // If no active badge, totalPrice is just the price
    product.totalPrice = product.price;
  }
});


// Export model
const Product = models?.Product || model<iProduct>("Product", ProductSchema);
export default Product;