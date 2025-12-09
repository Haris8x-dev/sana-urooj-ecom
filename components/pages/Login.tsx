"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Loader from "@/components/layouts/Loader";
import GoogleIcon from "@/components/assets/google-icon.png";
import Image from "next/image";

export default function Login() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ fullName: "", email: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isRegister) {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Registration failed");

        // Automatically sign in after registration
        await signIn("credentials", {
          redirect: false,
          email: form.email,
          password: form.password,
        });

        router.push("/");
      } else {
        const result = await signIn("credentials", {
          redirect: false,
          email: form.email,
          password: form.password,
        });

        if (result?.error) throw new Error(result.error);
        router.push("/");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    await signIn("google", { callbackUrl: "/" });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-[#8e9eab] to-[#eef2f3] px-4">
      <div className="w-full max-w-md bg-white/30 backdrop-blur-md rounded-3xl p-10 shadow-xl">
        <h2 className="text-3xl font-bold text-white text-center mb-6">
          {isRegister ? "Register" : "Login"} to Oceanova
        </h2>

        {error && (
          <p className="text-red-500 text-center mb-4 font-medium">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {isRegister && (
            <input
              type="text"
              name="userName"
              placeholder="User Name"
              value={form.fullName}
              onChange={handleChange}
              className="px-4 py-3 rounded-full bg-white/80 focus:outline-none focus:ring-2 focus:ring-[#8e9eab]"
              required
            />
          )}

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            className="px-4 py-3 rounded-full bg-white/80 focus:outline-none focus:ring-2 focus:ring-[#8e9eab]"
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            className="px-4 py-3 rounded-full bg-white/80 focus:outline-none focus:ring-2 focus:ring-[#8e9eab]"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="relative bg-white text-gray-800 font-semibold py-3 rounded-full hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl flex justify-center items-center"
          >
            {loading ? <Loader /> : isRegister ? "Register" : "Login"}
          </button>
        </form>
{/* 
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="mt-4 flex items-center justify-center gap-4 w-full bg-white text-gray-800 py-3 rounded-full hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl relative"
        >
          {loading ? (
            <Loader />
          ) : (
            <>
              <Image
                src={GoogleIcon}
                alt="google logo icon"
                className="w-6 h-6"
              />
              Continue with Google
            </>
          )}
        </button> */}

        <p className="text-white/80 text-center mt-6">
          {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="underline font-medium"
          >
            {isRegister ? "Login" : "Register"}
          </button>
        </p>
      </div>
    </div>
  );
}
