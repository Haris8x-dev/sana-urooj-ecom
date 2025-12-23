"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";

// ---------- TYPES ----------
interface IImageKitFile {
  url: string;
  fileId: string;
}

interface ApiResponse {
  images: IImageKitFile[];
}

// ---------- TIMINGS ----------
const DISPLAY_DURATION = 5000; // Slightly slower for a more luxurious feel
const FADE_DURATION = 1200;   // Smoother transition

const RADIUS = 10;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const BottomCarousal: React.FC = () => {
  const [images, setImages] = useState<IImageKitFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loaderKey, setLoaderKey] = useState(0);

  // ---------- FETCH ----------
  useEffect(() => {
    const fetchImages = async () => {
      try {
        const res = await fetch("/api/bottom-carousal", { cache: "no-store" });
        const data: ApiResponse = await res.json();
        if (data?.images?.length) setImages(data.images);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchImages();
  }, []);

  // ---------- AUTOPLAY ----------
  useEffect(() => {
    if (!images.length) return;

    const timer = setTimeout(() => {
      setActiveIndex((prev) => (prev + 1) % images.length);
      setLoaderKey((k) => k + 1);
    }, DISPLAY_DURATION);

    return () => clearTimeout(timer);
  }, [activeIndex, images.length]);

  if (loading) {
    return (
      <div className="h-[90vh] w-full flex items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-t-2 border-[var(--primary-color)] rounded-full animate-spin" />
            <p className="text-[var(--primary-color)] text-[10px] uppercase tracking-[0.4em]">Loading Gallery</p>
        </div>
      </div>
    );
  }

  return (
    <section className="w-full bg-[#fcfbf4] mt-10">
      {/* ---------- IMAGE AREA ---------- */}
      <div className="relative h-[90vh] w-full overflow-hidden group">
        
        {/* Subtle Vignette for depth */}
        <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/20 via-transparent to-black/40 pointer-events-none" />

        {images.map((img, index) => (
          <div
            key={img.fileId}
            className={`absolute inset-0 transition-all ease-in-out ${
              index === activeIndex ? "opacity-100 z-10 scale-100" : "opacity-0 z-0 scale-110"
            }`}
            style={{ transitionDuration: `${FADE_DURATION}ms` }}
          >
            <Image
              src={img.url}
              alt=""
              fill
              sizes="100vw"
              className={`object-cover transition-transform duration-[6000ms] ease-out ${
                index === activeIndex ? "scale-110" : "scale-100"
              }`}
              priority={index === 0}
            />
          </div>
        ))}

        {/* ---------- BRAND LABEL (Top Left Overlay) ---------- */}
        <div className="absolute top-10 left-10 z-20 hidden md:block">
            <p className="text-white text-[10px] uppercase tracking-[0.8em] opacity-60">
                Editorial / 0{activeIndex + 1}
            </p>
        </div>

        {/* ---------- DOTS (BOTTOM RIGHT) ---------- */}
        <div className="absolute bottom-10 right-10 z-20">
          <div className="flex items-center space-x-5">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setActiveIndex(index);
                  setLoaderKey((k) => k + 1);
                }}
                className="relative w-8 h-8 flex items-center justify-center transition-transform hover:scale-110"
              >
                {/* Loader ring */}
                {index === activeIndex && (
                  <svg
                    key={loaderKey}
                    width="32"
                    height="32"
                    viewBox="0 0 32 32"
                    className="absolute inset-0 -rotate-90"
                  >
                    <circle
                      cx="16"
                      cy="16"
                      r="14"
                      fill="none"
                      stroke="rgba(252, 211, 77, 0.3)" // Soft Amber path
                      strokeWidth="1"
                    />
                    <circle
                      cx="16"
                      cy="16"
                      r="14"
                      fill="none"
                      stroke="#fcd34d" // Bright Amber loader
                      strokeWidth="1.5"
                      strokeDasharray={88} // Adjusted circumference for R14
                      strokeDashoffset={88}
                      strokeLinecap="round"
                      style={{
                        animation: `circle-loader-new ${DISPLAY_DURATION}ms linear forwards`,
                      }}
                    />
                  </svg>
                )}

                {/* Dot: Changes from gray to Amber when active */}
                <span className={`w-1.5 h-1.5 rounded-full transition-all duration-500 z-10 ${
                    index === activeIndex ? "bg-[var(--primary-color)] scale-125 shadow-[0_0_8px_#fcd34d]" : "bg-white/40"
                }`} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ---------- DIVIDER SECTION ---------- */}
      <div className="py-24 px-10 bg-white">
        <div className="max-w-7xl mx-auto flex items-center gap-8">
            <div className="h-[1px] flex-1 bg-black/10" />
            <div className="w-2 h-2 rotate-45 border border-[var(--primary-color)" />
            <div className="h-[1px] flex-1 bg-black/10" />
        </div>
      </div>
      
      {/* Global CSS for the specific animation */}
      <style jsx global>{`
        @keyframes circle-loader-new {
          from { stroke-dashoffset: 88; }
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </section>
  );
};

export default BottomCarousal;