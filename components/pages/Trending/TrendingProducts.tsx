"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link"; 
import { LayoutGrid, Grid3X3, Grid2X2, ChevronDown, Square } from "lucide-react"; 

// --- INTERFACES ---
interface ImageObject {
  url: string;
  fileId: string;
}

// NOTE: We assume the Product interface fetched from the trending API is the same.
interface Product {
  _id: string;
  title: string;
  price: number;
  images: ImageObject[];
  isSoldOut: boolean;
  // Products with Priority: 1 are trending, but we don't strictly need the priority field here, 
  // as the API should already filter them.
}

// NEW INTERFACE: Reflects the expected response from a generic trending endpoint
interface TrendingData {
    message: string;
    products: Product[];
    error?: string;
}

// We remove the categoryId prop as this page is static/generic
export default function TrendingProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Static Title for the Trending Page
  const [pageTitle] = useState("TRENDING PRODUCTS"); 
  
  const [gridCols, setGridCols] = useState<3 | 4 | 6>(4); 

  useEffect(() => {
    const fetchTrendingProducts = async () => {
      try {
        // 1. CHANGE: Use a new API endpoint specifically for fetching products with Priority: 1
        // We assume this endpoint returns an array of products filtered by priority = 1
        const res = await fetch(`/api/products/trending`); 
        
        if (!res.ok) {
            throw new Error(`Failed to fetch trending products: ${res.status}`);
        }

        const data: TrendingData = await res.json(); 
        
        if (data.products) {
          setProducts(data.products);
        } else if (data.error) {
            console.error("API Error:", data.error);
        }
      } catch (error) {
        console.error("Failed to fetch trending products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingProducts();
  }, []); // No dependencies needed, runs once on mount

  // Handler to change layout - unchanged
  const handleLayoutChange = (cols: 3 | 4 | 6) => {
    setGridCols(cols);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-gray-80 py-20 lg:py-3">
      {/* 1. Page Title (Static) */}
      <div className="py-2 md:py-8 text-center"> 
        {/* Use the static title */}
        <h1 className="text-md tracking-widest text-gray-900 navItems uppercase font-mono py-4">
          {pageTitle}
        </h1>
      </div>

      {/* 2. Control Bar (Grid control, Sort, Filter) - Unchanged UI */}
      <div className="w-full h-[45px] border-y border-gray-300 flex items-center justify-between bg-transparent mt-4">
        
        {/* LEFT: View Toggle Icons */}
        <div className="h-full flex items-center px-4 border-r border-gray-300 gap-3">
          
          {/* --- DESKTOP ICONS (md:flex) - 3 Icons --- */}
          <div className="hidden md:flex gap-3">
              {/* Icon 1: Large View (3 items/row) */}
            <button 
                onClick={() => handleLayoutChange(3)}
                className={`transition-colors ${gridCols === 3 ? "text-black" : "text-gray-400 hover:text-gray-600"}`}
            >
                <div className="flex gap-0.5">
                    <div className="w-3 h-4 bg-current"></div>
                    <div className="w-3 h-4 bg-current"></div>
                    <div className="w-3 h-4 bg-current"></div>
                </div>
            </button>

            {/* Icon 2: Medium View (4 items/row) */}
            <button 
                onClick={() => handleLayoutChange(4)}
                className={`transition-colors ${gridCols === 4 ? "text-black" : "text-gray-400 hover:text-gray-600"}`}
            >
                <LayoutGrid size={20} strokeWidth={1.5} />
            </button>

            {/* Icon 3: Small/Dense View (6 items/row) */}
            <button 
                onClick={() => handleLayoutChange(6)}
                className={`transition-colors ${gridCols === 6 ? "text-black" : "text-gray-400 hover:text-gray-600"}`}
            >
                <Grid3X3 size={20} strokeWidth={1.5} />
            </button>
          </div>

          {/* --- MOBILE ICONS (flex md:hidden) - 2 Icons Only --- */}
          <div className="flex md:hidden gap-3">
              {/* Mobile Icon 1: Single Column View */}
             <button 
                onClick={() => handleLayoutChange(3)}
                className={`transition-colors ${gridCols === 3 ? "text-black" : "text-gray-400 hover:text-gray-600"}`}
            >
               <Square size={20} strokeWidth={1.5} fill={gridCols === 3 ? "currentColor" : "none"} />
            </button>

            {/* Mobile Icon 2: Two Column View */}
            <button 
                onClick={() => handleLayoutChange(4)}
                className={`transition-colors ${gridCols === 4 ? "text-black" : "text-gray-400 hover:text-gray-600"}`}
            >
                <Grid2X2 size={20} strokeWidth={1.5} />
            </button>
          </div>

        </div>

        {/* MIDDLE: Empty */}
        <div className="h-full"></div> 

        {/* RIGHT: Sort & Filter */}
        <div className="h-full flex items-center px-0 gap-0">
            
            {/* Sort Dropdown Trigger */}
            <div className="flex items-center gap-1 cursor-pointer group h-full px-4 border-r border-gray-300">
              <span className="text-xs font-medium tracking-wide text-gray-600 group-hover:text-black">
                SORT BY
              </span>
              <ChevronDown size={14} className="text-gray-400 group-hover:text-black"/>
            </div>

            {/* Filter Trigger with Left Border */}
            <button 
                className="text-xs font-medium tracking-wide text-gray-600 hover:text-black uppercase h-full flex items-center px-4 border-l border-gray-300"
            >
              Filter
            </button>
        </div>
      </div>
      
      {/* 3. Product Grid */}
      <div className="w-full py-8 px-6">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-400 tracking-widest text-sm">LOADING PRODUCTS...</p>
          </div>
        ) : (
          <div
            className={`grid gap-x-4 gap-y-4 transition-all duration-300 ease-in-out
              ${/* Grid Logic: EXACTLY same as requested */ ""}
              ${gridCols === 3 ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : ""}
              ${gridCols === 4 ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4" : ""}
              ${gridCols === 6 ? "grid-cols-3 md:grid-cols-4 lg:grid-cols-6" : ""}
            `}
          >
            {products.map((product) => (
              <Link 
                key={product._id} 
                href={`/product/${product._id}`} 
                className="group relative flex flex-col"
              >
                
                {/* Image Container */}
                <div className="relative w-full overflow-hidden bg-gray-100 aspect-3/4">
                    {/* Sold Out Badge */}
                    {product.isSoldOut && (
                        <div className="absolute top-2 left-2 z-10 bg-white/90 px-2 py-1">
                            <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">
                                Sold Out
                            </span>
                        </div>
                    )}

                    {product.images && product.images[0] ? (
                        <Image
                        src={product.images[0].url} 
                        alt={product.title}
                        fill
                        className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105"
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                        priority={false} 
                        />
                    ) : (
                        <div className="flex items-center justify-center w-full h-full text-gray-300 text-xs">
                        No Image
                        </div>
                    )}
                </div>

                {/* Product Details */}
                {gridCols !== 6 && (
                  <div className="mt-4 text-center space-y-1">
                    <h3 className="text-xs font-medium tracking-widest text-gray-900 uppercase">
                      {product.title}
                    </h3>
                    <p className="text-xs text-gray-500 font-light">
                      Rs {product.price ? product.price.toLocaleString() : "N/A"}
                    </p>
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
        {products.length === 0 && !loading && (
            <div className="flex justify-center items-center h-64">
                <p className="text-gray-500 tracking-widest text-sm">NO TRENDING PRODUCTS FOUND.</p>
            </div>
        )}
      </div>
    </div>
  );
}