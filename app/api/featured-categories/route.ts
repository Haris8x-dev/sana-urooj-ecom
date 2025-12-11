// app/api/featured-categories/route.ts
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/db';
import FeaturedCategories, { IPopulatedCategory, ICategoryImage } from '@/lib/models/featured/featuredCategoriesSchema';
import Category from '@/lib/models/categories/category';
import { Types } from 'mongoose';

function log(...args: any[]) {
    console.log("[/api/featured-categories]", ...args);
}

// Select all necessary fields including the complete images array with url and fileId
const REQUIRED_CATEGORY_FIELDS = '_id title description images';

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
                { featuredCategories: [], message: "No featured categories set." },
                { status: 200 }
            );
        }

        // 2. Fetch the full Category documents using the IDs and Mongoose populate
        // NOTE: The 'select' field dictates the details returned.
        const populatedDoc = await featuredDoc.populate({
            path: 'categoryIds',
            model: Category,
            select: REQUIRED_CATEGORY_FIELDS, // Use the consistent field list
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

        const { categoryIds } = await request.json();

        // 1. Basic validation
        if (!Array.isArray(categoryIds) || categoryIds.length !== 3) {
            return NextResponse.json(
                { error: "Must provide an array containing exactly three category IDs." },
                { status: 400 }
            );
        }

        // 2. Validate IDs are valid Mongoose ObjectIds
        // NOTE: We must convert strings to ObjectIds for Mongoose queries if we are using the array directly.
        const objectCategoryIds = categoryIds.map((id: string) => {
            if (!Types.ObjectId.isValid(id)) {
                throw new Error("Invalid ObjectId found.");
            }
            return new Types.ObjectId(id);
        });

        // 3. Optional: Verify these categories actually exist (recommended)
        const existingCount = await Category.countDocuments({ _id: { $in: objectCategoryIds } });
        if (existingCount !== 3) {
            return NextResponse.json(
                { error: "One or more categories do not exist in the database." },
                { status: 404 }
            );
        }

        // 4. Update or Create the single FeaturedCategories document
        const updatedDoc = await FeaturedCategories.findOneAndUpdate(
            {}, // Query: Find any document (since we only expect one)
            { categoryIds: objectCategoryIds }, // Update: Set the new array of IDs (using ObjectIds)
            {
                new: true,
                upsert: true,
                runValidators: true
            }
        );

        // 5. Respond with the populated document
        const populatedDoc: any = updatedDoc; // Cast for population stability

        const finalPopulated = await populatedDoc.populate({
            path: 'categoryIds',
            model: Category,
            select: REQUIRED_CATEGORY_FIELDS, // Use the consistent field list
        });

        return NextResponse.json(
            { message: "Featured categories updated successfully.", featuredCategories: finalPopulated.categoryIds },
            { status: 200 }
        );

    } catch (err: any) {
        log("PATCH error:", err);
        if (err.message === "Invalid ObjectId found.") {
            return NextResponse.json({ error: "One or more provided IDs are invalid Mongoose ObjectIds." }, { status: 400 });
        }
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