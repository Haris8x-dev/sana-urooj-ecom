import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/db";
import Product, { iProductSize } from "@/lib/models/products/product";
import { imagekit } from "@/lib/service/imagekit";
import { Types } from "mongoose";

const MAX_IMAGES = 12;
const VIDEO_FIELD_NAME = "videoFile";
const VALID_GENDERS = ['Male', 'Female'];

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


/* ---------- GET: Fetch Product (Includes totalPrice from DB) ---------- */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (!id || !Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid product id format" }, { status: 400 });
    }

    await connectToDatabase();

    // We use aggregate to populate reviews with user data
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
          title: 1,
          description: 1,
          images: 1,
          video: 1,
          price: 1,      // Original price (Crossed out price on UI)
          totalPrice: 1, // Pre-calculated final price (from Schema)
          category: 1,
          gender: 1,
          badges: 1,
          sizes: 1,
          priority: 1,
          cartLimit: 1,
          createdAt: 1,
          updatedAt: 1,
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

    const product = productArr[0];
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ product }, { status: 200 });
    
  } catch (err) {
    log("GET error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

/* ---------- PATCH: Update Product (Maintains Original Price in DB) ---------- */
export async function PATCH(req: NextRequest, { params }: { params: any }) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id as string;

    await connectToDatabase();
    const existing = await Product.findById(id);
    if (!existing) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    const contentType = req.headers.get("content-type") || "";
    const updateData: any = {};
    let imagesToSave = existing.images.slice(); 

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      
      const title = form.get("title");
      const description = form.get("description");
      const priceRaw = form.get("price");
      const genderStr = form.get("gender");
      const cartLimitStr = form.get("cartLimit");
      const category = form.get("category");
      const removeCategory = form.get("removeCategory") === "true";
      
      const badgeActiveStr = form.get("badgeActive");
      const badgeAmountStr = form.get("badgeAmount");

      // Save the raw base price to DB
      if (priceRaw) updateData.price = Number(priceRaw);

      if (badgeActiveStr !== null || badgeAmountStr !== null) {
          updateData.badges = {
              saveRs: {
                  active: badgeActiveStr !== null ? badgeActiveStr === "true" : existing.badges.saveRs.active,
                  amount: badgeAmountStr !== null ? Number(badgeAmountStr) : existing.badges.saveRs.amount
              }
          };
      }

      if (title) updateData.title = title;
      if (description) updateData.description = description;

      if (removeCategory) updateData.category = null;
      else if (category) updateData.category = category;

      if (genderStr) {
          const normalized = (genderStr as string).charAt(0).toUpperCase() + (genderStr as string).slice(1).toLowerCase();
          if (VALID_GENDERS.includes(normalized)) updateData.gender = normalized;
      }
      if (cartLimitStr) updateData.cartLimit = parseInt(cartLimitStr as string);

      // Media Handling
      const videoFile = form.get(VIDEO_FIELD_NAME) as File | null;
      const deleteVideo = form.get("deleteVideo") === "true";
      if (deleteVideo) {
          await deleteImagekitFileIfPossible(existing.video);
          updateData.video = null;
      } else if (videoFile && videoFile.size > 0) {
          const buffer = Buffer.from(await videoFile.arrayBuffer());
          const uploaded = await imagekit.upload({ file: buffer, fileName: `v-${Date.now()}`, folder: "/products/videos" });
          await deleteImagekitFileIfPossible(existing.video);
          updateData.video = { url: uploaded.url, fileId: uploaded.fileId };
      }

      // Image Logic
      const deleteIndexes = JSON.parse((form.get("deleteIndexes") as string) || "[]") as number[];
      const replaceIndexes = JSON.parse((form.get("replaceIndexes") as string) || "[]") as number[];
      const imageFiles = form.getAll("images") as File[];

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
              const uploaded = await imagekit.upload({ file: buffer, fileName: `img-${Date.now()}`, folder: "/products/images" });
              await deleteImagekitFileIfPossible(imagesToSave[idx]);
              imagesToSave[idx] = { url: uploaded.url, fileId: uploaded.fileId };
          }
      }
      const appendFiles = imageFiles.slice(replaceIndexes.length);
      for (const file of appendFiles) {
          if (imagesToSave.length >= MAX_IMAGES) break;
          const buffer = Buffer.from(await file.arrayBuffer());
          const uploaded = await imagekit.upload({ file: buffer, fileName: `img-${Date.now()}`, folder: "/products/images" });
          imagesToSave.push({ url: uploaded.url, fileId: uploaded.fileId });
      }
      updateData.images = imagesToSave;

    } else {
      const body = await req.json();
      if (body.price !== undefined) updateData.price = Number(body.price);
      if (body.badges) updateData.badges = body.badges;
      if (body.title) updateData.title = body.title;
      if (body.description) updateData.description = body.description;
      if (body.gender) updateData.gender = body.gender;
      if (body.category !== undefined) updateData.category = body.category;
    }

    const updated = await Product.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    return NextResponse.json({ message: "Product updated", product: updated }, { status: 200 });

  } catch (err: any) {
    log("PATCH error:", err);
    return NextResponse.json({ error: err.message || "Update failed" }, { status: 500 });
  }
}

/* ---------- DELETE ---------- */
export async function DELETE(req: NextRequest, { params }: { params: any }) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id as string;

    if (!id || !Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid product id" }, { status: 400 });
    }

    await connectToDatabase();
    const product = await Product.findById(id);
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    for (const img of product.images || []) await deleteImagekitFileIfPossible(img);
    if (product.video) await deleteImagekitFileIfPossible(product.video);
    
    await Product.findByIdAndDelete(id);
    return NextResponse.json({ message: "Product deleted" }, { status: 200 });

  } catch (err) {
    log("DELETE error:", err);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}