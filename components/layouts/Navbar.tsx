"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, Search, ShoppingBag, Loader2 } from "lucide-react";

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

  // --- SEARCH LOGIC (Kept exactly the same) ---
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
          const filtered = data.products.filter((p: Product) => 
            p.title.toLowerCase().includes(searchQuery.toLowerCase())
          );
          setResults(filtered);
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

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white shadow-md z-[100]">
      {/* LAYOUT FIX: 
          We removed 'py' from the parent 'nav' and added it to these internal 
          containers to ensure the height is consistent and doesn't jump.
      */}
      
      {/* 1. TOP ROW: Logo and Main Icons */}
      <div className="flex items-center justify-between px-4 md:px-8 relative z-[120] bg-white py-4 lg:py-2">
        {/* Mobile Menu Toggle */}
        <button className="md:hidden text-gray-700" onClick={() => setIsOpen(true)}>
          <Menu size={26} />
        </button>

        {/* Logo */}
        <Link href="/" className="absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0">
          <div className="relative w-[120px] h-[40px] md:w-[150px] md:h-[50px]">
            <Image
              src="/images/logo/logo-1.png"
              alt="Logo"
              fill
              className="object-contain filter contrast-125"
              priority
            />
          </div>
        </Link>

        {/* Right Action Icons */}
        <div className="flex items-center gap-4 md:gap-6 uppercase navItems text-[12px]">
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
             <ShoppingBag size={20} />
          </Link>
        </div>
      </div>

      {/* 2. BOTTOM ROW: Navigation Links (Desktop Only) */}
      <div className="hidden md:flex justify-center gap-10 pb-4 navItems uppercase text-[11.5px] font-mono relative z-[120] bg-white">
        {navigationLinks.map((link) => (
          <Link key={link.href} href={link.href} className="relative text-gray-700 font-medium group">
            {link.label}
            <span className="absolute left-0 -bottom-1.5 h-0.5 w-0 bg-black transition-all duration-300 group-hover:w-full"></span>
          </Link>
        ))}
      </div>

      {/* 3. DYNAMIC SEARCH DROPDOWN */}
      <div 
        ref={searchRef}
        className={`absolute top-full left-0 w-full bg-white z-[110] shadow-xl transition-all duration-500 ease-in-out overflow-hidden flex flex-col border-t border-gray-100 ${
          isSearchOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        }`}
        style={{ 
            minHeight: isSearchOpen ? '15vh' : '0px',
            maxHeight: '80vh', 
            height: results.length > 0 ? 'auto' : '20vh' 
        }}
      >
        <div className="w-full max-w-5xl mx-auto px-6 py-8 h-full flex flex-col">
          {/* Search Input */}
          <div className="relative flex items-center border-b border-gray-300 pb-2 shrink-0">
            <input 
              type="text" 
              placeholder="SEARCH PRODUCTS..." 
              className="w-full text-sm md:text-lg font-mono uppercase outline-none placeholder:text-gray-300 bg-transparent text-black tracking-widest"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus={isSearchOpen}
            />
            {isLoading ? <Loader2 className="animate-spin text-gray-400" size={18} /> : <Search className="text-gray-400" size={18} />}
          </div>

          {/* Search Results */}
          {results.length > 0 && (
            <div className="mt-8 overflow-y-auto pb-8 custom-scrollbar">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-x-4 gap-y-8">
                {results.map((product) => (
                  <Link 
                    key={product._id} 
                    href={`/product/${product._id}`} 
                    onClick={() => {
                        setIsSearchOpen(false);
                        setSearchQuery("");
                    }}
                    className="group flex flex-col"
                  >
                    <div className="aspect-[3/4] relative bg-gray-50 overflow-hidden">
                      <Image 
                        src={product.images[0]?.url || "/placeholder.png"} 
                        alt={product.title} 
                        fill 
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    </div>
                    <div className="mt-2 text-center">
                       <h4 className="text-[9px] uppercase tracking-[0.1em] font-semibold text-gray-800 line-clamp-1">{product.title}</h4>
                       <div className="flex justify-center items-center gap-2">
                          <span className="text-[10px] text-red-600 font-bold">RS {product.totalPrice.toLocaleString()}</span>
                          {product.price > product.totalPrice && (
                            <span className="text-[9px] text-gray-400 line-through">RS {product.price.toLocaleString()}</span>
                          )}
                       </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {searchQuery.length > 0 && results.length === 0 && !isLoading && (
            <div className="flex-grow flex items-center justify-center py-10">
              <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-gray-400">No matching items</p>
            </div>
          )}
        </div>
      </div>

      {/* Background Blur Overlay */}
      {isSearchOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-[105] backdrop-blur-[2px] transition-opacity duration-500"
          onClick={() => setIsSearchOpen(false)}
        ></div>
      )}

      {/* 4. MOBILE SIDEBAR (Logic implementation depends on your sidebar code) */}
      {/* ... keeping your sidebar logic if needed ... */}
    </nav>
  );
};

export default Navbar;