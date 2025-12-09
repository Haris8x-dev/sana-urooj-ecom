import mongoose, { Schema, model } from "mongoose";
import bcrypt from "bcryptjs";


// --- FIX APPLIED HERE ---
// The manual 'save(): unknown;' declaration has been removed.
export interface iUser extends mongoose.Document {
    userName: string;
    email: string;
    password?: string; // Optional for Google users
    isAdmin: boolean;
    wishlist: mongoose.Types.ObjectId[];
    cart: {
        items: {
            product: mongoose.Types.ObjectId;
            qty: number;
            totalPrice: number;
        }[];
        finalPrice: number;
    };
    profileImage?: { url: string; fileId: string };
    provider: "credentials" | "google";

    // --- OTP / Verification Fields ---
    isVerified: boolean;
    otpHash?: string;
    otpExpires?: Date;

    // --- Password Reset Fields ---
    resetPasswordToken?: string;
    resetPasswordExpire?: Date;

    createdAt: Date;
    updatedAt: Date;
}


const userSchema = new Schema<iUser>(
    {
        userName: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: false }, // Made optional
        isAdmin: { type: Boolean, default: false },

        // --- OTP / Verification Fields ---
        isVerified: { type: Boolean, default: false },
        otpHash: { type: String, required: false },
        otpExpires: { type: Date, required: false },

        // --- Password Reset Fields ---
        resetPasswordToken: { type: String, required: false },
        resetPasswordExpire: { type: Date, required: false },
        profileImage: {
            url: { type: String, default: "" },
            fileId: { type: String, default: "" },
        },
        provider: {
            type: String,
            enum: ["credentials", "google"],
            default: "credentials",
        }, // default credentials
    },
    { timestamps: true }
);

// Password hashing middleware - FIXED: async functions don't need next()
userSchema.pre("save", async function () {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified("password")) {
        return;
    }

    // Don't hash if password is undefined (for Google OAuth users)
    if (!this.password) {
        return;
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.models?.User || model<iUser>("User", userSchema);

export default User;