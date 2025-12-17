"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import { 
  Plus, X, Bold, Italic, List, ListOrdered, 
  Loader2, ArrowLeft, Save, Trash2, Upload, AlertCircle, Search 
} from "lucide-react";

// --- Types ---
interface Media {
  url: string;
  fileId: string;
}

interface Category {
  _id: string;
  title: string;
  description: string;
  images: Media[];
  priority: number | "";
}

// --- Reusable Modal Component ---
const DeleteModal = ({ isOpen, onClose, onConfirm, title, isLoading }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-sm p-8 shadow-2xl border border-gray-100">
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4 text-red-500">
            <AlertCircle size={24} />
          </div>
          <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-900 mb-2">Delete Category?</h3>
          <p className="text-xs text-gray-500 leading-relaxed mb-8 uppercase tracking-tighter">
            Are you sure you want to delete <span className="font-bold text-black italic">"{title}"</span>? This action cannot be undone.
          </p>
          <div className="flex w-full gap-3">
            <button 
              onClick={onClose}
              className="flex-1 py-3 border border-gray-200 text-[10px] font-bold uppercase tracking-widest hover:bg-gray-50 transition"
            >
              No, Cancel
            </button>
            <button 
              onClick={onConfirm}
              disabled={isLoading}
              className="flex-1 py-3 bg-red-600 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-red-700 transition flex items-center justify-center disabled:bg-red-300"
            >
              {isLoading ? <Loader2 className="animate-spin" size={14} /> : "Yes, Delete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const InputGroup: React.FC<{ label: string; children: React.ReactNode; required?: boolean }> = ({ label, children, required = false }) => (
  <div className="border border-gray-300 p-4 bg-white shadow-sm">
    <label className="block text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-2">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
  </div>
);

export default function CategoryEdit() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Deletion State
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<string>("");
  const [existingImages, setExistingImages] = useState<Media[]>([]);
  const [deleteIndexes, setDeleteIndexes] = useState<number[]>([]);
  const [replaceIndexes, setReplaceIndexes] = useState<number[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);

  const descriptionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  // --- Search Logic ---
  const filteredCategories = useMemo(() => {
    return categories.filter((cat) =>
      cat.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [categories, searchQuery]);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/categories/get");
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : data.categories || []);
    } catch (err) {
      console.error("Fetch failed", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!categoryToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/categories/${categoryToDelete._id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setCategories(categories.filter(c => c._id !== categoryToDelete._id));
        setCategoryToDelete(null);
      } else {
        alert("Failed to delete category");
      }
    } catch (err) {
      alert("An error occurred during deletion");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditClick = (cat: Category) => {
    setEditingCategory(cat);
    setTitle(cat.title || "");
    setDescription(cat.description || "");
    setPriority(cat.priority?.toString() || "");
    setExistingImages(cat.images || []);
    setDeleteIndexes([]);
    setReplaceIndexes([]);
    setNewFiles([]);
    
    setTimeout(() => {
      if (descriptionRef.current) {
        descriptionRef.current.innerHTML = cat.description || "";
      }
    }, 0);
  };

  const applyFormat = (cmd: string) => {
    document.execCommand(cmd, false, undefined);
    if (descriptionRef.current) {
      setDescription(descriptionRef.current.innerHTML);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, replaceIdx?: number) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    if (replaceIdx !== undefined) {
      setReplaceIndexes(prev => [...prev, replaceIdx]);
      setNewFiles(prev => [...prev, files[0]]);
    } else {
      setNewFiles(prev => [...prev, ...files]);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("priority", priority);
      formData.append("deleteIndexes", JSON.stringify(deleteIndexes));
      formData.append("replaceIndexes", JSON.stringify(replaceIndexes));
      newFiles.forEach(file => formData.append("images", file));

      const res = await fetch(`/api/categories/${editingCategory._id}`, {
        method: "PATCH",
        body: formData,
      });

      if (res.ok) {
        alert("Category updated successfully!");
        setEditingCategory(null);
        fetchInitialData();
      } else {
        const err = await res.json();
        alert(err.error || "Update failed");
      }
    } catch (error) {
      alert("An error occurred while saving");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return (
    <div className="flex h-96 items-center justify-center">
      <Loader2 className="animate-spin text-amber-500" size={40} />
    </div>
  );

  // --- GRID VIEW ---
  if (!editingCategory) {
    return (
      <div className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <h1 className="text-sm tracking-widest font-bold uppercase text-gray-500">Select Category to Edit</h1>
          
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="SEARCH CATEGORIES..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-gray-300 pl-10 pr-4 py-2 text-[10px] font-bold uppercase tracking-widest outline-none focus:ring-1 focus:ring-black"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 text-center">
          {filteredCategories.map((cat) => (
            <div key={cat._id} className="group relative">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setCategoryToDelete(cat);
                }}
                className="absolute top-2 right-2 z-10 p-2 bg-white text-red-600 shadow-xl opacity-0 group-hover:opacity-100 hover:bg-red-600 hover:text-white transition-all duration-300"
              >
                <Trash2 size={14} />
              </button>

              <div 
                onClick={() => handleEditClick(cat)} 
                className="cursor-pointer"
              >
                <div className="relative aspect-3/4 overflow-hidden bg-gray-100 mb-2 border border-transparent group-hover:border-gray-300">
                  <Image src={cat.images?.[0]?.url || ""} alt="" fill className="object-cover group-hover:scale-105 transition duration-500" />
                </div>
                <p className="text-[10px] tracking-widest font-bold uppercase truncate px-2">{cat.title}</p>
                <p className="text-[9px] text-gray-400 mt-1 uppercase tracking-tighter">Priority: {cat.priority || "N/A"}</p>
              </div>
            </div>
          ))}
        </div>

        <DeleteModal 
          isOpen={!!categoryToDelete}
          onClose={() => setCategoryToDelete(null)}
          onConfirm={handleDelete}
          title={categoryToDelete?.title}
          isLoading={isDeleting}
        />
      </div>
    );
  }

  // --- EDIT VIEW ---
  return (
    <div className="w-full px-6 py-6 bg-gray-50 min-h-screen">
      <button 
        onClick={() => setEditingCategory(null)} 
        className="flex items-center text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-black mb-6 transition"
      >
        <ArrowLeft size={14} className="mr-2" /> Back to Grid
      </button>

      <form onSubmit={handleUpdate} className="flex flex-col lg:flex-row gap-8 items-start">
        <div className="flex-1 space-y-5 w-full">
          <InputGroup label="Category Title" required>
            <input 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              className="w-full border border-gray-300 p-2.5 outline-none focus:ring-1 focus:ring-amber-300 transition" 
              required 
            />
          </InputGroup>

          <InputGroup label="Display Priority">
            <input 
              type="number" 
              value={priority} 
              onChange={(e) => setPriority(e.target.value)} 
              placeholder="e.g. 1"
              className="w-full border border-gray-300 p-2.5 outline-none focus:ring-1 focus:ring-amber-300 transition" 
            />
          </InputGroup>

          <InputGroup label="Images (Max 4)">
            <div className="grid grid-cols-4 gap-3">
              {existingImages.map((img, idx) => (
                <div key={idx} className={`relative aspect-3/4 border overflow-hidden group ${deleteIndexes.includes(idx) ? 'opacity-20 grayscale border-red-500' : ''}`}>
                  <Image src={img.url} alt="" fill className="object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                    <label className="cursor-pointer p-1.5 bg-white text-black hover:bg-amber-300 transition">
                      <Upload size={14} />
                      <input type="file" className="hidden" onChange={(e) => handleFileChange(e, idx)} />
                    </label>
                    <button 
                      type="button" 
                      onClick={() => setDeleteIndexes(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx])}
                      className="p-1.5 bg-white text-red-600 hover:bg-red-50 transition"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 border-t border-gray-100 pt-4">
              <label className="block text-[10px] font-bold uppercase mb-2 text-gray-400">Add New Category Images</label>
              <input 
                type="file" 
                multiple 
                onChange={(e) => handleFileChange(e)} 
                className="text-xs block w-full file:mr-4 file:py-2 file:px-4 file:border file:border-black file:text-[10px] file:font-bold file:uppercase file:bg-white file:text-black hover:file:bg-black hover:file:text-white transition cursor-pointer" 
              />
            </div>
          </InputGroup>
        </div>

        <div className="w-full lg:w-[450px] sticky top-24">
          <div className="flex flex-col">
            <div className="border border-gray-300 p-4 bg-white shadow-sm h-full">
              <label className="block text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-2">Description *</label>
              <div className="flex gap-1 mb-3 p-1 border border-gray-200 bg-gray-50">
                <button type="button" onClick={() => applyFormat('bold')} className="p-2 hover:bg-amber-100 transition"><Bold size={16}/></button>
                <button type="button" onClick={() => applyFormat('italic')} className="p-2 hover:bg-amber-100 transition"><Italic size={16}/></button>
                <button type="button" onClick={() => applyFormat('insertUnorderedList')} className="p-2 hover:bg-amber-100 transition"><List size={16}/></button>
                <button type="button" onClick={() => applyFormat('insertOrderedList')} className="p-2 hover:bg-amber-100 transition"><ListOrdered size={16}/></button>
              </div>
              <div 
                ref={descriptionRef} 
                contentEditable 
                onInput={() => setDescription(descriptionRef.current?.innerHTML || "")} 
                className="min-h-[350px] max-h-[60vh] border border-gray-300 p-3 outline-none focus:ring-1 focus:ring-amber-300 bg-white overflow-y-auto text-sm leading-relaxed" 
              />
            </div>

            <button 
              disabled={isSaving} 
              type="submit"
              className="w-full mt-5 py-4 bg-black text-white text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-gray-800 transition shadow-xl flex items-center justify-center disabled:bg-gray-400"
            >
              {isSaving ? <Loader2 className="animate-spin mr-2" size={16} /> : <Save className="mr-2" size={16} />}
              Update Category
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}