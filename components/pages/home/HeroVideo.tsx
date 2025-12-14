"use client";

import { useEffect, useState } from "react";

interface HeroVideoResponse {
  videoUrl?: string; // Make sure this matches your DB field name (e.g., "url" or "path")
  message?: string;
}

export default function HeroVideo() {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        const res = await fetch("/api/hero-video", { cache: "no-store" });
        const data: HeroVideoResponse = await res.json();

        if (data?.videoUrl) {
          setVideoUrl(data.videoUrl);
        } else {
          console.warn("No video found:", data.message);
        }
      } catch (error) {
        console.error("Failed to fetch hero video:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVideo();
  }, []);

  if (loading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-black text-white">
        Loading video...
      </div>
    );
  }

  if (!videoUrl) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-black text-white">
        No video available
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen md:h-full md:pt-20 overflow-hidden">
      <video
        src={videoUrl}
        autoPlay
        loop
        muted
        playsInline
        className="w-full h-full object-cover"
      />
    </div>
  );
}
