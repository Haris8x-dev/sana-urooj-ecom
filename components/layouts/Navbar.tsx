"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSession, signIn } from "next-auth/react";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { data: session, status } = useSession();

  // ✅ whenever route changes → close drawer
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Safe type checking for isAdmin with debugging
  const isAdmin = session?.user?.isAdmin || false;

  // Debug logging (remove in production)
  useEffect(() => {
    if (session) {
      console.log("🔐 Session Debug:", {
        hasSession: !!session,
        userEmail: session.user?.email,
        isAdmin: session.user?.isAdmin,
        fullUser: session.user,
      });
    }
  }, [session]);

  return (
    <>
      {/* Navbar button */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-6xl">
        <div className="bg-white/80 backdrop-blur-md shadow-lg rounded-full px-8 py-4 flex justify-between items-center">
          <Link
            href="/"
            className="text-2xl font-bold bg-linear-to-r from-[#8e9eab] to-[#6b7a8f] bg-clip-text text-transparent"
          >
            <span className="text-sky-500">Ocean</span>ova
          </Link>

          {/* Show admin badge in navbar if user is admin */}
          {isAdmin && (
            <div className="hidden md:flex items-center">
              <span className="bg-purple-100 text-purple-800 text-xs font-medium px-2.5 py-0.5 rounded-full border border-purple-400">
                Admin
              </span>
            </div>
          )}

          <button
            onClick={() => setOpen(true)}
            className="text-gray-700 flex items-center gap-2"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
            Menu
          </button>
        </div>
      </nav>

      {/* Backdrop */}
      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-500 ${
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-72 bg-white shadow-xl z-50 transform transition-transform duration-500 ease-[cubic-bezier(.24,1,.32,1)] ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Drawer header */}
        <div className="p-6 flex justify-between items-center border-b">
          <span className="text-xl font-bold">Menu</span>
          <button onClick={() => setOpen(false)}>
            <svg className="w-7 h-7" fill="none" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Drawer links */}
        <div className="flex flex-col divide-y text-lg">
          {/* Home always at the top */}
          <Link
            href="/"
            className="py-4 px-6 hover:bg-gray-50"
            onClick={() => setOpen(false)}
          >
            Home
          </Link>

          {/* Common links for all users */}
          <Link
            href="/products"
            className="py-4 px-6 hover:bg-gray-50"
            onClick={() => setOpen(false)}
          >
            Products
          </Link>
          <Link
            href="/cart"
            className="py-4 px-6 hover:bg-gray-50"
            onClick={() => setOpen(false)}
          >
            Cart
          </Link>
          <Link
            href="/about"
            className="py-4 px-6 hover:bg-gray-50"
            onClick={() => setOpen(false)}
          >
            About
          </Link>
          <Link
            href="/contact"
            className="py-4 px-6 hover:bg-gray-50"
            onClick={() => setOpen(false)}
          >
            Contact
          </Link>

          {/* Order links - only show if user is logged in */}
          {session && (
            <>
              <Link
                href="/pendingOrders"
                className="py-4 px-6 hover:bg-gray-50"
                onClick={() => setOpen(false)}
              >
                Pending Orders
              </Link>
              <Link
                href="/completedOrders"
                className="py-4 px-6 hover:bg-gray-50"
                onClick={() => setOpen(false)}
              >
                Completed Orders
              </Link>
            </>
          )}

          {/* Conditional Admin Panel - only show if user is admin */}
          {status === "loading" ? (
            <div className="py-4 px-6 text-gray-500">Loading...</div>
          ) : isAdmin ? (
            <Link
              href="/admin"
              className="py-4 px-6 hover:bg-gray-50 flex items-center gap-2 bg-purple-50 border-l-4 border-purple-500"
              onClick={() => setOpen(false)}
            >
              <svg
                className="w-5 h-5 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Admin Panel
              <span className="ml-auto bg-purple-100 text-purple-800 text-xs font-medium px-2 py-0.5 rounded-full">
                Admin
              </span>
            </Link>
          ) : null}

          {/* User Dashboard for all authenticated users */}
          {session && (
            <Link
              href="/userdashboard"
              className="py-4 px-6 hover:bg-gray-50 flex items-center gap-2"
              onClick={() => setOpen(false)}
            >
              <svg
                className="w-5 h-5 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              User Dashboard
            </Link>
          )}

          {/* SIGN IN BUTTON - Only show when no session */}
          {!session && status !== "loading" && (
            <button
              onClick={() => {
                setOpen(false);
                signIn();
              }}
              className="py-4 px-6 hover:bg-gray-50 text-left flex items-center gap-2 text-blue-600 font-semibold"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                />
              </svg>
              Sign In
            </button>
          )}
        </div>
      </div>
    </>
  );
}
