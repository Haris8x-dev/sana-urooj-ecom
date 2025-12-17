"use client";

import React, { useState, useEffect, useRef } from "react";
import { Upload, Film, Loader2, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";

interface VideoData {
  _id: string;
  videoUrl: string;
  fileId: string;
  uploadDate: string;
}

export default function HeroVideo() {
  const [videoData, setVideoData] = useState<VideoData | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Fetch current video status
  useEffect(() => {
    fetchCurrentVideo();
  }, []);

  const fetchCurrentVideo = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/hero-video");
      const data = await res.json();
      if (res.ok && data._id) {
        setVideoData(data);
      }
    } catch (err) {
      console.error("Failed to fetch hero video");
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Handle File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setMessage({ text: "", type: "" });
    }
  };

  // 3. Handle Upload/Update
  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setMessage({ text: "Uploading video to ImageKit...", type: "info" });

    const formData = new FormData();
    formData.append("file", file);

    // Determine method: POST if no video exists, PATCH if replacing
    const method = videoData ? "PATCH" : "POST";

    try {
      const res = await fetch("/api/hero-video", {
        method: method,
        body: formData,
      });

      const result = await res.json();

      if (res.ok) {
        setVideoData(result);
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        setMessage({ text: "Hero video updated successfully!", type: "success" });
      } else {
        setMessage({ text: result.error || "Upload failed", type: "error" });
      }
    } catch (err) {
      setMessage({ text: "Network error occurred during upload", type: "error" });
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) return (
    <div className="flex h-64 items-center justify-center">
      <Loader2 className="animate-spin text-gray-400" size={32} />
    </div>
  );

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-10">
        <h1 className="text-[12px] tracking-[0.3em] font-bold uppercase text-gray-500 flex items-center gap-2">
          <Film size={14} className="text-black" />
          Homepage Hero Video
        </h1>
        <p className="text-[10px] text-gray-400 uppercase mt-2 tracking-widest leading-loose">
          Upload a high-quality video for your homepage background. <br />
          Recommended: 16:9 ratio, under 20MB, MP4 format.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* LEFT: CURRENT VIDEO PREVIEW */}
        <div className="space-y-4">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Live Preview
          </span>
          <div className="aspect-video bg-black rounded-lg overflow-hidden border border-gray-200 shadow-2xl relative group">
            {videoData?.videoUrl ? (
              <video
                key={videoData.videoUrl}
                src={videoData.videoUrl}
                autoPlay
                muted
                loop
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
                <Film size={40} strokeWidth={1} className="mb-4 opacity-20" />
                <p className="text-[9px] uppercase font-bold tracking-widest">No Video Configured</p>
              </div>
            )}
          </div>
          {videoData && (
            <div className="flex items-center gap-2 text-[9px] text-gray-400 uppercase tracking-tighter">
              <CheckCircle2 size={12} className="text-green-500" />
              Active ID: {videoData.fileId}
            </div>
          )}
        </div>

        {/* RIGHT: UPLOAD CONTROLS */}
        <div className="flex flex-col justify-center space-y-8">
          <div className="space-y-4">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              {videoData ? "Replace Video" : "Initial Upload"}
            </span>
            
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center cursor-pointer transition-all
                ${file ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-400'}
              `}
            >
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="video/*"
                className="hidden" 
              />
              <Upload size={24} className={`mb-4 ${file ? 'text-black' : 'text-gray-300'}`} />
              <p className="text-[11px] font-bold uppercase tracking-widest text-center">
                {file ? file.name : "Click to select video"}
              </p>
              {file && (
                <p className="text-[9px] text-gray-400 mt-2 uppercase">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              )}
            </div>
          </div>

          <button
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="w-full py-4 bg-black text-white text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-gray-800 transition flex items-center justify-center disabled:bg-gray-200 shadow-lg"
          >
            {isUploading ? (
              <Loader2 className="animate-spin mr-2" size={16} />
            ) : videoData ? (
              <RefreshCw className="mr-2" size={14} />
            ) : (
              <Upload className="mr-2" size={14} />
            )}
            {isUploading ? "Processing..." : videoData ? "Replace Active Video" : "Upload Hero Video"}
          </button>

          {message.text && (
            <div className={`p-4 rounded-lg flex items-start gap-3 border ${
              message.type === 'error' ? 'bg-red-50 border-red-100 text-red-600' : 
              message.type === 'success' ? 'bg-green-50 border-green-100 text-green-600' : 
              'bg-blue-50 border-blue-100 text-blue-600'
            }`}>
              {message.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
              <span className="text-[10px] font-bold uppercase tracking-widest leading-relaxed">
                {message.text}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}