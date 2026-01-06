"use client";

import React from "react";
import Image from "next/image";
import { MoveRight } from "lucide-react";

const AboutPhilosophy: React.FC = () => {
  return (
    <section className="w-full bg-white py-20 md:py-32 overflow-hidden transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* LEFT COLUMN: VISUAL COMPOSITION */}
          <div className="relative">
            {/* Main Large Image */}
            <div className="relative w-full aspect-[4/5] md:w-[90%] z-10 border border-gray-200">
              <Image
                src="/images/about-brand.jpg" 
                alt="Artisanal Craftsmanship"
                fill
                className="object-cover transition-all duration-700"
              />
            </div>
            
            {/* --- THE GLOWING FLOATING BOX --- */}
            <div className="absolute -bottom-10 -right-4 md:right-0 w-64 p-6 z-30 
                            backdrop-blur-md bg-white/30 
                            border border-[var(--primary-color)] shadow-[0_0_20px_rgba(250,204,51,0.4)]
                            animate-pulse-slow">
              <h4 className="text-[11px] font-bold uppercase tracking-widest mb-2 text-gray-900">
                Handcrafted Excellence
              </h4>
              <p className="text-[12px] text-gray-800 leading-relaxed font-medium">
                Every thread is selected with intention, weaving together a narrative of luxury that transcends seasons.
              </p>
            </div>

            {/* Decorative Floating Text */}
            <div className="absolute top-10 -left-8 md:-left-12 rotate-90 origin-left hidden lg:block">
              <span className="text-[10px] uppercase tracking-[1em] text-gray-400 font-bold whitespace-nowrap">
                ESTABLISHED TRADITION — MMXXIV
              </span>
            </div>
          </div>

          {/* RIGHT COLUMN: TEXT CONTENT */}
          <div className="space-y-8 lg:pl-10">
            <div className="space-y-4">
              <span className="text-[10px] uppercase tracking-[0.5em] text-[var(--primary-color)] font-bold block">
                Our Philosophy
              </span>
              <h2 className="text-4xl md:text-6xl font-primary italic text-gray-900 leading-tight">
                Where Heritage Meets <br />
                <span className="text-[var(--primary-color)] not-italic font-sans font-light tracking-tighter">
                  Modern Soul.
                </span>
              </h2>
            </div>

            <div className="space-y-6">
              <p className="text-gray-600 font-light leading-relaxed text-sm md:text-base">
                At the heart of Urooj Sana lies a profound respect for the artisanal 
                hands that bring our visions to life. Every silhouette we create is 
                a dialogue between the timeless traditions of the past and the 
                unapologetic boldness of the contemporary woman.
              </p>
              
              <div className="grid grid-cols-2 gap-8 pt-4">
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-widest mb-2 text-gray-900">The Fabric</h4>
                  <p className="text-[12px] text-gray-500 leading-relaxed">
                    Sourced from the finest mills, ensuring every yard feels like a second skin.
                  </p>
                </div>
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-widest mb-2 text-gray-900">The Cut</h4>
                  <p className="text-[12px] text-gray-500 leading-relaxed">
                    Precision engineering meets fluid grace for a silhouette that empowers.
                  </p>
                </div>
              </div>

              <div className="pt-8 flex items-center gap-6 group cursor-pointer">
                <div className="h-[1px] w-12 bg-gray-900 group-hover:w-20 transition-all duration-500"></div>
                <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-gray-900">
                  Discover the Process
                </span>
                <MoveRight size={16} className="text-gray-400 group-hover:translate-x-2 transition-transform" />
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default AboutPhilosophy;