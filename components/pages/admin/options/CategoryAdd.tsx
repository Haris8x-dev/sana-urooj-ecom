"use client";

import React, { useState, useRef, useCallback } from "react";
import { Plus, X, Bold, Italic, List, ListOrdered, Loader2, Image as ImageIcon, Star } from "lucide-react";

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

export default function CategoryAdd() {
  // --- State ---
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<number | string>("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const descriptionRef = useRef<HTMLDivElement>(null);

  // --- Rich Text Handlers ---
  const applyFormat = useCallback((command: string) => {
    document.execCommand(command, false, undefined);
    descriptionRef.current?.focus();
  }, []);

  const handleDescriptionChange = useCallback(() => {
    if (descriptionRef.current) {
      setDescription(descriptionRef.current.innerHTML);
    }
  }, []);

  // --- Submit Handler ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!image) {
      alert("Please upload exactly 1 category image.");
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("priority", priority.toString());
      // Backend expects the key "images" for the single file
      formData.append("images", image);

      const response = await fetch("/api/categories/add", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        alert("Category created successfully!");
        window.location.reload();
      } else {
        alert(`Error: ${result.error || "Failed to create category"}`);
      }
    } catch (error) {
      console.error("Submission error:", error);
      alert("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full px-4 lg:px-6 py-3">
        <div className="mb-10">
        <h1 className="text-[12px] tracking-[0.3em] font-bold uppercase text-gray-500 flex items-center gap-2">
          <Star size={14} className="fill-amber-400 text-amber-400" />
          Create a New Category
        </h1>
        <p className="text-[10px] text-gray-400 uppercase mt-2 tracking-widest">
          Create Categories to keep your St
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-6">
        
        {/* LEFT COLUMN - Primary Fields */}
        <div className="w-full lg:w-1/2 space-y-5">
          
          {/* Title */}
          <InputGroup label="Category Title" required>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Summer Collection"
              className="w-full border border-gray-300 rounded-md shadow-sm p-2.5 focus:ring-2 focus:ring-amber-300 outline-none"
              required
            />
          </InputGroup>

          {/* Priority */}
          <InputGroup label="Display Priority (1 = Highest)">
            <input
              type="number"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              placeholder="e.g., 1"
              min="1"
              className="w-full border border-gray-300 rounded-md shadow-sm p-2.5 focus:ring-2 focus:ring-amber-300 outline-none"
            />
            <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">Higher priority categories appear first on the home page.</p>
          </InputGroup>

          {/* Image Upload */}
          <InputGroup label="Category Banner/Thumbnail" required>
            <div className="space-y-4">
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="text-xs text-gray-500">
                      {image ? <span className="text-amber-600 font-semibold">{image.name}</span> : "Click to upload category image"}
                    </p>
                  </div>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => setImage(e.target.files ? e.target.files[0] : null)}
                    required
                  />
                </label>
              </div>
              {image && (
                <div className="flex items-center gap-2 p-2 bg-amber-50 rounded border border-amber-200">
                    <div className="w-10 h-10 relative rounded overflow-hidden border border-amber-300">
                        <img src={URL.createObjectURL(image)} alt="Preview" className="object-cover w-full h-full" />
                    </div>
                    <span className="text-xs text-amber-800 flex-1 truncate">{image.name}</span>
                    <button type="button" onClick={() => setImage(null)} className="text-red-500 hover:bg-red-50 p-1 rounded">
                        <X size={14} />
                    </button>
                </div>
              )}
            </div>
          </InputGroup>
          
          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 px-4 rounded-md shadow-lg text-sm font-semibold text-white transition-all flex justify-center items-center ${
                isSubmitting ? "bg-amber-200 cursor-not-allowed text-gray-500" : "bg-gray-900 hover:bg-amber-400 hover:text-gray-900"
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin mr-2" />
                  Creating Category...
                </>
              ) : (
                "Create Category"
              )}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN - Description */}
        <div className="w-full lg:w-1/2">
          <div className="border border-gray-300 rounded-lg p-4 lg:sticky lg:top-4 bg-white shadow-sm">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description / Bio
            </label>
            
            {/* Rich Text Toolbar */}
            <div className="flex flex-wrap gap-2 mb-3 p-2 border border-gray-300 rounded-md bg-gray-50">
              <button type="button" onClick={() => applyFormat('bold')} className="p-2 hover:bg-amber-200 rounded transition" title="Bold"><Bold size={18} /></button>
              <button type="button" onClick={() => applyFormat('italic')} className="p-2 hover:bg-amber-200 rounded transition" title="Italic"><Italic size={18} /></button>
              <button type="button" onClick={() => applyFormat('insertUnorderedList')} className="p-2 hover:bg-amber-200 rounded transition" title="Bullet List"><List size={18} /></button>
              <button type="button" onClick={() => applyFormat('insertOrderedList')} className="p-2 hover:bg-amber-200 rounded transition" title="Numbered List"><ListOrdered size={18} /></button>
            </div>
            
            {/* Editable Content Area */}
            <div
              ref={descriptionRef}
              contentEditable
              onInput={handleDescriptionChange}
              className="min-h-[300px] lg:min-h-[450px] w-full border border-gray-300 rounded-md shadow-inner p-3 focus:ring-2 focus:ring-amber-300 outline-none bg-white overflow-y-auto"
              style={{ maxHeight: '65vh' }}
              suppressContentEditableWarning
            >
              <p className="text-gray-400 italic">Describe this category...</p>
            </div>
            
            <p className="text-[11px] text-gray-400 mt-3 italic">
              Optional: This description helps with SEO and informs users about the collection style.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}