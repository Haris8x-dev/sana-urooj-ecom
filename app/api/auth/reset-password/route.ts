// app/api/auth/reset-password/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/db";
import User from "@/lib/models/users/user";
import crypto from "crypto";

export async function POST(request: Request) {
    const { token, password } = await request.json();

    if (!token || !password) {
        return NextResponse.json({ error: "Token and password are required." }, { status: 400 });
    }

    if (password.length < 6) {
        return NextResponse.json({ error: "Password must be at least 6 characters long." }, { status: 400 });
    }

    try {
        await connectToDatabase();

        // Hash the token to compare with stored hash
        const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

        // Find user with matching token that hasn't expired
        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpire: { $gt: Date.now() },
        });

        if (!user) {
            return NextResponse.json({
                error: "Invalid or expired reset token."
            }, { status: 400 });
        }

        // Update password (will be hashed by pre-save hook)
        user.password = password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();

        return NextResponse.json({
            ok: true,
            message: "Password reset successful. You can now log in with your new password."
        }, { status: 200 });

    } catch (error) {
        console.error("Reset Password Error:", error);
        return NextResponse.json({ error: "Failed to reset password." }, { status: 500 });
    }
}
