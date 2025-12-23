"use client";

import React from "react";
import Image from "next/image";

export default function AboutHero() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-white">
      {/* BACKGROUND LAYER */}
      <div className="absolute inset-0 z-0">
        <Image 
          src="/images/about-brand.jpg" 
          alt="Sana Urooj Heritage" 
          fill 
          className="object-cover opacity-20 scale-105"
          priority
        />
        {/* Soft designer gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/50 via-transparent to-white" />
      </div>
      
      {/* CONTENT LAYER */}
      <div className="container mx-auto px-6 text-center z-10 py-24">
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          
          <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <span className="text-[10px] md:text-xs tracking-[0.6em] font-bold uppercase">
              The Foundation • Est. 2024
            </span>
          </div>
          
          <h1 className="text-7xl md:text-[10rem] font-primary italic text-slate-900 tracking-tighter leading-[0.8] mb-10 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
           <span className="drop-shadow-slate-700 drop-shadow-md">Urooj</span> <span className="text-[var(--primary-color)] drop-shadow-black drop-shadow-md">Sana</span>
          </h1> 
          
          <div className="w-16 h-[1px] bg-primary-color mb-10" />
          
          <p className="text-lg md:text-2xl text-slate-600 font-primary italic leading-relaxed max-w-xl animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-500">
            "Where timeless elegance meets the pulse of contemporary expression."
          </p>
        </div>
      </div>
      
      {/* SCROLL INDICATOR */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2">
        <div className="flex flex-col items-center gap-4">
            <span className="text-[9px] uppercase tracking-[0.3em] text-slate-300">Scroll</span>
            <div className="w-[1px] h-12 bg-gradient-to-b from-slate-200 to-transparent" />
        </div>
      </div>
    </section>
  );
}