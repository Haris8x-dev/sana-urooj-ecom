// lib/models/categories/category.ts (or wherever your category schema is located)
import { Schema, model, models } from "mongoose";

const CategorySchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
    },
    images: {
      type: [
        {
          url: { type: String, required: true },
          fileId: { type: String, required: true },
        },
      ],
      validate: {
        validator: (val: { url: string; fileId: string }[]) =>
          val.length >= 1 && val.length <= 4,
        message: "Category must have at least 1 image and max 4 images",
      },
      required: true,
    },
    // --- NEW FIELD FOR PRIORITY SORTING ---
    priority: {
      // Using Number is best for sorting (1, 2, 3...)
      type: Number,
      // Defaulting to null or 999 ensures categories without a set priority appear last or in default order
      default: null, 
      // Ensure the priority is a positive integer or null
      min: 1, 
      max: 999, // Setting a reasonable max limit
      // Optional: Add an index for faster sorting queries on the frontend
      index: true,
    },
  },
  { timestamps: true }
);

const Category = models?.Category || model("Category", CategorySchema);
export default Category;