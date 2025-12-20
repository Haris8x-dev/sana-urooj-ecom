"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { LayoutGrid, Grid3X3, Grid2X2, ChevronDown, Square, ShoppingBag } from "lucide-react"; 
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Import the QuickViewBox component
import QuickViewBox from "@/components/layouts/QuickViewBox";

interface ImageObject {
  url: string;
  fileId: string;
}

interface Size {
  name: string;
  quantity: number | string;
}

interface Product {
  _id: string;
  title: string;
  price: number;      // Original Price
  totalPrice: number; // Final Price from DB
  images: ImageObject[];
  isSoldOut: boolean;
  gender: string; 
  cartLimit: number;  // Individual product limit
  sizes: Size[];      // Product sizes
  badges?: {
    saveRs: {
      active: boolean;
      amount: number;
    };
  };
}

export default function WomenShop() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [gridCols, setGridCols] = useState<3 | 4 | 6>(4); 
  
  // Quick View State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/products/get");
        const data = await res.json();
        
        if (data.products) {
          // FILTER: Only show products where gender is "female"
          const femaleProducts = data.products.filter(
            (product: Product) => product.gender?.toLowerCase() === "female"
          );
          setProducts(femaleProducts);
        }
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  /**
   * Final Cart Logic
   * Triggered by QuickViewBox after user selects size/qty
   */
  const handleFinalAddToCart = (size: string, quantity: number) => {
    if (!selectedProduct) return;

    const existingCart = JSON.parse(localStorage.getItem("cart") || "[]");
    
    // Check for duplicates
    const alreadyInCart = existingCart.find(
      (item: any) => item._id === selectedProduct._id && item.selectedSize === size
    );

    if (alreadyInCart) {
      toast.info(`Item (${size}) is already in your cart!`, { theme: "dark" });
      return;
    }

    const cartItem = {
      _id: selectedProduct._id,
      title: selectedProduct.title,
      price: selectedProduct.totalPrice,
      image: selectedProduct.images?.[0]?.url,
      quantity: quantity,
      selectedSize: size,
      cartLimit: selectedProduct.cartLimit // Injecting the specific DB limit
    };

    existingCart.push(cartItem);
    localStorage.setItem("cart", JSON.stringify(existingCart));
    
    // Sync UI icons
    window.dispatchEvent(new Event("cartUpdated"));

    toast.success(`${selectedProduct.title} added to cart!`, {
      theme: "dark",
      position: "bottom-right"
    });

    setSelectedProduct(null); // Close Modal
  };

  const handleLayoutChange = (cols: 3 | 4 | 6) => {
    setGridCols(cols);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-gray-80 py-20 lg:py-30">
      <ToastContainer limit={3} />

      {/* QUICK VIEW MODAL */}
      {selectedProduct && (
        <QuickViewBox 
          product={selectedProduct} 
          onClose={() => setSelectedProduct(null)} 
          onAddToCart={handleFinalAddToCart}
        />
      )}

      {/* 1. Page Title */}
      <div className="py-2 md:py-8 text-center"> 
        <h1 className="text-md tracking-widest text-gray-900 navItems uppercase font-mono py-4">
          Women's Collection
        </h1>
      </div>

      {/* 2. Control Bar */}
      <div className="w-full h-[45px] border-y border-gray-300 flex items-center justify-between bg-transparent mt-4">
        <div className="h-full flex items-center px-4 border-r border-gray-300 gap-3">
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
              <ChevronDown size={14} className="text-gray-400 group-hover:text-black transition-transform group-hover:rotate-180"/>
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
            <p className="text-gray-400 tracking-widest text-sm animate-pulse uppercase">Loading Women&apos;s Collection...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="flex justify-center items-center h-64 text-center flex-col gap-2">
            <p className="text-gray-400 tracking-widest text-sm uppercase">No items found</p>
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
              const isSaversActive = product.badges?.saveRs?.active && (product.badges?.saveRs?.amount || 0) > 0;
              const saversAmount = product.badges?.saveRs?.amount;

              return (
                <div key={product._id} className="group relative flex flex-col">
                  <div className="relative w-full overflow-hidden bg-gray-100 aspect-[3/4]">
                    <Link href={`/product/${product._id}`} className="block w-full h-full">
                      {isSaversActive && (
                        <div className="absolute top-3 left-3 z-20 bg-red-600 text-white text-[9px] md:text-[11px] font-bold px-2 py-1 tracking-tighter uppercase shadow-sm">
                          SAVERS {saversAmount}
                        </div>
                      )}

                      {product.isSoldOut && (
                          <div className="absolute bottom-2 left-2 z-10 bg-white/90 px-2 py-1">
                              <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">
                                  Sold Out
                              </span>
                          </div>
                      )}

                      {product.images?.[0] ? (
                          <Image
                            src={product.images[0].url} 
                            alt={product.title}
                            fill
                            className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-105"
                            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                          />
                      ) : (
                          <div className="flex items-center justify-center w-full h-full text-gray-300 text-xs italic">
                            No Image
                          </div>
                      )}
                    </Link>

                    {/* QUICK VIEW TRIGGER */}
                    {!product.isSoldOut && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setSelectedProduct(product);
                        }}
                        className="absolute bottom-3 right-3 z-30 p-2.5 rounded-full shadow-lg transition-all duration-300 transform bg-white text-gray-900 hover:bg-black hover:text-white md:translate-y-4 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 flex items-center justify-center"
                      >
                        <ShoppingBag size={18} />
                      </button>
                    )}
                  </div>

                  {/* Product Details */}
                  {gridCols !== 6 && (
                    <div className="mt-4 text-center space-y-1">
                      <Link href={`/product/${product._id}`}>
                        <h3 className="text-xs font-medium tracking-widest text-gray-900 uppercase hover:text-gray-500 transition-colors">
                          {product.title}
                        </h3>
                      </Link>
                      
                      <div className="flex items-center justify-center gap-2">
                        {isSaversActive ? (
                          <>
                            <span className="text-[11px] text-gray-400 line-through">
                              Rs {product.price.toLocaleString()}
                            </span>
                            <span className="text-[11px] text-red-600 font-bold">
                              Rs {product.totalPrice.toLocaleString()}
                            </span>
                          </>
                        ) : (
                          <p className="text-xs text-gray-500 font-light">
                            Rs {product.totalPrice ? product.totalPrice.toLocaleString() : "N/A"}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}