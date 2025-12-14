// app/api/products/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/db";
import Product, { iProductSize, iAddOn } from "@/lib/models/products/product"; 
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
    const cartLimitStr = form.get("cartLimit") as string | null;
    const category = form.get("category") as string | null;
    
    // --- 1. NEW: Extract Gender Field ---
    const genderStr = form.get("gender") as string | null;
    // ------------------------------------

    const imageFiles = form.getAll("images") as File[];
    const videoFile = form.get(VIDEO_FIELD_NAME) as File | null;
    
    // --- 2. Basic Validation (Including Gender Check) ---
    if (!title || !description || isNaN(price) || price <= 0 || !sizesStr || !cartLimitStr || !genderStr) {
      return NextResponse.json(
        { error: "Title, description, price, sizes, cartLimit, and gender are required fields." },
        { status: 400 }
      );
    }
    
    // --- 3. Validate Gender Value ---
    let gender: 'Male' | 'Female';
    const normalizedGender = genderStr.charAt(0).toUpperCase() + genderStr.slice(1).toLowerCase(); // Normalize to "Male" or "Female"
    
    if (normalizedGender === 'Male' || normalizedGender === 'Female') {
        gender = normalizedGender as 'Male' | 'Female';
    } else {
        return NextResponse.json(
            { error: "Invalid gender value. Must be 'Male' or 'Female'." },
            { status: 400 }
        );
    }
    // ------------------------------------


    // --- 4. Parse and Validate cartLimit ---
    let cartLimit = parseInt(cartLimitStr);
    if (isNaN(cartLimit) || cartLimit < 1) {
        return NextResponse.json(
            { error: "Invalid cartLimit value. Must be a number >= 1." },
            { status: 400 }
        );
    }

    // --- 5. Image/Video Validation (Unchanged) ---
    if (imageFiles.length < MIN_IMAGES || imageFiles.length > MAX_IMAGES) {
      return NextResponse.json(
        { error: `You must upload between ${MIN_IMAGES} and ${MAX_IMAGES} images.` },
        { status: 400 }
      );
    }
    
    if (videoFile && videoFile.size === 0) {
         return NextResponse.json(
            { error: "Provided video file is empty." },
            { status: 400 }
        );
    }

    // --- 6. Parse and Validate Sizes (Unchanged) ---
    let sizes: iProductSize[] = [];
    try {
        const parsedSizes = JSON.parse(sizesStr!);
        if (!Array.isArray(parsedSizes) || parsedSizes.length === 0) {
            throw new Error("Sizes must be a non-empty array.");
        }
        
        sizes = parsedSizes.map((size: any) => {
            const quantity = Number(size.quantity);
            if (isNaN(quantity) || quantity < 0) {
                 throw new Error(`Quantity for size ${size.name} must be a non-negative number.`);
            }

            const addOns: iAddOn[] = (Array.isArray(size.addOns) ? size.addOns : []).map((addon: any) => {
                const priceAdjustment = Number(addon.priceAdjustment);
                if (isNaN(priceAdjustment) || priceAdjustment < 0) {
                    throw new Error(`Price adjustment for addOn must be a non-negative number.`);
                }
                return {
                    detail: String(addon.detail),
                    priceAdjustment: priceAdjustment,
                };
            });

            return {
                name: String(size.name),
                quantity: quantity,
                addOns: addOns, 
            };
        });
        
    } catch (e: any) {
        return NextResponse.json(
            { error: e.message || "Invalid sizes format or content." },
            { status: 400 }
        );
    }

    // --- 7. Parse and Validate Priority (Unchanged) ---
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

    // --- 8. Upload Images (Up to 12) (Unchanged) ---
    for (const file of imageFiles) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const uploaded = await imagekit.upload({
        file: buffer,
        fileName: `${Date.now()}-${file.name}`,
        folder: "/products/images",
      });

      imageURLs.push({ url: uploaded.url, fileId: uploaded.fileId });
    }

    // --- 9. Upload Optional Video (Max 1) (Unchanged) ---
    if (videoFile) {
        const arrayBuffer = await videoFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const uploaded = await imagekit.upload({
            file: buffer,
            fileName: `${Date.now()}-${videoFile.name}`,
            folder: "/products/videos",
            isPrivateFile: false,
        });
        
        videoURL = { url: uploaded.url, fileId: uploaded.fileId };
    }

    // --- 10. Final Product Creation Call (Now includes gender) ---
    const newProduct = await Product.create({
      title,
      description,
      price,
      images: imageURLs,
      video: videoURL,
      category,
      sizes, 
      priority, 
      cartLimit, 
      gender, // <-- NEW: Insert the validated gender
    });
    // ---------------------------------------------------

    return NextResponse.json(
      { message: "Product created", product: newProduct },
      { status: 201 }
    );
  } catch (error) {
    console.error("Add product error:", error); 
    
    // NOTE: If file uploads occurred before the error, you may want to add logic 
    // to delete those files from ImageKit to prevent orphaned media.
    
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}