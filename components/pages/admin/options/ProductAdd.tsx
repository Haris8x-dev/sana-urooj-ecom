// components/pages/admin/options/ProductAdd.tsx

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
  priority?: number;
}

// --- Reusable Components ---

interface InputGroupProps {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}

const InputGroup: React.FC<InputGroupProps> = ({ label, children, required = false }) => (
  <div className="border border-gray-300 rounded-lg p-4 bg-white shadow-sm">
    <label className="block text-sm font-semibold text-gray-700 mb-2">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
  </div>
);

// --- Main Component ---

export default function ProductAdd() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number | string>("");
  const [priority, setPriority] = useState<number | string>("");
  const [cartLimit, setCartLimit] = useState<number | string>("");
  const [category, setCategory] = useState(""); // Defaults to empty (None)
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [gender, setGender] = useState<"Male" | "Female" | "">("");
  const [images, setImages] = useState<File[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const descriptionRef = useRef<HTMLDivElement>(null);
  
  const [sizes, setSizes] = useState<SizeInput[]>([
    { name: "", quantity: "", addOns: [] },
  ]);

  // --- Data Fetching ---

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const response = await fetch('/api/categories/get'); 
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        let fetchedCategories: Category[] = [];

        if (data && Array.isArray(data.categories)) {
          fetchedCategories = data.categories;
        } else if (Array.isArray(data)) {
          fetchedCategories = data;
        }

        setCategories(fetchedCategories);
        // REMOVED: Logic that auto-selected fetchedCategories[0]
      } catch (error) {
        console.error('Error fetching categories:', error);
        setCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  // --- Rich Text Editor Handlers ---

  const applyFormat = useCallback((command: string) => {
    document.execCommand(command, false, undefined);
    descriptionRef.current?.focus();
  }, []);

  const handleDescriptionChange = useCallback(() => {
    if (descriptionRef.current) {
      setDescription(descriptionRef.current.innerHTML);
    }
  }, []);

  // --- Dynamic Sizes/Addons Handlers ---

  const handleAddSize = () => {
    setSizes([...sizes, { name: "", quantity: "", addOns: [] }]);
  };

  const handleRemoveSize = (index: number) => {
    setSizes(sizes.filter((_, i) => i !== index));
  };

  const handleSizeChange = (index: number, field: keyof SizeInput, value: string | number) => {
    const newSizes = sizes.map((size, i) => (i === index ? { ...size, [field]: value } : size));
    setSizes(newSizes);
  };

  const handleAddAddOn = (sizeIndex: number) => {
    setSizes(prevSizes => prevSizes.map((size, i) => {
      if (i === sizeIndex) {
        return { ...size, addOns: [...size.addOns, { detail: "", priceAdjustment: "" }] };
      }
      return size;
    }));
  };

  const handleRemoveAddOn = (sizeIndex: number, addOnIndex: number) => {
    setSizes(prevSizes => prevSizes.map((size, i) => {
      if (i === sizeIndex) {
        return { ...size, addOns: size.addOns.filter((_, j) => j !== addOnIndex) };
      }
      return size;
    }));
  };

  const handleAddOnChange = (sizeIndex: number, addOnIndex: number, field: keyof AddOnInput, value: string | number) => {
    setSizes(prevSizes => prevSizes.map((size, i) => {
      if (i === sizeIndex) {
        return {
          ...size,
          addOns: size.addOns.map((addOn, j) => (j === addOnIndex ? { ...addOn, [field]: value } : addOn)),
        };
      }
      return size;
    }));
  };
  
  // --- Submission Handler ---
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!description || description === '<p className="text-gray-400">Start typing your product description here...</p>') {
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
      
      // If category is empty string, backend should handle it as unassigned/null
      formData.append("category", category);
      formData.append("gender", gender);

      const filteredSizes = sizes.filter(s => s.name && s.quantity !== "");
      formData.append("sizes", JSON.stringify(filteredSizes));

      images.forEach((file) => formData.append("images", file));
      if (videoFile) formData.append("videoFile", videoFile);

      const response = await fetch("/api/products/add", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        alert("Product created successfully!");
        window.location.reload(); 
      } else {
        alert(`Error: ${result.error || "Failed to create product"}`);
      }
    } catch (error) {
      console.error("Submission error:", error);
      alert("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Render Functions ---

  const renderCategoryDropdown = useMemo(() => (
    <select
      value={category}
      onChange={(e) => setCategory(e.target.value)}
      className="w-full text-black border border-gray-300 rounded-md shadow-sm p-2.5 focus:ring-2 focus:ring-amber-300 focus:border-amber-300 bg-white outline-none appearance-none cursor-pointer"
      disabled={loadingCategories}
    >
      {/* Default None Option */}
      <option value="">None (No Category)</option>
      
      {categories.map((cat) => (
        <option key={cat._id} value={cat._id}>
          {cat.title}
        </option>
      ))}
    </select>
  ), [category, categories, loadingCategories]);

  return (
    <div className="w-full px-6 py-6">
      <form onSubmit={handleSubmit} className="flex gap-6">
        
        {/* LEFT COLUMN */}
        <div className="w-1/2 space-y-5">
          <InputGroup label="Title" required>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Slim Fit Denim Jacket"
              className="w-full border border-gray-300 rounded-md shadow-sm p-2.5 focus:ring-2 focus:ring-amber-300 focus:border-amber-300 outline-none"
              required
            />
          </InputGroup>

          <InputGroup label="Price (Rs)" required>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="e.g., 2500"
              min="1"
              className="w-full border border-gray-300 rounded-md shadow-sm p-2.5 focus:ring-2 focus:ring-amber-300 focus:border-amber-300 outline-none"
              required
            />
          </InputGroup>

          <div className="border border-gray-300 rounded-lg p-4 space-y-4 bg-white shadow-sm">
            <h3 className="text-base font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-4">
                Product Details
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Priority (1 = Highest)</label>
                    <input
                      type="number"
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      placeholder="1"
                      min="1"
                      className="w-full border border-gray-300 rounded-md shadow-sm p-2.5 focus:ring-2 focus:ring-amber-300 focus:border-amber-300 outline-none"
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Cart Limit <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      value={cartLimit}
                      onChange={(e) => setCartLimit(e.target.value)}
                      placeholder="1"
                      min="1"
                      className="w-full border border-gray-300 rounded-md shadow-sm p-2.5 focus:ring-2 focus:ring-amber-300 focus:border-amber-300 outline-none"
                      required
                    />
                </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
              {loadingCategories ? (
                <div className="flex items-center text-gray-500 p-2.5 border border-gray-300 rounded-md">
                    <Loader2 size={16} className="animate-spin mr-2" />
                    <span>Loading...</span>
                </div>
              ) : renderCategoryDropdown}
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Gender <span className="text-red-500">*</span></label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as "Male" | "Female" | "")}
                className="w-full border border-gray-300 rounded-md shadow-sm p-2.5 focus:ring-2 focus:ring-amber-300 focus:border-amber-300 bg-white outline-none appearance-none"
                required
              >
                <option value="" disabled>Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
          </div>
          
          <InputGroup label="Product Sizes & Inventory">
            <div className="flex justify-end items-center mb-4">
              <button
                type="button"
                onClick={handleAddSize}
                className="flex items-center text-sm px-3 py-1.5 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 transition font-medium shadow-md"
              >
                <Plus size={16} className="mr-1" /> Add Size
              </button>
            </div>
            
            <div className="space-y-4">
              {sizes.map((size, sizeIndex) => (
                <div key={sizeIndex} className="p-4 border border-gray-300 rounded-lg bg-gray-50 shadow-inner">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-bold text-gray-700 text-sm">Size Entry {sizeIndex + 1}</h4>
                    <button
                      type="button"
                      onClick={() => handleRemoveSize(sizeIndex)}
                      className="text-red-500 hover:text-red-700 transition"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Size Name</label>
                      <input
                        type="text"
                        value={size.name}
                        onChange={(e) => handleSizeChange(sizeIndex, 'name', e.target.value)}
                        placeholder="e.g., S, M"
                        className="block w-full border border-gray-300 rounded-md p-2 text-sm outline-none focus:ring-1 focus:ring-amber-300 bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Quantity <span className="text-red-500">*</span></label>
                      <input
                        type="number"
                        value={size.quantity}
                        onChange={(e) => handleSizeChange(sizeIndex, 'quantity', e.target.value)}
                        placeholder="0"
                        min="0"
                        className="block w-full border border-gray-300 rounded-md p-2 text-sm outline-none focus:ring-1 focus:ring-amber-300 bg-white"
                        required
                      />
                    </div>
                  </div>

                  <div className="p-3 border border-dashed border-gray-300 rounded-md bg-white">
                    <div className="flex justify-between items-center mb-2">
                      <h5 className="text-xs font-semibold text-gray-600">Add-Ons</h5>
                      <button
                        type="button"
                        onClick={() => handleAddAddOn(sizeIndex)}
                        className="flex items-center text-xs px-2 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition font-medium"
                      >
                        <Plus size={12} className="mr-1" /> Add
                      </button>
                    </div>
                    <div className="space-y-2">
                      {size.addOns.map((addOn, addOnIndex) => (
                        <div key={addOnIndex} className="flex gap-2 items-center">
                          <input
                            type="text"
                            value={addOn.detail}
                            onChange={(e) => handleAddOnChange(sizeIndex, addOnIndex, 'detail', e.target.value)}
                            placeholder="Detail"
                            className="grow border border-gray-300 rounded p-1.5 text-xs outline-none focus:ring-1 focus:ring-amber-300"
                            required
                          />
                          <input
                            type="number"
                            value={addOn.priceAdjustment}
                            onChange={(e) => handleAddOnChange(sizeIndex, addOnIndex, 'priceAdjustment', e.target.value)}
                            placeholder="Rs"
                            className="w-24 border border-gray-300 rounded p-1.5 text-xs outline-none focus:ring-1 focus:ring-amber-300"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveAddOn(sizeIndex, addOnIndex)}
                            className="text-red-500 hover:text-red-700 p-1"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </InputGroup>

          <InputGroup label="Product Media">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Images <span className="text-red-500">*</span></label>
                <input
                  type="file"
                  onChange={(e) => setImages(Array.from(e.target.files || []))}
                  multiple
                  accept="image/*"
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border file:border-gray-300 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Video (Optional)</label>
                <input
                  type="file"
                  onChange={(e) => setVideoFile(e.target.files ? e.target.files[0] : null)}
                  accept="video/*"
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border file:border-gray-300 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                />
              </div>
            </div>
          </InputGroup>
          
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 px-4 border border-transparent rounded-md shadow-lg text-sm font-semibold text-white transition-colors flex justify-center items-center ${
                isSubmitting ? "bg-indigo-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"
              }`}
            >
              {isSubmitting ? <><Loader2 size={18} className="animate-spin mr-2" /> Uploading...</> : "Create Product"}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="w-1/2">
          <div className="border border-gray-300 rounded-lg p-4 sticky top-4 bg-white shadow-sm">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Description <span className="text-red-500">*</span></label>
            <div className="flex gap-2 mb-3 p-2 border border-gray-300 rounded-md bg-gray-50">
              <button type="button" onClick={() => applyFormat('bold')} className="p-2 hover:bg-gray-200 rounded transition"><Bold size={18} /></button>
              <button type="button" onClick={() => applyFormat('italic')} className="p-2 hover:bg-gray-200 rounded transition"><Italic size={18} /></button>
              <button type="button" onClick={() => applyFormat('insertUnorderedList')} className="p-2 hover:bg-gray-200 rounded transition"><List size={18} /></button>
              <button type="button" onClick={() => applyFormat('insertOrderedList')} className="p-2 hover:bg-gray-200 rounded transition"><ListOrdered size={18} /></button>
            </div>
            <div
              ref={descriptionRef}
              contentEditable
              onInput={handleDescriptionChange}
              className="min-h-[500px] w-full border border-gray-300 rounded-md shadow-inner p-3 focus:ring-2 focus:ring-amber-300 focus:border-amber-300 outline-none bg-white overflow-y-auto"
              style={{ maxHeight: '70vh' }}
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