// app/api/categories/get/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/db";
import Category from "@/lib/models/categories/category";

function log(...args: any[]) {
  console.log("[/api/categories/get]", ...args);
}

// Define a safe, very high number for non-prioritized items
const MAX_PRIORITY_VALUE = 999999; 

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    
    // Use the aggregation pipeline for reliable null-last sorting
    const categories = await Category.aggregate([
        // 1. Create a temporary sorting field (`sortPriority`)
        //    If 'priority' is null (or missing), use MAX_PRIORITY_VALUE. Otherwise, use the actual priority.
        {
            $addFields: {
                sortPriority: { $ifNull: ["$priority", MAX_PRIORITY_VALUE] }
            }
        },
        // 2. Sort by the temporary field (ascending)
        //    All categories with a real number (1, 2, 3...) will come before 999999.
        {
            $sort: {
                sortPriority: 1,  // Sorts 1, 2, 3... then 999999
                createdAt: -1     // Secondary sort by newest first
            }
        },
        // 3. Clean up the response (Remove the temporary field)
        {
            $project: {
                sortPriority: 0 // Exclude the temporary field from the final output
            }
        }
    ]);

    return NextResponse.json({ categories }, { status: 200 });
  } catch (err) {
    log("GET error:", err);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}