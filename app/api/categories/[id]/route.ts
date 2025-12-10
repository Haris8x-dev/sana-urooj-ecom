// app/api/categories/[id]/route.ts    
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


/* ---------- GET single category (No Change) ---------- */
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

    // Check if category exists
    const category = await Category.findById(id);
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    // Get all products with this category id
    // NOTE: We now sort products by the new 'priority' field, with null/undefined ones appearing last.
    const products = await Product.find({ category: id })
      .select('title name description price images reviews badges sizes priority') // Added badges, sizes, priority
      .sort({ priority: 1, createdAt: -1 }); // Sort by priority (asc), then by newest

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


/* ---------- PATCH category (Refactored to include priority) ---------- */
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
      const priorityStr = form.get("priority") as string | null; // <-- NEW: Get priority string
      
      const files = form.getAll("images") as File[];
      const replaceIndexes = JSON.parse((form.get("replaceIndexes") as string) || "[]") as number[];
      const deleteIndexes = JSON.parse((form.get("deleteIndexes") as string) || "[]") as number[];

      if (title) updateData.title = title;
      if (description) updateData.description = description;

      // <-- NEW: Handle priority update from form data -->
      if (priorityStr !== null) {
          // Convert to number; null/empty string can be converted to null for default
          const priority = priorityStr === "" ? null : parseInt(priorityStr); 
          if (priority !== null && (isNaN(priority) || priority < 1)) {
              return NextResponse.json({ error: "Invalid priority value. Must be a number >= 1." }, { status: 400 });
          }
          updateData.priority = priority;
      }
      // <-- END NEW PRIORITY HANDLING -->


      let images = existing.images.slice(); // clone current images

      // Delete images
      for (const idx of deleteIndexes) {
        if (images[idx]) {
          await deleteImagekitFileIfPossible(images[idx]);
          images.splice(idx, 1);
        }
      }

      // Replace images
      for (let i = 0; i < replaceIndexes.length; i++) {
        const file = files[i];
        const idx = replaceIndexes[i];
        if (!file) continue;

        const buffer = Buffer.from(await file.arrayBuffer());
        const uploaded = await imagekit.upload({ file: buffer, fileName: `${Date.now()}-${file.name}` });

        if (images[idx]) {
          await deleteImagekitFileIfPossible(images[idx]);
        }

        images[idx] = { url: uploaded.url, fileId: uploaded.fileId };
      }

      // Append new images
      const appendStartIndex = replaceIndexes.length;
      for (let i = appendStartIndex; i < files.length; i++) {
        if (images.length >= 4) break; // max 4 images
        const file = files[i];
        const buffer = Buffer.from(await file.arrayBuffer());
        const uploaded = await imagekit.upload({ file: buffer, fileName: `${Date.now()}-${file.name}` });
        images.push({ url: uploaded.url, fileId: uploaded.fileId });
      }

      if (images.length < 1) {
        return NextResponse.json({ error: "Category must have at least 1 image" }, { status: 400 });
      }

      updateData.images = images;
    } else {
      // JSON updates
      const body = (await req.json().catch(() => ({}))) as any;
      const { title, description, replaceImages, deleteImages, priority } = body; // <-- NEW: Destructure priority

      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      
      // <-- NEW: Handle priority update from JSON -->
      if (priority !== undefined) {
          // Allow setting null (or 0) to remove priority, otherwise enforce number >= 1
          const finalPriority = priority === null || priority === "" ? null : parseInt(priority);
          
          if (finalPriority !== null && (isNaN(finalPriority) || finalPriority < 1)) {
               return NextResponse.json({ error: "Invalid priority value. Must be a number >= 1 or null." }, { status: 400 });
          }
          updateData.priority = finalPriority;
      }
      // <-- END NEW PRIORITY HANDLING -->


      let images = existing.images.slice();

      if (Array.isArray(deleteImages)) {
        for (const idx of deleteImages) { // <--- CORRECTED: Using deleteImages here
          if (images[idx]) {
            await deleteImagekitFileIfPossible(images[idx]);
            images.splice(idx, 1);
          }
        }
      }

      if (Array.isArray(replaceImages)) {
        for (const item of replaceImages) {
          const { idx, url, fileId } = item;
          if (!images[idx]) continue;
          await deleteImagekitFileIfPossible(images[idx]);
          images[idx] = { url, fileId };
        }
      }

      if (images.length < 1) {
        return NextResponse.json({ error: "Category must have at least 1 image" }, { status: 400 });
      }

      updateData.images = images;
    }

    const updated = await Category.findByIdAndUpdate(id, updateData, { new: true });
    return NextResponse.json({ message: "Category updated", category: updated }, { status: 200 });
  } catch (err) {
    log("PATCH error:", err);
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
  }
}

/* ---------- DELETE category (No Change) ---------- */
export async function DELETE(req: NextRequest, { params }: { params: any }) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id as string;
    if (!id || !Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid category id" }, { status: 400 });
    }

    await connectToDatabase();
    const category = await Category.findById(id);
    if (!category) return NextResponse.json({ error: "Category not found" }, { status: 404 });

    for (const img of category.images || []) {
      await deleteImagekitFileIfPossible(img);
    }

    await Category.findByIdAndDelete(id);
    return NextResponse.json({ message: "Category deleted" }, { status: 200 });
  } catch (err) {
    log("DELETE error:", err);
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}