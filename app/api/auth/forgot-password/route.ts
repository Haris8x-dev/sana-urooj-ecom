// app/api/auth/forgot-password/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/db";
import User from "@/lib/models/users/user";
import { generatePasswordResetToken } from "@/lib/utils/token-utils";
import { sendPasswordResetEmail } from "@/lib/utils/email-utils";

const TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour expiry

export async function POST(request: Request) {
    const { email } = await request.json();

    if (!email) {
        return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    try {
        await connectToDatabase();

        const user = await User.findOne({ email: email.toLowerCase(), provider: "credentials" });

        // SECURITY: Always return a success response to prevent email enumeration.
        if (!user) {
            return NextResponse.json({
                ok: true,
                message: "If an account exists, a password reset link has been sent."
            }, { status: 200 });
        }

        // 1. Generate and store the reset token
        const { token, hashedToken } = generatePasswordResetToken();

        user.resetPasswordToken = hashedToken;
        user.resetPasswordExpire = new Date(Date.now() + TOKEN_EXPIRY_MS);

        await user.save({ validateBeforeSave: false });

        // 2. Construct the reset link
        const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;

        // 3. Send Email
        await sendPasswordResetEmail(user.email, user.userName, resetUrl);

        return NextResponse.json({
            ok: true,
            message: "Password reset link sent to your email."
        }, { status: 200 });

    } catch (error) {
        console.error("Forgot Password Error:", error);
        return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
    }
}
