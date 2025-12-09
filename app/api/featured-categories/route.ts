// app/api/featured-categories/route.ts
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/db';
import FeaturedCategories from '@/lib/models/featured/featuredCategoriesSchema';
import Category from '@/lib/models/categories/category'; // Your existing Category model
import { Types } from 'mongoose';

function log(...args: any[]) {
    console.log("[/api/featured-categories]", ...args);
}

// =======================================================
// A. GET: Fetch the 3 Featured Categories (for Homepage Display)
// =======================================================
export async function GET() {
    try {
        await connectToDatabase();

        // 1. Find the single FeaturedCategories document
        const featuredDoc = await FeaturedCategories.findOne({});

        if (!featuredDoc || featuredDoc.categoryIds.length === 0) {
            return NextResponse.json(
                { featuredCategories: [] , message: "No featured categories set." }, 
                { status: 200 }
            );
        }

        // 2. Fetch the full Category documents using the IDs and Mongoose populate
        // NOTE: We rely on the 'ref: Category' property in the schema.
        const populatedDoc = await featuredDoc.populate({
            path: 'categoryIds',
            model: Category,
            select: '_id title description images', // Select fields needed for display
        });
        
        // Ensure only valid categories are returned (in case a referenced category was deleted)
        const categories = populatedDoc.categoryIds.filter(cat => cat !== null);

        return NextResponse.json(
            { featuredCategories: categories }, 
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
// B. PATCH: Update/Set the 3 Featured Categories (for Admin Panel)
// =======================================================
export async function PATCH(request: Request) {
    try {
        await connectToDatabase();
        
        const { categoryIds } = await request.json(); // Expects an array of 3 IDs: ["id1", "id2", "id3"]

        // 1. Basic validation
        if (!Array.isArray(categoryIds) || categoryIds.length !== 3) {
            return NextResponse.json(
                { error: "Must provide an array containing exactly three category IDs." }, 
                { status: 400 }
            );
        }

        // 2. Validate IDs are valid Mongoose ObjectIds
        const validIds = categoryIds.every(id => Types.ObjectId.isValid(id));
        if (!validIds) {
            return NextResponse.json(
                { error: "One or more provided IDs are invalid Mongoose ObjectIds." }, 
                { status: 400 }
            );
        }
        
        // 3. Optional: Verify these categories actually exist (recommended)
        const existingCount = await Category.countDocuments({ _id: { $in: categoryIds } });
        if (existingCount !== 3) {
            return NextResponse.json(
                { error: "One or more categories do not exist in the database." }, 
                { status: 404 }
            );
        }

        // 4. Update or Create the single FeaturedCategories document
        const updatedDoc = await FeaturedCategories.findOneAndUpdate(
            {}, // Query: Find any document (since we only expect one)
            { categoryIds: categoryIds }, // Update: Set the new array of IDs
            { 
                new: true, 
                upsert: true, // Create the document if it doesn't exist
                runValidators: true // Run the validator that ensures array length is 3
            }
        );

        // 5. Respond with the populated document (optional but helpful for immediate feedback)
        const populatedDoc = await updatedDoc.populate({
            path: 'categoryIds',
            model: Category,
            select: '_id title images',
        });

        return NextResponse.json(
            { message: "Featured categories updated successfully.", featuredCategories: populatedDoc.categoryIds }, 
            { status: 200 }
        );

    } catch (err: any) {
        log("PATCH error:", err);
        // Catch validation errors from the schema (e.g., if array length wasn't 3)
        if (err.name === 'ValidationError') {
             return NextResponse.json({ error: err.message }, { status: 400 });
        }
        return NextResponse.json(
            { error: "Failed to update featured categories." }, 
            { status: 500 }
        );
    }
}