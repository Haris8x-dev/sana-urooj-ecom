"use client";

import React from "react";
import Image from "next/image";

export default function AboutEditorial() {
  return (
    <section className="py-24 bg-white px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          
          {/* IMAGE SIDE (Takes 7 columns) */}
          <div className="lg:col-span-7 relative group">
            <div className="relative h-[400px] md:h-[600px] overflow-hidden">
              <Image 
                src="/images/couture-detail.jpg" 
                alt="Craftsmanship"
                fill
                className="object-cover grayscale hover:grayscale-0 transition-all duration-1000 scale-100 group-hover:scale-105"
              />
            </div>
            {/* Floating accent box */}
            <div className="absolute -bottom-6 -right-6 bg-primary-color w-32 h-32 hidden md:block -z-10" />
          </div>

          {/* TEXT SIDE (Takes 5 columns) */}
          <div className="lg:col-span-5 lg:-ml-20 z-20 bg-white p-8 md:p-16 shadow-xl border border-slate-100">
            <span className="text-primary-color text-[10px] uppercase tracking-[0.4em] font-bold block mb-6">
               Our Philosophy
            </span>
            <h2 className="text-4xl md:text-5xl font-primary italic text-slate-900 leading-tight mb-8">
               Born from <br /> a Vision
            </h2>
            <div className="space-y-6 text-slate-600 font-sans text-sm leading-loose">
              <p>
                Sana Urooj emerged from a simple belief: that fashion should be an extension 
                of who you are, not a compromise of it.
              </p>
              <p className="border-l-2 border-primary-color pl-6 italic font-primary text-lg text-slate-800">
                We curate pieces for the individual who values quality over quantity and substance over trends.
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}