"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, Search, ShoppingBag, Loader2, ChevronRight } from "lucide-react";
import {jwtDecode} from "jwt-decode"; // npm install jwt-decode

interface NavLink {
  label: string;
  href: string;
}

interface Product {
  _id: string;
  title: string;
  totalPrice: number;
  price: number;
  images: { url: string }[];
}

interface JwtPayload {
  isAdmin?: boolean;
  [key: string]: any;
}

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [user, setUser] = useState<JwtPayload | null>(null);

  const searchRef = useRef<HTMLDivElement>(null);

  const navigationLinks: NavLink[] = [
    { label: "Home", href: "/" },
    { label: "About Us", href: "/about" },
    { label: "Shop", href: "/shop" },
    { label: "Sale", href: "/sale" },
    { label: "Trending", href: "/trending" },
    { label: "Men", href: "/men" },
    { label: "Women", href: "/women" },
    { label: "Contact", href: "/contact" },
  ];

  // --- CART COUNT SYNC ---
  useEffect(() => {
    const updateCount = () => {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]");
      setCartCount(cart.length);
    };
    updateCount();
    window.addEventListener("cartUpdated", updateCount);
    window.addEventListener("storage", updateCount);
    return () => {
      window.removeEventListener("cartUpdated", updateCount);
      window.removeEventListener("storage", updateCount);
    };
  }, []);

  // --- FETCH JWT FROM COOKIE ---
  useEffect(() => {
    const getUserFromCookie = () => {
      const match = document.cookie.match(/jwt=([^;]+)/);
      if (match) {
        try {
          const decoded: JwtPayload = jwtDecode(match[1]);
          setUser(decoded);
        } catch (err) {
          console.error("Invalid JWT", err);
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };
    getUserFromCookie();
  }, []);

  // --- SEARCH LOGIC ---
  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!searchQuery.trim()) {
        setResults([]);
        return;
      }
      setIsLoading(true);
      try {
        const res = await fetch(`/api/products/get?search=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        if (data.products) setResults(data.products);
      } catch (err) {
        console.error("Search failed", err);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(fetchSearchResults, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  // Prevent scrolling when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
  }, [isOpen]);

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white shadow-sm z-[100]">
      <div className="flex items-center justify-between px-4 md:px-8 relative z-[120] bg-white py-4 lg:py-2">
        <button className="md:hidden text-gray-700 p-1" onClick={() => setIsOpen(true)}>
          <Menu size={24} />
        </button>

        <Link href="/" className="absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0">
          <div className="relative w-[110px] h-[35px] md:w-[150px] md:h-[70px]">
            <Image
              src="/images/logo/logo-1.png"
              alt="Logo"
              fill
              className="object-contain filter contrast-125 mt-2"
              priority
            />
          </div>
        </Link>

        {/* Right Action Icons */}
        <div className="flex items-center gap-3 md:gap-6 uppercase navItems text-[12px]">
          {/* CONDITIONAL LOGIN / ADMIN */}
          {user ? (
            user.isAdmin ? (
              <Link href="/admin" className="text-gray-700 hover:text-black md:flex hidden items-center uppercase font-medium">
                Admin
              </Link>
            ) : null
          ) : (
            <Link href="/login" className="text-gray-700 hover:text-black md:flex hidden items-center uppercase font-medium">
              Login
            </Link>
          )}

          <button
            onClick={() => {
              setIsSearchOpen(!isSearchOpen);
              if (isSearchOpen) setSearchQuery("");
            }}
            className="text-gray-700 hover:text-black flex items-center uppercase tracking-widest font-medium gap-2"
          >
            <span className="md:block hidden">{isSearchOpen ? "Close" : "Search"}</span>
            {isSearchOpen ? <X size={18} /> : <Search size={18} />}
          </button>

          <Link href="/cart" className="relative text-gray-700 hover:text-black flex items-center uppercase font-medium gap-2">
            <span className="md:block hidden">Cart</span>
            <div className="relative">
              <ShoppingBag size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-black text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </div>
          </Link>
        </div>
      </div>

      {/* DESKTOP NAVIGATION */}
      <div className="hidden md:flex justify-center gap-10 pb-4 navItems uppercase text-[11px] font-mono relative z-[120] bg-white">
        {navigationLinks.map((link) => (
          <Link key={link.href} href={link.href} className="relative text-gray-600 hover:text-black font-medium group transition-colors">
            {link.label}
            <span className="absolute left-0 -bottom-1.5 h-0.5 w-0 bg-black transition-all duration-300 group-hover:w-full"></span>
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default Navbar;
