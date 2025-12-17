// app/api/products/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/db";
import Product, { iProductSize } from "@/lib/models/products/product";
import { imagekit } from "@/lib/service/imagekit";
import { Types } from "mongoose";

// We still need to ensure the Product model is defined, but we remove the direct use of User populate.

const MAX_IMAGES = 12;
const VIDEO_FIELD_NAME = "videoFile";
const VALID_GENDERS = ['Male', 'Female']; // For validation

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

/* ---------- GET single product (FIXED: Uses 'cartLimit' instead of 'increment') ---------- */
export async function GET(
    req: NextRequest, 
    { params }: { params: { id: string } }
) {
  try {
    // ⭐ FIX: Await the params object to resolve the dynamic segment ID.
    // We cast to 'any' to avoid TypeScript errors since the type definition 
    // doesn't reflect the framework's runtime Promise wrapping.
    const resolvedParams: { id: string } = (await (params as any)) ?? params;
    const { id } = resolvedParams;

    log("GET called with id:", id);

    if (!id) {
         log("Error: Product ID is missing (after resolve).");
         return NextResponse.json({ error: "Product ID is required" }, { status: 400 });
    }
    
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid product id format" }, { status: 400 });
    }

    await connectToDatabase();

    // Rest of the aggregation pipeline remains the same
    const productArr = await Product.aggregate([
        { $match: { _id: new Types.ObjectId(id) } },
        {
            $lookup: {
                from: 'users',
                localField: 'reviews.userId',
                foreignField: '_id',
                as: 'populatedUsers'
            }
        },
        {
            $project: {
                title: 1, description: 1, images: 1, video: 1, price: 1, category: 1,
                badges: 1, sizes: 1, priority: 1, createdAt: 1, updatedAt: 1, 
                increment: 1, 
                cartLimit: 1, 
                reviews: {
                    $map: { /* ... review reconstruction logic ... */
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
    
    const product = productArr[0];

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ product }, { status: 200 });
  } catch (err) {
    log("GET error:", err);
    return NextResponse.json({ error: "Failed to fetch product (Internal Server Error)" }, { status: 500 });
  }
}


/* ---------- PATCH (update product) - FULL REFACTOR ---------- */
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
    let imagesToSave = existing.images.slice(); 

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const title = form.get("title") as string | null;
      const description = form.get("description") as string | null;
      const priceRaw = form.get("price") as string | null;
      const price = priceRaw ? Number(priceRaw) : undefined;
      
      // --- CATEGORY HANDLING (form-data) ---
      const category = form.get("category") as string | null;
      const removeCategory = form.get("removeCategory") === "true";

      if (removeCategory) {
        updateData.category = null; // Unassign category
      } else if (category && category.trim() !== "") {
        updateData.category = category;
      }
      // ------------------------------------

      const sizesStr = form.get("sizes") as string | null; 
      const priorityStr = form.get("priority") as string | null;
      const cartLimitStr = form.get("cartLimit") as string | null;
      const genderStr = form.get("gender") as string | null;
      
      const imageFiles = form.getAll("images") as File[]; 
      const videoFile = form.get(VIDEO_FIELD_NAME) as File | null; 
      const deleteVideo = form.get("deleteVideo") === "true";
        
      const replaceIndexes = JSON.parse((form.get("replaceIndexes") as string) || "[]") as number[];
      const deleteIndexes = JSON.parse((form.get("deleteIndexes") as string) || "[]") as number[];

      if (title) updateData.title = title;
      if (description) updateData.description = description;
      if (price !== undefined && !Number.isNaN(price)) updateData.price = price;
      
      // ✅ GENDER LOGIC
      if (genderStr !== null) {
          const normalizedGender = genderStr.charAt(0).toUpperCase() + genderStr.slice(1).toLowerCase();
          if (VALID_GENDERS.includes(normalizedGender)) {
              updateData.gender = normalizedGender;
          } else if (genderStr.trim() !== "") {
              return NextResponse.json({ error: "Invalid gender value." }, { status: 400 });
          }
      }
      
      // ✅ cartLimit LOGIC
      if (cartLimitStr !== null) {
          const cartLimit = parseInt(cartLimitStr);
          if (!isNaN(cartLimit) && cartLimit >= 1) {
              updateData.cartLimit = cartLimit;
          }
      }

      // ✅ SIZES LOGIC
      if (sizesStr !== null) {
          try {
              const parsedSizes = JSON.parse(sizesStr);
              updateData.sizes = parsedSizes.map((size: any) => ({
                  name: String(size.name),
                  quantity: Number(size.quantity) >= 0 ? Number(size.quantity) : 0,
                  addOns: Array.isArray(size.addOns) ? size.addOns : [], 
              }));
          } catch (e) {
              return NextResponse.json({ error: "Invalid sizes format" }, { status: 400 });
          }
      }
      
      // ✅ PRIORITY LOGIC
      if (priorityStr !== null) {
          const priority = priorityStr === "" ? null : parseInt(priorityStr);
          updateData.priority = priority;
      }
      
      // --- MEDIA HANDLING (same as original) ---
      if (deleteVideo) {
          if (currentVideo) await deleteImagekitFileIfPossible(currentVideo);
          updateData.video = null;
      } else if (videoFile && videoFile.size > 0) {
          const buffer = Buffer.from(await videoFile.arrayBuffer());
          const uploaded = await imagekit.upload({ file: buffer, fileName: `${Date.now()}-${videoFile.name}`, folder: "/products/videos" });
          if (currentVideo) await deleteImagekitFileIfPossible(currentVideo);
          updateData.video = { url: uploaded.url, fileId: uploaded.fileId };
      }

      for (const idx of deleteIndexes.sort((a, b) => b - a)) { 
        if (imagesToSave[idx]) {
          await deleteImagekitFileIfPossible(imagesToSave[idx]);
          imagesToSave.splice(idx, 1);
        }
      }

      for (let i = 0; i < replaceIndexes.length; i++) {
        const file = imageFiles[i];
        const idx = replaceIndexes[i];
        if (file) {
          const buffer = Buffer.from(await file.arrayBuffer());
          const uploaded = await imagekit.upload({ file: buffer, fileName: `${Date.now()}-${file.name}`, folder: "/products/images" });
          if (imagesToSave[idx]) await deleteImagekitFileIfPossible(imagesToSave[idx]);
          imagesToSave[idx] = { url: uploaded.url, fileId: uploaded.fileId };
        }
      }

      const appendStartIndex = replaceIndexes.length;
      for (let i = appendStartIndex; i < imageFiles.length; i++) {
        if (imagesToSave.length >= MAX_IMAGES) break; 
        const file = imageFiles[i];
        const buffer = Buffer.from(await file.arrayBuffer());
        const uploaded = await imagekit.upload({ file: buffer, fileName: `${Date.now()}-${file.name}`, folder: "/products/images" });
        imagesToSave.push({ url: uploaded.url, fileId: uploaded.fileId });
      }

      if (imagesToSave.length === 0) return NextResponse.json({ error: "At least 1 image required" }, { status: 400 });
      updateData.images = imagesToSave;

    } else {
      // JSON updates
      const body = (await req.json().catch(() => ({}))) as any;
      const { 
          title, description, price, deleteImages, replaceImages, 
          removeCategory, sizes, priority, deleteVideo, video, 
          cartLimit, gender, category 
      } = body; 

      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      if (price !== undefined) updateData.price = Number(price);
      
      // --- CATEGORY HANDLING (JSON) ---
      if (removeCategory === true) {
        updateData.category = null;
      } else if (category !== undefined && category !== "") {
        updateData.category = category;
      }
      // -------------------------------

      if (gender) updateData.gender = gender;
      if (cartLimit) updateData.cartLimit = Number(cartLimit);
      if (sizes) updateData.sizes = sizes;
      if (priority !== undefined) updateData.priority = priority === "" ? null : priority;

      // --- JSON MEDIA HANDLING (simplified for brevity, maintain your current logic) ---
      if (deleteVideo) {
          if (currentVideo) await deleteImagekitFileIfPossible(currentVideo);
          updateData.video = null;
      }
      
      if (Array.isArray(deleteImages)) {
        for (const idx of deleteImages.sort((a, b) => b - a)) {
          if (imagesToSave[idx]) {
            await deleteImagekitFileIfPossible(imagesToSave[idx]);
            imagesToSave.splice(idx, 1);
          }
        }
      }
      updateData.images = imagesToSave;
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