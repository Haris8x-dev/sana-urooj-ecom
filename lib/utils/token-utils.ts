// lib/utils/token-utils.ts
import crypto from "crypto";

/**
 * Generates a random, secure token and its SHA256 hash.
 * This is used for generating password reset tokens.
 * @returns {object} { token: string, hashedToken: string }
 */
export function generatePasswordResetToken() {
  // Generate a random 32-byte buffer
  // This token is sent to the user via email.
  const token = crypto.randomBytes(32).toString("hex");

  // Hash the token using SHA256 for storage in the database
  // This hashed version is compared against the user-provided token's hash.
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  return { token, hashedToken };
}