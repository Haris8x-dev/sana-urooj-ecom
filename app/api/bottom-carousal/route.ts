import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/db";
import BottomCarousel, { IBottomCarousel, IImageKitFile } from "@/lib/models/carousal/bottom-carousal";
import { imagekit } from "@/lib/service/imagekit";

const MAX_IMAGES = 5;
const MIN_IMAGES = 1;

/** Simple server log */
function log(...args: any[]) {
  console.log("[/api/bottom-carousal]", ...args);
}

/** Delete a single image from ImageKit safely */
async function deleteImagekitFileIfPossible(img: IImageKitFile | null | undefined) {
  try {
    if (img && typeof img === "object" && img.fileId) {
      await imagekit.deleteFile(img.fileId);
    }
  } catch (err) {
    log("imagekit deleteFile failed:", err);
  }
}

/* -------------------- POST (Add initial set of images) -------------------- */
export async function POST(req: NextRequest) {
    try {
        await connectToDatabase();
        log("POST called.");

        // Check if the document already exists (since we only allow one)
        const existing = await BottomCarousel.findOne({});
        if (existing) {
            return NextResponse.json(
                { error: "Carousel images already exist. Use PATCH to update." },
                { status: 409 } // Conflict
            );
        }

        const form = await req.formData();
        const files = form.getAll("images") as File[];

        if (files.length < MIN_IMAGES || files.length > MAX_IMAGES) {
            return NextResponse.json(
                { error: `Must upload between ${MIN_IMAGES} and ${MAX_IMAGES} images.` },
                { status: 400 }
            );
        }

        const uploadedImages: IImageKitFile[] = [];

        // Upload all files to ImageKit
        for (const file of files) {
            const buffer = Buffer.from(await file.arrayBuffer());
            const uploaded = await imagekit.upload({
                file: buffer,
                fileName: `${Date.now()}-${file.name}`,
                folder: "/carousel/bottom", // Dedicated folder for better organization
            });
            uploadedImages.push({ url: uploaded.url, fileId: uploaded.fileId });
        }

        // Create the single document in the database
        const newCarousel = await BottomCarousel.create({ images: uploadedImages });

        return NextResponse.json(
            { message: "Carousel images added successfully", carousel: newCarousel },
            { status: 201 }
        );

    } catch (err) {
        log("POST error:", err);
        return NextResponse.json({ error: "Failed to add carousel images" }, { status: 500 });
    }
}

/* -------------------- GET (Fetch all images) -------------------- */
export async function GET() {
    try {
        await connectToDatabase();
        log("GET called.");

        // Fetch the single carousel document
        const carousel = await BottomCarousel.findOne({});

        if (!carousel) {
            return NextResponse.json(
                { error: "Carousel images not found. Run POST route first." },
                { status: 404 }
            );
        }

        return NextResponse.json({ images: carousel.images }, { status: 200 });

    } catch (err) {
        log("GET error:", err);
        return NextResponse.json({ error: "Failed to fetch carousel images" }, { status: 500 });
    }
}

/* -------------------- PATCH (Update/Replace/Delete images) -------------------- */
export async function PATCH(req: NextRequest) {
    try {
        await connectToDatabase();
        log("PATCH called.");

        const existing = await BottomCarousel.findOne({});
        if (!existing) {
            return NextResponse.json({ error: "Carousel not found. Run POST first." }, { status: 404 });
        }

        const form = await req.formData();
        const files = form.getAll("images") as File[];
        
        // Arrays for indexes to handle
        const replaceIndexes = JSON.parse((form.get("replaceIndexes") as string) || "[]") as number[];
        const deleteIndexes = JSON.parse((form.get("deleteIndexes") as string) || "[]") as number[];
        
        let images = existing.images.slice(); // Copy current images

        // 1. Delete images
        // Sort descending to prevent index shift issues
        for (const idx of deleteIndexes.sort((a, b) => b - a)) {
            if (images[idx]) {
                await deleteImagekitFileIfPossible(images[idx]);
                images.splice(idx, 1);
            }
        }

        // Check MIN_IMAGES requirement after deletion
        if (images.length === 0) {
            return NextResponse.json(
                { error: "Cannot delete all images. At least 1 image must remain." },
                { status: 400 }
            );
        }

        let fileIndex = 0;

        // 2. Replace images
        for (const idx of replaceIndexes) {
            const file = files[fileIndex++];
            if (!file) continue; 

            // Upload new file
            const buffer = Buffer.from(await file.arrayBuffer());
            const uploaded = await imagekit.upload({
                file: buffer,
                fileName: `${Date.now()}-${file.name}`,
                folder: "/carousel/bottom",
            });

            // Delete old file and update database record
            if (images[idx]) await deleteImagekitFileIfPossible(images[idx]);
            images[idx] = { url: uploaded.url, fileId: uploaded.fileId };
        }

        // 3. Append new images
        for (let i = fileIndex; i < files.length; i++) {
            if (images.length >= MAX_IMAGES) break; 
            const file = files[i];

            const buffer = Buffer.from(await file.arrayBuffer());
            const uploaded = await imagekit.upload({
                file: buffer,
                fileName: `${Date.now()}-${file.name}`,
                folder: "/carousel/bottom",
            });
            images.push({ url: uploaded.url, fileId: uploaded.fileId });
        }
        
        // Check MAX_IMAGES requirement after append
        if (images.length > MAX_IMAGES) {
             // This case should be mostly covered by the `break` above, but is a final safety check
             return NextResponse.json(
                { error: `Cannot exceed ${MAX_IMAGES} images.` },
                { status: 400 }
            );
        }

        // Save the updated array
        existing.images = images;
        const updated = await existing.save();

        return NextResponse.json(
            { message: "Carousel images updated", images: updated.images },
            { status: 200 }
        );

    } catch (err) {
        log("PATCH error:", err);
        return NextResponse.json({ error: "Failed to update carousel images" }, { status: 500 });
    }
}

/* -------------------- DELETE (Remove all images) -------------------- */
export async function DELETE(req: NextRequest) {
    try {
        await connectToDatabase();
        log("DELETE called.");

        const carousel = await BottomCarousel.findOne({});
        if (!carousel) {
            return NextResponse.json({ error: "Carousel not found" }, { status: 404 });
        }

        // Delete all images from ImageKit first
        for (const img of carousel.images || []) {
            await deleteImagekitFileIfPossible(img);
        }

        // Delete the single document
        await BottomCarousel.deleteOne({ _id: carousel._id });

        return NextResponse.json({ message: "All carousel images and document deleted" }, { status: 200 });

    } catch (err) {
        log("DELETE error:", err);
        return NextResponse.json({ error: "Failed to delete carousel" }, { status: 500 });
    }
}