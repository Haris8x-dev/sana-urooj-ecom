import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/db";
import User from "@/lib/models/users/user";
import { imagekit } from "@/lib/service/imagekit";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth";

// PATCH → update profile image
export async function PATCH(req: NextRequest) {
  try {
    // 1️⃣ Get user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const userId = session.user.id;

    await connectToDatabase();
    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json({ error: "Content-type must be multipart/form-data" }, { status: 400 });
    }

    const form = await req.formData();
    const file = form.get("profileImage") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided under key 'profileImage'" }, { status: 400 });

    // Delete old image from ImageKit if exists
    if (user.profileImage?.fileId) {
      try {
        await imagekit.deleteFile(user.profileImage.fileId);
      } catch (err) {
        console.warn("Failed to delete old profile image in ImageKit:", err);
      }
    }

    // Upload new image
    const buffer = Buffer.from(await file.arrayBuffer());
    const uploaded = await imagekit.upload({
      file: buffer,
      fileName: `profile_${userId}_${Date.now()}-${file.name}`,
    });

    // Save as object in MongoDB
    user.profileImage = {
      url: uploaded.url,
      fileId: uploaded.fileId,
    };
    await user.save();

    return NextResponse.json({ message: "Profile image updated", profileImage: user.profileImage }, { status: 200 });

  } catch (err) {
    console.error("Profile image update error:", err);
    return NextResponse.json({ error: "Failed to update profile image" }, { status: 500 });
  }
}

// DELETE → remove profile image
export async function DELETE(req: NextRequest) {
  try {
    // 1️⃣ Get user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const userId = session.user.id;

    await connectToDatabase();
    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    // Delete old image from ImageKit if exists
    if (user.profileImage?.fileId) {
      try {
        await imagekit.deleteFile(user.profileImage.fileId);
      } catch (err) {
        console.warn("Failed to delete old profile image in ImageKit:", err);
      }
    }

    // Reset profileImage to first letter of fullName
    user.profileImage = {
      url: user.fullName[0].toUpperCase(),
      fileId: "",
    };
    await user.save();

    return NextResponse.json({ message: "Profile image deleted", profileImage: user.profileImage }, { status: 200 });

  } catch (err) {
    console.error("DELETE profile image error:", err);
    return NextResponse.json({ error: "Failed to delete profile image" }, { status: 500 });
  }
}
