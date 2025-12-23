"use client";

import React from "react";

export default function SideDesign() {
  return (
    <section className="relative w-full overflow-hidden bg-white">
      {/* MAIN CONTAINER 
          h-[40vh] provides the 30vh+ height requested.
          The image is handled via a background-image div to perfectly 
          achieve the fixed scroll effect where the image stays put 
          while the window moves.
      */}
      <div className="relative h-[40vh] lg:h-[70vh] w-full flex items-center justify-center overflow-hidden">
        
        {/* FIXED IMAGE BACKGROUND LAYER */}
        <div 
          className="absolute inset-0 w-full h-full bg-fixed bg-cover bg-center grayscale-[20%]"
          style={{
            backgroundImage: `url('/images/about-brand.jpg')`, // Replace with your high-res editorial image
          }}
        >
          {/* Dark elegant overlay for text contrast */}
          <div className="absolute inset-0 bg-black/50" />
        </div>

        {/* CONTENT OVERLAY */}
        <div className="relative z-10 text-center px-6 max-w-4xl">
          <div className="space-y-4">
            {/* Unique Brand Accent */}
            <span className="block text-primary-color text-[10px] md:text-xs uppercase tracking-[0.6em] font-bold">
              Timeless Elegance
            </span>
            
            {/* Unique Heading */}
            <h2 className="text-4xl md:text-6xl font-primary italic text-white tracking-tighter leading-tight">
              Where Tradition Meets <br />
              <span className="text-primary-color">The Modern Soul</span>
            </h2>
            
            {/* Elegant Divider */}
            <div className="flex justify-center items-center gap-4 py-2">
              <div className="w-12 h-[1px] bg-white/30" />
              <div className="w-2 h-2 rotate-45 border border-primary-color" />
              <div className="w-12 h-[1px] bg-white/30" />
            </div>

            {/* Unique Description */}
            <p className="text-gray-300 text-xs md:text-sm font-light leading-relaxed max-w-xl mx-auto italic">
              Our journey doesn't end here. Every stitch is a commitment to 
              preserving our heritage while crafting a bold new future for 
              the Urooj Sana woman.
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}