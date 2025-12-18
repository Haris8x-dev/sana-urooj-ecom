"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ShoppingBag, Check } from "lucide-react";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// --- INTERFACES ---
interface ImageObject {
  url: string;
  fileId: string;
}

interface Product {
  _id: string;
  title: string;
  images: ImageObject[];
  price: number;
  totalPrice: number;
  badges?: {
    saveRs: {
      active: boolean;
      amount: number;
    };
  };
}

interface Category {
  _id: string;
  title: string;
  description?: string;
  products: Product[];
}

interface ApiResponse {
  categories: Category[];
}

// --- PRODUCT CARD ---
const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
  const [isAdded, setIsAdded] = useState(false);
  const productUrl = `/product/${product._id}`;
  const imageUrl = product.images?.[0]?.url || "/images/placeholder.png";
  
  const isSaversActive = product.badges?.saveRs?.active && (product.badges?.saveRs?.amount || 0) > 0;
  const saversAmount = product.badges?.saveRs?.amount;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const existingCart = JSON.parse(localStorage.getItem("cart") || "[]");

    // STRICTOR LOGIC: Check if product ID already exists in cart
    const alreadyInCart = existingCart.find((item: any) => item._id === product._id);

    if (alreadyInCart) {
      toast.info("Item is already in your cart!", {
        position: "bottom-right",
        autoClose: 2000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: false,
        theme: "dark",
      });
      return;
    }

    const cartItem = {
      _id: product._id,
      title: product.title,
      price: product.totalPrice,
      image: imageUrl,
      quantity: 1,
      selectedSize: "Standard" 
    };

    existingCart.push(cartItem);
    localStorage.setItem("cart", JSON.stringify(existingCart));
    
    // Sync Navbar
    window.dispatchEvent(new Event("cartUpdated"));

    // Success Feedback
    setIsAdded(true);
    toast.success(`${product.title} added to cart!`, {
      position: "bottom-right",
      autoClose: 2000,
      theme: "dark",
    });

    setTimeout(() => setIsAdded(false), 3000);
  };

  return (
    <div className="group block text-center relative">
      <Link href={productUrl}>
        <div className="relative w-full overflow-hidden bg-gray-50 mb-4 h-80 md:h-[580px]">
          {isSaversActive && (
            <div className="absolute top-4 left-4 z-10 bg-red-600 text-white text-[10px] md:text-xs font-bold px-2 py-1 tracking-tighter uppercase">
              SAVERS {saversAmount}
            </div>
          )}

          {/* ADD TO CART BUTTON (Desktop & Mobile) */}
          <button
            onClick={handleAddToCart}
            className={`absolute bottom-4 right-4 z-20 p-3 rounded-full shadow-lg transition-all duration-300 transform 
              ${isAdded ? 'bg-green-600 text-white' : 'bg-white text-gray-900 hover:bg-black hover:text-white'}
              hidden md:flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-2
            `}
          >
            {isAdded ? <Check size={20} /> : <ShoppingBag size={20} />}
          </button>

          <button
            onClick={handleAddToCart}
            className="absolute bottom-3 right-3 z-20 p-2 bg-white/90 rounded-full shadow md:hidden flex items-center justify-center"
          >
             {isAdded ? <Check size={18} className="text-green-600" /> : <ShoppingBag size={18} />}
          </button>

          <Image
            src={imageUrl}
            alt={product.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </div>
      </Link>

      <h4 className="text-sm uppercase tracking-wide text-gray-800 group-hover:text-black">
        {product.title}
      </h4>

      <div className="flex items-center justify-center gap-2 mt-1">
        {isSaversActive ? (
          <>
            <span className="text-sm text-gray-400 line-through">
              Rs. {product.price.toLocaleString("en-US")}
            </span>
            <span className="text-sm text-red-600 font-semibold">
              Rs. {product.totalPrice.toLocaleString("en-US")}
            </span>
          </>
        ) : (
          <p className="text-sm text-gray-600">
            {product.totalPrice > 0 
              ? `Rs. ${product.totalPrice.toLocaleString("en-US")}` 
              : "Price on request"}
          </p>
        )}
      </div>
    </div>
  );
};

// --- DESKTOP SCROLLER ---
const DesktopScroller: React.FC<{ products: Product[] }> = ({ products }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setShowLeft(el.scrollLeft > 10);
    setShowRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    const container = scrollRef.current;
    if (container) {
      container.addEventListener("scroll", checkScroll);
      return () => container.removeEventListener("scroll", checkScroll);
    }
  }, []);

  return (
    <div className="relative hidden md:block">
      {showLeft && (
        <button onClick={() => scrollRef.current?.scrollBy({ left: -500, behavior: "smooth" })}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-30 bg-white/70 hover:bg-white p-2 rounded-full shadow"
        >
          <ChevronLeft size={35} />
        </button>
      )}
      {showRight && (
        <button onClick={() => scrollRef.current?.scrollBy({ left: 500, behavior: "smooth" })}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-30 bg-white/70 hover:bg-white p-2 rounded-full shadow"
        >
          <ChevronRight size={35} />
        </button>
      )}

      <div ref={scrollRef} className="flex space-x-12 overflow-x-hidden pb-6">
        {products.map((product) => (
          <div key={product._id} className="min-w-[420px] shrink-0">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---
const HomeCategories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/home-categories", { cache: "no-store" });
        const data: ApiResponse = await res.json();
        if (data?.categories) {
          setCategories(data.categories.filter((cat) => cat.products?.length > 0));
        }
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  if (loading) {
    return (
      <section className="w-full py-24 bg-[#fcfbf4] text-center">
        <p className="text-gray-500 animate-pulse text-xs uppercase tracking-widest">Loading Collections...</p>
      </section>
    );
  }

  return (
    <section className="w-full bg-[#fcfbf4]">
      {/* GLOBAL TOAST PROVIDER */}
      <ToastContainer limit={3} />
      
      {categories.map((category, index) => (
        <div key={category._id}>
          <div className="max-w-7xl mx-auto pt-10 pb-12 text-center">
            <h2 className="text-3xl md:text-4xl font-serif uppercase tracking-widest text-gray-900">{category.title}</h2>
          </div>

          <div className="w-8xl mx-auto px-3 sm:px-4 md:px-12">
            <div className="flex md:hidden space-x-6 overflow-x-auto scrollbar-none pb-6">
              {category.products.map((product) => (
                <div key={product._id} className="min-w-[240px]">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>

            <DesktopScroller products={category.products} />

            <div className="flex mx-auto justify-center mt-6 mb-10">
              <Link
                href={`/category/${category._id}`}
                className="relative inline-block px-10 py-3 text-xs font-semibold uppercase tracking-widest text-white bg-gray-900 overflow-hidden transition-colors duration-500 ease-in-out group hover:text-gray-900 hover:bg-transparent border border-gray-900"
              >
                <span className="absolute inset-0 block bg-white transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-in-out z-0"></span>
                <span className="relative z-10">View All Products</span>
              </Link>
            </div>
          </div>
          {index < categories.length - 1 && <hr className="border-t border-gray-200" />}
        </div>
      ))}
    </section>
  );
};

export default HomeCategories;