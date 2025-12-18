"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { LayoutGrid, Grid3X3, Grid2X2, ChevronDown, Square, ShoppingBag, Check } from "lucide-react"; 
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
  const [gridCols, setGridCols] = useState<3 | 4 | 6>(4); 
  const [addingId, setAddingId] = useState<string | null>(null);

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

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();

    if (product.isSoldOut) return;

    const existingCart = JSON.parse(localStorage.getItem("cart") || "[]");
    const isDuplicate = existingCart.find((item: any) => item._id === product._id);

    if (isDuplicate) {
      toast.info("Item is already in your cart!", {
        position: "bottom-right",
        autoClose: 2000,
        theme: "dark",
      });
      return;
    }

    const cartItem = {
      _id: product._id,
      title: product.title,
      price: product.totalPrice,
      image: product.images[0]?.url,
      quantity: 1,
      selectedSize: "Standard"
    };

    existingCart.push(cartItem);
    localStorage.setItem("cart", JSON.stringify(existingCart));
    window.dispatchEvent(new Event("cartUpdated"));

    setAddingId(product._id);
    toast.success(`${product.title} added to cart!`, {
      position: "bottom-right",
      autoClose: 2000,
      theme: "dark",
    });

    setTimeout(() => setAddingId(null), 3000);
  };

  const handleLayoutChange = (cols: 3 | 4 | 6) => {
    setGridCols(cols);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-gray-80 py-20 lg:py-30">
      <ToastContainer limit={3} />

      {/* 1. Page Title */}
      <div className="py-2 md:py-8 text-center"> 
        <h1 className="text-md tracking-widest text-red-600 navItems uppercase font-mono py-4">
          Special Offers
        </h1>
      </div>

      {/* 2. Control Bar */}
      <div className="w-full h-[45px] border-y border-gray-300 flex items-center justify-between bg-transparent mt-4">
        <div className="h-full flex items-center px-4 border-r border-gray-300 gap-3">
          {/* DESKTOP CONTROLS */}
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

          {/* MOBILE CONTROLS */}
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
          <div className="flex flex-col justify-center items-center h-64 gap-3">
            <div className="w-6 h-6 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-400 tracking-widest text-xs uppercase">Fetching Deals...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="flex justify-center items-center h-64 text-center flex-col gap-2">
            <p className="text-gray-400 tracking-widest text-sm uppercase">No active offers at the moment</p>
            <Link href="/shop" className="text-[10px] underline tracking-widest text-gray-900 uppercase">Browse all products</Link>
          </div>
        ) : (
          <div
            className={`grid gap-x-4 gap-y-10 transition-all duration-500 ease-in-out
              ${gridCols === 3 ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : ""}
              ${gridCols === 4 ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4" : ""}
              ${gridCols === 6 ? "grid-cols-3 md:grid-cols-4 lg:grid-cols-6" : ""}
            `}
          >
            {products.map((product) => {
              const saversAmount = product.badges?.saveRs?.amount;
              const isAdding = addingId === product._id;

              return (
                <div key={product._id} className="group relative flex flex-col">
                  {/* Image Container */}
                  <div className="relative w-full overflow-hidden bg-gray-100 aspect-[3/4]">
                    <Link href={`/product/${product._id}`} className="block w-full h-full">
                        {/* SAVERS TAG */}
                        <div className="absolute top-3 left-3 z-20 bg-red-600 text-white text-[9px] md:text-[11px] font-bold px-2 py-1 tracking-tighter uppercase shadow-sm">
                          SAVERS {saversAmount}
                        </div>

                        {/* Sold Out Badge */}
                        {product.isSoldOut && (
                            <div className="absolute inset-0 bg-white/40 z-10 flex items-end p-2">
                                <span className="bg-white/90 px-2 py-1 text-[10px] font-bold tracking-widest text-gray-500 uppercase">
                                    Sold Out
                                </span>
                            </div>
                        )}

                        {product.images && product.images[0] ? (
                            <Image
                              src={product.images[0].url} 
                              alt={product.title}
                              fill
                              className="object-cover object-top transition-transform duration-1000 ease-out group-hover:scale-110"
                              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                            />
                        ) : (
                            <div className="flex items-center justify-center w-full h-full text-gray-300 text-xs italic font-serif">
                             - No Preview -
                            </div>
                        )}
                    </Link>

                    {/* QUICK ACTION BUTTON */}
                    {!product.isSoldOut && (
                      <button
                        onClick={(e) => handleAddToCart(e, product)}
                        className={`absolute bottom-3 right-3 z-30 p-2.5 rounded-full shadow-lg transition-all duration-300 transform 
                          ${isAdding ? 'bg-green-600 text-white translate-y-0 opacity-100' : 'bg-white text-gray-900 hover:bg-black hover:text-white md:translate-y-4 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100'}
                          flex items-center justify-center
                        `}
                      >
                        {isAdding ? <Check size={18} /> : <ShoppingBag size={18} />}
                      </button>
                    )}
                  </div>

                  {/* Product Info */}
                  {gridCols !== 6 && (
                    <div className="mt-4 text-center space-y-1 px-1">
                      <Link href={`/product/${product._id}`}>
                        <h3 className="text-[11px] font-medium tracking-widest text-gray-900 uppercase hover:text-red-600 transition-colors line-clamp-1">
                          {product.title}
                        </h3>
                      </Link>
                      
                      <div className="flex items-center justify-center gap-2 pt-1">
                        <span className="text-[10px] text-gray-400 line-through">
                          Rs {product.price.toLocaleString()}
                        </span>
                        <span className="text-[11px] text-red-600 font-bold">
                          Rs {product.totalPrice.toLocaleString()}
                        </span>
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