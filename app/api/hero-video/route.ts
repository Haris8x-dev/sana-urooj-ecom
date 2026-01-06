// app/api/hero-video/route.ts
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/db';
import { imagekit } from '@/lib/service/imagekit'; 
import HeroVideo from '@/lib/models/video/videoSchema'; // Assuming this is the correct path

// --- HELPER FUNCTION: Deletes old file from ImageKit ---
async function deleteOldVideo(fileId: string) {
    try {
        await imagekit.deleteFile(fileId);
        console.log(`ImageKit: Successfully deleted old file: ${fileId}`);
    } catch (error) {
        console.error(`ImageKit: Failed to delete file ${fileId}.`, error);
    }
}

// =======================================================
// A. GET: Fetch the Current Hero Video (No change needed)
// =======================================================
export async function GET() {
    try {
        await connectToDatabase();
        
        const video = await HeroVideo.findOne({});

        if (!video) {
            return NextResponse.json({ message: "No hero video currently set." }, { status: 200 });
        }

        return NextResponse.json(video, { status: 200 });

    } catch (error) {
        console.error("GET Hero Video Error:", error);
        return NextResponse.json({ error: "Failed to fetch hero video." }, { status: 500 });
    }
}

// =======================================================
// B. POST: Upload Initial Hero Video (Fix Applied)
// =======================================================
export async function POST(request: Request) {
    try {
        await connectToDatabase();

        const existingVideo = await HeroVideo.findOne({});
        if (existingVideo) {
             return NextResponse.json({ error: "A hero video already exists. Use PATCH to update it." }, { status: 409 });
        }
        
        const formData = await request.formData();
        
        // FIX: Cast file to 'File' type to access 'name' property
        const file = formData.get('file') as File | null; 
        
        if (!file) {
            return NextResponse.json({ error: "Video file is required." }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        // FIX applied here: 'file.name' is now valid
        const fileName = `${Date.now()}-${file.name.replace(/\s/g, '_')}`; 

        // 1. Upload to ImageKit
        const uploadResponse = await imagekit.upload({
            file: buffer,
            fileName: fileName,
            folder: '/hero_videos',
            useUniqueFileName: true,
        });

        // 2. Store details in MongoDB
        const newVideo = await HeroVideo.create({
            videoUrl: uploadResponse.url,
            fileId: uploadResponse.fileId,
        });

        return NextResponse.json(newVideo, { status: 201 });

    } catch (error) {
        console.error("POST Hero Video Error:", error);
        return NextResponse.json({ error: "Failed to upload initial hero video." }, { status: 500 });
    }
}

// =======================================================
// C. PATCH: Replace Existing Hero Video (Fix Applied)
// =======================================================
export async function PATCH(request: Request) {
    try {
        await connectToDatabase();

        const existingVideo = await HeroVideo.findOne({});
        if (!existingVideo) {
            return NextResponse.json({ error: "No existing hero video to patch. Use POST for initial upload." }, { status: 404 });
        }
        
        const formData = await request.formData();
        
        // FIX: Cast file to 'File' type to access 'name' property
        const file = formData.get('file') as File | null; 

        if (!file) {
            return NextResponse.json({ error: "New video file is required for update." }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        // FIX applied here: 'file.name' is now valid
        const fileName = `${Date.now()}-update-${file.name.replace(/\s/g, '_')}`;
        
        // --- CRITICAL STEP 1: Delete Old File ---
        await deleteOldVideo(existingVideo.fileId);

        // 2. Upload New File to ImageKit
        const uploadResponse = await imagekit.upload({
            file: buffer,
            fileName: fileName,
            folder: '/hero_videos',
            useUniqueFileName: true,
        });

        // 3. Update MongoDB entry with new details
        existingVideo.videoUrl = uploadResponse.url;
        existingVideo.fileId = uploadResponse.fileId;
        existingVideo.uploadDate = new Date();
        
        await existingVideo.save();

        return NextResponse.json(existingVideo, { status: 200 });

    } catch (error) {
        console.error("PATCH Hero Video Error:", error);
        return NextResponse.json({ error: "Failed to replace hero video." }, { status: 500 });
    }
}