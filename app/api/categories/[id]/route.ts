import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/db";
import Category from "@/lib/models/categories/category";
import { imagekit } from "@/lib/service/imagekit";
import Product from "@/lib/models/products/product";
import { Types } from "mongoose";

function log(...args: any[]) {
  console.log("[/api/categories/[id]]", ...args);
}

async function deleteImagekitFileIfPossible(img: any) {
  try {
    if (img?.fileId) await imagekit.deleteFile(img.fileId);
  } catch (err) {
    log("ImageKit deleteFile failed:", err);
  }
}


/* ---------- GET single category + Pre-calculated Products ---------- */
export async function GET(
  req: NextRequest, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid category id" }, { status: 400 });
    }

    await connectToDatabase();

    // 1. Fetch the category details
    const category = await Category.findById(id);
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    // 2. Fetch products using the stored 'totalPrice' field
    const products = await Product.aggregate([
        { $match: { category: new Types.ObjectId(id) } },
        {
            $sort: { 
                priority: 1, 
                createdAt: -1 
            }
        },
        {
            $project: {
                title: 1, 
                name: 1, 
                description: 1, 
                price: 1,      // Original Price (Base)
                totalPrice: 1, // Final Price (Pre-calculated by Middleware)
                images: 1, 
                reviews: 1, 
                badges: 1, 
                sizes: 1, 
                priority: 1
            }
        }
    ]);

    return NextResponse.json({
      message: "Category products fetched",
      category,
      products,
    }, { status: 200 });
    
  } catch (err) {
    console.error("Category products error:", err);
    return NextResponse.json(
      { error: "Failed to fetch category products" },
      { status: 500 }
    );
  }
}

/* ---------- PATCH category ---------- */
export async function PATCH(req: NextRequest, { params }: { params: any }) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id as string;
    if (!id || !Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid category id" }, { status: 400 });
    }

    await connectToDatabase();
    const existing = await Category.findById(id);
    if (!existing) return NextResponse.json({ error: "Category not found" }, { status: 404 });

    const contentType = req.headers.get("content-type") || "";
    const updateData: any = {};

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const title = form.get("title") as string | null;
      const description = form.get("description") as string | null;
      const priorityStr = form.get("priority") as string | null; 
      
      const files = form.getAll("images") as File[];
      const replaceIndexes = JSON.parse((form.get("replaceIndexes") as string) || "[]") as number[];
      const deleteIndexes = JSON.parse((form.get("deleteIndexes") as string) || "[]") as number[];

      if (title) updateData.title = title;
      if (description) updateData.description = description;

      if (priorityStr !== null) {
          const priority = priorityStr === "" ? null : parseInt(priorityStr); 
          if (priority !== null && (isNaN(priority) || priority < 1)) {
              return NextResponse.json({ error: "Invalid priority value." }, { status: 400 });
          }
          updateData.priority = priority;
      }

      let images = existing.images.slice();

      for (const idx of deleteIndexes.sort((a, b) => b - a)) {
        if (images[idx]) {
          await deleteImagekitFileIfPossible(images[idx]);
          images.splice(idx, 1);
        }
      }

      for (let i = 0; i < replaceIndexes.length; i++) {
        const file = files[i];
        const idx = replaceIndexes[i];
        if (!file) continue;
        const buffer = Buffer.from(await file.arrayBuffer());
        const uploaded = await imagekit.upload({ file: buffer, fileName: `${Date.now()}-${file.name}` });
        if (images[idx]) await deleteImagekitFileIfPossible(images[idx]);
        images[idx] = { url: uploaded.url, fileId: uploaded.fileId };
      }

      const appendFiles = files.slice(replaceIndexes.length);
      for (const file of appendFiles) {
        if (images.length >= 4) break;
        const buffer = Buffer.from(await file.arrayBuffer());
        const uploaded = await imagekit.upload({ file: buffer, fileName: `${Date.now()}-${file.name}` });
        images.push({ url: uploaded.url, fileId: uploaded.fileId });
      }

      updateData.images = images;
    } else {
      const body = await req.json();
      if (body.title !== undefined) updateData.title = body.title;
      if (body.description !== undefined) updateData.description = body.description;
      if (body.priority !== undefined) {
          updateData.priority = body.priority === null ? null : parseInt(body.priority);
      }
    }

    const updated = await Category.findByIdAndUpdate(id, updateData, { new: true });
    return NextResponse.json({ message: "Category updated", category: updated }, { status: 200 });
  } catch (err) {
    log("PATCH error:", err);
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
  }
}

/* ---------- DELETE category ---------- */
export async function DELETE(req: NextRequest, { params }: { params: any }) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id as string;
    await connectToDatabase();
    const category = await Category.findById(id);
    if (!category) return NextResponse.json({ error: "Category not found" }, { status: 404 });

    for (const img of category.images || []) await deleteImagekitFileIfPossible(img);
    await Category.findByIdAndDelete(id);
    return NextResponse.json({ message: "Category deleted" }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}