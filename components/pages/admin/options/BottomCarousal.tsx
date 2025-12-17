"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Plus, 
  Trash2, 
  Image as ImageIcon, 
  Loader2, 
  RefreshCcw, 
  Save, 
  AlertCircle,
  X
} from "lucide-react";

interface CarousalImage {
  url: string;
  fileId: string;
}

export default function BottomCarousal() {
  const [images, setImages] = useState<CarousalImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const [pendingChanges, setPendingChanges] = useState<{
    replace: { index: number; file: File }[];
    deleteIndexes: number[];
    newFiles: File[];
  }>({ replace: [], deleteIndexes: [], newFiles: [] });

  const MAX_IMAGES = 5;

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/bottom-carousal");
      const data = await res.json();
      if (res.ok) {
        setImages(data.images || []);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, mode: 'new' | 'replace', index?: number) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (mode === 'replace' && index !== undefined) {
      setPendingChanges(prev => ({
        ...prev,
        replace: [...prev.replace.filter(r => r.index !== index), { index, file: files[0] }]
      }));
    } else {
      setPendingChanges(prev => ({
        ...prev,
        newFiles: [...prev.newFiles, ...files].slice(0, MAX_IMAGES - (images.length - prev.deleteIndexes.length))
      }));
    }
    e.target.value = "";
  };

  const markForDeletion = (index: number) => {
    if (images.length - pendingChanges.deleteIndexes.length <= 1) {
      alert("At least 1 image must remain in the carousel.");
      return;
    }
    setPendingChanges(prev => ({
      ...prev,
      deleteIndexes: [...prev.deleteIndexes, index]
    }));
  };

  const saveChanges = async () => {
    setIsSubmitting(true);
    setMessage({ text: "Processing updates...", type: "info" });

    const formData = new FormData();
    pendingChanges.replace.forEach(r => formData.append("images", r.file));
    pendingChanges.newFiles.forEach(f => formData.append("images", f));
    formData.append("replaceIndexes", JSON.stringify(pendingChanges.replace.map(r => r.index)));
    formData.append("deleteIndexes", JSON.stringify(pendingChanges.deleteIndexes));

    try {
      const method = images.length === 0 ? "POST" : "PATCH";
      const res = await fetch("/api/bottom-carousal", {
        method: method,
        body: formData,
      });

      const result = await res.json();

      if (res.ok) {
        setImages(result.images || result.carousel?.images || []);
        setPendingChanges({ replace: [], deleteIndexes: [], newFiles: [] });
        setMessage({ text: "Carousel updated successfully!", type: "success" });
      } else {
        setMessage({ text: result.error || "Update failed", type: "error" });
      }
    } catch (err) {
      setMessage({ text: "Connection error", type: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <Loader2 className="animate-spin text-indigo-500" size={32} />
    </div>
  );

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-gray-100 pb-6">
        <div>
          <h1 className="text-sm font-bold uppercase tracking-widest text-gray-800 flex items-center gap-2">
            <ImageIcon size={18} /> Bottom Carousel Management
          </h1>
          <p className="text-[10px] text-gray-400 uppercase tracking-tighter mt-1">
            Min 1 - Max 5 images. Mobile optimized view enabled.
          </p>
        </div>
        
        <div className="flex gap-2">
            <button 
                onClick={() => setPendingChanges({ replace: [], deleteIndexes: [], newFiles: [] })}
                className="px-4 py-2 text-[10px] font-bold uppercase border border-gray-200 hover:bg-gray-50 rounded transition"
            >
                Reset
            </button>
            <button 
                onClick={saveChanges}
                disabled={isSubmitting || (pendingChanges.newFiles.length === 0 && pendingChanges.replace.length === 0 && pendingChanges.deleteIndexes.length === 0)}
                className="px-6 py-2 bg-black text-white text-[10px] font-bold uppercase tracking-widest rounded shadow-lg disabled:bg-gray-200 flex items-center gap-2"
            >
                {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Save Changes
            </button>
        </div>
      </div>

      {message.text && (
        <div className={`p-4 rounded border text-[10px] font-bold uppercase tracking-widest flex items-center gap-3 ${
            message.type === 'error' ? 'bg-red-50 border-red-100 text-red-600' : 'bg-green-50 border-green-100 text-green-600'
        }`}>
            <AlertCircle size={16} /> {message.text}
            <button className="ml-auto" onClick={() => setMessage({text: "", type: ""})}><X size={14}/></button>
        </div>
      )}

      {/* Grid Section */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {images.map((img, idx) => {
          const isDeleted = pendingChanges.deleteIndexes.includes(idx);
          const replacement = pendingChanges.replace.find(r => r.index === idx);
          
          return (
            <div key={idx} className={`relative group aspect-4/5 rounded-lg overflow-hidden border-2 transition-all ${
                isDeleted ? 'opacity-40 border-red-500 scale-95' : replacement ? 'border-blue-400' : 'border-gray-100'
            }`}>
              <img 
                src={replacement ? URL.createObjectURL(replacement.file) : img.url} 
                alt={`Carousel ${idx}`} 
                className="w-full h-full object-cover"
              />
              
              {/* Responsive Action Overlay */}
              {!isDeleted && (
                <div className="absolute inset-0 bg-black/20 lg:bg-black/40 flex flex-col items-center justify-center gap-3 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                    <div className="flex gap-2">
                        <label className="p-3 lg:p-2 bg-white rounded-full cursor-pointer hover:bg-blue-50 text-blue-600 shadow-2xl active:scale-90 transition">
                            <RefreshCcw size={20} className="lg:w-[18px] lg:h-[18px]" />
                            <input type="file" hidden accept="image/*" onChange={(e) => handleFileSelect(e, 'replace', idx)} />
                        </label>
                        <button 
                            onClick={() => markForDeletion(idx)}
                            className="p-3 lg:p-2 bg-white rounded-full hover:bg-red-50 text-red-600 shadow-2xl active:scale-90 transition"
                        >
                            <Trash2 size={20} className="lg:w-[18px] lg:h-[18px]" />
                        </button>
                    </div>
                </div>
              )}

              {isDeleted && (
                <div className="absolute inset-0 flex items-center justify-center bg-red-500/20 backdrop-blur-[2px]">
                    <button 
                        onClick={() => setPendingChanges(prev => ({...prev, deleteIndexes: prev.deleteIndexes.filter(i => i !== idx)}))}
                        className="bg-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-xl active:scale-95 transition"
                    >
                        Undo
                    </button>
                </div>
              )}
              
              <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 text-white text-[7px] font-bold rounded uppercase tracking-tighter">
                Slot {idx + 1} {replacement && "• Edited"}
              </div>
            </div>
          );
        })}

        {/* New Pending Uploads */}
        {pendingChanges.newFiles.map((file, idx) => (
            <div key={`new-${idx}`} className="relative aspect-4/5 rounded-lg overflow-hidden border-2 border-indigo-400">
                <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" />
                <button 
                    onClick={() => setPendingChanges(prev => ({...prev, newFiles: prev.newFiles.filter((_, i) => i !== idx)}))}
                    className="absolute top-2 right-2 p-1.5 bg-white rounded-full text-red-500 shadow-lg active:scale-90 transition"
                >
                    <X size={16} />
                </button>
                <div className="absolute bottom-0 inset-x-0 py-1 bg-indigo-600 text-white text-[8px] font-bold text-center uppercase">
                    New Slot
                </div>
            </div>
        ))}

        {/* Add Button */}
        {(images.length + pendingChanges.newFiles.length - pendingChanges.deleteIndexes.length) < MAX_IMAGES && (
            <label className="aspect-4/5 rounded-lg border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-all text-gray-400 hover:text-indigo-600 active:bg-gray-100">
                <Plus size={32} strokeWidth={1} />
                <span className="text-[10px] font-bold uppercase mt-2 tracking-widest">Add New</span>
                <input type="file" hidden accept="image/*" onChange={(e) => handleFileSelect(e, 'new')} />
            </label>
        )}
      </div>
    </div>
  );
}