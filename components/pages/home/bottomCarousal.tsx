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
const DISPLAY_DURATION = 4000;
const FADE_DURATION = 800;

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
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <section className="w-full bg-[#fcfbf4]">
      {/* ---------- IMAGE AREA (70vh) ---------- */}
      <div className="relative h-[90vh] w-full overflow-hidden">
        {images.map((img, index) => (
          <div
            key={img.fileId}
            className={`absolute inset-0 transition-opacity ${
              index === activeIndex ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
            style={{ transitionDuration: `${FADE_DURATION}ms` }}
          >
            <Image
              src={img.url}
              alt=""
              fill
              sizes="100vw"
              className="object-cover"
              priority={index === 0}
            />
          </div>
        ))}

        {/* ---------- DOTS (BOTTOM RIGHT ON IMAGE) ---------- */}
        <div className="absolute bottom-6 right-6 z-20">
          <div className="flex space-x-3">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setActiveIndex(index);
                  setLoaderKey((k) => k + 1);
                }}
                className="relative w-6 h-6"
              >
                {/* Loader ring */}
                {index === activeIndex && (
                  <svg
                    key={loaderKey}
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    className="absolute inset-0"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r={RADIUS}
                      fill="none"
                      stroke="white"
                      strokeWidth="2"
                      strokeDasharray={CIRCUMFERENCE}
                      strokeDashoffset={CIRCUMFERENCE}
                      strokeLinecap="round"
                      style={{
                        animation: `circle-loader ${DISPLAY_DURATION}ms linear forwards`,
                      }}
                    />
                  </svg>
                )}

                {/* Black dot */}
                <span className="absolute inset-0 m-auto w-2 h-2 bg-black rounded-full z-10" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ---------- DIVIDER SECTION ---------- */}
      <div className="py-20">
        <div className="border-t border-black/10" />
      </div>

      {/* ---------- FUTURE CONTENT ---------- */}
    </section>
  );
};

export default BottomCarousal;
