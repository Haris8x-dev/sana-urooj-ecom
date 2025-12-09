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
  },
  { timestamps: true }
);

const Category = models?.Category || model("Category", CategorySchema);
export default Category;
