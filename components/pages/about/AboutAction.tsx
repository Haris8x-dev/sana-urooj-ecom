"use client";

import React from "react";
import Link from "next/link";

export default function AboutAction() {
  return (
    <section className="relative h-[50vh] w-full flex items-center justify-center overflow-hidden">
       {/* FIXED BG EFFECT */}
       <div 
        className="absolute inset-0 bg-fixed bg-cover bg-center"
        style={{ backgroundImage: "url('/images/final-editorial.jpg')" }}
       >
         <div className="absolute inset-0 bg-black/60" />
       </div>

       <div className="relative z-10 text-center space-y-8 px-6">
          <h2 className="text-5xl md:text-7xl font-primary italic text-white tracking-tighter">
            Begin Your <span className="text-primary-color">Journey</span>
          </h2>
          <p className="text-gray-300 text-sm md:text-lg max-w-xl mx-auto font-light tracking-wide">
            Explore our latest collections and find pieces that speak to your authentic self.
          </p>
          <div className="pt-4">
            <Link href="/shop" className="px-12 py-4 border border-white text-white text-[11px] uppercase tracking-[0.5em] hover:bg-white hover:text-black transition-all duration-500 font-bold">
              Explore Now
            </Link>
          </div>
       </div>
    </section>
  );
}