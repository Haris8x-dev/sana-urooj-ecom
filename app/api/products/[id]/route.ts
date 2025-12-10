// app/api/products/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/db";
import Product, { iProductSize } from "@/lib/models/products/product";
import { imagekit } from "@/lib/service/imagekit";
import { Types } from "mongoose";

const MAX_IMAGES = 12;
const VIDEO_FIELD_NAME = "videoFile";

/** Simple server log */
function log(...args: any[]) {
  console.log("[/api/products/[id]]", ...args);
}

/** Delete a single image/video from ImageKit safely */
async function deleteImagekitFileIfPossible(media: any) {
  try {
    if (media && typeof media === "object" && media.fileId) {
      await imagekit.deleteFile(media.fileId);
    }
  } catch (err) {
    log("imagekit deleteFile failed:", err);
  }
}

/* ---------- GET single product (NO CHANGE REQUIRED) ---------- */
// Mongoose automatically includes the new 'video' field
export async function GET(req: NextRequest, { params }: { params: any }) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id as string;
    log("GET called with id:", id);

    if (!id || !Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
    }

    await connectToDatabase();

    // Populate reviews for completeness (optional but good practice)
    const product = await Product.findById(id).populate({
        path: "reviews.userId",
        model: "User",
        select: "fullName profileImage",
    });
    
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ product }, { status: 200 });
  } catch (err) {
    log("GET error:", err);
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}

