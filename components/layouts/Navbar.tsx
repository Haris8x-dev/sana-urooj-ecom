"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, Search, ShoppingBag, Loader2, ChevronRight } from "lucide-react";

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

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  
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
        if (data.products) {
          setResults(data.products);
        }
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
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
  }, [isOpen]);

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white shadow-sm z-[100]">
      {/* 1. TOP ROW */}
      <div className="flex items-center justify-between px-4 md:px-8 relative z-[120] bg-white py-4 lg:py-2">
        {/* Mobile Menu Toggle */}
        <button className="md:hidden text-gray-700 p-1" onClick={() => setIsOpen(true)}>
          <Menu size={24} />
        </button>

        {/* Logo */}
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
          <Link href="/admin" className="text-gray-700 hover:text-black md:flex hidden items-center uppercase font-medium">
            Admin
          </Link>
          
          <button 
            onClick={() => {
                setIsSearchOpen(!isSearchOpen);
                if(isSearchOpen) setSearchQuery("");
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

      {/* 2. DESKTOP NAVIGATION */}
      <div className="hidden md:flex justify-center gap-10 pb-4 navItems uppercase text-md font-mono relative z-[120] bg-white">
        {navigationLinks.map((link) => (
          <Link key={link.href} href={link.href} className="relative text-gray-600 hover:text-black font-medium group transition-colors">
            {link.label}
            <span className="absolute left-0 -bottom-1.5 h-0.5 w-0 bg-black transition-all duration-300 group-hover:w-full"></span>
          </Link>
        ))}
      </div>

      {/* 3. DYNAMIC SEARCH DROPDOWN */}
      <div 
        ref={searchRef}
        className={`absolute top-full left-0 w-full bg-white z-[110] shadow-2xl transition-all duration-500 ease-in-out overflow-hidden flex flex-col border-t border-gray-100 ${
          isSearchOpen ? "translate-y-0 opacity-100 visible" : "-translate-y-4 opacity-0 invisible pointer-events-none"
        }`}
        style={{ minHeight: isSearchOpen ? '20vh' : '0px', maxHeight: '80vh' }}
      >
        <div className="w-full max-w-5xl mx-auto px-6 py-8 h-full">
          <div className="relative flex items-center border-b border-gray-200 pb-2">
            <input 
              type="text" 
              placeholder="SEARCH PRODUCTS..." 
              className="w-full text-lg font-mono uppercase outline-none placeholder:text-gray-300 bg-transparent tracking-widest"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus={isSearchOpen}
            />
            {isLoading ? <Loader2 className="animate-spin text-gray-400" size={20} /> : <Search className="text-gray-400" size={20} />}
          </div>

          {results.length > 0 && (
            <div className="mt-8 overflow-y-auto max-h-[50vh] pb-4">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {results.map((product) => (
                  <Link 
                    key={product._id} 
                    href={`/product/${product._id}`} 
                    onClick={() => { setIsSearchOpen(false); setSearchQuery(""); }}
                    className="group"
                  >
                    <div className="aspect-[3/4] relative bg-gray-50 mb-2">
                      <Image src={product.images[0]?.url || "/placeholder.png"} alt={product.title} fill className="object-cover" />
                    </div>
                    <h4 className="text-[9px] uppercase font-bold tracking-tight line-clamp-1">{product.title}</h4>
                    <p className="text-[10px] text-red-600 font-bold">RS {product.totalPrice.toLocaleString()}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. MOBILE SIDEBAR */}
      <div 
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[200] transition-opacity duration-300 md:hidden ${
          isOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        }`}
        onClick={() => setIsOpen(false)}
      />
      
      <div className={`fixed top-0 left-0 bottom-0 w-[80%] max-w-[320px] bg-white z-[210] shadow-2xl transition-transform duration-500 ease-out transform md:hidden ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-6 border-b border-gray-100">
            <span className="font-mono text-sm tracking-widest font-bold uppercase">Menu</span>
            <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-black">
              <X size={24} />
            </button>
          </div>
          
          <div className="flex-grow overflow-y-auto py-4">
            {navigationLinks.map((link) => (
              <Link 
                key={link.href} 
                href={link.href} 
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-between px-8 py-4 text-[12px] font-mono font-medium uppercase tracking-widest text-gray-700 hover:bg-gray-50 hover:text-black transition-colors"
              >
                {link.label}
                <ChevronRight size={14} className="text-gray-300" />
              </Link>
            ))}
          </div>

          <div className="p-8 border-t border-gray-100">
            <Link href="/admin" onClick={() => setIsOpen(false)} className="block text-center bg-gray-900 text-white py-4 text-[11px] font-bold uppercase tracking-[0.2em]">
              Admin Panel
            </Link>
          </div>
        </div>
      </div>

      {/* Background Blur Overlay for Search */}
      {isSearchOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-[105] backdrop-blur-[2px] transition-opacity duration-500"
          onClick={() => setIsSearchOpen(false)}
        ></div>
      )}
    </nav>
  );
};

export default Navbar;