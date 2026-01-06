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
  gender: string;
  cartLimit: number;
  sizes: Size[];
  badges?: { saveRs: { active: boolean; amount: number; }; };
}

export default function MenShop() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [gridCols, setGridCols] = useState<3 | 4 | 6>(4);
  
  const [sortBy, setSortBy] = useState<string>("default");
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
          const menItems = data.products.filter((p: Product) => p.gender?.toLowerCase() === "male");
          setProducts(menItems);
        }
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    let result = [...products];
    if (maxPrice !== 9999999) {
      result = result.filter(p => p.totalPrice >= 0 && p.totalPrice <= maxPrice);
    }
    if (sortBy === "az") result.sort((a, b) => a.title.localeCompare(b.title));
    else if (sortBy === "za") result.sort((a, b) => b.title.localeCompare(a.title));
    else if (sortBy === "lowHigh") result.sort((a, b) => a.totalPrice - b.totalPrice);
    else if (sortBy === "highLow") result.sort((a, b) => b.totalPrice - a.totalPrice);
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

      {/* Page Title */}
      <div className="max-w-4xl mx-auto px-6 py-12 text-center">
        <motion.h1 
          initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-5xl tracking-tight font-serif mb-4"
        >
          <span className="text-[var(--primary-color)] italic">Men&apos;s </span> Collection
        </motion.h1>
      </div>

      {/* Sticky Bar */}
      <div className="sticky top-[64px] z-50 w-full h-[55px] border-y border-gray-200 flex items-center justify-between bg-[#FDFBF7]/90 backdrop-blur-md px-4">
        <div className="flex items-center gap-4">
          <div className="hidden md:flex gap-4 border-r border-gray-200 pr-4">
            {[3, 4, 6].map((cols) => (
              <button key={cols} onClick={() => setGridCols(cols as any)} className={`transition-all ${gridCols === cols ? "text-black scale-110" : "text-gray-300 hover:text-gray-500"}`}>
                {cols === 4 ? <LayoutGrid size={18} /> : cols === 6 ? <Grid3X3 size={18} /> : <Square size={18} />}
              </button>
            ))}
          </div>
          <div className="flex md:hidden gap-4">
             <button onClick={() => setGridCols(3)} className={gridCols === 3 ? "text-black" : "text-gray-300"}><Square size={18} fill={gridCols === 3 ? "currentColor" : "none"}/></button>
             <button onClick={() => setGridCols(4)} className={gridCols === 4 ? "text-black" : "text-gray-300"}><Grid2X2 size={18} /></button>
          </div>
        </div>

        <div className="flex items-center h-full">
          <button onClick={() => {setShowSort(!showSort); setShowFilters(false);}} className="flex items-center gap-2 px-4 h-full border-l border-gray-200">
            <span className="text-[10px] font-bold tracking-widest uppercase">Sort</span>
            <ChevronDown size={12} className={`transition-transform ${showSort ? "rotate-180" : ""}`} />
          </button>
          <button onClick={() => {setShowFilters(!showFilters); setShowSort(false);}} className="flex items-center gap-2 px-4 h-full border-l border-gray-200 uppercase text-[10px] font-bold tracking-widest">Filter</button>
          <button onClick={handleReset} className="px-4 border-l border-gray-200 text-gray-400 hover:text-red-500 transition-colors"><RotateCcw size={14} /></button>
        </div>

        {/* Sort Menu */}
        <AnimatePresence>
          {showSort && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute top-[56px] right-24 w-48 bg-white shadow-2xl border border-gray-100 p-2 z-[60]">
              {[ {l: "A - Z", v: "az"}, {l: "Z - A", v: "za"}, {l: "Low to High", v: "lowHigh"}, {l: "High to Low", v: "highLow"} ].map((opt) => (
                <button key={opt.v} onClick={() => { setSortBy(opt.v); setShowSort(false); }} className="w-full text-left px-4 py-3 text-[9px] uppercase tracking-widest hover:bg-gray-50">{opt.l}</button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Grid */}
      <div className="w-full py-12 px-6">
        {loading ? (
           <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-[var(--primary-color)] border-t-transparent rounded-full animate-spin"></div></div>
        ) : (
          <motion.div layout className={`grid gap-x-6 gap-y-16 ${gridCols === 3 ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : gridCols === 4 ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4" : "grid-cols-3 md:grid-cols-4 lg:grid-cols-6"}`}>
            <AnimatePresence mode="popLayout">
              {filteredProducts.map((product) => (
                <motion.div layout key={product._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="group">
                  <div className="relative aspect-[3/4] bg-[#F5F5F5] overflow-hidden">
                    <Link href={`/product/${product._id}`}>
                      {product.badges?.saveRs?.active && (
                         <div className="absolute top-4 left-4 z-20 bg-red-600 text-white text-[9px] font-bold px-2 py-1 tracking-widest uppercase">SAVE RS {product.badges.saveRs.amount}</div>
                      )}
                      <Image src={product.images[0]?.url} alt={product.title} fill className="object-cover object-top transition-transform duration-1000 group-hover:scale-110" />
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
                      <h3 className="text-[11px] font-semibold tracking-[0.2em] text-gray-900 uppercase">{product.title}</h3>
                      <div className="mt-2 flex items-center justify-center gap-2">
                        {product.badges?.saveRs?.active ? (
                          <>
                            <span className="text-[11px] text-gray-300 line-through font-mono">RS {product.price.toLocaleString()}</span>
                            <span className="text-[11px] text-red-600 font-bold font-mono text-[var(--primary-color)]">RS {product.totalPrice.toLocaleString()}</span>
                          </>
                        ) : (
                          <span className="text-[11px] text-gray-500 font-mono text-[var(--primary-color)]">RS {product.totalPrice.toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}