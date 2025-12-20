"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Loader2, CreditCard } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface CartItem {
  _id: string;
  title: string;
  price: number;
  image: string;
  quantity: number;
  cartLimit: number;
  selectedSize: string;
}

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCart = () => {
      const savedCart = JSON.parse(localStorage.getItem("cart") || "[]");
      setCartItems(savedCart);
      setIsLoading(false);
    };
    loadCart();
  }, []);

  const updateQuantity = (id: string, size: string, delta: number) => {
    const updated = cartItems.map((item) => {
      if (item._id === id && item.selectedSize === size) {
        const limit = item.cartLimit || 5;

        // Check if user is trying to exceed limit
        if (delta > 0 && item.quantity >= limit) {
          toast.warn(`The Add to cart limit for this product is ${limit}`, {
            theme: "dark",
            position: "bottom-center",
            autoClose: 2000,
          });
          return item;
        }

        const newQty = Math.max(1, Math.min(item.quantity + delta, limit));
        return { ...item, quantity: newQty };
      }
      return item;
    });

    setCartItems(updated);
    localStorage.setItem("cart", JSON.stringify(updated));
    window.dispatchEvent(new Event("cartUpdated"));
  };

  const removeItem = (id: string, size: string) => {
    const updated = cartItems.filter((item) => !(item._id === id && item.selectedSize === size));
    setCartItems(updated);
    localStorage.setItem("cart", JSON.stringify(updated));
    window.dispatchEvent(new Event("cartUpdated"));
    toast.error("Item removed from cart", { theme: "dark", position: "bottom-right" });
  };

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFBF7]">
        <Loader2 className="animate-spin text-gray-400 mb-4" size={32} />
        <p className="text-[10px] uppercase tracking-[0.3em] text-gray-500">Securing your selection...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-gray-900 pb-20 pt-32 px-4 md:px-10 lg:px-20">
      <ToastContainer limit={2} />
      
      {/* Header */}
      <div className="mb-12 border-b border-gray-200 pb-8 lg:pt-6">
        <h1 className="text-3xl md:text-5xl font-serif italic tracking-tight">Shopping bag</h1>
        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400 mt-2">
          {cartItems.length} {cartItems.length === 1 ? "Item" : "Items"} in your collection
        </p>
      </div>

      {cartItems.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center">
          <ShoppingBag size={40} className="text-gray-200 mb-6" strokeWidth={1} />
          <h2 className="text-lg uppercase tracking-widest font-light">Your bag is empty</h2>
          <Link href="/shop" className="mt-8 text-[11px] font-bold uppercase tracking-[0.3em] border-b-2 border-black pb-1 hover:text-gray-500 hover:border-gray-300 transition-all">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-16">
          
          {/* 1. PRODUCT LIST */}
          <div className="flex-grow space-y-10">
            {cartItems.map((item) => {
              const isAtLimit = item.quantity >= (item.cartLimit || 5);

              return (
                <div key={`${item._id}-${item.selectedSize}`} className="group relative flex gap-6 md:gap-10 border-b border-gray-100 pb-10 transition-all">
                  <div className="relative w-24 h-32 md:w-40 md:h-52 bg-gray-50 overflow-hidden shrink-0">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  </div>

                  <div className="flex flex-col justify-between flex-grow">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xs md:text-sm font-bold uppercase tracking-widest leading-relaxed max-w-[200px] md:max-w-md">
                          {item.title}
                        </h3>
                        <p className="text-[10px] text-gray-400 uppercase tracking-tighter mt-1 italic">
                          Size: {item.selectedSize}
                        </p>
                      </div>
                      <button 
                        onClick={() => removeItem(item._id, item.selectedSize)}
                        className="text-red-800 hover:text-gray-300 transition-colors"
                      >
                        <Trash2 size={16} strokeWidth={1.5} />
                      </button>
                    </div>

                    <div className="flex items-end justify-between mt-6">
                      {/* Quantity Selector */}
                      <div className="flex items-center border border-gray-200 rounded-full px-3 py-1 scale-90 md:scale-100 origin-left">
                        <button 
                          onClick={() => updateQuantity(item._id, item.selectedSize, -1)} 
                          className="p-1 hover:text-gray-400 transition-colors"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="px-4 text-xs font-mono font-bold">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item._id, item.selectedSize, 1)} 
                          className={`p-1 transition-all ${isAtLimit ? 'opacity-30 cursor-not-allowed' : 'hover:text-gray-400'}`}
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      <div className="text-right">
                         <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">Price per unit</p>
                         <p className="text-sm font-mono font-bold">Rs. {item.price.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 2. INVOICE SUMMARY SECTION */}
          <div className="w-full lg:w-[450px]">
            <div className="bg-white border border-gray-900 p-8 md:p-10 sticky top-32 shadow-[20px_20px_0px_0px_rgba(0,0,0,0.05)]">
              <div className="flex justify-between items-center mb-10 border-b border-gray-100 pb-4">
                <h2 className="text-xs font-black uppercase tracking-[0.4em]">Invoice Summary</h2>
                <CreditCard size={18} className="text-gray-400" />
              </div>

              <div className="space-y-4 mb-10 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                {cartItems.map((item) => (
                  <div key={`${item._id}-${item.selectedSize}`} className="flex flex-col text-[10px] uppercase tracking-widest border-b border-dotted border-gray-200 pb-3">
                    <div className="flex justify-between font-bold text-gray-800">
                      <span>{item.title}</span>
                      <span>Rs. {(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-gray-400 mt-1 lowercase italic">
                      <span>{item.selectedSize} × {item.quantity}</span>
                      <span className="text-[9px]">Subtotal</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4 pt-4">
                <div className="flex justify-between text-[11px] uppercase tracking-widest text-gray-500">
                  <span>Shipping</span>
                  <span className="text-green-600 font-bold">Calculated at Checkout</span>
                </div>
                
                <div className="pt-6 mt-6 border-t-[3px] border-double border-gray-900 flex justify-between items-center">
                  <span className="text-xs font-black uppercase tracking-[0.3em]">Total Amount</span>
                  <div className="text-right">
                    <span className="text-2xl font-mono font-black">Rs. {subtotal.toLocaleString()}</span>
                    <p className="text-[8px] text-gray-400 uppercase mt-1 italic tracking-widest">Taxes included</p>
                  </div>
                </div>
              </div>

              <Link 
                href="/checkout" 
                className="group mt-10 w-full bg-black text-white py-5 text-[10px] font-bold uppercase tracking-[0.4em] flex items-center justify-center transition-all hover:bg-white hover:text-black border border-black"
              >
                Proceed to Checkout
                <ArrowRight size={14} className="ml-3 group-hover:translate-x-2 transition-transform" />
              </Link>

              <div className="mt-6 flex items-center justify-center gap-2 opacity-30 grayscale">
                 <div className="h-px bg-gray-300 w-10"></div>
                 <span className="text-[8px] uppercase tracking-[0.2em] font-bold">Secure Checkout</span>
                 <div className="h-px bg-gray-300 w-10"></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}