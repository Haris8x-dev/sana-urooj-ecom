import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/db";
import Category from "@/lib/models/categories/category";
import { imagekit } from "@/lib/service/imagekit";

async function uploadImage(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const uploaded = await imagekit.upload({
    file: buffer,
    fileName: `${Date.now()}-${file.name}`,
  });
  return { url: uploaded.url, fileId: uploaded.fileId };
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();

    const title = form.get("title") as string;
    const description = form.get("description") as string;
    // --- MODIFIED: Get single 'images' file ---
    const file = form.get("images") as File | null; 
    // --- NEW: Get priority string ---
    const priorityStr = form.get("priority") as string | null;

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    // --- MODIFIED VALIDATION: Check for exactly ONE file ---
    if (!file) {
      return NextResponse.json(
        { error: "Exactly 1 image is required" },
        { status: 400 }
      );
    }
    // The previous checks for files.length (0 or > 4) are removed and replaced by the single file check.
    
    // --- Priority Validation and Conversion ---
    let priority: number | null = null;
    if (priorityStr !== null && priorityStr !== "") {
        const parsedPriority = parseInt(priorityStr);
        if (isNaN(parsedPriority) || parsedPriority < 1) {
            return NextResponse.json(
                { error: "Invalid priority value. Must be a number >= 1." },
                { status: 400 }
            );
        }
        priority = parsedPriority;
    }
    // --- END Priority Logic ---


    await connectToDatabase();

    // --- MODIFIED: Uploading only the single file ---
    const uploadedImage = await uploadImage(file);
    // Since the schema expects an array, wrap the single uploaded image in an array
    const images = [uploadedImage];


    const newCategory = await Category.create({
      title,
      description,
      images,
      priority, // <-- NEW: Include priority
    });

    return NextResponse.json(
      { message: "Category created", category: newCategory },
      { status: 201 }
    );
  } catch (err) {
    console.error("Add category error:", err);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}