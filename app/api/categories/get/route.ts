import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/db";
import Category from "@/lib/models/categories/category";

function log(...args: any[]) {
  console.log("[/api/categories/get]", ...args);
}

const MAX_PRIORITY_VALUE = 999999; 

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    
    const categories = await Category.aggregate([
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
        {
            $project: {
                sortPriority: 0 
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