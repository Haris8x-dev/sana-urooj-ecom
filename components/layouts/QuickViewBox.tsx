"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, Plus, Minus, ShoppingBag, ArrowRight, Check } from "lucide-react";
import { toast } from "react-toastify";

interface Size {
  name: string;
  quantity: number | string;
}

interface Product {
  _id: string;
  title: string;
  price: number;
  totalPrice: number;
  images: { url: string; fileId: string }[];
  sizes: Size[];
  cartLimit: number;
  badges?: {
    saveRs: { active: boolean; amount: number; };
  };
}

interface QuickViewBoxProps {
  product: Product;
  onClose: () => void;
  onAddToCart: (selectedSize: string, quantity: number) => void;
}

export default function QuickViewBox({ product, onClose, onAddToCart }: QuickViewBoxProps) {
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [activeImgIndex, setActiveImgIndex] = useState<number>(0); // Added setter

  const limit = product.cartLimit || 5;
  const isSaversActive = product.badges?.saveRs?.active && (product.badges?.saveRs?.amount || 0) > 0;

  // Optimized: Only re-check cart when selectedSize changes
  const isAlreadyInCart = useMemo(() => {
    if (typeof window === "undefined" || !selectedSize) return false;
    const existingCart = JSON.parse(localStorage.getItem("cart") || "[]");
    return existingCart.some(
      (item: any) => item._id === product._id && item.selectedSize === selectedSize
    );
  }, [selectedSize, product._id]);

  const handleIncrement = () => {
    if (quantity < limit) {
      setQuantity((prev) => prev + 1);
    } else {
      toast.warn(`Limit reached: Maximum ${limit} units allowed.`, {
        theme: "dark",
        position: "top-center",
      });
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) setQuantity((prev) => prev - 1);
  };

  const handleAddToCartAttempt = () => {
    // 1. Validation
    if (!selectedSize) {
      toast.error("Please select a size first", { 
        position: "top-center", 
        theme: "dark" 
      });
      return;
    }

    // 2. Logic Check: Already in cart?
    if (isAlreadyInCart) {
      toast.info(`${product.title} (${selectedSize}) is already in your cart`, {
        theme: "dark",
        position: "top-center",
      });
      return; 
    }

    // 3. Construct Item
    const cartItem = {
      _id: product._id,
      title: product.title,
      price: product.totalPrice,
      image: product.images?.[0]?.url,
      quantity: quantity,
      selectedSize: selectedSize,
      cartLimit: product.cartLimit,
    };

    // 4. Save & Sync
    const existingCart = JSON.parse(localStorage.getItem("cart") || "[]");
    localStorage.setItem("cart", JSON.stringify([...existingCart, cartItem]));
    window.dispatchEvent(new Event("cartUpdated"));
    
    // 5. Single Success Toast
    toast.success("Added to cart successfully", {
      theme: "dark",
      position: "bottom-right",
    });

    onAddToCart(selectedSize, quantity);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-[#FDFBF7] w-full max-w-[900px] relative flex flex-col md:flex-row shadow-2xl rounded-sm overflow-hidden scale-in-95 animate-in zoom-in duration-300">
        
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 z-20 p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-full transition-all"
        >
          <X size={22} />
        </button>

        {/* LEFT: Image Section */}
        <div className="w-full md:w-1/2 p-6 bg-[#f7f4ef] flex flex-col items-center justify-center border-r border-gray-100">
          <div className="relative w-full aspect-[3/4] overflow-hidden bg-gray-100 shadow-inner rounded-sm">
            {product.images?.[activeImgIndex] ? (
              <Image
                src={product.images[activeImgIndex].url}
                alt={product.title}
                fill
                className="object-cover object-top hover:scale-105 transition-transform duration-700"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 uppercase text-[10px] tracking-widest">No Image Available</div>
            )}
          </div>

          {/* Image Navigation Dots */}
          {product.images.length > 1 && (
            <div className="flex gap-2 mt-4">
              {product.images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImgIndex(idx)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    activeImgIndex === idx ? "bg-black w-6" : "bg-gray-300 hover:bg-gray-400"
                  }`}
                  aria-label={`View image ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: Product Details */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col">
          <div className="mb-8">
            <h2 className="text-2xl font-serif text-gray-900 mb-3 leading-tight tracking-tight">{product.title}</h2>
            <div className="flex items-center gap-4">
              <span className="text-2xl font-mono font-bold text-red-600">Rs. {product.totalPrice.toLocaleString()}</span>
              {isSaversActive && (
                <span className="text-sm text-gray-400 line-through font-mono">Rs. {product.price.toLocaleString()}</span>
              )}
            </div>
          </div>

          {/* Size Selection */}
          <div className="mb-8">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-5">Select Size</p>
            <div className="flex flex-wrap gap-3">
              {product.sizes.map((size) => (
                <button
                  key={size.name}
                  onClick={() => setSelectedSize(size.name)}
                  className={`min-w-[60px] h-[48px] border text-[10px] font-bold uppercase tracking-widest transition-all duration-300
                    ${selectedSize === size.name
                      ? "bg-black text-white border-black shadow-lg"
                      : "bg-white text-gray-900 border-gray-200 hover:border-black"}`}
                >
                  {size.name}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity Selector */}
          <div className="mb-10">
            <div className="flex justify-between items-center mb-4">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Quantity</p>
              <span className="text-[9px] font-mono text-gray-400 italic">Limit: {limit} items</span>
            </div>

            <div className="inline-flex items-center border border-gray-300 rounded-sm overflow-hidden bg-white shadow-sm">
              <button 
                onClick={handleDecrement} 
                className="w-12 h-12 flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-30"
                disabled={quantity <= 1}
              >
                <Minus size={14} />
              </button>
              <div className="w-14 text-center text-xs font-mono font-bold select-none border-x border-gray-100">
                {quantity}
              </div>
              <button 
                onClick={handleIncrement} 
                className="w-12 h-12 flex items-center justify-center hover:bg-gray-50 transition-colors border-l border-gray-100 disabled:opacity-30"
                disabled={quantity >= limit}
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCartAttempt}
            className={`w-full py-5 text-[11px] font-bold uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-3 shadow-xl mb-8
              ${isAlreadyInCart 
                ? "bg-gray-50 text-gray-400 border border-gray-200" 
                : "bg-[#1a1a1a] text-white hover:bg-black active:scale-[0.97]"}`}
          >
            {isAlreadyInCart ? (
              <><Check size={18} className="text-green-500" /> Already In Bag</>
            ) : (
              <><ShoppingBag size={18} /> Add To Cart</>
            )}
          </button>

          <Link
            href={`/product/${product._id}`}
            className="inline-flex items-center text-[10px] font-bold uppercase tracking-[0.2em] text-gray-900 group self-start"
          >
            <span className="border-b-2 border-black/10 pb-1 group-hover:border-black transition-all">
              View full details
            </span>
            <ArrowRight size={12} className="ml-2 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}