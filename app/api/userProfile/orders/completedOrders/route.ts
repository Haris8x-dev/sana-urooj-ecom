import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/db";
import User from "@/lib/models/users/user";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth";

export async function GET(_req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const userId = session.user.id;

    await connectToDatabase();

    // select fields + pendingOrders + completedOrders
    const user = await User.findById(userId).select(
      "fullName email type profileImage createdAt updatedAt pendingOrders completedOrders"
    );
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const pendingCount = user.pendingOrders?.length || 0;
    const completedCount = user.completedOrders?.length || 0;

    return NextResponse.json({
      user,
      pendingCount,
      completedCount,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch user profile" }, { status: 500 });
  }
}
