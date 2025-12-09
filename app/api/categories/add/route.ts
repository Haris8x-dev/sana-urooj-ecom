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
    const files = form.getAll("images") as File[];

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "At least 1 image is required" },
        { status: 400 }
      );
    }

    if (files.length > 4) {
      return NextResponse.json(
        { error: "Max 4 images allowed" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const images = [];
    for (const file of files) {
      const uploaded = await uploadImage(file);
      images.push(uploaded);
    }

    const newCategory = await Category.create({
      title,
      description,
      images,
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
