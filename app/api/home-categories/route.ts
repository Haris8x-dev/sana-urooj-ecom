import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/db";
import Category from "@/lib/models/categories/category";
import Product from "@/lib/models/products/product";

// Define a safe, very high number for non-prioritized items
const MAX_PRIORITY_VALUE = 999999; 

/**
 * GET handler to fetch all categories, sorted by priority, 
 * with their associated products also sorted by priority.
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
            // Stage 2: Sort Categories by their priority (1 is highest)
            {
                $sort: {
                    sortPriority: 1,  
                    createdAt: 1
                }
            },
            // --- NEW STAGE: Clean up temporary category sort field immediately ---
            {
                $unset: ["sortPriority"] 
            },
            // Stage 4 (formerly 3): Look up Products associated with this Category
            {
                $lookup: {
                    from: Product.collection.name, 
                    localField: '_id', 
                    foreignField: 'category', 
                    as: 'products'
                }
            },
            // Stage 5 (formerly 4): Process the 'products' array to apply custom sorting
            {
                $addFields: {
                    products: {
                        $map: {
                            input: "$products",
                            as: "product",
                            in: {
                                // Reconstruct the product fields, adding a temporary sort field
                                _id: "$$product._id",
                                title: "$$product.title",
                                images: "$$product.images",
                                video: "$$product.video", // Include video
                                price: "$$product.price",
                                sizes: "$$product.sizes",
                                priority: "$$product.priority",
                                // Temporary field for sorting products (nulls last)
                                productSortPriority: { $ifNull: ["$$product.priority", MAX_PRIORITY_VALUE] }
                            }
                        }
                    }
                }
            },
            // Stage 6 (formerly 5): Sort the array of products within the document
            {
                $addFields: {
                    products: {
                        $sortArray: {
                            input: "$products",
                            // Sort products: priority ascending, createdAt descending
                            sortBy: { productSortPriority: 1, createdAt: -1 } 
                        }
                    }
                }
            },
            // Stage 7 (formerly 6): Final Projection - Clean up product's temporary sort field
            {
                $project: {
                    // Category fields (simple inclusion)
                    _id: 1,
                    title: 1,
                    slug: 1,
                    description: 1,
                    image: 1,
                    priority: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    
                    // Clean up product fields within the array (using $map)
                    products: {
                        $map: {
                            input: "$products",
                            as: "product",
                            in: {
                                _id: "$$product._id",
                                title: "$$product.title",
                                images: "$$product.images",
                                video: "$$product.video", 
                                price: "$$product.price",
                                sizes: "$$product.sizes",
                                priority: "$$product.priority",
                                // The productSortPriority field is implicitly excluded here
                            }
                        }
                    },
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