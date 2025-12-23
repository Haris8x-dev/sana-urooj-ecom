"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface HeroVideoResponse {
  videoUrl?: string;
  message?: string;
}

export default function HeroVideo() {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isApiLoading, setIsApiLoading] = useState(true);
  const [isVideoReady, setIsVideoReady] = useState(false);

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        const res = await fetch("/api/hero-video", { cache: "no-store" });
        const data: HeroVideoResponse = await res.json();

        if (data?.videoUrl) {
          const optimizedUrl = data.videoUrl.includes('?') 
            ? `${data.videoUrl}&tr=h-1080,q-80,f-auto` 
            : `${data.videoUrl}?tr=h-1080,q-80,f-auto`;
          
          setVideoUrl(optimizedUrl);
        }
      } catch (error) {
        console.error("Failed to fetch hero video:", error);
      } finally {
        setIsApiLoading(false);
      }
    };
    fetchVideo();
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black font-primary">
      
      {/* 1. THE LOADER SCREEN */}
      {(!isVideoReady || !videoUrl) && (
        <div className="absolute inset-0 z-[50] w-screen h-screen bg-black flex flex-col items-center justify-center space-y-8">
          <div className="text-center">
            <h2 className="text-white italic text-4xl tracking-tighter animate-in fade-in zoom-in duration-1000 font-primary">
               Urooj <span className="text-[var(--primary-color)]">Sana</span>
            </h2>
          </div>

          <div className="flex flex-col items-center gap-5">
            <div className="relative flex items-center justify-center">
                <div className="w-12 h-12 border-[1px] border-primary-color/10 rounded-full" />
                <div className="absolute w-12 h-12 border-t-[1px] border-primary-color rounded-full animate-spin" />
            </div>
            <p className="text-[var(--primary-color)] text-[10px] uppercase tracking-[0.6em] font-light animate-pulse">
               Loading Layout
            </p>
          </div>
        </div>
      )}

      {/* 2. VIDEO CONTENT */}
      {videoUrl && (
        <div className={`relative w-full h-full transition-opacity duration-[1500ms] ${isVideoReady ? 'opacity-100' : 'opacity-0'}`}>
          <video
            src={videoUrl}
            autoPlay
            loop
            muted
            playsInline
            onLoadedData={() => setIsVideoReady(true)}
            className="w-full h-full object-cover opacity-70"
          />

          {/* LEFT SIDE VIGNETTE */}
          <div className="absolute inset-y-0 left-0 w-full md:w-[75%] bg-gradient-to-r from-black via-black/60 to-transparent z-10" />

          {/* STYLISH TEXT LAYOUT */}
          <div className="absolute inset-0 z-20 flex flex-col justify-center px-10 md:px-24">
            <div className="max-w-5xl space-y-10 animate-in fade-in slide-in-from-left-12 duration-1000">
              
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-[1px] bg-[var(--primary-color)]" />
                  <p className="text-[var(--primary-color)] text-[11px] uppercase tracking-[0.5em] font-bold">
                    Est. 2024 • Private Collection
                  </p>
                </div>

                {/* SINGLE LINE NAME WITH GEORGIA FONT */}
                <h1 className="text-white text-5xl md:text-[8rem] italic leading-tight tracking-tighter font-[var(--primaryfont)]">
                  Urooj <span className="text-[var(--primary-color)]">Sana</span>
                </h1>
              </div>

              <p className="text-gray-300 text-sm md:text-lg font-light max-w-lg leading-relaxed border-l border-primary-color/30 pl-6">
                Redefining the modern silhouette through ancestral craftsmanship. 
                Discover pieces designed to transcend seasons.
              </p>

              <div className="pt-6">
                <Link 
                  href="/shop" 
                  className="group relative inline-flex items-center justify-center px-14 py-5 overflow-hidden border border-white transition-all duration-500 hover:border-primary-color hover:shadow-[0_0_30px_rgba(252,211,77,0.5)]"
                >
                  {/* Glowing Effect Background */}
                  <span className="absolute inset-0 bg-primary-color opacity-0 group-hover:opacity-10 transition-opacity duration-500"></span>
                  
                  {/* Button Text */}
                  <span className="relative text-white text-[11px] font-bold uppercase tracking-[0.5em] transition-all duration-500 group-hover:text-[var(--primary-color)]">
                    Explore Collection
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SCROLL DECORATION */}
      {isVideoReady && (
        <div className="absolute bottom-12 right-12 z-20 hidden md:block">
          <div className="flex flex-col items-center gap-6">
            <span className="text-white/40 text-[9px] uppercase tracking-[0.5em] [writing-mode:vertical-lr] font-medium">Discover More</span>
            <div className="w-[1px] h-20 bg-gradient-to-b from-primary-color to-transparent" />
          </div>
        </div>
      )}
    </div>
  );
}