"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Loader2, ShieldCheck, Truck } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface CartItem {
  _id: string;
  title: string;
  price: number;
  image: string;
  quantity: number;
  cartLimit: number; // Ensure this is always a number
  selectedSize: string;
}

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Sync local cart with real Database details
  const fetchRealTimeDetails = async (localCart: CartItem[]) => {
    try {
      const updatedCart = await Promise.all(
        localCart.map(async (item) => {
          try {
            const res = await fetch(`/api/products/${item._id}`);
            if (res.ok) {
              const data = await res.json();
              const product = data.product;
              
              return {
                ...item,
                title: product.title || item.title,
                price: product.totalPrice || product.price || item.price,
                // Fallback to 5 or item.cartLimit if DB value is missing
                cartLimit: Number(product.cartLimit) || Number(item.cartLimit) || 5, 
                image: product.images?.[0]?.url || item.image,
              };
            }
          } catch (err) {
            console.error(`Failed to sync item ${item._id}:`, err);
          }
          return item;
        })
      );
      
      setCartItems(updatedCart);
      localStorage.setItem("cart", JSON.stringify(updatedCart));
    } catch (error) {
      console.error("Error syncing cart with database:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      const parsedCart = JSON.parse(savedCart);
      fetchRealTimeDetails(parsedCart);
    } else {
      setIsLoading(false);
    }

    const handleUpdate = () => {
      const updated = localStorage.getItem("cart");
      if (updated) setCartItems(JSON.parse(updated));
    };

    window.addEventListener("cartUpdated", handleUpdate);
    return () => window.removeEventListener("cartUpdated", handleUpdate);
  }, []);

  const updateStorage = (newCart: CartItem[]) => {
    setCartItems(newCart);
    localStorage.setItem("cart", JSON.stringify(newCart));
    window.dispatchEvent(new Event("cartUpdated"));
  };

  const handleQtyChange = (id: string, type: "inc" | "dec") => {
    let limitReached = false;
    let currentLimit = 5;

    const newCart = cartItems.map((item) => {
      if (item._id === id) {
        // Ensure we are working with numbers
        const itemLimit = Number(item.cartLimit) || 5;
        currentLimit = itemLimit;

        if (type === "inc") {
          if (item.quantity < itemLimit) {
            return { ...item, quantity: item.quantity + 1 };
          } else {
            limitReached = true;
            return item;
          }
        } else if (type === "dec" && item.quantity > 1) {
          return { ...item, quantity: item.quantity - 1 };
        }
      }
      return item;
    });

    if (limitReached) {
      toast.warn(`Maximum limit reached: Only ${currentLimit} units allowed.`, {
        theme: "dark",
        position: "bottom-center"
      });
      return; // Don't update storage if nothing changed
    }

    updateStorage(newCart);
  };

  const removeItem = (id: string) => {
    const newCart = cartItems.filter((item) => item._id !== id);
    updateStorage(newCart);
    toast.error("Item removed from cart", { position: "bottom-center", autoClose: 1500 });
  };

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <Loader2 className="animate-spin text-black mb-4" size={40} />
        <p className="text-[10px] uppercase tracking-[0.3em] font-medium animate-pulse">Synchronizing Inventory...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1a1a1a]">
      <ToastContainer limit={2} />
      
      <div className="max-w-7xl mx-auto px-6 py-20 lg:py-32">
        <div className="flex flex-col items-center mb-16 text-center">
          <h1 className="text-2xl md:text-3xl font-serif tracking-tight mb-4 italic">Shopping Bag</h1>
          <div className="h-[1px] w-12 bg-black mb-4"></div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500">
            {cartItems.length} {cartItems.length === 1 ? "Item" : "Items"} ready for checkout
          </p>
        </div>

        {cartItems.length === 0 ? (
          <div className="max-w-md mx-auto text-center py-20">
            <div className="bg-white p-12 border border-gray-100 shadow-sm rounded-sm">
              <ShoppingBag size={40} className="mx-auto mb-6 text-gray-200" strokeWidth={1} />
              <h2 className="text-sm font-medium uppercase tracking-widest mb-2">Empty Cart</h2>
              <p className="text-xs text-gray-400 mb-8 leading-relaxed">Your selection is currently empty.</p>
              <Link href="/" className="inline-block bg-black text-white px-10 py-4 text-[10px] font-bold uppercase tracking-widest">
                Start Shopping
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-20 items-start">
            <div className="w-full lg:flex-grow space-y-12">
              {cartItems.map((item) => (
                <div key={`${item._id}-${item.selectedSize}`} className="flex flex-col sm:flex-row gap-8 pb-12 border-b border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="relative w-full sm:w-40 aspect-[3/4] overflow-hidden bg-gray-100">
                    <Image src={item.image} alt={item.title} fill className="object-cover" />
                  </div>

                  <div className="flex flex-col flex-grow py-2">
                    <div className="flex justify-between items-start mb-4">
                      <div className="space-y-1">
                        <h3 className="text-sm font-bold uppercase tracking-widest">{item.title}</h3>
                        <div className="flex gap-4 text-[10px] text-gray-400 uppercase tracking-tighter">
                          <p>Size: <span className="text-black font-medium">{item.selectedSize}</span></p>
                          <p>Price: <span className="text-black font-medium">Rs. {item.price.toLocaleString()}</span></p>
                        </div>
                      </div>
                      <button onClick={() => removeItem(item._id)} className="text-gray-300 hover:text-red-600 transition-colors">
                        <Trash2 size={16} strokeWidth={1.5} />
                      </button>
                    </div>

                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center bg-white border border-gray-200 rounded-full px-2 py-1 shadow-sm">
                        <button onClick={() => handleQtyChange(item._id, "dec")} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-black">
                          <Minus size={12} />
                        </button>
                        <span className="w-10 text-center text-xs font-mono font-bold">{item.quantity}</span>
                        <button onClick={() => handleQtyChange(item._id, "inc")} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-black">
                          <Plus size={12} />
                        </button>
                      </div>

                      <div className="text-right font-mono text-sm font-bold">
                        Rs. {(item.price * item.quantity).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="w-full lg:w-[400px] lg:sticky lg:top-32 bg-white p-10 border border-gray-100 shadow-xl rounded-sm">
              <h2 className="text-xs font-bold uppercase tracking-[0.3em] mb-10 text-center">Summary</h2>
              <div className="space-y-6 mb-10">
                <div className="flex justify-between text-[11px] uppercase tracking-wider text-gray-500">
                  <span>Cart Subtotal</span>
                  <span className="text-black font-medium font-mono">Rs. {subtotal.toLocaleString()}</span>
                </div>
                <div className="pt-6 border-t border-gray-100 flex justify-between items-baseline">
                  <span className="text-xs font-bold uppercase tracking-[0.2em]">Total</span>
                  <span className="text-2xl font-mono font-bold">Rs. {subtotal.toLocaleString()}</span>
                </div>
              </div>

              <Link href="/checkout" className="w-full bg-[#1a1a1a] text-white py-5 text-[10px] font-bold uppercase tracking-[0.3em] flex items-center justify-center hover:bg-black transition-all">
                Proceed to Checkout
                <ArrowRight size={14} className="ml-2" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}