// app/api/auth/resend-otp/route.ts
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/db";
import User from "@/lib/models/users/user";
import { sendOtpForUser } from "@/lib/utils/otp-utils"; 

const RESEND_COOLDOWN_MS = 2 * 60 * 1000; 

export async function POST(request: Request) {
    const { email } = await request.json();

    if (!email) {
        return NextResponse.json({ error: "Email is required for resend." }, { status: 400 });
    }

    try {
        await connectToDatabase();

        const user = await User.findOne({ 
            email: email.toLowerCase(),
            isVerified: false 
        });

        if (!user) {
            return NextResponse.json({ error: "Account not found or already verified." }, { status: 400 });
        }
        
        // 1. Check Cooldown/Rate Limit
        if (user.otpExpires) {
            const timeSinceExpiry = Date.now() - user.otpExpires.getTime();
            
            if (timeSinceExpiry < RESEND_COOLDOWN_MS) {
                const timeRemaining = RESEND_COOLDOWN_MS - timeSinceExpiry;
                const secondsRemaining = Math.ceil(timeRemaining / 1000);
                
                return NextResponse.json({ 
                    error: `Please wait ${secondsRemaining} seconds before requesting a new OTP.`, 
                    cooldown: secondsRemaining 
                }, { status: 429 });
            }
        }
        
        // 2. Send New OTP
        await sendOtpForUser(user);

        return NextResponse.json({ 
            ok: true, 
            message: "New OTP sent successfully. Check your email." 
        }, { status: 200 });

    } catch (error) {
        console.error("Resend OTP Error:", error);
        return NextResponse.json({ error: "Failed to resend OTP." }, { status: 500 });
    }
}