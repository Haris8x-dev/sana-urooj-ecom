import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/db";
import Product, { iProductSize } from "@/lib/models/products/product";
import { imagekit } from "@/lib/service/imagekit";

// Define max limits
const MAX_IMAGES = 12;
const MIN_IMAGES = 1;
const VIDEO_FIELD_NAME = "videoFile";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();

    const title = form.get("title") as string;
    const description = form.get("description") as string;
    const price = Number(form.get("price"));
    
    const sizesStr = form.get("sizes") as string | null; 
    const priorityStr = form.get("priority") as string | null; 
    
    // --- NEW: Get media files ---
    const imageFiles = form.getAll("images") as File[];
    const videoFile = form.get(VIDEO_FIELD_NAME) as File | null; // Single video file or null
    // ----------------------------
    
    const category = form.get("category") as string | null;

    // --- 1. Basic Validation ---
    if (!title || !description || isNaN(price) || price <= 0 || !sizesStr) {
      return NextResponse.json(
        { error: "Title, description, price, and sizes are required fields." },
        { status: 400 }
      );
    }

    // --- 2. Image Validation (Min 1, Max 12) ---
    if (imageFiles.length < MIN_IMAGES || imageFiles.length > MAX_IMAGES) {
      return NextResponse.json(
        { error: `You must upload between ${MIN_IMAGES} and ${MAX_IMAGES} images.` },
        { status: 400 }
      );
    }
    
    // --- 3. Video Validation (Max 1) ---
    if (videoFile && videoFile.size === 0) { // Check if file is provided but empty
         return NextResponse.json(
            { error: "Provided video file is empty." },
            { status: 400 }
        );
    }

    // --- 4. Parse and Validate Sizes (Quantity check added) ---
    let sizes: iProductSize[] = [];
    try {
        const parsedSizes = JSON.parse(sizesStr!);
        if (!Array.isArray(parsedSizes) || parsedSizes.length === 0) {
            throw new Error("Sizes must be a non-empty array.");
        }
        
        sizes = parsedSizes.map((size: any) => {
            const quantity = Number(size.quantity);
            if (isNaN(quantity) || quantity < 0) { // Enforce non-negative quantity
                 throw new Error(`Quantity for size ${size.name} must be a non-negative number.`);
            }
            return {
                name: String(size.name),
                quantity: quantity,
            };
        });
        
    } catch (e: any) {
        return NextResponse.json(
            { error: e.message || "Invalid sizes format or content. Must be a JSON array of {name, quantity} with non-negative quantities." },
            { status: 400 }
        );
    }

    // --- 5. Parse and Validate Priority ---
    let priority: number | null = null;
    if (priorityStr !== null && priorityStr !== "") {
        const parsedPriority = parseInt(priorityStr);
        if (isNaN(parsedPriority) || parsedPriority < 1) {
            return NextResponse.json(
                { error: "Invalid priority value. Must be a number >= 1 or null." },
                { status: 400 }
            );
        }
        priority = parsedPriority;
    }
    
    await connectToDatabase();

    let imageURLs: { url: string; fileId: string }[] = [];
    let videoURL: { url: string; fileId: string } | null = null;

    // --- 6. Upload Images (Up to 12) ---
    for (const file of imageFiles) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const uploaded = await imagekit.upload({
        file: buffer,
        fileName: `${Date.now()}-${file.name}`,
        folder: "/products/images", // Recommended: organize files
      });

      imageURLs.push({
        url: uploaded.url,
        fileId: uploaded.fileId,
      });
    }

    // --- 7. Upload Optional Video (Max 1) ---
    if (videoFile) {
        const arrayBuffer = await videoFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const uploaded = await imagekit.upload({
            file: buffer,
            fileName: `${Date.now()}-${videoFile.name}`,
            folder: "/products/videos", // Recommended: organize files
            isPrivateFile: false, // Videos are often public
        });
        
        videoURL = {
            url: uploaded.url,
            fileId: uploaded.fileId,
        };
    }

    // --- 8. Final Product Creation Call ---
    const newProduct = await Product.create({
      title,
      description,
      price,
      images: imageURLs,
      video: videoURL, // <-- INSERTED: Video URL
      category,
      sizes, 
      priority, 
    });
    // ----------------------------------------

    return NextResponse.json(
      { message: "Product created", product: newProduct },
      { status: 201 }
    );
  } catch (error) {
    console.error("Add product error:", error); 
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}