// components/HomeCategories.tsx

"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
    const productUrl = `/product/${product._id}`;
    const imageUrl = product.images?.[0]?.url || "/images/placeholder.png";
    const formattedPrice = product.price
        ? `Rs. ${product.price.toLocaleString("en-US")}`
        : "Price on request";

    return (
        <Link href={productUrl} className="group block text-center">
            <div
                className="
            relative 
            w-full 
            overflow-hidden 
            bg-gray-50 
            mb-4
            h-[400px]      // mobile height
            md:h-[580px]   // desktop height
        "
            >
                <Image
                    src={imageUrl}
                    alt={product.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
            </div>

            <h4 className="text-sm uppercase tracking-wide text-gray-800 group-hover:text-black">
                {product.title}
            </h4>

            <p className="text-sm text-gray-600 mt-1">{formattedPrice}</p>
        </Link>

    );
};

// --- DESKTOP SCROLLER WITH ARROWS ---
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
        if (!container) return;

        container.addEventListener("scroll", checkScroll);
        return () => container.removeEventListener("scroll", checkScroll);
    }, []);

    const scrollByAmount = (amount: number) => {
        scrollRef.current?.scrollBy({ left: amount, behavior: "smooth" });
    };

    return (
        <div className="relative hidden md:block">
            {/* LEFT ARROW */}
            {showLeft && (
                <button
                    onClick={() => scrollByAmount(-500)}
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10
                               bg-white/70 hover:bg-white p-2 rounded-full shadow"
                >
                    <ChevronLeft size={35} />
                </button>
            )}

            {/* RIGHT ARROW */}
            {showRight && (
                <button
                    onClick={() => scrollByAmount(500)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10
                               bg-white/70 hover:bg-white p-2 rounded-full shadow"
                >
                    <ChevronRight size={35} />
                </button>
            )}

            {/* ⭐ DESKTOP SCROLL AREA — overflow-x hidden */}
            <div
                ref={scrollRef}
                className="
                    flex space-x-12
                    overflow-x-hidden   /* ⭐ Hiding horizontal overflow */
                    pb-6
                "
            >
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
                const res = await fetch("/api/home-categories", {
                    cache: "no-store",
                });
                const data: ApiResponse = await res.json();

                if (data?.categories) {
                    const filtered = data.categories.filter(
                        (cat) => cat.products && cat.products.length > 0
                    );
                    setCategories(filtered);
                }
            } catch (err) {
                console.error("Failed to fetch home categories:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchCategories();
    }, []);

    if (loading) {
        return (
            <section className="w-full py-24 bg-[#fcfbf4] text-center">
                <p className="text-gray-500 animate-pulse">Loading Collections...</p>
            </section>
        );
    }

    return (
        <section className="w-full bg-[#fcfbf4]">
            {categories.map((category, index) => (
                <div key={category._id}>
                    {/* TITLE */}
                    <div className="max-w-7xl mx-auto pt-12 pb-12 text-center">
                        <h2 className="text-3xl md:text-4xl font-serif uppercase tracking-widest text-gray-900">
                            {category.title}
                        </h2>
                    </div>

                    {/* PRODUCT LISTS */}
                    <div className="w-8xl mx-auto px-3 sm:px-4 md:px-12">

                        {/* ⭐ MOBILE — swipe manually */}
                        <div
                            className="
                                flex md:hidden 
                                space-x-8 
                                overflow-x-auto 
                                scrollbar-none 
                                pb-6 
                                whitespace-nowrap
                            "
                        >
                            {category.products.map((product) => (
                                <div key={product._id} className="inline-block min-w-[280px]">
                                    <ProductCard product={product} />
                                </div>
                            ))}
                        </div>

                        {/* ⭐ DESKTOP — with arrows + overflow hidden */}
                        <DesktopScroller products={category.products} />

                        {/* BUTTON */}
                        <div className="flex mx-auto justify-center mt-16 mb-20">
                            <Link
                                href={`/category/${category._id}`}
                                className="
                                    inline-block 
                                    px-10 py-3 
                                    text-xs 
                                    font-semibold 
                                    uppercase 
                                    tracking-widest 
                                    text-white 
                                    bg-gray-900 
                                    hover:bg-black 
                                    transition
                                "
                            >
                                View All Products
                            </Link>
                        </div>
                    </div>

                    {/* DIVIDER */}
                    {index < categories.length - 1 && (
                        <hr className="max-w-full mx-auto border-t border-gray-300 my-10" />
                    )}
                </div>
            ))}
        </section>
    );
};

export default HomeCategories;