/* ---------- PATCH (update product) - FULLY MODIFIED ---------- */
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
    let currentVideo = existing.video; // Track current video object

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const title = form.get("title") as string | null;
      const description = form.get("description") as string | null;
      const priceRaw = form.get("price") as string | null;
      const price = priceRaw ? Number(priceRaw) : undefined;
      const category = form.get("category") as string | null;
      const removeCategory = form.get("removeCategory") === "true";

      const sizesStr = form.get("sizes") as string | null; 
      const priorityStr = form.get("priority") as string | null;
        
      // --- NEW MEDIA FIELDS ---
      const imageFiles = form.getAll("images") as File[]; // Only new/replacement images
      const videoFile = form.get(VIDEO_FIELD_NAME) as File | null; 
      const deleteVideo = form.get("deleteVideo") === "true";
      // ------------------------
        
      const replaceIndexes = JSON.parse((form.get("replaceIndexes") as string) || "[]") as number[];
      const deleteIndexes = JSON.parse((form.get("deleteIndexes") as string) || "[]") as number[];

      if (title) updateData.title = title;
      if (description) updateData.description = description;
      if (price !== undefined && !Number.isNaN(price)) updateData.price = price;
      
      // Handle category removal or update
      if (removeCategory) {
        updateData.category = null;
      } else if (category) {
        updateData.category = category;
      }

      // --- Handle Sizes Update from form-data ---
      if (sizesStr !== null) {
          try {
              const parsedSizes = JSON.parse(sizesStr);
              if (!Array.isArray(parsedSizes)) throw new Error("Sizes must be an array.");
              updateData.sizes = parsedSizes.map((size: any) => ({
                  name: String(size.name),
                  quantity: Number(size.quantity) >= 0 ? Number(size.quantity) : 0,
              })) as iProductSize[];
          } catch (e) {
              return NextResponse.json({ error: "Invalid sizes format." }, { status: 400 });
          }
      }
      
      // --- Handle Priority Update from form-data ---
      if (priorityStr !== null) {
          const priority = priorityStr === "" ? null : parseInt(priorityStr);
          if (priority !== null && (isNaN(priority) || priority < 1)) {
              return NextResponse.json({ error: "Invalid priority value. Must be a number >= 1 or null." }, { status: 400 });
          }
          updateData.priority = priority;
      }
        
      // --- START VIDEO HANDLING (form-data) ---
      if (deleteVideo) {
          if (currentVideo) await deleteImagekitFileIfPossible(currentVideo);
          updateData.video = null;
      } else if (videoFile) {
          if (videoFile.size === 0) {
              return NextResponse.json({ error: "Provided video file is empty." }, { status: 400 });
          }
          const buffer = Buffer.from(await videoFile.arrayBuffer());
          const uploaded = await imagekit.upload({ file: buffer, fileName: `${Date.now()}-${videoFile.name}`, folder: "/products/videos" });
          
          if (currentVideo) await deleteImagekitFileIfPossible(currentVideo);
          updateData.video = { url: uploaded.url, fileId: uploaded.fileId };
      }
      // --- END VIDEO HANDLING (form-data) ---

      let images = existing.images.slice();

      // Delete images
      for (const idx of deleteIndexes.sort((a, b) => b - a)) { // Sort descending to prevent index shift issues
        if (images[idx]) {
          await deleteImagekitFileIfPossible(images[idx]);
          images.splice(idx, 1);
        }
      }

      // Replace images
      const filesToAppend: File[] = [];
      for (let i = 0; i < replaceIndexes.length; i++) {
        const file = imageFiles[i];
        const idx = replaceIndexes[i];
        if (!file) { // Files intended for replacement are at the start of the imageFiles array
            filesToAppend.push(imageFiles[i]); // Should not happen in a typical frontend flow, but safeguard
            continue;
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const uploaded = await imagekit.upload({ file: buffer, fileName: `${Date.now()}-${file.name}`, folder: "/products/images" });

        if (images[idx]) await deleteImagekitFileIfPossible(images[idx]);
        images[idx] = { url: uploaded.url, fileId: uploaded.fileId };
      }

      // Append new images (Remaining files in imageFiles array)
      const appendStartIndex = replaceIndexes.length;
      for (let i = appendStartIndex; i < imageFiles.length; i++) {
        if (images.length >= MAX_IMAGES) break; // Use 12 image limit
        const file = imageFiles[i];
        const buffer = Buffer.from(await file.arrayBuffer());
        const uploaded = await imagekit.upload({ file: buffer, fileName: `${Date.now()}-${file.name}`, folder: "/products/images" });
        images.push({ url: uploaded.url, fileId: uploaded.fileId });
      }

      if (images.length === 0) {
        return NextResponse.json({ error: "At least 1 image required" }, { status: 400 });
      }

      updateData.images = images;

    } else {
      // JSON updates
      const body = (await req.json().catch(() => ({}))) as any;
      
      // --- MODIFIED: Added video fields to JSON destructuring ---
      const { title, description, price, deleteImages, replaceImages, removeCategory, sizes, priority, deleteVideo, video } = body; 

      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (price !== undefined && !Number.isNaN(Number(price))) updateData.price = Number(price);
      
      // Handle category removal or update
      if (removeCategory) {
        updateData.category = null;
      } else if (body.category) {
        updateData.category = body.category;
      }

      // --- Handle Sizes Update from JSON ---
      if (sizes !== undefined) {
          if (!Array.isArray(sizes)) {
              return NextResponse.json({ error: "Sizes must be a JSON array." }, { status: 400 });
          }
          updateData.sizes = sizes.map((size: any) => ({
              name: String(size.name),
              quantity: Number(size.quantity) >= 0 ? Number(size.quantity) : 0,
          })) as iProductSize[];
      }
      
      // --- Handle Priority Update from JSON ---
      if (priority !== undefined) {
          const finalPriority = priority === null || priority === "" ? null : parseInt(priority);
          if (finalPriority !== null && (isNaN(finalPriority) || finalPriority < 1)) {
              return NextResponse.json({ error: "Invalid priority value. Must be a number >= 1 or null." }, { status: 400 });
          }
          updateData.priority = finalPriority;
      }
      
      // --- START VIDEO HANDLING (JSON) ---
      if (deleteVideo) {
          if (currentVideo) await deleteImagekitFileIfPossible(currentVideo);
          updateData.video = null;
      } else if (video !== undefined) {
          // 'video' field expects a new { url, fileId } object or null to remove it (if not deleted by flag)
          if (video === null) {
              if (currentVideo) await deleteImagekitFileIfPossible(currentVideo);
              updateData.video = null;
          } else if (typeof video === 'object' && video.url && video.fileId) {
              // Assuming this is a pre-uploaded video replacement or a new one
              updateData.video = video;
              // Note: If the replaced video was the *existing* one, the frontend must ensure its deletion.
              // For simplicity, we assume frontend manages deletion when replacing via JSON, or the user sends the new object directly.
          } else {
               return NextResponse.json({ error: "Invalid video format provided in JSON body." }, { status: 400 });
          }
      }
      // --- END VIDEO HANDLING (JSON) ---

      let currentImages = existing.images.slice();

      // Delete images
      if (Array.isArray(deleteImages)) {
        for (const idx of deleteImages.sort((a, b) => b - a)) { // Sort descending
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

/* ---------- DELETE product - MODIFIED TO DELETE VIDEO ---------- */
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

    // 1. Delete all images from ImageKit
    for (const img of product.images || []) {
      await deleteImagekitFileIfPossible(img);
    }
    
    // 2. Delete the video from ImageKit (if one exists)
    if (product.video) {
        await deleteImagekitFileIfPossible(product.video);
    }
    
    // 3. Delete the product document
    await Product.findByIdAndDelete(id);
    
    return NextResponse.json({ message: "Product deleted" }, { status: 200 });

  } catch (err) {
    log("DELETE error:", err);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}