import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { connectToDatabase } from "../db/db";
import User, { iUser } from "@/lib/models/users/user";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email/Username", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Email and password are required");
                }

                await connectToDatabase();

                // Find user by email OR userName
                const existingUser = await User.findOne({
                    $or: [
                        { email: credentials.email.toLowerCase() },
                        { userName: credentials.email }, // Allow login by userName
                    ]
                });

                if (!existingUser) {
                    throw new Error("Invalid Credentials");
                }

                // Block unverified users
                if (!existingUser.isVerified) {
                    throw new Error("Account not verified. Please check your email for OTP.");
                }

                const isValid = await bcrypt.compare(
                    credentials.password,
                    existingUser.password || ""
                );

                if (!isValid) {
                    throw new Error("Invalid Credentials");
                }

                // Return the user object
                return {
                    id: existingUser._id.toString(),
                    userName: existingUser.userName,
                    email: existingUser.email,
                    isAdmin: existingUser.isAdmin || false,
                    profileImage: existingUser.profileImage?.url || "",
                    provider: existingUser.provider || "credentials",
                } as any;
            },
        }),

        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
    ],

    callbacks: {
        async signIn({ user, account, profile }) {
            try {
                console.log("🔍 SignIn callback started for:", user.email);

                if (account?.provider === "credentials") {
                    return true;
                }

                if (account?.provider === "google") {
                    await connectToDatabase();

                    let dbUser = await User.findOne({ email: user.email });

                    if (!dbUser) {
                        // Create new Google user - automatically verified
                        dbUser = await User.create({
                            userName: user.name || "Google User",
                            email: user.email!,
                            profileImage: {
                                url: user.image || "/default-profile.png",
                                fileId: "",
                            },
                            provider: "google",
                            isAdmin: false,
                            isVerified: true,
                        });

                        console.log("✅ New Google user created successfully.");
                    } else {
                        if (!dbUser.isVerified) {
                            dbUser.isVerified = true;
                            await dbUser.save();
                        }

                        if ((!dbUser.profileImage?.url || dbUser.profileImage.url === "/default-profile.png") && user.image) {
                            dbUser.profileImage = {
                                url: user.image,
                                fileId: "",
                            };
                            dbUser.provider = "google";
                            await dbUser.save();
                            console.log("🔄 Updated user profile image");
                        }
                    }
                    return true;
                }

                return false;
            } catch (error) {
                console.error("❌ SignIn callback error:", error);
                return false;
            }
        },

        async jwt({ token, user, account, profile }) {
            if (user) {
                const u = user as any;
                token.id = u.id;
                token.provider = u.provider || "credentials";
                token.profileImage = u.profileImage;
                token.isAdmin = u.isAdmin || false;
                token.userName = u.userName;
            }

            if (account?.provider === "google") {
                await connectToDatabase();
                const dbUser = await User.findOne({ email: token.email });

                if (dbUser) {
                    token.id = dbUser._id.toString();
                    token.profileImage = dbUser.profileImage?.url || user?.image || "/default-profile.png";
                    token.provider = "google";
                    token.isAdmin = dbUser.isAdmin || false;
                    token.userName = dbUser.userName || user?.name || "Google User";
                }
            }

            return token;
        },

        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string;
                session.user.profileImage = token.profileImage as string;
                (session.user as any).provider = token.provider as string;
                (session.user as any).isAdmin = token.isAdmin as boolean;
                (session.user as any).userName = token.userName as string;
            }

            return session;
        },
    },

    pages: {
        signIn: "/login",
        error: "/login",
    },

    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60,
    },

    debug: process.env.NODE_ENV === "development",

    secret: process.env.AUTH_SECRET,
};