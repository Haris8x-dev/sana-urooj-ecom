// app/api/products/add/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/db";
import Product, { iProductSize, iAddOn } from "@/lib/models/products/product"; 
import { imagekit } from "@/lib/service/imagekit"; 

// Configuration Constants
const MAX_IMAGES = 12;
const MIN_IMAGES = 1;
const VIDEO_FIELD_NAME = "videoFile";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();

    // 1. Extract Basic Fields
    const title = form.get("title") as string;
    const description = form.get("description") as string;
    const price = Number(form.get("price"));
    const sizesStr = form.get("sizes") as string | null; 
    const priorityStr = form.get("priority") as string | null; 
    const cartLimitStr = form.get("cartLimit") as string | null;
    const category = form.get("category") as string | null; // Optional
    const genderStr = form.get("gender") as string | null;

    const imageFiles = form.getAll("images") as File[];
    const videoFile = form.get(VIDEO_FIELD_NAME) as File | null;

    // 2. Strict Validation (Category is excluded from 'required' list)
    if (!title || !description || isNaN(price) || price <= 0 || !sizesStr || !cartLimitStr || !genderStr) {
      return NextResponse.json(
        { error: "Missing required fields: Title, Description, Price, Sizes, Cart Limit, and Gender are mandatory." },
        { status: 400 }
      );
    }

    // 3. Normalize & Validate Gender
    let gender: 'Male' | 'Female';
    const normalizedGender = genderStr.charAt(0).toUpperCase() + genderStr.slice(1).toLowerCase();
    if (normalizedGender === 'Male' || normalizedGender === 'Female') {
      gender = normalizedGender as 'Male' | 'Female';
    } else {
      return NextResponse.json({ error: "Gender must be 'Male' or 'Female'." }, { status: 400 });
    }

    // 4. Parse Numbers
    const cartLimit = parseInt(cartLimitStr);
    if (isNaN(cartLimit) || cartLimit < 1) {
      return NextResponse.json({ error: "Cart limit must be a number greater than 0." }, { status: 400 });
    }

    // 5. Media Validation
    if (imageFiles.length < MIN_IMAGES || imageFiles.length > MAX_IMAGES) {
      return NextResponse.json(
        { error: `Upload between ${MIN_IMAGES} and ${MAX_IMAGES} images.` },
        { status: 400 }
      );
    }

    // 6. Parse Sizes Array
    let sizes: iProductSize[] = [];
    try {
      const parsedSizes = JSON.parse(sizesStr);
      sizes = parsedSizes.map((size: any) => ({
        name: String(size.name),
        quantity: Number(size.quantity),
        addOns: (size.addOns || []).map((addon: any) => ({
          detail: String(addon.detail),
          priceAdjustment: Number(addon.priceAdjustment)
        }))
      }));
    } catch (e) {
      return NextResponse.json({ error: "Invalid sizes format." }, { status: 400 });
    }

    // 7. Handle Optional Priority
    let priority: number | null = null;
    if (priorityStr) {
      const p = parseInt(priorityStr);
      if (!isNaN(p)) priority = p;
    }

    await connectToDatabase();

    // 8. Process Media Uploads (ImageKit)
    const imageURLs: { url: string; fileId: string }[] = [];
    let videoURL: { url: string; fileId: string } | null = null;

    // Upload Images
    for (const file of imageFiles) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const uploaded = await imagekit.upload({
        file: buffer,
        fileName: `img-${Date.now()}-${file.name}`,
        folder: "/products/images",
      });
      imageURLs.push({ url: uploaded.url, fileId: uploaded.fileId });
    }

    // Upload Video (if exists)
    if (videoFile && videoFile.size > 0) {
      const vBuffer = Buffer.from(await videoFile.arrayBuffer());
      const uploadedV = await imagekit.upload({
        file: vBuffer,
        fileName: `vid-${Date.now()}-${videoFile.name}`,
        folder: "/products/videos",
      });
      videoURL = { url: uploadedV.url, fileId: uploadedV.fileId };
    }

    // 9. Sanitize Optional Category
    // If user selected "None", category might be "" or "null". Convert to null for DB.
    const finalCategory = (category === "" || category === "null" || !category) ? null : category;

    // 10. Create Product in MongoDB
    const newProduct = await Product.create({
      title,
      description,
      price,
      images: imageURLs,
      video: videoURL,
      category: finalCategory, 
      sizes, 
      priority, 
      cartLimit, 
      gender,
    });

    return NextResponse.json(
      { message: "Product created successfully", product: newProduct },
      { status: 201 }
    );

  } catch (error: any) {
    console.error("Backend Product Add Error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}