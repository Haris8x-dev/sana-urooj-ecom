// lib/models/video/videoSchema.ts
import mongoose, { Schema, model } from 'mongoose';

// Interface for the Hero Video document
export interface iHeroVideo extends mongoose.Document {
  videoUrl: string;       // The public URL from ImageKit for displaying the video
  fileId: string;         // The ImageKit unique file ID for patching/deleting
  uploadDate: Date;       // Timestamp of the upload
}

const heroVideoSchema = new Schema<iHeroVideo>({
  videoUrl: { 
    type: String, 
    required: true,
    trim: true,
  },
  fileId: { 
    type: String, 
    required: true,
    unique: true, // Should be unique per ImageKit upload
    trim: true,
  },
  uploadDate: {
    type: Date,
    default: Date.now,
  },
}, { 
    timestamps: true 
});

// Since we only want one "Hero Video" entry, we make the model name unique.
// We use findOne() instead of find() to fetch the single active video.
const HeroVideo = mongoose.models?.HeroVideo || model<iHeroVideo>("HeroVideo", heroVideoSchema);

export default HeroVideo;