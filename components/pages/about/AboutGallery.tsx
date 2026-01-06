"use client";

import React, { useState } from "react";
import Image from "next/image";
import { X } from "lucide-react"; // Assuming lucide-react is available, or use a simple "X" string

const images = [
  // LEFT WING (Pivoting from Bottom Right)
  { src: "/images/about-brand.jpg", angle: "-rotate-[40deg]", x: "-translate-x-[450px]", y: "translate-y-28", origin: "origin-bottom-right", title: "The Concept" },
  { src: "/images/about-brand.jpg", angle: "-rotate-[25deg]", x: "-translate-x-[300px]", y: "translate-y-10", origin: "origin-bottom-right", title: "The Sketch" },
  { src: "/images/about-brand.jpg", angle: "-rotate-[10deg]", x: "-translate-x-[150px]", y: "translate-y-2", origin: "origin-bottom-right", title: "The Pattern" },
  
  // CENTER (Straight)
  { src: "/images/about-brand.jpg", angle: "rotate-0", x: "translate-x-0", y: "-translate-y-6", origin: "origin-bottom", title: "The Craft" },
  
  // RIGHT WING (Pivoting from Bottom Left)
  { src: "/images/about-brand.jpg", angle: "rotate-[10deg]", x: "translate-x-[150px]", y: "translate-y-2", origin: "origin-bottom-left", title: "The Stitch" },
  { src: "/images/about-brand.jpg", angle: "rotate-[25deg]", x: "translate-x-[320px]", y: "translate-y-10", origin: "origin-bottom-left", title: "The Fitting" },
  { src: "/images/about-brand.jpg", angle: "rotate-[42deg]", x: "translate-x-[480px]", y: "translate-y-28", origin: "origin-bottom-left", title: "The Reveal" },
];

export default function AboutGallery() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <section className=" bg-white pb-14 overflow-hidden flex flex-col justify-center">
      <div className="container h-80vh pt-18 mx-auto px-6">
         
        {/* SECTION HEADER */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3"> 
          <span className="text-primary-color text-[10px] md:text-xs uppercase tracking-[0.8em] font-bold">
            Visual Narrative
          </span>
          <h2 className="text-5xl md:text-7xl font-primary italic text-slate-900 tracking-tighter leading-none">
            The <span className="text-[var(--primary-color)]">Art</span> of Process
          </h2>
          <div className="w-12 h-[1px] bg-primary-color mx-auto my-2" />
          <p className="text-slate-500 font-primary italic text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
            "Every silhouette tells a story of patience, crafted one frame at a time."
          </p>
        </div>

        {/* SOLITAIRE ARC GALLERY */}
        <div className="relative flex justify-center items-start pt-16 h-[500px] md:h-[800px]">
          {images.map((item, index) => {
            const isHovered = hoveredIndex === index;
            const isActive = activeIndex === index;
            const somethingIsActive = activeIndex !== null;

            return (
              <div
                key={index}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => setActiveIndex(index)}
                className={`absolute w-[220px] h-[330px] md:w-[300px] md:h-[450px] 
                  transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] 
                  cursor-pointer ${item.origin}
                  ${item.angle} ${item.x} ${item.y}
                  ${isActive ? "!rotate-0 !translate-x-0 !-translate-y-32 z-[100] scale-110" : ""}
                  ${somethingIsActive && !isActive ? "blur-xl opacity-30 scale-90 pointer-events-none" : ""}
                `}
                style={{ zIndex: isActive ? 100 : index }}
              >
                {/* Close Button - Appears only above the Active Card */}
                {isActive && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveIndex(null);
                    }}
                    className="absolute -bottom-16 left-1/2 -translate-x-1/2 bg-slate-900 text-white p-2 rounded-full hover:bg-primary-color transition-colors shadow-xl z-[110] animate-in fade-in zoom-in duration-300"
                  >
                    <X size={20} />
                  </button>
                )}

                {/* Image Card Container */}
                <div className={`relative w-full h-full rounded-sm overflow-hidden border-[8px] md:border-[12px] border-white transition-all duration-500
                  ${isHovered ? "drop-shadow-[0_0_15px_#facc33]" : "shadow-xl"}
                  ${isActive ? "shadow-[0_50px_100px_rgba(0,0,0,0.4)]" : ""}
                `}>
                  <Image
                    src={item.src}
                    alt={item.title}
                    fill
                    className={`object-cover transition-all duration-700 
                      ${isActive ? "grayscale-0" : "grayscale-[20%]"}
                    `}
                  />
                  
                  {/* Content Overlay - Only visible when Active */}
                  <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent flex flex-col justify-end p-8 transition-opacity duration-500
                    ${isActive ? "opacity-100" : "opacity-0"}
                  `}>
                     <span className="text-primary-color text-[10px] uppercase tracking-[0.4em] font-bold mb-2">
                        Stage 0{index + 1}
                     </span>
                     <p className="text-white font-primary italic text-2xl md:text-3xl">
                      {item.title}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}