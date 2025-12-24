"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, ChevronLeft, ChevronRight } from "lucide-react";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Import the QuickViewBox component
import QuickViewBox from "../../layouts/QuickViewBox";

// --- INTERFACES ---
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
  images: ImageObject[];
  price: number;
  totalPrice: number;
  cartLimit: number; 
  sizes: Size[];
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
const ProductCard: React.FC<{ 
  product: Product; 
  onQuickView: (product: Product) => void 
}> = ({ product, onQuickView }) => {
  const productUrl = `/product/${product._id}`;
  const imageUrl = product.images?.[0]?.url || "/images/placeholder.png";
  
  const isSaversActive = product.badges?.saveRs?.active && (product.badges?.saveRs?.amount || 0) > 0;
  const saversAmount = product.badges?.saveRs?.amount;

  return (
    <div className="group block text-center relative">
      <div className="relative w-full overflow-hidden bg-gray-50 mb-4 h-80 md:h-[580px]">
        {isSaversActive && (
          <div className="absolute top-4 left-4 z-10 bg-red-600 text-white text-[10px] md:text-xs font-bold px-2 py-1 tracking-tighter uppercase">
            SAVERS {saversAmount}
          </div>
        )}

        <button
          onClick={(e) => {
            e.preventDefault();
            onQuickView(product);
          }}
          className="absolute bottom-4 right-4 z-20 p-3 rounded-full shadow-lg transition-all duration-300 transform bg-white text-gray-900 hover:bg-black hover:text-white hidden md:flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:translate-y-0 translate-y-2"
        >
          <ShoppingBag size={20} />
        </button>

        <button
          onClick={(e) => {
            e.preventDefault();
            onQuickView(product);
          }}
          className="absolute bottom-3 right-3 z-20 p-2 bg-white/90 rounded-full shadow md:hidden flex items-center justify-center"
        >
          <ShoppingBag size={18} />
        </button>

        <Link href={productUrl}>
          <Image
            src={imageUrl}
            alt={product.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        </Link>
      </div>

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

// --- SCROLLER COMPONENT ---
// Handles the 8-product limit and the arrow navigation
const ProductScroller: React.FC<{ 
  products: Product[]; 
  onQuickView: (product: Product) => void 
}> = ({ products, onQuickView }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === "left" 
        ? scrollLeft - clientWidth / 1.5 
        : scrollLeft + clientWidth / 1.5;
      
      scrollRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
    }
  };

  return (
    <div className="relative group/scroller">
      {/* Navigation Arrows */}
      <button 
        onClick={() => scroll("left")}
        className="absolute cursor-pointer left-0 top-[40%] -translate-y-1/2 z-30 p-2 bg-white/80 hover:bg-black hover:text-white transition-all shadow-md rounded-full -ml-4 opacity-0 group-hover/scroller:opacity-100 hidden md:flex"
      >
        <ChevronLeft size={40} />
      </button>

      <button 
        onClick={() => scroll("right")}
        className="absolute cursor-pointer right-0 top-[40%] -translate-y-1/2 z-30 p-2 bg-white/80 hover:bg-black hover:text-white transition-all shadow-md rounded-full -mr-4 opacity-0 group-hover/scroller:opacity-100 hidden md:flex"
      >
        <ChevronRight size={40} />
      </button>

      {/* Product List */}
      <div 
        ref={scrollRef}
        className="flex space-x-6 md:space-x-12 overflow-x-auto scrollbar-none pb-6 scroll-smooth"
      >
        {products.slice(0, 8).map((product) => (
          <div key={product._id} className="min-w-[240px] md:min-w-[420px] shrink-0">
            <ProductCard product={product} onQuickView={onQuickView} />
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
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

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

  const handleAddToCart = () => {
    setSelectedProduct(null);
  };

  if (loading) {
    return (
      <section className="w-full py-24 bg-[#fcfbf4] text-center">
        <p className="text-gray-500 animate-pulse text-xs uppercase tracking-widest font-primary">Loading Collections...</p>
      </section>
    );
  }

  return (
    <section className="w-full bg-[#fcfbf4]">
      <ToastContainer limit={3} />
      
      {/* UNIQUE BRAND HEADER */}
      <div className="text-center pt-20 pb-12 px-6 max-w-4xl mx-auto space-y-4">
        <span className="text-[10px] uppercase tracking-[0.6em] font-bold block mb-2">
          The Artisanal Series
        </span>
        <h2 className="text-4xl md:text-6xl font-primary italic text-gray-900 tracking-tighter leading-tight">
          Urooj <span className="text-[var(--primary-color)]">Sana</span> Masterpieces
        </h2>
        <div className="flex justify-center items-center gap-4 py-2">
           <div className="w-8 h-[1px] bg-primary-color/30" />
           <div className="w-2 h-2 rotate-45 border border-primary-color" />
           <div className="w-8 h-[1px] bg-primary-color/30" />
        </div>
        <p className="text-gray-500 text-xs md:text-sm font-light leading-relaxed max-w-2xl mx-auto italic font-primary">
          Explore our most prestigious categories, where every stitch tells a story of 
          heritage and every silhouette defines modern elegance.
        </p>
      </div>

      {selectedProduct && (
        <QuickViewBox 
          product={selectedProduct} 
          onClose={() => setSelectedProduct(null)} 
          onAddToCart={handleAddToCart}
        />
      )}

      {categories.map((category, index) => (
        <div key={category._id}>
          <div className="max-w-7xl mx-auto pt-10 pb-12 text-center">
            <h2 className="text-2xl md:text-4xl font-primary uppercase tracking-widest text-gray-900">
              {category.title}
            </h2>
          </div>

          <div className="w-8xl mx-auto px-3 sm:px-4 md:px-12">
            {/* Using the new Scroller with Arrows and 8-limit */}
            <ProductScroller 
              products={category.products} 
              onQuickView={setSelectedProduct} 
            />

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