import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/db";
import User from "@/lib/models/users/user";

// PATCH: update isAdmin flag
export async function PATCH(request: NextRequest, context: { params: { userId: string } | Promise<{ userId: string }> }) {
  try {
    const params = await context.params; // <-- unwrap Promise
    const { userId } = params;

    const { isAdmin } = await request.json();
    if (typeof isAdmin !== "boolean") {
      return NextResponse.json({ error: "isAdmin must be boolean" }, { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    user.isAdmin = isAdmin;
    await user.save();

    return NextResponse.json({ message: "User updated successfully", user }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

// DELETE: delete user
export async function DELETE(request: NextRequest, context: { params: { userId: string } | Promise<{ userId: string }> }) {
  try {
    const params = await context.params; // <-- unwrap Promise
    const { userId } = params;

    await connectToDatabase();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await User.findByIdAndDelete(userId);

    return NextResponse.json({ message: "User deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
