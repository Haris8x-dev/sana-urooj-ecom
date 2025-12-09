// app/api/auth/verify-otp/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/db";
import User from "@/lib/models/users/user";
import crypto from "crypto";

export async function POST(request: Request) {
    const { email, otp } = await request.json();

    if (!email || !otp) {
        return NextResponse.json({ error: "Email and OTP are required." }, { status: 400 });
    }

    try {
        await connectToDatabase();

        const user = await User.findOne({ email: email.toLowerCase(), isVerified: false });

        if (!user) {
            return NextResponse.json({ error: "Invalid verification request." }, { status: 400 });
        }
        
        const submittedOtpHashed = crypto.createHash("sha256").update(otp).digest("hex");
        
        const isOtpValid = user.otpHash && user.otpHash === submittedOtpHashed;
        const isOtpExpired = user.otpExpires && user.otpExpires.getTime() < Date.now();

        if (!isOtpValid || isOtpExpired) {
            // Clean up transient fields on failed attempt
            user.otpHash = undefined;
            user.otpExpires = undefined;
            await user.save();
            return NextResponse.json({ error: isOtpExpired ? "OTP has expired. Please request a new one." : "Invalid OTP." }, { status: 400 });
        }
        
        // Success
        user.isVerified = true;
        user.otpHash = undefined;
        user.otpExpires = undefined;
        await user.save();

        return NextResponse.json({ ok: true, message: "Account successfully verified." }, { status: 200 });

    } catch (error) {
        console.error("Verification Error:", error);
        return NextResponse.json({ error: "Failed to verify OTP." }, { status: 500 });
    }
}