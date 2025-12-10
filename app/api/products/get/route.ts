import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/db";
import Product from "@/lib/models/products/product";

// Define a safe, very high number for non-prioritized items
const MAX_PRIORITY_VALUE = 999999; 

export async function GET() {
  try {
    await connectToDatabase();

    const products = await Product.aggregate([
        // 1. Create a temporary sorting field (`sortPriority`)
        {
            $addFields: {
                sortPriority: { $ifNull: ["$priority", MAX_PRIORITY_VALUE] }
            }
        },
        // 2. Sort by the temporary field (ascending), then by newest creation date
        {
            $sort: {
                sortPriority: 1,  
                createdAt: -1     
            }
        },
        // 3. Perform the population step ($lookup)
        {
            $lookup: {
                from: 'users',
                localField: 'reviews.userId',
                foreignField: '_id',
                as: 'populatedUsers' // <--- FIX 1: Rename to a top-level field for easy access
            }
        },
        // 4. Project/Clean up the final shape and remove the temporary fields
        {
            $project: {
                // Include all desired product fields
                title: 1, description: 1, images: 1, video: 1, price: 1, category: 1,
                badges: 1, sizes: 1, priority: 1, createdAt: 1, updatedAt: 1,
                
                // Reconstruct the reviews array
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
                            // Attach populated user data (simplified for structure)
                            user: {
                                $arrayElemAt: [
                                    "$populatedUsers", // <--- FIX 2: Use the new top-level field
                                    { $indexOfArray: ["$populatedUsers._id", "$$review.userId"] } // <--- FIX 3: Reference the new field
                                ]
                            }
                        }
                    }
                }
            }
        },
        // 5. Final cleanup to select only necessary fields from the user
        {
             $project: {
                // All desired product fields are included
                title: 1, description: 1, images: 1, video: 1, price: 1, category: 1,
                badges: 1, sizes: 1, priority: 1, createdAt: 1, updatedAt: 1,
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
                                // Extract specific fields from the user object reconstructed in Stage 4
                                fullName: "$$review.user.fullName",
                                profileImage: "$$review.user.profileImage",
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
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}