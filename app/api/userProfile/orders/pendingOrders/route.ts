import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/db";
import User from "@/lib/models/users/user";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/auth"; // ✅ use this import

export async function GET(_req: Request) {
  try {
    // 1️⃣ Get user session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const userId = session.user.id;

    await connectToDatabase();

    const user = await User.findById(userId).select("pendingOrders");
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ pendingOrders: user.pendingOrders });
  } catch (error) {
    console.error("Error fetching pendingOrders:", error);
    return NextResponse.json({ error: "Failed to fetch pendingOrders" }, { status: 500 });
  }
}
