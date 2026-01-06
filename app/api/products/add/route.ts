import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/db";
import Product, { iProductSize } from "@/lib/models/products/product"; 
import { imagekit } from "@/lib/service/imagekit"; 

// Configuration Constants
const MAX_IMAGES = 12;
const MIN_IMAGES = 1;
const VIDEO_FIELD_NAME = "videoFile";
const VALID_GENDERS = ['Male', 'Female'];

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
    const category = form.get("category") as string | null;
    const genderStr = form.get("gender") as string | null;

    // 2. Extract Badge Fields
    const badgeActive = form.get("badgeActive") === "true";
    const badgeAmount = Number(form.get("badgeAmount")) || 0;

    const imageFiles = form.getAll("images") as File[];
    const videoFile = form.get(VIDEO_FIELD_NAME) as File | null;

    // 3. Strict Validation
    if (!title || !description || isNaN(price) || price <= 0 || !sizesStr || !cartLimitStr || !genderStr) {
      return NextResponse.json(
        { error: "Required fields missing: Title, Description, Price, Sizes, Cart Limit, and Gender." },
        { status: 400 }
      );
    }

    // 4. Normalize & Validate Gender
    const normalizedGender = genderStr.charAt(0).toUpperCase() + genderStr.slice(1).toLowerCase();
    if (!VALID_GENDERS.includes(normalizedGender)) {
      return NextResponse.json({ error: "Gender must be 'Male' or 'Female'." }, { status: 400 });
    }

    // 5. Media Validation
    if (imageFiles.length < MIN_IMAGES || imageFiles.length > MAX_IMAGES) {
      return NextResponse.json(
        { error: `Please upload between ${MIN_IMAGES} and ${MAX_IMAGES} images.` },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // 6. Process Media Uploads (ImageKit)
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

    // 7. Data Parsing
    const cartLimit = parseInt(cartLimitStr);
    const priority = (priorityStr === "" || priorityStr === null) ? null : parseInt(priorityStr);
    const finalCategory = (category === "" || category === "null" || !category) ? null : category;
    
    let sizes: iProductSize[] = [];
    try {
      sizes = JSON.parse(sizesStr);
    } catch (e) {
      return NextResponse.json({ error: "Invalid sizes format." }, { status: 400 });
    }

    // 8. Create Product in MongoDB (Following your exact schema)
    const newProduct = await Product.create({
      title,
      description,
      price, // The base price
      images: imageURLs,
      video: videoURL,
      category: finalCategory, 
      sizes, 
      priority, 
      cartLimit, 
      gender: normalizedGender,
      badges: {
        saveRs: {
          active: badgeActive,
          amount: badgeAmount
        }
      }
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