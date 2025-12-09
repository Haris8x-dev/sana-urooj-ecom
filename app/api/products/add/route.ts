import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/db";
import Product from "@/lib/models/products/product";
import { imagekit } from "@/lib/service/imagekit";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();

    const title = form.get("title") as string;
    const description = form.get("description") as string;
    const price = Number(form.get("price"));
    const quantity = Number(form.get("quantity")); // <-- added
    const files = form.getAll("images") as File[];
    const category = form.get("category") as string | null;

    if (!title || !description || !price || quantity === undefined) {
      return NextResponse.json(
        { error: "Required fields missing" },
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

    let imageURLs: { url: string; fileId: string }[] = [];

    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const uploaded = await imagekit.upload({
        file: buffer,
        fileName: `${Date.now()}-${file.name}`,
      });

      imageURLs.push({
        url: uploaded.url,
        fileId: uploaded.fileId,
      });
    }

    const newProduct = await Product.create({
      title,
      description,
      price,
      quantity, // <--- insert here
      images: imageURLs,
      category,  
    });

    return NextResponse.json(
      { message: "Product created", product: newProduct },
      { status: 201 }
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}
