"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

interface CategoryImage {
  url: string;
  fileId: string;
}

interface Category {
  _id: string;
  title: string;
  description?: string;
  images: CategoryImage[];
}

interface ApiResponse {
  featuredCategories: Category[];
}

const FeaturedCategories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/featured-categories", {
          cache: "no-store",
        });
        const data: ApiResponse = await res.json();

        if (data?.featuredCategories) {
          setCategories(data.featuredCategories);
        }
      } catch (error) {
        console.error("Failed to fetch featured categories:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading) {
    return (
      <section className="w-full py-20 bg-[#fcfbf4] flex justify-center items-center border-b border-gray-200">
        <p className="text-gray-500 animate-pulse">Loading Collections...</p>
      </section>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <div className="w-full py-14 text-center text-red-500 bg-[#fcfbf4] border-b border-gray-200">
        No categories found. Check console for API response.
      </div>
    );
  }

  return (
    <section className="w-full bg-[#fcfbf4] pt-8 pb-12 border-b border-gray-300">

      {/* SUPER TIGHT LEFT/RIGHT SPACING */}
      <div className="px-3 sm:px-4 md:px-10 mx-auto">

        {/* MOBILE: horizontal scroll
            DESKTOP: 3-column grid */}
        <div
          className="
            md:grid md:grid-cols-3 
            gap-4 md:gap-5 lg:gap-6

            flex 
            overflow-x-auto md:overflow-visible 
            snap-x snap-mandatory 
            scrollbar-none
            space-x-4 md:space-x-0
          "
        >
          {categories.map((category) => (
            <Link
              key={category._id}
              href={`/category/${category._id}`}
              className="
                group relative 
                snap-start 
                overflow-hidden cursor-pointer
                md:w-full 
              "
              style={{
                height: "480px",

                // Mobile: card width around 80–85% for horizontal swipe
                minWidth: "85%", 
              }}
            >
              <Image
                src={category.images?.[0]?.url || "/images/placeholder.png"}
                alt={category.title}
                fill
                className="
                  object-cover 
                  transition-transform duration-700 
                  group-hover:scale-[1.05]
                "
                sizes="(max-width: 768px) 100vw, 33vw"
              />

              <div className="absolute inset-0 bg-linear-to-t from-black/50 via-black/20 to-transparent" />

              <div className="absolute bottom-6 left-0 right-0 text-center px-3">
                <h3 className="text-white text-xl md:text-2xl tracking-wide font-light drop-shadow-lg">
                  {category.title}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedCategories;
