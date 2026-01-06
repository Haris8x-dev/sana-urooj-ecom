"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { LayoutGrid, Grid3X3, Grid2X2, ChevronDown, Square, ShoppingBag, X, RotateCcw } from "lucide-react";
import { ToastContainer } from 'react-toastify';
import { motion, AnimatePresence } from "framer-motion";
import 'react-toastify/dist/ReactToastify.css';

import QuickViewBox from "@/components/layouts/QuickViewBox";

interface ImageObject { url: string; fileId: string; }
interface Size { name: string; quantity: number | string; }

interface Product {
  _id: string;
  title: string;
  price: number;
  totalPrice: number;
  images: ImageObject[];
  isSoldOut: boolean;
  priority: number;
  cartLimit: number;
  sizes: Size[];
  badges?: { saveRs: { active: boolean; amount: number; }; };
}

export default function PriorityShop() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [gridCols, setGridCols] = useState<3 | 4 | 6>(4);
  
  // Filter & Sort State
  const [sortBy, setSortBy] = useState<string>("default");
  // Set to a massive number so "Reset" shows everything regardless of price
  const [maxPrice, setMaxPrice] = useState<number>(9999999); 
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/products/get");
        const data = await res.json();
        if (data.products) {
          // STRICT FILTER: Only show products where priority is 1
          const priorityItems = data.products.filter((p: Product) => p.priority === 1);
          setProducts(priorityItems);
        }
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // --- LOGIC: FILTER & SORT ---
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Apply Price Filter only if user interacted with slider
    if (maxPrice !== 9999999) {
      result = result.filter(p => p.totalPrice >= 5000 && p.totalPrice <= maxPrice);
    }

    // Apply Sorting
    if (sortBy === "az") {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === "za") {
      result.sort((a, b) => b.title.localeCompare(a.title));
    } else if (sortBy === "lowHigh") {
      result.sort((a, b) => a.totalPrice - b.totalPrice);
    } else if (sortBy === "highLow") {
      result.sort((a, b) => b.totalPrice - a.totalPrice);
    }

    return result;
  }, [products, maxPrice, sortBy]);

  const handleReset = () => {
    setMaxPrice(9999999);
    setSortBy("default");
    setShowFilters(false);
    setShowSort(false);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-gray-800 py-20 lg:py-30">
      <ToastContainer limit={3} />

      {selectedProduct && (
        <QuickViewBox
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={() => setSelectedProduct(null)}
        />
      )}

      {/* 1. Page Header */}
      <div className="max-w-4xl mx-auto px-6 py-12 text-center">
        <motion.h1 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-5xl tracking-tighter text-gray-900 font-serif mb-4"
        >
          <span className="text-[var(--primary-color)] italic">Trending</span><span className="pl-6">Now</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-[10px] md:text-xs text-gray-400 font-medium leading-relaxed uppercase tracking-[0.3em] max-w-2xl mx-auto"
        >
          Explore the season&apos;s most-wanted styles. Hand-picked pieces 
          that are defining the current fashion landscape.
        </motion.p>
      </div>

      {/* 2. Control Bar (Sticky) */}
      <div className="sticky top-[64px] z-50 w-full h-[55px] border-y border-gray-200 flex items-center justify-between bg-[#FDFBF7]/90 backdrop-blur-md px-4">
        
        {/* Layout Selectors */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex gap-4 border-r border-gray-200 pr-4">
            {[3, 4, 6].map((cols) => (
              <button 
                key={cols}
                onClick={() => setGridCols(cols as any)} 
                className={`transition-all duration-300 ${gridCols === cols ? "text-black scale-110" : "text-gray-300 hover:text-gray-500"}`}
              >
                {cols === 3 && <div className="flex gap-0.5"><div className="w-2.5 h-4 bg-current"></div><div className="w-2.5 h-4 bg-current"></div><div className="w-2.5 h-4 bg-current"></div></div>}
                {cols === 4 && <LayoutGrid size={18} strokeWidth={1.5} />}
                {cols === 6 && <Grid3X3 size={18} strokeWidth={1.5} />}
              </button>
            ))}
          </div>
          <div className="flex md:hidden gap-4">
             <button onClick={() => setGridCols(3)} className={gridCols === 3 ? "text-black" : "text-gray-300"}><Square size={18} fill={gridCols === 3 ? "currentColor" : "none"}/></button>
             <button onClick={() => setGridCols(4)} className={gridCols === 4 ? "text-black" : "text-gray-300"}><Grid2X2 size={18} /></button>
          </div>
        </div>

        {/* Filters/Sort/Reset */}
        <div className="flex items-center h-full">
          <button 
            onClick={() => {setShowSort(!showSort); setShowFilters(false);}}
            className="flex items-center gap-2 px-4 h-full border-l border-gray-200 hover:bg-white transition-colors"
          >
            <span className="text-[10px] font-bold tracking-widest uppercase">Sort</span>
            <ChevronDown size={12} className={`transition-transform ${showSort ? "rotate-180" : ""}`} />
          </button>

          <button 
            onClick={() => {setShowFilters(!showFilters); setShowSort(false);}}
            className="flex items-center gap-2 px-4 h-full border-l border-gray-200 hover:bg-white transition-colors"
          >
            <span className="text-[10px] font-bold tracking-widest uppercase">Filter</span>
          </button>
          
          <button 
            onClick={handleReset}
            className="flex items-center justify-center px-4 h-full border-l border-gray-200 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
            title="Clear All"
          >
            <RotateCcw size={14} />
          </button>
        </div>

        {/* Sort Menu */}
        <AnimatePresence>
          {showSort && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="absolute top-[56px] right-[110px] w-48 bg-white shadow-2xl border border-gray-100 p-2 z-[60]"
            >
              {[
                { label: "Recommended", val: "default" },
                { label: "A - Z", val: "az" },
                { label: "Z - A", val: "za" },
                { label: "Price: Low to High", val: "lowHigh" },
                { label: "Price: High to Low", val: "highLow" },
              ].map((opt) => (
                <button 
                  key={opt.val}
                  onClick={() => { setSortBy(opt.val); setShowSort(false); }}
                  className={`w-full text-left px-4 py-3 text-[9px] uppercase tracking-widest transition-colors ${sortBy === opt.val ? "bg-amber-50 text-amber-700 font-bold" : "hover:bg-gray-50"}`}
                >
                  {opt.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filter Slider */}
        <AnimatePresence>
          {showFilters && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="absolute top-[56px] right-4 w-72 bg-white shadow-2xl border border-gray-100 p-6 z-[60]"
            >
              <div className="flex justify-between items-center mb-6">
                <span className="text-[10px] font-bold tracking-widest uppercase">Filter by Price</span>
                <button onClick={() => setShowFilters(false)}><X size={14}/></button>
              </div>
              
              <input 
                type="range" min="5000" max="20000" step="500"
                value={maxPrice > 20000 ? 20000 : maxPrice}
                onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                className="w-full h-1 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              
              <div className="flex justify-between mt-4">
                <span className="text-[9px] font-mono text-gray-400 uppercase">Min: 5k</span>
                <span className="text-[9px] font-bold text-amber-600 font-mono uppercase">
                  {maxPrice > 20000 ? "Showing All" : `Up to Rs ${maxPrice.toLocaleString()}`}
                </span>
              </div>

              <button 
                onClick={handleReset}
                className="w-full mt-6 py-3 bg-gray-900 text-white text-[9px] font-bold uppercase tracking-widest hover:bg-black transition-all"
              >
                Reset Filter
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. Products Area */}
      <div className="w-full py-12 px-6">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <motion.div
            layout
            className={`grid gap-x-6 gap-y-16 transition-all duration-500
              ${gridCols === 3 ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : ""}
              ${gridCols === 4 ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4" : ""}
              ${gridCols === 6 ? "grid-cols-3 md:grid-cols-4 lg:grid-cols-6" : ""}
            `}
          >
            <AnimatePresence mode="popLayout">
              {filteredProducts.map((product) => {
                const isSavers = product.badges?.saveRs?.active;
                return (
                  <motion.div 
                    layout
                    key={product._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.4 }}
                    className="group relative flex flex-col"
                  >
                    <div className="relative w-full overflow-hidden bg-[#F5F5F5] aspect-[3/4]">
                      <Link href={`/product/${product._id}`}>
                        {isSavers && (
                          <div className="absolute top-4 left-4 z-20 bg-red-600 text-white text-[9px] font-bold px-2 py-1 tracking-widest uppercase shadow-sm">
                            SAVE RS {product.badges?.saveRs.amount}
                          </div>
                        )}
                        
                        {product.isSoldOut && (
                          <div className="absolute inset-0 bg-white/40 z-10 flex items-center justify-center">
                            <span className="bg-white/90 px-3 py-1.5 text-[10px] font-bold tracking-[0.2em] text-gray-500 uppercase border border-gray-100 shadow-sm">
                              Sold Out
                            </span>
                          </div>
                        )}

                        <Image
                          src={product.images[0]?.url || "/placeholder.jpg"}
                          alt={product.title}
                          fill
                          className="object-cover object-top transition-transform duration-1000 group-hover:scale-110"
                        />
                      </Link>

                      {!product.isSoldOut && (
                        <button
                          onClick={() => setSelectedProduct(product)}
                          className="absolute bottom-4 right-4 z-30 p-4 rounded-full shadow-xl bg-white text-gray-900 hover:bg-black hover:text-white transition-all duration-300 md:translate-y-12 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100"
                        >
                          <ShoppingBag size={18} />
                        </button>
                      )}
                    </div>

                    {gridCols !== 6 && (
                      <div className="mt-6 text-center">
                        <h3 className="text-[11px] font-semibold tracking-[0.2em] text-gray-900 uppercase">
                          {product.title}
                        </h3>
                        <div className="mt-2 flex items-center justify-center gap-2">
                          {isSavers ? (
                            <>
                              <span className="text-[11px] text-gray-300 line-through font-mono">RS {product.price.toLocaleString()}</span>
                              <span className="text-[11px] text-red-600 font-bold font-mono">RS {product.totalPrice.toLocaleString()}</span>
                            </>
                          ) : (
                            <span className="text-[11px] text-gray-500 font-mono">RS {product.totalPrice.toLocaleString()}</span>
                          )}
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
        
        {!loading && filteredProducts.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-400 uppercase tracking-widest text-xs">No results for this selection.</p>
            <button onClick={handleReset} className="mt-4 text-amber-600 text-[10px] font-bold uppercase underline tracking-widest">Clear All Filters</button>
          </div>
        )}
      </div>
    </div>
  );
}