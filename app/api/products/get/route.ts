import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/db";
import Product from "@/lib/models/products/product";

const MAX_PRIORITY_VALUE = 999999; 

export async function GET() {
  try {
    await connectToDatabase();

    const products = await Product.aggregate([
        // 1. Priority Sorting (Custom logic to keep null priorities at the end)
        {
            $addFields: {
                sortPriority: { $ifNull: ["$priority", MAX_PRIORITY_VALUE] }
            }
        },
        {
            $sort: {
                sortPriority: 1,  
                createdAt: -1     
            }
        },
        // 2. Lookup Users for Reviews population
        {
            $lookup: {
                from: 'users',
                localField: 'reviews.userId',
                foreignField: '_id',
                as: 'populatedUsers'
            }
        },
        // 3. Stock Calculation & Sold Out Status
        {
            $addFields: {
                totalStock: { $sum: "$sizes.quantity" }
            }
        },
        {
            $addFields: {
                isSoldOut: { $eq: ["$totalStock", 0] }
            }
        },
        // 4. Final Projection
        // We now fetch 'price' and 'totalPrice' directly from the DB
        {
            $project: {
                title: 1, 
                description: 1, 
                images: 1, 
                video: 1, 
                price: 1,      // Original Price (Strikethrough on UI)
                totalPrice: 1, // Final Discounted Price (stored via Schema middleware)
                category: 1,
                badges: 1, 
                sizes: 1, 
                priority: 1, 
                createdAt: 1, 
                updatedAt: 1,
                cartLimit: 1, 
                gender: 1, 
                isSoldOut: 1,
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
                            user: {
                                fullName: { 
                                    $arrayElemAt: ["$populatedUsers.fullName", { $indexOfArray: ["$populatedUsers._id", "$$review.userId"] }] 
                                },
                                profileImage: { 
                                    $arrayElemAt: ["$populatedUsers.profileImage", { $indexOfArray: ["$populatedUsers._id", "$$review.userId"] }] 
                                }
                            }
                        }
                    }
                }
            }
        }
    ]);

    return NextResponse.json({ products }, { status: 200 });
  } catch (error) {
    console.error("GET products error:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}