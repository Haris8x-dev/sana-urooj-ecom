// lib/utils/otp-utils.ts
import SibApiV3Sdk from "@sendinblue/client";
import crypto from "crypto";
import User, { iUser } from "@/lib/models/users/user"; // assuming User.ts is in lib/models/users/user
import { connectToDatabase } from "@/lib/db/db";

const client = new SibApiV3Sdk.TransactionalEmailsApi();
client.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY!);

// Helper to generate a 6-digit OTP
export function generateOtp(length = 6): string {
  const digits = "0123456789";
  let otp = "";
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }
  return otp;
}

// Helper to extract email from "Name <email@domain.com>" format
const getSenderEmail = (fullSender: string): string => {
  const match = fullSender.match(/<(.+)>/);
  return match ? match[1] : fullSender;
};


// Main function to generate, save, and send the OTP
export async function sendOtpForUser(user: iUser) {
  await connectToDatabase();

  const otp = generateOtp(6);
  const otpHashed = crypto.createHash("sha256").update(otp).digest("hex");
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  // Update user document with the new OTP hash and expiry
  user.otpHash = otpHashed;
  user.otpExpires = new Date(expiresAt);
  await user.save();

  // Send email via Brevo
  const senderEmail = getSenderEmail(process.env.EMAIL_FROM!);

  const sendSmtpEmail = {
    sender: {
      name: process.env.EMAIL_FROM!.split('<')[0].trim(),
      email: senderEmail
    },
    to: [{ email: user.email, name: user.userName || "" }],
    subject: "Your Oceanova Verification Code",
    htmlContent: `<p>Hello ${user.userName || ""},</p>
                  <p>Your verification code is: <strong style="font-size:20px">${otp}</strong></p>
                  <p>This code expires in 10 minutes. Do not share this code.</p>`,
  };

  try {
    await client.sendTransacEmail(sendSmtpEmail);
    console.log(`✅ OTP sent to ${user.email}`);
    return { success: true };
  } catch (err) {
    console.error("❌ Brevo send error:", err);
    throw new Error("Failed to send verification email.");
  }
}