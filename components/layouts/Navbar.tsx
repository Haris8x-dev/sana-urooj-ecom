"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, Search, ShoppingBag } from "lucide-react";

interface NavLink {
  label: string;
  href: string;
}

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const navigationLinks: NavLink[] = [
    { label: "Home", href: "/" },
    { label: "Shop", href: "/shop" },
    { label: "Sale", href: "/cloths" },
    { label: "Trending", href: "/categories" },
    { label: "Men", href: "/men" },
    { label: "Women", href: "/women" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white shadow-md z-50 py-5 lg:py-1">
      {/* Navbar Container */}
      <div className="flex items-center justify-between px-4 md:px-8">

        {/* Hamburger Menu - Mobile */}
        <button
          className="md:hidden text-gray-700"
          onClick={() => setIsOpen(true)}
        >
          <Menu size={28} />
        </button>

        {/* Logo Center */}
        <Link
          href="/"
          className="absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0 scale-150 pt-1 pb-3 lg:pb-0"
        >
          <Image
            src="/images/logo/logo-1.png"
            alt="Sana-urooj-Ecommerce"
            width={180}
            height={180}
            className="object-contain filter contrast-125 drop-shadow-md md:w-[150px] md:h-[60px] w-18 h-18 pt-3"
          />
        </Link>

        {/* Right Icons / Desktop Links */}
        <div className="flex items-center gap-4 md:gap-6 uppercase navItems text-[12px]">
          <Link
            href="/search"
            className="text-gray-700 hover:text-black md:flex hidden items-center"
          >
            Admin Panel
          </Link>

          <Link
            href="/search"
            className="text-gray-700 hover:text-black md:flex hidden items-center"
          >
            Search
          </Link>

          <Link
            href="/search"
            className="md:hidden text-gray-700 hover:text-black"
          >
            <Search size={22} />
          </Link>

          <Link
            href="/cart"
            className="relative text-gray-700 hover:text-black md:flex hidden items-center"
          >
            Cart
          </Link>

          <Link
            href="/cart"
            className="md:hidden text-gray-700 hover:text-black relative"
          >
            <ShoppingBag size={22} />
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              0
            </span>
          </Link>
        </div>
      </div>

      {/* Desktop Nav Links */}
      <div className="hidden md:flex justify-center gap-10 pb-3 navItems uppercase text-sm font-mono">
        {navigationLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="relative text-gray-700 font-medium group"
          >
            {link.label}
            <span className="absolute left-0 -bottom-2 h-0.5 w-0 bg-black transition-all duration-300 group-hover:w-full"></span>
          </Link>
        ))}
      </div>

      {/* Mobile Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-xl z-50 transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          onClick={() => setIsOpen(false)}
          className="p-4 text-gray-700"
        >
          <X size={28} />
        </button>

        <div className="flex flex-col mt-4 pl-6 gap-6">
          {navigationLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="relative text-gray-700 font-medium group uppercase navItems text-sm"
              onClick={() => setIsOpen(false)}
            >
              {link.label}
              <span className="absolute left-0 -bottom-1 h-0.5 w-0 bg-black transition-all duration-300 group-hover:w-full"></span>
            </Link>
          ))}

          <Link
            href="/login"
            className="text-gray-700 font-medium uppercase navItems text-sm"
            onClick={() => setIsOpen(false)}
          >
            Login
          </Link>

          <Link
            href="/admin"
            className="text-gray-700 font-medium uppercase navItems text-sm"
            onClick={() => setIsOpen(false)}
          >
            Admin Panel
          </Link>
        </div>
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </nav>
  );
};

export default Navbar;
