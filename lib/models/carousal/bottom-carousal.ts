import mongoose, { Document, Schema, Model } from "mongoose";

export interface IImageKitFile {
    url: string;
    fileId: string;
}

export interface IBottomCarousel extends Document {
    images: IImageKitFile[];
    createdAt: Date;
    updatedAt: Date;
}

const ImageFileSchema: Schema = new Schema({
    url: { type: String, required: true },
    fileId: { type: String, required: true },
}, { _id: false });

const BottomCarouselSchema: Schema = new Schema({
    images: {
        type: [ImageFileSchema],
        required: true,
        validate: {
            validator: (arr: IImageKitFile[]) => arr.length >= 1 && arr.length <= 5,
            message: 'A carousel must have between 1 and 5 images.',
        }
    },
}, { timestamps: true });

// Ensure only one document can exist in this collection
BottomCarouselSchema.index({ _id: 1 }, { unique: true });

const BottomCarousel: Model<IBottomCarousel> = 
    (mongoose.models.BottomCarousel as Model<IBottomCarousel>) || 
    mongoose.model<IBottomCarousel>("BottomCarousel", BottomCarouselSchema);

export default BottomCarousel;