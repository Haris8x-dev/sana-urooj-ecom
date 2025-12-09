// types/next-auth.d.ts
import { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface User extends DefaultUser {
    id: string;
    fullName?: string;
    email: string;
    profileImage?: string;
    isAdmin: boolean;
    provider?: "credentials" | "google";
  }

  interface Session {
    user: {
      id: string;
      fullName?: string;
      email: string;
      profileImage?: string;
      isAdmin: boolean;
      provider?: "credentials" | "google";
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    fullName?: string;
    isAdmin: boolean;
    profileImage?: string;
    provider?: "credentials" | "google";
  }
}