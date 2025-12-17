"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Loader2, Save, Star, ChevronDown, AlertCircle } from "lucide-react";

interface Category {
  _id: string;
  title: string;
  images: { url: string; fileId: string }[];
}

export default function FeaturedCategory() {
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>(["", "", ""]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  // 1. Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, featRes] = await Promise.all([
          fetch("/api/categories/get"),
          fetch("/api/featured-categories")
        ]);

        const catData = await catRes.json();
        const featData = await featRes.json();

        setAllCategories(Array.isArray(catData) ? catData : catData.categories || []);

        if (featData.featuredCategories && featData.featuredCategories.length === 3) {
          setSelectedIds(featData.featuredCategories.map((c: any) => c._id));
        }
      } catch (err) {
        console.error("Error fetching data", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // 2. Handle Dropdown Change
  const handleSelectChange = (index: number, value: string) => {
    const newIds = [...selectedIds];
    newIds[index] = value;
    setSelectedIds(newIds);
  };

  // 3. Save to Backend
  const handleSave = async () => {
    // Basic frontend check
    if (selectedIds.some(id => id === "")) {
      setMessage({ text: "Please select categories for all 3 slots.", type: "error" });
      return;
    }

    setIsSaving(true);
    setMessage({ text: "", type: "" });

    try {
      const res = await fetch("/api/featured-categories", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryIds: selectedIds }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ text: "Featured categories updated successfully!", type: "success" });
      } else {
        setMessage({ text: data.error || "Failed to update", type: "error" });
      }
    } catch (err) {
      setMessage({ text: "Network error occurred", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return (
    <div className="flex h-96 items-center justify-center">
      <Loader2 className="animate-spin text-amber-500" size={32} />
    </div>
  );

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-10">
        <h1 className="text-[12px] tracking-[0.3em] font-bold uppercase text-gray-500 flex items-center gap-2">
          <Star size={14} className="fill-amber-400 text-amber-400" />
          Featured Homepage Categories
        </h1>
        <p className="text-[10px] text-gray-400 uppercase mt-2 tracking-widest">
          Select exactly three categories to display on your store's main page.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[0, 1, 2].map((index) => {
          const selectedCategory = allCategories.find(c => c._id === selectedIds[index]);
          
          return (
            <div key={index} className="flex flex-col space-y-4">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Slot 0{index + 1}
              </span>
              
              {/* Preview Box */}
              <div className="aspect-[4/5] bg-gray-100 border border-gray-200 relative overflow-hidden group">
                {selectedCategory ? (
                  <Image 
                    src={selectedCategory.images[0]?.url || ""} 
                    alt="Preview" 
                    fill 
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center border-2 border-dashed border-gray-300 m-4">
                    <p className="text-[9px] uppercase font-bold text-gray-400">No Selection</p>
                  </div>
                )}
              </div>

              {/* Dropdown Selection */}
              <div className="relative">
                <select
                  value={selectedIds[index]}
                  onChange={(e) => handleSelectChange(index, e.target.value)}
                  className="w-full appearance-none bg-white border border-gray-300 p-4 text-[11px] font-bold uppercase tracking-widest outline-none focus:ring-1 focus:ring-black cursor-pointer pr-10"
                >
                  <option value="">Select Category</option>
                  {allCategories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.title}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" size={14} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Actions */}
      <div className="mt-16 pt-8 border-t border-gray-100 flex flex-col items-center">
        {message.text && (
          <div className={`mb-6 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest ${message.type === 'error' ? 'text-red-500' : 'text-green-600'}`}>
            {message.type === 'error' && <AlertCircle size={14} />}
            {message.text}
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full md:w-64 py-4 bg-black text-white text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-gray-800 transition flex items-center justify-center disabled:bg-gray-400 shadow-xl"
        >
          {isSaving ? <Loader2 className="animate-spin mr-2" size={16} /> : <Save className="mr-2" size={16} />}
          Save Configuration
        </button>
      </div>
    </div>
  );
}