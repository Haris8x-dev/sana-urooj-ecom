// app/api/auth/register/route.ts
import { NextResponse } from 'next/server';
import { connectToDatabase } from "@/lib/db/db";
import User from "@/lib/models/users/user";
import { sendOtpForUser } from "@/lib/utils/otp-utils";

export async function POST(request: Request) {
    try {
        await connectToDatabase();

        const { userName, email, password } = await request.json();

        // 1. Basic validation
        if (!userName || !email || !password) {
            return NextResponse.json({ error: "All fields are required." }, { status: 400 });
        }

        // 2. Check for existing user
        const existingUser = await User.findOne({ email: email.toLowerCase() });

        if (existingUser) {
            if (existingUser.isVerified) {
                return NextResponse.json({ error: "User already registered and verified." }, { status: 409 });
            }

            // If user exists but is not verified, we reuse the unverified account.
            // We update the password, clear old OTP, and send a new one.
            existingUser.userName = userName; // Update userName as well
            existingUser.password = password; // Will be hashed by pre-save hook
            existingUser.isVerified = false;

            await existingUser.save();

            await sendOtpForUser(existingUser);
            return NextResponse.json({ message: "Unverified account found. New OTP sent." }, { status: 200 });
        }

        // 3. Create new user
        const user = await User.create({
            userName,
            email: email.toLowerCase(),
            password, // Will be hashed by pre-save hook
        });

        // 4. Send OTP
        await sendOtpForUser(user);

        return NextResponse.json({ message: "Registration successful. OTP sent for verification." }, { status: 201 });

    } catch (error) {
        console.error("Registration Error:", error);
        return NextResponse.json({ error: "Failed to process registration." }, { status: 500 });
    }
}