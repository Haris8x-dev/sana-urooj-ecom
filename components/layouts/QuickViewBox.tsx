"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, Plus, Minus, ShoppingBag, ArrowRight } from "lucide-react";
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
  cartLimit: number; // Strictly lowercase 'c'
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
  const [activeImgIndex, setActiveImgIndex] = useState<number>(0);

  // Use the limit directly from the product object
  // If it's undefined, we'll see "N/A" in the debug label below
  const limit = product.cartLimit;

  const isSaversActive = product.badges?.saveRs?.active && (product.badges?.saveRs?.amount || 0) > 0;

  const handleIncrement = () => {
    if (quantity < limit) {
      setQuantity((prev) => prev + 1);
    } else {
      toast.warn(`Limit reached: Maximum ${limit} units allowed.`, {
        theme: "dark",
        position: "top-center"
      });
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) setQuantity((prev) => prev - 1);
  };

  const handleAddToCartAttempt = () => {
    if (!selectedSize) {
      toast.error("Please select a size", { position: "top-center", theme: "dark" });
      return;
    }

    // Get existing cart from localStorage
    const existingCart = JSON.parse(localStorage.getItem("cart") || "[]");

    // Check for duplicates (same product + same size)
    const alreadyInCart = existingCart.find(
      (item: any) => item._id === product._id && item.selectedSize === selectedSize
    );

    if (alreadyInCart) {
      toast.info(`This item (${selectedSize}) is already in your cart!`, {
        theme: "dark",
        position: "top-center"
      });
      return;
    }

    // Prepare the cart item with all necessary data
    const cartItem = {
      _id: product._id,
      title: product.title,
      price: product.totalPrice,
      image: product.images?.[0]?.url,
      quantity: quantity,
      selectedSize: selectedSize,
      cartLimit: product.cartLimit
    };

    // Add to cart
    existingCart.push(cartItem);
    localStorage.setItem("cart", JSON.stringify(existingCart));

    // Trigger update for navigation cart icons
    window.dispatchEvent(new Event("cartUpdated"));

    // Show success message
    toast.success(`${product.title} added to cart!`, {
      theme: "dark",
      position: "bottom-right"
    });

    // Call the optional callback (parent can still be notified if needed)
    onAddToCart(selectedSize, quantity);

    // Close the modal
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-md p-4">
      <div className="bg-[#FDFBF7] w-full max-w-[900px] relative flex flex-col md:flex-row shadow-2xl rounded-sm overflow-hidden">

        {/* Close Button */}
        <button onClick={onClose} className="absolute top-4 right-4 z-20 p-1 text-gray-400 hover:text-black transition-colors">
          <X size={24} />
        </button>

        {/* LEFT: Image Section */}
        <div className="w-full md:w-1/2 p-6 md:p-10 bg-[#f7f4ef] flex flex-col items-center justify-center">
          <div className="relative w-full aspect-[3/4] overflow-hidden shadow-sm">
            {product.images?.[activeImgIndex] ? (
              <Image
                src={product.images[activeImgIndex].url}
                alt={product.title}
                fill
                className="object-cover object-top"
                priority
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">No Image</div>
            )}
          </div>
        </div>

        {/* RIGHT: Product Details */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
          <h2 className="text-2xl font-serif text-gray-900 mb-2">{product.title}</h2>

          <div className="flex items-center gap-4 mb-8">
            <span className="text-xl font-bold text-red-600">Rs. {product.totalPrice.toLocaleString()}</span>
            {isSaversActive && (
              <span className="text-sm text-gray-400 line-through">Rs. {product.price.toLocaleString()}</span>
            )}
          </div>

          {/* Size Selection */}
          <div className="mb-8">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-4">Select Size</p>
            <div className="flex flex-wrap gap-2">
              {product.sizes.map((size) => (
                <button
                  key={size.name}
                  onClick={() => setSelectedSize(size.name)}
                  className={`min-w-[50px] h-[40px] border flex items-center justify-center text-[10px] font-bold uppercase tracking-widest transition-all
                    ${selectedSize === size.name
                      ? "bg-black text-white border-black"
                      : "bg-white text-gray-900 border-gray-200 hover:border-black"}`}
                >
                  {size.name}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity Selector */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Quantity</p>
              {/* DEBUG LABEL: This will tell you exactly what the code sees for this product */}
              <span className="text-[9px] font-mono text-blue-500 uppercase tracking-tighter">
                Individual Limit: {limit ?? "Undefined"}
              </span>
            </div>

            <div className="inline-flex items-center border border-gray-300 bg-white">
              <button onClick={handleDecrement} className="w-12 h-12 flex items-center justify-center hover:bg-gray-50 transition-colors">
                <Minus size={14} />
              </button>
              <div className="w-14 text-center text-xs font-mono font-bold border-x border-gray-300">
                {quantity}
              </div>
              <button onClick={handleIncrement} className="w-12 h-12 flex items-center justify-center hover:bg-gray-50 transition-colors">
                <Plus size={14} />
              </button>
            </div>
          </div>

          <button
            onClick={handleAddToCartAttempt}
            className="w-full py-5 bg-[#1a1a1a] text-white text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-black transition-all flex items-center justify-center gap-3 active:scale-[0.98] shadow-lg mb-6"
          >
            <ShoppingBag size={16} /> Add To Cart
          </button>

          <Link
            href={`/product/${product._id}`}
            className="inline-flex items-center text-[10px] font-bold uppercase tracking-widest text-gray-900 group"
          >
            <span className="border-b border-black pb-0.5 group-hover:text-gray-500 group-hover:border-gray-500">View full details</span>
            <ArrowRight size={12} className="ml-2 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}