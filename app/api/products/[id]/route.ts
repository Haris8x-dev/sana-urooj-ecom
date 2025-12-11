// app/api/products/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/db";
import Product, { iProductSize } from "@/lib/models/products/product";
import { imagekit } from "@/lib/service/imagekit";
import { Types } from "mongoose";

// We still need to ensure the Product model is defined, but we remove the direct use of User populate.

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

/* ---------- GET single product (MODIFIED TO USE $lookup) ---------- */
export async function GET(req: NextRequest, { params }: { params: any }) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id as string;
    log("GET called with id:", id);

    if (!id || !Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
    }

    await connectToDatabase();

    // 1. Use the aggregation pipeline to find the single product and perform the join.
    const productArr = await Product.aggregate([
        // Match the specific product ID
        { $match: { _id: new Types.ObjectId(id) } },
        
        // Perform the lookup (Manual Population)
        {
            $lookup: {
                from: 'users', // The name of the User collection in MongoDB
                localField: 'reviews.userId',
                foreignField: '_id',
                as: 'populatedUsers'
            }
        },
        
        // Reconstruct the final product shape (similar to your listing route logic)
        {
            $project: {
                // Include all product fields (including increment and badges)
                title: 1, description: 1, images: 1, video: 1, price: 1, category: 1,
                badges: 1, sizes: 1, priority: 1, createdAt: 1, updatedAt: 1, increment: 1, // <-- Ensures increment is included
                
                // Reconstruct the reviews array with populated user data
                reviews: {
                    $map: {
                        input: "$reviews",
                        as: "review",
                        in: {
                            _id: "$$review._id",
                            userId: "$$review.userId",
                            rating: "$$review.rating",
                            comment: "$$review.comment",
                            createdAt: "$$review.createdAt",
                            updatedAt: "$$review.updatedAt",
                            user: {
                                $arrayElemAt: [
                                    "$populatedUsers",
                                    { $indexOfArray: ["$populatedUsers._id", "$$review.userId"] }
                                ]
                            }
                        }
                    }
                }
            }
        }
    ]);
    
    const product = productArr[0]; // Aggregate returns an array, take the first element.

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ product }, { status: 200 });
  } catch (err) {
    log("GET error:", err);
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}

