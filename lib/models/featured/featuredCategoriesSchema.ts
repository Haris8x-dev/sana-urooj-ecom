// lib/models/featured/featuredCategoriesSchema.ts
import mongoose, { Schema, model, Document, Types } from 'mongoose';

// Interface for Category Image structure
export interface ICategoryImage {
  url: string;
  fileId: string;
}

// Interface for populated Category data
export interface IPopulatedCategory {
  _id: Types.ObjectId | string;
  title: string;
  description?: string;
  images: ICategoryImage[];
}

// Interface for the Featured Categories document
export interface iFeaturedCategories extends Document {
  // Array of Mongoose ObjectId references to the Category model
  // Enforces exactly 3 categories through validation
  categoryIds: Types.ObjectId[] | IPopulatedCategory[];
}

const featuredCategoriesSchema = new Schema<iFeaturedCategories>({
  categoryIds: {
    type: [Types.ObjectId], // Array of ObjectIds
    ref: 'Category', // IMPORTANT: Reference the name of your existing Category model
    required: true,
    // Optional: Add a custom validator to ensure exactly 3 categories are provided
    validate: {
      validator: (v: Types.ObjectId[]) => v.length === 3,
      message: 'Must select exactly three featured categories.',
    },
  },
}, {
  timestamps: true
});

// Enforce that only one document can exist in this collection
featuredCategoriesSchema.index({ categoryIds: 1 }, { unique: true, partialFilterExpression: { categoryIds: { $exists: true } } });

const FeaturedCategories = mongoose.models?.FeaturedCategories
  ? mongoose.models.FeaturedCategories as mongoose.Model<iFeaturedCategories>
  : model<iFeaturedCategories>("FeaturedCategories", featuredCategoriesSchema);

export default FeaturedCategories;