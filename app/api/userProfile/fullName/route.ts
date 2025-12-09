import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/db";
import User from "@/lib/models/users/user";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth";

export async function PATCH(request: NextRequest) {
  try {
    // 1️⃣ Get user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const userId = session.user.id;

    const { fullName } = await request.json();
    if (!fullName || typeof fullName !== "string") {
      return NextResponse.json({ error: "fullName is required" }, { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    user.fullName = fullName;
    await user.save();

    return NextResponse.json(
      { message: "Full name updated successfully", fullName: user.fullName },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update full name" }, { status: 500 });
  }
}
