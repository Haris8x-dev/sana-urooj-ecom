"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { LayoutGrid, Grid3X3, Grid2X2, ChevronDown, Square, ShoppingBag, X, RotateCcw } from "lucide-react";
import { ToastContainer } from 'react-toastify';
import { motion, AnimatePresence } from "framer-motion";
import 'react-toastify/dist/ReactToastify.css';

import QuickViewBox from "@/components/layouts/QuickViewBox";

// --- INTERFACES ---
interface ImageObject { url: string; fileId: string; }
interface Size { name: string; quantity: number | string; }

interface Product {
  _id: string;
  title: string;
  price: number;
  totalPrice: number;
  images: ImageObject[];
  isSoldOut: boolean;
  cartLimit: number;
  sizes: Size[];
  badges?: { saveRs: { active: boolean; amount: number; }; };
}

interface CategoryObject { _id: string; title: string; }
interface CategoryData { message: string; category: CategoryObject; products: Product[]; error?: any; }
interface CategoryPageProps { categoryId: string; }

const formatTitleFromId = (id: string): string => {
  if (!id) return "Category";
  return id.replace(/[-_]/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
};

export default function CategoryPage({ categoryId }: CategoryPageProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryTitle, setCategoryTitle] = useState(formatTitleFromId(categoryId));
  const [gridCols, setGridCols] = useState<3 | 4 | 6>(4);
  
  // Logic States exactly like Shop.tsx
  const [sortBy, setSortBy] = useState<string>("default");
  // Default to massive number so everything shows initially
  const [maxPrice, setMaxPrice] = useState<number>(9999999); 
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    const fetchCategoryProducts = async () => {
      try {
        const res = await fetch(`/api/categories/${categoryId}`);
        const data: CategoryData = await res.json();
        if (data.products) {
          setProducts(data.products);
          if (data.category?.title) setCategoryTitle(data.category.title);
        }
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        // Slight delay for a smoother "Good Loading Screen" transition
        setTimeout(() => setLoading(false), 800);
      }
    };
    fetchCategoryProducts();
  }, [categoryId]);

  // --- LOGIC: FILTER & SORT (Mirrored from Shop.tsx) ---
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Only apply constraint IF the user has moved the slider from default
    if (maxPrice !== 9999999) {
      result = result.filter(p => p.totalPrice >= 0 && p.totalPrice <= maxPrice);
    }

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

  // 1. GOOD LOADING SCREEN
  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#FDFBF7]">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }} 
          className="flex flex-col items-center"
        >
          <div className="w-12 h-12 border-2 border-gray-100 border-t-[var(--primary-color)] rounded-full animate-spin mb-4" />
          <motion.p 
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="text-[10px] font-bold tracking-[0.4em] uppercase text-gray-400"
          >
            Loading {categoryTitle}
          </motion.p>
        </motion.div>
      </div>
    );
  }

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

      {/* 2. TITLE SECTION (Updated with tracking-tight) */}
      <div className="max-w-4xl mx-auto px-6 py-12 text-center">
        <motion.h1 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-6xl tracking-tight text-gray-900 uppercase font-serif italic mb-4"
        >
          {categoryTitle}
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-[10px] md:text-xs text-gray-400 font-medium leading-relaxed uppercase tracking-[0.3em] max-w-2xl mx-auto"
        >
          Curated selection of pieces specifically chosen for this collection.
        </motion.p>
      </div>

      {/* 3. CONTROL BAR (Exact Mirror of Shop.tsx) */}
      <div className="sticky top-[64px] z-50 w-full h-[55px] border-y border-gray-200 flex items-center justify-between bg-[#FDFBF7]/90 backdrop-blur-md px-4">
        
        {/* Layout Switchers */}
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

        {/* Filters & Sort Icons */}
        <div className="flex items-center h-full">
          <button 
            onClick={() => {setShowSort(!showSort); setShowFilters(false);}}
            className="flex items-center gap-2 px-4 h-full border-l border-gray-200 hover:bg-white transition-colors"
          >
            <span className="text-[10px] font-bold tracking-widest uppercase">Sort</span>
            <ChevronDown size={12} className={`transition-transform duration-300 ${showSort ? "rotate-180" : ""}`} />
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
            title="Reset All"
          >
            <RotateCcw size={14} />
          </button>
        </div>

        {/* SORT DROPDOWN (Mirrored Labels from Shop.tsx) */}
        <AnimatePresence>
          {showSort && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="absolute top-[56px] right-[110px] w-48 bg-white shadow-2xl border border-gray-100 p-2 z-[60]"
            >
              {[
                { label: "Default", val: "default" },
                { label: "Alphabetical A-Z", val: "az" },
                { label: "Alphabetical Z-A", val: "za" },
                { label: "Price: Low to High", val: "lowHigh" },
                { label: "Price: High to Low", val: "highLow" },
              ].map((opt) => (
                <button 
                  key={opt.val}
                  onClick={() => { setSortBy(opt.val); setShowSort(false); }}
                  className={`w-full text-left px-4 py-3 text-[9px] uppercase tracking-widest transition-colors ${sortBy === opt.val ? "bg-amber-50 text-amber-400 font-bold" : "hover:bg-gray-50 text-gray-500"}`}
                >
                  {opt.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* FILTER PROGRESS BAR DROPDOWN (Mirrored from Shop.tsx) */}
        <AnimatePresence>
          {showFilters && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              className="absolute top-[56px] right-4 w-72 bg-white shadow-2xl border border-gray-100 p-6 z-[60]"
            >
              <div className="flex justify-between items-center mb-6">
                <span className="text-[10px] font-bold tracking-widest uppercase">Price Range</span>
                <button onClick={() => setShowFilters(false)} className="text-gray-400 hover:text-black transition-colors"><X size={14}/></button>
              </div>
              
              <input 
                type="range" min="1000" max="25000" step="500"
                value={maxPrice > 25000 ? 25000 : maxPrice}
                onChange={(e) => setMaxPrice(parseInt(e.target.value))}
                className="w-full h-1 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-[var(--primary-color)]"
              />
              
              <div className="flex justify-between mt-4">
                <span className="text-[9px] font-mono text-gray-400">RS 1,000</span>
                <span className="text-[9px] font-bold text-amber-400 font-mono">
                  {maxPrice > 25000 ? "UNLIMITED" : `UP TO RS ${maxPrice.toLocaleString()}`}
                </span>
              </div>

              <button 
                onClick={handleReset}
                className="w-full mt-6 py-3 bg-gray-900 text-white text-[9px] font-bold uppercase tracking-widest hover:bg-black transition-all"
              >
                Clear All Filters
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 4. PRODUCT GRID */}
      <div className="w-full py-12 px-6">
        <motion.div
          layout
          className={`grid gap-x-6 gap-y-16 transition-all duration-500
            ${gridCols === 3 ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : ""}
            ${gridCols === 4 ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4" : ""}
            ${gridCols === 6 ? "grid-cols-3 md:grid-cols-4 lg:grid-cols-6" : ""}
          `}
        >
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((product) => (
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
                    {product.badges?.saveRs?.active && (
                      <div className="absolute top-4 left-4 z-20 bg-red-600 text-white text-[9px] font-bold px-2 py-1 tracking-widest uppercase">
                        SAVE RS {product.badges.saveRs.amount}
                      </div>
                    )}
                    <Image
                      src={product.images[0]?.url || "/placeholder.jpg"}
                      alt={product.title}
                      fill
                      className="object-cover object-top transition-transform duration-1000 group-hover:scale-110"
                    />
                  </Link>

                  {/* The Hover-up Shopping Bag icon */}
                  {!product.isSoldOut && (
                    <button
                      onClick={() => setSelectedProduct(product)}
                      className="absolute bottom-4 right-4 z-30 p-4 rounded-full shadow-xl bg-white text-gray-900 hover:bg-black hover:text-white transition-all duration-300 transform md:translate-y-12 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 flex items-center justify-center"
                    >
                      <ShoppingBag size={18} />
                    </button>
                  )}
                </div>

                {gridCols !== 6 && (
                  <div className="mt-6 text-center">
                    <h3 className="text-[11px] font-semibold tracking-[0.2em] text-gray-900 uppercase group-hover:text-[var(--primary-color)] transition-colors">
                      {product.title}
                    </h3>
                    <div className="mt-2 flex items-center justify-center gap-2">
                      {product.badges?.saveRs?.active ? (
                        <>
                          <span className="text-[11px] text-gray-300 line-through font-mono font-bold">RS {product.price.toLocaleString()}</span>
                          <span className="text-[11px] text-red-600 font-bold font-mono">RS {product.totalPrice.toLocaleString()}</span>
                        </>
                      ) : (
                        <span className="text-[11px] text-gray-500 font-mono font-bold tracking-widest uppercase">RS {product.totalPrice.toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
        
        {filteredProducts.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-400 uppercase tracking-widest text-xs font-medium">No products match your criteria.</p>
            <button onClick={handleReset} className="mt-4 text-amber-400 text-[10px] font-bold uppercase underline tracking-widest">Show All Products</button>
          </div>
        )}
      </div>
    </div>
  );
}