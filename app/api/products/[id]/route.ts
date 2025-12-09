// app/api/products/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/db";
import Product from "@/lib/models/products/product";
import { imagekit } from "@/lib/service/imagekit";
import { Types } from "mongoose";

/** Simple server log */
function log(...args: any[]) {
  console.log("[/api/products/[id]]", ...args);
}

/** Delete a single image from ImageKit safely */
async function deleteImagekitFileIfPossible(img: any) {
  try {
    if (img && typeof img === "object" && img.fileId) {
      await imagekit.deleteFile(img.fileId);
    }
  } catch (err) {
    log("imagekit deleteFile failed:", err);
  }
}

/* ---------- GET single product ---------- */
export async function GET(req: NextRequest, { params }: { params: any }) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id as string;
    log("GET called with id:", id);

    if (!id || !Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
    }

    await connectToDatabase();

    const product = await Product.findById(id);
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ product }, { status: 200 });
  } catch (err) {
    log("GET error:", err);
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}

/* ---------- PATCH (update product) ---------- */
export async function PATCH(req: NextRequest, { params }: { params: any }) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id as string;
    log("PATCH called with id:", id);

    if (!id || !Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
    }

    await connectToDatabase();
    const existing = await Product.findById(id);
    if (!existing) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    const contentType = req.headers.get("content-type") || "";
    const updateData: any = {};

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const title = form.get("title") as string | null;
      const description = form.get("description") as string | null;
      const priceRaw = form.get("price") as string | null;
      const price = priceRaw ? Number(priceRaw) : undefined;
      const category = form.get("category") as string | null;
      const removeCategory = form.get("removeCategory") === "true"; // NEW: Check for category removal
      const quantityRaw = form.get("quantity") as string | null;
      const quantity = quantityRaw ? Number(quantityRaw) : undefined;
      const files = form.getAll("images") as File[];
      const replaceIndexes = JSON.parse((form.get("replaceIndexes") as string) || "[]") as number[];
      const deleteIndexes = JSON.parse((form.get("deleteIndexes") as string) || "[]") as number[];

      if (title) updateData.title = title;
      if (description) updateData.description = description;
      if (price !== undefined && !Number.isNaN(price)) updateData.price = price;
      if (quantity !== undefined && !Number.isNaN(quantity)) updateData.quantity = quantity;
      
      // NEW: Handle category removal or update
      if (removeCategory) {
        updateData.category = null; // Remove category
      } else if (category) {
        updateData.category = category; // Set new category
      }

      let images = existing.images.slice();

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

        if (images[idx]) await deleteImagekitFileIfPossible(images[idx]);
        images[idx] = { url: uploaded.url, fileId: uploaded.fileId };
      }

      // Append new images
      const appendStartIndex = replaceIndexes.length;
      for (let i = appendStartIndex; i < files.length; i++) {
        if (images.length >= 4) break;
        const file = files[i];
        const buffer = Buffer.from(await file.arrayBuffer());
        const uploaded = await imagekit.upload({ file: buffer, fileName: `${Date.now()}-${file.name}` });
        images.push({ url: uploaded.url, fileId: uploaded.fileId });
      }

      if (images.length === 0) {
        return NextResponse.json({ error: "At least 1 image required" }, { status: 400 });
      }

      updateData.images = images;

    } else {
      // JSON updates
      const body = (await req.json().catch(() => ({}))) as any;
      const { title, description, price, quantity, deleteImages, replaceImages, removeCategory } = body; // NEW: Added removeCategory

      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (price !== undefined && !Number.isNaN(Number(price))) updateData.price = Number(price);
      if (quantity !== undefined && !Number.isNaN(Number(quantity))) updateData.quantity = Number(quantity);
      
      // NEW: Handle category removal or update
      if (removeCategory) {
        updateData.category = null; // Remove category
      } else if (body.category) {
        updateData.category = body.category; // Set new category
      }

      let currentImages = existing.images.slice();

      // Delete images
      if (Array.isArray(deleteImages)) {
        for (const idx of deleteImages) {
          if (currentImages[idx]) {
            await deleteImagekitFileIfPossible(currentImages[idx]);
            currentImages.splice(idx, 1);
          }
        }
      }

      // Replace images
      if (Array.isArray(replaceImages)) {
        for (const item of replaceImages) {
          const { idx, url, fileId } = item;
          if (!currentImages[idx]) continue;
          await deleteImagekitFileIfPossible(currentImages[idx]);
          currentImages[idx] = { url, fileId };
        }
      }

      if (currentImages.length === 0) {
        return NextResponse.json({ error: "At least 1 image required" }, { status: 400 });
      }

      updateData.images = currentImages;
    }

    const updated = await Product.findByIdAndUpdate(id, updateData, { new: true });
    return NextResponse.json({ message: "Product updated", product: updated }, { status: 200 });

  } catch (err) {
    console.log("PATCH error:", err);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

/* ---------- DELETE product ---------- */
export async function DELETE(req: NextRequest, { params }: { params: any }) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id as string;
    log("DELETE called with id:", id);

    if (!id || !Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
    }

    await connectToDatabase();
    const product = await Product.findById(id);
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    for (const img of product.images || []) {
      await deleteImagekitFileIfPossible(img);
    }

    await Product.findByIdAndDelete(id);
    return NextResponse.json({ message: "Product deleted" }, { status: 200 });

  } catch (err) {
    log("DELETE error:", err);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
