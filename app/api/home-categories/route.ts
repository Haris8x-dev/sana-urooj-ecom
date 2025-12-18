import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/db";
import Category from "@/lib/models/categories/category";
import Product from "@/lib/models/products/product";

// Define a safe, very high number for non-prioritized items
const MAX_PRIORITY_VALUE = 999999; 

/**
 * GET handler to fetch all categories, sorted by priority, 
 * with their associated products (and calculated discounted prices).
 */
export async function GET() {
    try {
        await connectToDatabase();
        
        const homeCategories = await Category.aggregate([
            // Stage 1: Create a temporary sorting field for the Category
            {
                $addFields: {
                    sortPriority: { $ifNull: ["$priority", MAX_PRIORITY_VALUE] }
                }
            },
            // Stage 2: Sort Categories by their priority
            {
                $sort: {
                    sortPriority: 1,  
                    createdAt: 1
                }
            },
            // Stage 3: Clean up temporary category sort field
            {
                $unset: ["sortPriority"] 
            },
            // Stage 4: Look up Products associated with this Category
            {
                $lookup: {
                    from: Product.collection.name, 
                    localField: '_id', 
                    foreignField: 'category', 
                    as: 'products'
                }
            },
            // Stage 5: Process the 'products' array to apply Price Minus Logic and Sort Fields
            {
                $addFields: {
                    products: {
                        $map: {
                            input: "$products",
                            as: "product",
                            in: {
                                _id: "$$product._id",
                                title: "$$product.title",
                                images: "$$product.images",
                                video: "$$product.video",
                                // --- MINUS CALCULATION LOGIC ---
                                // Overwrites the price with (price - amount) if saveRs badge is active
                                price: {
                                    $cond: {
                                        if: { $eq: ["$$product.badges.saveRs.active", true] },
                                        then: { $subtract: ["$$product.price", "$$product.badges.saveRs.amount"] },
                                        else: "$$product.price"
                                    }
                                },
                                badges: "$$product.badges",
                                sizes: "$$product.sizes",
                                priority: "$$product.priority",
                                createdAt: "$$product.createdAt",
                                // Temporary field for sorting products within the array
                                productSortPriority: { $ifNull: ["$$product.priority", MAX_PRIORITY_VALUE] }
                            }
                        }
                    }
                }
            },
            // Stage 6: Sort the array of products within the document
            {
                $addFields: {
                    products: {
                        $sortArray: {
                            input: "$products",
                            sortBy: { productSortPriority: 1, createdAt: -1 } 
                        }
                    }
                }
            },
            // Stage 7: Final Projection
            {
                $project: {
                    _id: 1,
                    title: 1,
                    slug: 1,
                    description: 1,
                    image: 1,
                    priority: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    products: {
                        $map: {
                            input: "$products",
                            as: "p",
                            in: {
                                _id: "$$p._id",
                                title: "$$p.title",
                                images: "$$p.images",
                                video: "$$p.video", 
                                price: "$$p.price", // This is the calculated price
                                badges: "$$p.badges",
                                sizes: "$$p.sizes",
                                priority: "$$p.priority"
                            }
                        }
                    }
                }
            }
        ]);

        return NextResponse.json({ categories: homeCategories }, { status: 200 });

    } catch (error) {
        console.error("GET home-categories error:", error);
        return NextResponse.json(
            { error: "Failed to fetch home categories" },
            { status: 500 }
        );
    }
}