"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { LayoutGrid, Grid3X3, Grid2X2, ChevronDown, Square } from "lucide-react"; 

interface ImageObject {
  url: string;
  fileId: string;
}

interface Product {
  _id: string;
  title: string;
  price: number;      // Original Price
  totalPrice: number; // Final Price
  images: ImageObject[];
  isSoldOut: boolean;
  badges?: {
    saveRs: {
      active: boolean;
      amount: number;
    };
  };
}

export default function SaleShop() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State for Layout Control
  const [gridCols, setGridCols] = useState<3 | 4 | 6>(4); 

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/products/get");
        const data = await res.json();
        
        if (data.products) {
          // FILTER: Only show products where SaveRs badge is active AND amount > 0
          const saleProducts = data.products.filter((product: Product) => {
            return (
              product.badges?.saveRs?.active === true && 
              (product.badges?.saveRs?.amount || 0) > 0
            );
          });
          setProducts(saleProducts);
        }
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const handleLayoutChange = (cols: 3 | 4 | 6) => {
    setGridCols(cols);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-gray-80 py-20 lg:py-30">
      {/* 1. Page Title */}
      <div className="py-2 md:py-8 text-center"> 
        <h1 className="text-md tracking-widest text-red-600 navItems uppercase font-mono py-4">
          Special Offers
        </h1>
      </div>

      {/* 2. Control Bar */}
      <div className="w-full h-[45px] border-y border-gray-300 flex items-center justify-between bg-transparent mt-4">
        <div className="h-full flex items-center px-4 border-r border-gray-300 gap-3">
          {/* DESKTOP ICONS */}
          <div className="hidden md:flex gap-3">
            <button onClick={() => handleLayoutChange(3)} className={`transition-colors ${gridCols === 3 ? "text-black" : "text-gray-400 hover:text-gray-600"}`}>
                <div className="flex gap-0.5">
                    <div className="w-3 h-4 bg-current"></div>
                    <div className="w-3 h-4 bg-current"></div>
                    <div className="w-3 h-4 bg-current"></div>
                </div>
            </button>
            <button onClick={() => handleLayoutChange(4)} className={`transition-colors ${gridCols === 4 ? "text-black" : "text-gray-400 hover:text-gray-600"}`}>
                <LayoutGrid size={20} strokeWidth={1.5} />
            </button>
            <button onClick={() => handleLayoutChange(6)} className={`transition-colors ${gridCols === 6 ? "text-black" : "text-gray-400 hover:text-gray-600"}`}>
                <Grid3X3 size={20} strokeWidth={1.5} />
            </button>
          </div>

          {/* MOBILE ICONS */}
          <div className="flex md:hidden gap-3">
             <button onClick={() => handleLayoutChange(3)} className={`transition-colors ${gridCols === 3 ? "text-black" : "text-gray-400 hover:text-gray-600"}`}>
               <Square size={20} strokeWidth={1.5} fill={gridCols === 3 ? "currentColor" : "none"} />
            </button>
            <button onClick={() => handleLayoutChange(4)} className={`transition-colors ${gridCols === 4 ? "text-black" : "text-gray-400 hover:text-gray-600"}`}>
                <Grid2X2 size={20} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        <div className="h-full flex items-center px-0 gap-0">
            <div className="flex items-center gap-1 cursor-pointer group h-full px-4 border-r border-gray-300">
              <span className="text-xs font-medium tracking-wide text-gray-600 group-hover:text-black">SORT BY</span>
              <ChevronDown size={14} className="text-gray-400 group-hover:text-black"/>
            </div>
            <button className="text-xs font-medium tracking-wide text-gray-600 hover:text-black uppercase h-full flex items-center px-4 border-l border-gray-300">
              Filter
            </button>
        </div>
      </div>

      {/* 3. Product Grid */}
      <div className="w-full py-8 px-6">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <p className="text-gray-400 tracking-widest text-sm uppercase">Loading Offers...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="flex justify-center items-center h-64 text-center flex-col gap-2">
            <p className="text-gray-400 tracking-widest text-sm uppercase">No active offers at the moment</p>
          </div>
        ) : (
          <div
            className={`grid gap-x-4 gap-y-10 transition-all duration-300 ease-in-out
              ${gridCols === 3 ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : ""}
              ${gridCols === 4 ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4" : ""}
              ${gridCols === 6 ? "grid-cols-3 md:grid-cols-4 lg:grid-cols-6" : ""}
            `}
          >
            {products.map((product) => {
              // Since we are on the Sale page, these will always be true based on our filter
              const saversAmount = product.badges?.saveRs?.amount;

              return (
                <Link 
                  key={product._id} 
                  href={`/product/${product._id}`} 
                  className="group relative flex flex-col"
                >
                  {/* Image Container */}
                  <div className="relative w-full overflow-hidden bg-gray-100 aspect-3/4">
                      {/* RED SAVERS TAG */}
                      <div className="absolute top-3 left-3 z-20 bg-red-600 text-white text-[9px] md:text-[11px] font-bold px-2 py-1 tracking-tighter uppercase shadow-sm">
                        SAVERS {saversAmount}
                      </div>

                      {/* Sold Out Badge */}
                      {product.isSoldOut && (
                          <div className="absolute bottom-2 left-2 z-10 bg-white/90 px-2 py-1">
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
                      
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-[11px] text-gray-400 line-through">
                          Rs {product.price.toLocaleString()}
                        </span>
                        <span className="text-[11px] text-red-600 font-bold">
                          Rs {product.totalPrice.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}