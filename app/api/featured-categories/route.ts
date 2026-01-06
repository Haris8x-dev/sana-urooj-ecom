// app/api/featured-categories/route.ts
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/db';
import FeaturedCategories from '@/lib/models/featured/featuredCategoriesSchema';
import Category from '@/lib/models/categories/category';
import Product from '@/lib/models/products/product'; // Required for aggregate calculation
import { Types } from 'mongoose';

function log(...args: any[]) {
    console.log("[/api/featured-categories]", ...args);
}

// =======================================================
// A. GET: Fetch the 3 Featured Categories (Includes Calculated Prices)
// =======================================================
export async function GET() {
    try {
        await connectToDatabase();

        // 1. Find the single FeaturedCategories document
        const featuredDoc = await FeaturedCategories.findOne({});

        if (!featuredDoc || featuredDoc.categoryIds.length === 0) {
            return NextResponse.json(
                { featuredCategories: [], message: "No featured categories set." },
                { status: 200 }
            );
        }

        // 2. Fetch the Categories and their associated Products with the minus logic
        // We use Promise.all to handle the async calculation for each category
        const featuredCategories = await Promise.all(
            featuredDoc.categoryIds.map(async (catId) => {
                const category = await Category.findById(catId).select('_id title description images');
                if (!category) return null;

                // For each featured category, we also want its products to have the discounted price
                const products = await Product.aggregate([
                    { $match: { category: new Types.ObjectId(catId as string) } },
                    {
                        $addFields: {
                            // price = price - badgeAmount (if active)
                            price: {
                                $cond: {
                                    if: { $eq: ["$badges.saveRs.active", true] },
                                    then: { $subtract: ["$price", "$badges.saveRs.amount"] },
                                    else: "$price"
                                }
                            }
                        }
                    },
                    { $sort: { priority: 1, createdAt: -1 } }
                ]);

                // Return category combined with its correctly priced products
                return {
                    ...category.toObject(),
                    products
                };
            })
        );

        // Filter out any nulls in case a category was deleted but still in featuredDoc
        const validCategories = featuredCategories.filter(cat => cat !== null);

        return NextResponse.json(
            { featuredCategories: validCategories },
            { status: 200 }
        );

    } catch (err) {
        log("GET error:", err);
        return NextResponse.json(
            { error: "Failed to fetch featured categories." },
            { status: 500 }
        );
    }
}

// =======================================================
// B. PATCH: Update/Set the 3 Featured Categories
// =======================================================
export async function PATCH(request: Request) {
    try {
        await connectToDatabase();

        const { categoryIds } = await request.json();

        // 1. Basic validation
        if (!Array.isArray(categoryIds) || categoryIds.length !== 3) {
            return NextResponse.json(
                { error: "Must provide an array containing exactly three category IDs." },
                { status: 400 }
            );
        }

        // 2. Validate IDs
        const objectCategoryIds = categoryIds.map((id: string) => {
            if (!Types.ObjectId.isValid(id)) throw new Error("Invalid ObjectId found.");
            return new Types.ObjectId(id);
        });

        // 3. Verify existence
        const existingCount = await Category.countDocuments({ _id: { $in: objectCategoryIds } });
        if (existingCount !== 3) {
            return NextResponse.json(
                { error: "One or more categories do not exist." },
                { status: 404 }
            );
        }

        // 4. Update the document
        const updatedDoc = await FeaturedCategories.findOneAndUpdate(
            {}, 
            { categoryIds: objectCategoryIds }, 
            { new: true, upsert: true, runValidators: true }
        );

        // 5. Populate and return (Re-using the GET logic ensures price consistency after update)
        const finalCategories = await Promise.all(
            updatedDoc.categoryIds.map(async (catId) => {
                const category = await Category.findById(catId).select('_id title description images');
                const products = await Product.aggregate([
                    { $match: { category: new Types.ObjectId(catId as string) } },
                    {
                        $addFields: {
                            price: {
                                $cond: {
                                    if: { $eq: ["$badges.saveRs.active", true] },
                                    then: { $subtract: ["$price", "$badges.saveRs.amount"] },
                                    else: "$price"
                                }
                            }
                        }
                    }
                ]);
                return { ...category?.toObject(), products };
            })
        );

        return NextResponse.json(
            { message: "Featured categories updated.", featuredCategories: finalCategories },
            { status: 200 }
        );

    } catch (err: any) {
        log("PATCH error:", err);
        return NextResponse.json(
            { error: err.message || "Failed to update featured categories." },
            { status: 500 }
        );
    }
}