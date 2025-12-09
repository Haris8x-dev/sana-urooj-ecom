// lib/utils/email-utils.ts
import SibApiV3Sdk from "@sendinblue/client";

const client = new SibApiV3Sdk.TransactionalEmailsApi();
client.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY!);

// Helper to extract email from "Name <email@domain.com>" format
const getSenderEmail = (fullSender: string): string => {
    const match = fullSender.match(/<(.+)>/);
    return match ? match[1] : fullSender;
};

interface SendEmailOptions {
    to: string;
    subject: string;
    htmlContent: string;
    toName?: string;
}

export async function sendEmail({ to, subject, htmlContent, toName }: SendEmailOptions) {
    const senderEmail = getSenderEmail(process.env.EMAIL_FROM!);

    const sendSmtpEmail = {
        sender: {
            name: process.env.EMAIL_FROM!.split('<')[0].trim(),
            email: senderEmail
        },
        to: [{ email: to, name: toName || "" }],
        subject,
        htmlContent,
    };

    try {
        await client.sendTransacEmail(sendSmtpEmail);
        console.log(`✅ Email sent to ${to}`);
        return { success: true };
    } catch (err) {
        console.error("❌ Brevo send error:", err);
        throw new Error("Failed to send email.");
    }
}

export async function sendPasswordResetEmail(to: string, userName: string, resetUrl: string) {
    const htmlContent = `
    <p>Hello ${userName},</p>
    <p>You requested to reset your password for your Oceanova account.</p>
    <p>Click the link below to reset your password:</p>
    <p><a href="${resetUrl}" style="display:inline-block;padding:10px 20px;background-color:#4F46E5;color:white;text-decoration:none;border-radius:5px;">Reset Password</a></p>
    <p>Or copy and paste this URL into your browser:</p>
    <p>${resetUrl}</p>
    <p>This link will expire in 1 hour.</p>
    <p>If you did not request this, please ignore this email.</p>
  `;

    return sendEmail({
        to,
        subject: "Password Reset Request - Oceanova",
        htmlContent,
        toName: userName,
    });
}
