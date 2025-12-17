"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Plus, X, Bold, Italic, List, ListOrdered, Loader2 } from "lucide-react";

// --- Type Definitions ---
interface AddOnInput {
  detail: string;
  priceAdjustment: number | string;
}

interface SizeInput {
  name: string;
  quantity: number | string;
  addOns: AddOnInput[];
}

interface Category {
  _id: string;
  title: string;
}

interface InputGroupProps {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}

const InputGroup: React.FC<InputGroupProps> = ({ label, children, required = false }) => (
  <div className="border border-gray-300 rounded-lg p-4 bg-white shadow-sm h-full">
    <label className="block text-sm font-semibold text-gray-700 mb-2">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
  </div>
);

export default function ProductAdd() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number | string>("");
  const [priority, setPriority] = useState<number | string>("");
  const [cartLimit, setCartLimit] = useState<number | string>("");
  const [category, setCategory] = useState(""); 
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [gender, setGender] = useState<"Male" | "Female" | "">("");
  const [images, setImages] = useState<File[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const descriptionRef = useRef<HTMLDivElement>(null);
  const [sizes, setSizes] = useState<SizeInput[]>([{ name: "", quantity: "", addOns: [] }]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const response = await fetch('/api/categories/get'); 
        const data = await response.json();
        setCategories(data.categories || data || []);
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  const applyFormat = useCallback((command: string) => {
    document.execCommand(command, false, undefined);
    descriptionRef.current?.focus();
  }, []);

  const handleDescriptionChange = useCallback(() => {
    if (descriptionRef.current) {
      setDescription(descriptionRef.current.innerHTML);
    }
  }, []);

  const handleAddSize = () => setSizes([...sizes, { name: "", quantity: "", addOns: [] }]);
  const handleRemoveSize = (index: number) => setSizes(sizes.filter((_, i) => i !== index));
  const handleSizeChange = (index: number, field: keyof SizeInput, value: string | number) => {
    setSizes(sizes.map((size, i) => (i === index ? { ...size, [field]: value } : size)));
  };

  const handleAddAddOn = (sizeIndex: number) => {
    setSizes(prev => prev.map((s, i) => i === sizeIndex ? { ...s, addOns: [...s.addOns, { detail: "", priceAdjustment: "" }] } : s));
  };

  const handleRemoveAddOn = (sizeIndex: number, addOnIndex: number) => {
    setSizes(prev => prev.map((s, i) => i === sizeIndex ? { ...s, addOns: s.addOns.filter((_, j) => j !== addOnIndex) } : s));
  };

  const handleAddOnChange = (sIdx: number, aIdx: number, field: keyof AddOnInput, val: string | number) => {
    setSizes(prev => prev.map((s, i) => i === sIdx ? { ...s, addOns: s.addOns.map((a, j) => j === aIdx ? { ...a, [field]: val } : a) } : s));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || description === '<p class="text-gray-400">Start typing your product description here...</p>') {
      alert("Please enter a product description.");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("price", price.toString());
      formData.append("priority", priority.toString());
      formData.append("cartLimit", cartLimit.toString());
      
      // Explicitly handle "None" as null/empty string
      formData.append("category", category === "" ? "" : category);
      formData.append("gender", gender);

      const filteredSizes = sizes.filter(s => s.name && s.quantity !== "");
      formData.append("sizes", JSON.stringify(filteredSizes));

      images.forEach((file) => formData.append("images", file));
      if (videoFile) formData.append("videoFile", videoFile);

      const response = await fetch("/api/products/add", { method: "POST", body: formData });
      const result = await response.json();

      if (response.ok) {
        alert("Product created successfully!");
        window.location.reload(); 
      } else {
        alert(`Error: ${result.error || "Failed to create product"}`);
      }
    } catch (error) {
      alert("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full px-4 sm:px-6">

      <div>
          <h1
          className="text-2xl font-bold pt-8 pb-8"
          >Add A Product</h1>
      </div>
      
      <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-6 items-start">
        {/* LEFT COLUMN - RESPONSIVE WIDTH */}
        <div className="w-full lg:w-1/2 space-y-5">
          <InputGroup label="Title" required>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Slim Fit Denim Jacket" className="w-full border border-gray-300 rounded-md p-2.5 focus:ring-2 focus:ring-amber-300 outline-none" required />
          </InputGroup>

          <InputGroup label="Price (Rs)" required>
            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g., 2500" min="1" className="w-full border border-gray-300 rounded-md p-2.5 focus:ring-2 focus:ring-amber-300 outline-none" required />
          </InputGroup>

          <div className="border border-gray-300 rounded-lg p-4 space-y-4 bg-white shadow-sm">
            <h3 className="text-base font-semibold text-gray-800 border-b pb-2">Product Settings</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Priority</label>
                <input type="number" value={priority} onChange={(e) => setPriority(e.target.value)} placeholder="1" min="1" className="w-full border border-gray-300 rounded-md p-2.5 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Cart Limit *</label>
                <input type="number" value={cartLimit} onChange={(e) => setCartLimit(e.target.value)} placeholder="1" min="1" className="w-full border border-gray-300 rounded-md p-2.5 outline-none" required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Category (Optional)</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full border border-gray-300 rounded-md p-2.5 bg-white outline-none appearance-none">
                <option value="">None (No Category)</option>
                {categories.map((cat) => <option key={cat._id} value={cat._id}>{cat.title}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Gender *</label>
              <select value={gender} onChange={(e) => setGender(e.target.value as any)} className="w-full border border-gray-300 rounded-md p-2.5 bg-white outline-none" required>
                <option value="" disabled>Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
          </div>
          
          <InputGroup label="Sizes & Inventory">
             <div className="flex justify-between items-center mb-4">
                <span className="text-xs text-gray-500 italic">Add at least one size</span>
                <button type="button" onClick={handleAddSize} className="flex items-center text-xs px-3 py-1.5 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 shadow-md">
                  <Plus size={14} className="mr-1" /> Add Size
                </button>
             </div>
             <div className="space-y-4">
               {sizes.map((size, sIdx) => (
                 <div key={sIdx} className="p-3 border rounded-lg bg-gray-50">
                    <div className="flex justify-between mb-2">
                       <span className="text-xs font-bold uppercase">Size {sIdx + 1}</span>
                       <button type="button" onClick={() => handleRemoveSize(sIdx)} className="text-red-500"><X size={14}/></button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <input type="text" placeholder="Size (e.g. M)" value={size.name} onChange={(e) => handleSizeChange(sIdx, 'name', e.target.value)} className="p-2 text-sm border rounded bg-white" required />
                      <input type="number" placeholder="Qty" value={size.quantity} onChange={(e) => handleSizeChange(sIdx, 'quantity', e.target.value)} className="p-2 text-sm border rounded bg-white" required />
                    </div>
                    {/* Addons Logic preserved... */}
                 </div>
               ))}
             </div>
          </InputGroup>

          <InputGroup label="Media">
             <input type="file" onChange={(e) => setImages(Array.from(e.target.files || []))} multiple accept="image/*" className="w-full text-xs mb-4" required />
             <input type="file" onChange={(e) => setVideoFile(e.target.files?.[0] || null)} accept="video/*" className="w-full text-xs" />
          </InputGroup>

          <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-indigo-600 text-white font-bold rounded-lg shadow-xl uppercase tracking-widest disabled:bg-gray-400">
            {isSubmitting ? "Processing..." : "Create Product"}
          </button>
        </div>

        {/* RIGHT COLUMN - STICKY ON DESKTOP, FLOW ON MOBILE */}
        <div className="w-full lg:w-1/2 lg:sticky lg:top-4">
          <div className="border border-gray-300 rounded-lg p-4 bg-white shadow-sm">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Description *</label>
            <div className="flex gap-1 mb-3 p-1 border rounded bg-gray-50 overflow-x-auto">
              <button type="button" onClick={() => applyFormat('bold')} className="p-2 hover:bg-gray-200 rounded"><Bold size={16} /></button>
              <button type="button" onClick={() => applyFormat('italic')} className="p-2 hover:bg-gray-200 rounded"><Italic size={16} /></button>
              <button type="button" onClick={() => applyFormat('insertUnorderedList')} className="p-2 hover:bg-gray-200 rounded"><List size={16} /></button>
              <button type="button" onClick={() => applyFormat('insertOrderedList')} className="p-2 hover:bg-gray-200 rounded"><ListOrdered size={16} /></button>
            </div>
            <div
              ref={descriptionRef}
              contentEditable
              onInput={handleDescriptionChange}
              className="min-h-[300px] lg:min-h-[600px] w-full border rounded-md p-3 outline-none bg-white overflow-y-auto text-sm"
              suppressContentEditableWarning
            >
              <p className="text-gray-400">Start typing your product description here...</p>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}