/* ---------- PATCH (update product) - FULLY MODIFIED AND FIXED for cartLimit ---------- */
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
    let currentVideo = existing.video; 
    
    // Unified variable for images. Defined here for full scope access.
    let imagesToSave = existing.images.slice(); 

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
      
      // ------------------------------------------------------------------
      // Target Field: cartLimit
      const cartLimitStr = form.get("cartLimit") as string | null;
      // ------------------------------------------------------------------
      
      // --- NEW MEDIA FIELDS ---
      const imageFiles = form.getAll("images") as File[]; 
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
      
      // ------------------------------------------------------------------
      // ✅ FIXED LOGIC for cartLimit (form-data)
      if (cartLimitStr !== null) {
          const cartLimit = parseInt(cartLimitStr);
          // Check for valid number and schema minimum (1)
          if (!isNaN(cartLimit) && cartLimit >= 1) {
              updateData.cartLimit = cartLimit;
          } else if (cartLimitStr.trim() !== "") {
              return NextResponse.json({ error: "Invalid cartLimit value. Must be a number >= 1." }, { status: 400 });
          }
      }
      // ------------------------------------------------------------------


      // --- Handle Sizes Update from form-data [FIXED: Include addOns] ---
      if (sizesStr !== null) {
          try {
              const parsedSizes = JSON.parse(sizesStr);
              if (!Array.isArray(parsedSizes)) throw new Error("Sizes must be an array.");
              updateData.sizes = parsedSizes.map((size: any) => ({
                  name: String(size.name),
                  quantity: Number(size.quantity) >= 0 ? Number(size.quantity) : 0,
                  addOns: Array.isArray(size.addOns) ? size.addOns : [], 
              })) as iProductSize[];
          } catch (e) {
              log("Sizes parsing error:", e);
              return NextResponse.json({ error: "Invalid sizes format (check quantity/addOns structure)." }, { status: 400 });
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

      // --- START IMAGES HANDLING (form-data) ---
      // Delete images
      for (const idx of deleteIndexes.sort((a, b) => b - a)) { 
        if (imagesToSave[idx]) {
          await deleteImagekitFileIfPossible(imagesToSave[idx]);
          imagesToSave.splice(idx, 1);
        }
      }

      // Replace images and append new images
      // ... (Image logic remains the same) ...
      for (let i = 0; i < replaceIndexes.length; i++) {
        const file = imageFiles[i];
        const idx = replaceIndexes[i];
        if (!file) { continue; }

        const buffer = Buffer.from(await file.arrayBuffer());
        const uploaded = await imagekit.upload({ file: buffer, fileName: `${Date.now()}-${file.name}`, folder: "/products/images" });

        if (imagesToSave[idx]) await deleteImagekitFileIfPossible(imagesToSave[idx]);
        imagesToSave[idx] = { url: uploaded.url, fileId: uploaded.fileId };
      }

      const appendStartIndex = replaceIndexes.length;
      for (let i = appendStartIndex; i < imageFiles.length; i++) {
        if (imagesToSave.length >= MAX_IMAGES) break; 
        const file = imageFiles[i];
        const buffer = Buffer.from(await file.arrayBuffer());
        const uploaded = await imagekit.upload({ file: buffer, fileName: `${Date.now()}-${file.name}`, folder: "/products/images" });
        imagesToSave.push({ url: uploaded.url, fileId: uploaded.fileId });
      }

      if (imagesToSave.length === 0) {
        return NextResponse.json({ error: "At least 1 image required" }, { status: 400 });
      }

      updateData.images = imagesToSave; // Final assignment for form-data
      // --- END IMAGES HANDLING (form-data) ---

    } else {
      // JSON updates
      const body = (await req.json().catch(() => ({}))) as any;
      
      // Destructuring for cartLimit
      const { title, description, price, deleteImages, replaceImages, removeCategory, sizes, priority, deleteVideo, video, cartLimit } = body; 

      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (price !== undefined && !Number.isNaN(Number(price))) updateData.price = Number(price);
      
      // Handle category removal or update
      if (removeCategory) {
        updateData.category = null;
      } else if (body.category) {
        updateData.category = body.category;
      }
      
      // ------------------------------------------------------------------
      // ✅ FIXED LOGIC for cartLimit (JSON)
      if (cartLimit !== undefined && cartLimit !== null) {
          const finalLimit = Number(cartLimit);
          // Check for valid number and schema minimum (1)
          if (!Number.isNaN(finalLimit) && finalLimit >= 1) {
              updateData.cartLimit = finalLimit;
          } else if (cartLimit !== "") {
              return NextResponse.json({ error: "Invalid cartLimit value. Must be a number >= 1." }, { status: 400 });
          }
      }
      // ------------------------------------------------------------------

      // --- Handle Sizes Update from JSON [FIXED: Include addOns] ---
      if (sizes !== undefined) {
          if (!Array.isArray(sizes)) {
              return NextResponse.json({ error: "Sizes must be a JSON array." }, { status: 400 });
          }
          updateData.sizes = sizes.map((size: any) => ({
              name: String(size.name),
              quantity: Number(size.quantity) >= 0 ? Number(size.quantity) : 0,
              addOns: Array.isArray(size.addOns) ? size.addOns : [],
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
          if (video === null) {
              if (currentVideo) await deleteImagekitFileIfPossible(currentVideo);
              updateData.video = null;
          } else if (typeof video === 'object' && video.url && video.fileId) {
              updateData.video = video;
          } else {
               return NextResponse.json({ error: "Invalid video format provided in JSON body." }, { status: 400 });
          }
      }
      // --- END VIDEO HANDLING (JSON) ---

      
      // --- START IMAGES HANDLING (JSON) ---
      // Delete images
      if (Array.isArray(deleteImages)) {
        for (const idx of deleteImages.sort((a, b) => b - a)) { 
          if (imagesToSave[idx]) {
            await deleteImagekitFileIfPossible(imagesToSave[idx]);
            imagesToSave.splice(idx, 1);
          }
        }
      }

      // Replace images
      if (Array.isArray(replaceImages)) {
        for (const item of replaceImages) {
          const { idx, url, fileId } = item;
          if (!imagesToSave[idx]) continue;
          await deleteImagekitFileIfPossible(imagesToSave[idx]);
          imagesToSave[idx] = { url, fileId };
        }
      }

      if (imagesToSave.length === 0) {
        return NextResponse.json({ error: "At least 1 image required" }, { status: 400 });
      }

      updateData.images = imagesToSave; // Final assignment for JSON 
      // --- END IMAGES HANDLING (JSON) ---

    }


    const updated = await Product.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
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