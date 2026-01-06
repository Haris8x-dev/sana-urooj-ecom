"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Image from "next/image";
import { 
  Plus, X, Bold, Italic, List, ListOrdered, 
  Loader2, ArrowLeft, Save, Trash2, Upload, AlertTriangle, Search, Video, Film, Star
} from "lucide-react";

// --- Type Definitions ---
interface AddOn {
  detail: string;
  priceAdjustment: number | string;
}

interface Size {
  name: string;
  quantity: number | string;
  addOns: AddOn[];
}

interface Category {
  _id: string;
  title: string;
}

interface Product {
  _id: string;
  title: string;
  description: string;
  price: number;
  category: string | null;
  gender: string;
  priority: number | "";
  cartLimit: number;
  images: { url: string; fileId: string }[];
  video?: { url: string; fileId: string } | null; // Added Video type
  sizes: Size[];
  badges?: {
    saveRs: {
      active: boolean;
      amount: number;
    }
  }
}

const InputGroup: React.FC<{ label: string; children: React.ReactNode; required?: boolean }> = ({ label, children, required = false }) => (
  <div className="border border-gray-300 p-4 bg-white shadow-sm">
    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
  </div>
);

export default function ProductEdit() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Deletion States
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form States
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<string>("");
  const [category, setCategory] = useState("");
  const [gender, setGender] = useState("");
  const [priority, setPriority] = useState<string>("");
  const [cartLimit, setCartLimit] = useState<string>("1");
  const [sizes, setSizes] = useState<Size[]>([]);
  
  const [badgeActive, setBadgeActive] = useState<boolean>(false);
  const [badgeAmount, setBadgeAmount] = useState<string>("0");
  
  // Media States
  const [deleteIndexes, setDeleteIndexes] = useState<number[]>([]);
  const [replaceIndexes, setReplaceIndexes] = useState<number[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  
  // NEW: Video States
  const [newVideoFile, setNewVideoFile] = useState<File | null>(null);
  const [deleteVideo, setDeleteVideo] = useState<boolean>(false);

  const descriptionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((prod) =>
      prod.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch("/api/products/get"),
        fetch("/api/categories/get")
      ]);
      const prodData = await prodRes.json();
      const catData = await catRes.json();
      setProducts(prodData.products || []);
      setCategories(Array.isArray(catData) ? catData : catData.categories || []);
    } catch (err) {
      console.error("Fetch failed", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
    setTitle(product.title || "");
    setDescription(product.description || "");
    setPrice(product.price?.toString() || "");
    setCategory(product.category || "");
    setGender(product.gender || "");
    setPriority(product.priority?.toString() || "");
    setCartLimit(product.cartLimit?.toString() || "1");
    setSizes(product.sizes || []);
    setBadgeActive(product.badges?.saveRs?.active || false);
    setBadgeAmount(product.badges?.saveRs?.amount?.toString() || "0");

    // Reset Media States
    setDeleteIndexes([]);
    setReplaceIndexes([]);
    setNewFiles([]);
    setNewVideoFile(null);
    setDeleteVideo(false);

    setTimeout(() => {
      if (descriptionRef.current) {
        descriptionRef.current.innerHTML = product.description || "";
      }
    }, 0);
  };

  const triggerDelete = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/products/${productToDelete._id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setShowDeleteModal(false);
        setProductToDelete(null);
        fetchInitialData();
      } else {
        alert("Failed to delete product");
      }
    } catch (err) {
      alert("Error deleting product");
    } finally {
      setIsDeleting(false);
    }
  };

  const applyFormat = (cmd: string) => {
    document.execCommand(cmd, false, undefined);
    handleDescriptionChange();
  };

  const handleDescriptionChange = useCallback(() => {
    if (descriptionRef.current) {
      setDescription(descriptionRef.current.innerHTML);
    }
  }, []);

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

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewVideoFile(file);
      setDeleteVideo(false); 
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setIsSaving(true);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("price", price);
      formData.append("badgeActive", String(badgeActive));
      formData.append("badgeAmount", badgeAmount);

      if (category === "" || !category) {
        formData.append("removeCategory", "true");
      } else {
        formData.append("category", category);
        formData.append("removeCategory", "false");
      }

      formData.append("gender", gender);
      formData.append("priority", priority);
      formData.append("cartLimit", cartLimit);
      formData.append("sizes", JSON.stringify(sizes));
      
      formData.append("deleteIndexes", JSON.stringify(deleteIndexes));
      formData.append("replaceIndexes", JSON.stringify(replaceIndexes));
      newFiles.forEach(file => formData.append("images", file));

      if (newVideoFile) {
        formData.append("videoFile", newVideoFile);
      }
      formData.append("deleteVideo", String(deleteVideo));

      const res = await fetch(`/api/products/${editingProduct._id}`, {
        method: "PATCH",
        body: formData,
      });

      if (res.ok) {
        alert("Product updated successfully!");
        setEditingProduct(null);
        fetchInitialData();
      } else {
        const err = await res.json();
        alert(err.error || "Update failed");
      }
    } catch (err) {
      alert("Error saving product");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return (
    <div className="flex h-96 items-center justify-center">
      <Loader2 className="animate-spin text-amber-500" size={40} />
    </div>
  );

  if (!editingProduct) {
    return (
      <div className="p-6 relative">
        {showDeleteModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white max-w-md w-full p-8 border border-gray-200 shadow-2xl">
              <div className="flex items-center justify-center w-16 h-16 bg-red-50 text-red-600 mb-6 mx-auto">
                <AlertTriangle size={32} />
              </div>
              <h2 className="text-xl font-bold text-center mb-2 uppercase tracking-tight">Confirm Deletion</h2>
              <p className="text-gray-500 text-center text-sm mb-8 leading-relaxed">
                Are you sure you want to delete <span className="font-bold text-black">"{productToDelete?.title}"</span>? 
              </p>
              <div className="flex gap-4">
                <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-3 border border-black text-xs font-bold uppercase tracking-widest hover:bg-gray-100 transition">No, Cancel</button>
                <button onClick={confirmDelete} disabled={isDeleting} className="flex-1 py-3 bg-red-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-red-700 transition flex items-center justify-center">
                  {isDeleting ? <Loader2 className="animate-spin" size={16} /> : "Yes, Delete"}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div className="mb-10">
            <h1 className="text-[12px] tracking-[0.3em] font-bold uppercase text-gray-500 flex items-center gap-2">
              <Star size={14} className="fill-amber-400 text-amber-400" />
              Manage / Edit Current Products
            </h1>
            <p className="text-[10px] text-gray-400 uppercase mt-2 tracking-widest">
              Select from the existing products & Modify its current Values
            </p>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text" 
              placeholder="SEARCH BY TITLE..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-gray-300 pl-10 pr-4 py-2 text-[10px] font-bold uppercase tracking-widest outline-none focus:ring-1 focus:ring-black"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 text-center">
          {filteredProducts?.map((prod) => (
            <div key={prod._id} onClick={() => handleEditClick(prod)} className="group cursor-pointer relative">
              <div className="relative aspect-[3/4] overflow-hidden bg-gray-100 mb-2 border border-transparent group-hover:border-gray-300">
                <Image src={prod.images?.[0]?.url || ""} alt="" fill className="object-cover group-hover:scale-105 transition duration-500" />
                <button 
                  onClick={(e) => triggerDelete(e, prod)}
                  className="absolute top-2 right-2 p-2 bg-white/90 text-red-600 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 hover:text-white"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <p className="text-[10px] tracking-widest font-bold uppercase truncate px-2">{prod.title}</p>
              <p className="text-[9px] text-gray-400 mt-1 uppercase tracking-tighter">Rs. {prod.price}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-6 py-6 bg-gray-50 min-h-screen">
      <button onClick={() => setEditingProduct(null)} className="flex items-center text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-black mb-6 transition">
        <ArrowLeft size={14} className="mr-2" /> Back to Grid
      </button>

      <form onSubmit={handleUpdate} className="flex flex-col lg:flex-row gap-8 items-start">
        {/* LEFT COLUMN */}
        <div className="flex-1 space-y-5 w-full">
          <InputGroup label="Product Title" required>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border border-gray-300 p-2.5 outline-none focus:ring-1 focus:ring-amber-300 transition" required />
          </InputGroup>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <InputGroup label="Savers Rs Badge">
               <div className="flex items-center h-10 gap-3">
                 <input type="checkbox" id="saversActive" checked={badgeActive} onChange={(e) => setBadgeActive(e.target.checked)} className="w-5 h-5 accent-black cursor-pointer" />
                 <label htmlFor="saversActive" className="text-[10px] font-bold uppercase cursor-pointer">{badgeActive ? "Discount Active" : "No Discount Active"}</label>
               </div>
             </InputGroup>
             <InputGroup label="Discount Amount (Rs)">
               <input type="number" disabled={!badgeActive} value={badgeAmount} onChange={(e) => setBadgeAmount(e.target.value)} className={`w-full border p-2.5 outline-none transition text-sm ${!badgeActive ? "bg-gray-100 text-gray-400 border-gray-200" : "border-gray-300 focus:ring-1 focus:ring-amber-300"}`} placeholder="Amount to subtract..." />
             </InputGroup>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InputGroup label="Original Price (Rs)" required>
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full border border-gray-300 p-2.5 outline-none focus:ring-1 focus:ring-amber-300 transition" required />
            </InputGroup>
            <InputGroup label="Cart Limit" required>
              <input type="number" value={cartLimit} onChange={(e) => setCartLimit(e.target.value)} className="w-full border border-gray-300 p-2.5 outline-none focus:ring-1 focus:ring-amber-300 transition" required />
            </InputGroup>
            <InputGroup label="Priority (Shop Order)">
              <input type="number" value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full border border-gray-300 p-2.5 outline-none focus:ring-1 focus:ring-amber-300 transition" placeholder="e.g. 10" />
            </InputGroup>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <InputGroup label="Category">
              <select value={category || ""} onChange={(e) => setCategory(e.target.value)} className="w-full border border-gray-300 p-2.5 outline-none bg-white cursor-pointer">
                <option value="">No Category (Unassign)</option>
                {categories?.map(cat => <option key={cat._id} value={cat._id}>{cat.title}</option>)}
              </select>
            </InputGroup>
            <InputGroup label="Gender" required>
              <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full border border-gray-300 p-2.5 outline-none bg-white cursor-pointer" required>
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </InputGroup>
          </div>

          <InputGroup label="Sizes & Inventory">
            <div className="flex justify-end mb-4">
              <button type="button" onClick={() => setSizes([...sizes, { name: "", quantity: "", addOns: [] }])} className="text-[10px] font-bold uppercase border border-black px-4 py-2 hover:bg-black hover:text-white transition">Add Size</button>
            </div>
            <div className="space-y-4">
              {sizes?.map((size, sIdx) => (
                <div key={sIdx} className="p-4 border border-gray-200 bg-gray-50 relative">
                  <button type="button" onClick={() => setSizes(sizes.filter((_, i) => i !== sIdx))} className="absolute top-2 right-2 text-red-500"><X size={16}/></button>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <input placeholder="Size Name" value={size.name} onChange={(e) => { const ns = [...sizes]; ns[sIdx].name = e.target.value; setSizes(ns); }} className="border border-gray-300 p-2 text-sm outline-none bg-white" />
                    <input placeholder="Quantity" type="number" value={size.quantity} onChange={(e) => { const ns = [...sizes]; ns[sIdx].quantity = e.target.value; setSizes(ns); }} className="border border-gray-300 p-2 text-sm outline-none bg-white" />
                  </div>
                  <div className="space-y-2 border-t pt-2">
                    {size.addOns?.map((ao, aIdx) => (
                      <div key={aIdx} className="flex gap-2 items-center">
                        <input placeholder="Add-on detail" value={ao.detail} onChange={(e) => { const ns = [...sizes]; ns[sIdx].addOns[aIdx].detail = e.target.value; setSizes(ns); }} className="grow border p-1.5 text-xs outline-none" />
                        <input placeholder="Price" type="number" value={ao.priceAdjustment} onChange={(e) => { const ns = [...sizes]; ns[sIdx].addOns[aIdx].priceAdjustment = e.target.value; setSizes(ns); }} className="w-20 border p-1.5 text-xs outline-none" />
                        <button type="button" onClick={() => { const ns = [...sizes]; ns[sIdx].addOns.splice(aIdx, 1); setSizes(ns); }}><X size={12} /></button>
                      </div>
                    ))}
                    <button type="button" onClick={() => { const ns = [...sizes]; ns[sIdx].addOns.push({ detail: "", priceAdjustment: "" }); setSizes(ns); }} className="text-[9px] font-bold uppercase text-indigo-600">+ Add Option</button>
                  </div>
                </div>
              ))}
            </div>
          </InputGroup>

          <InputGroup label="Video Management">
            <div className="flex flex-col md:flex-row gap-6 items-center">
               <div className="w-full md:w-1/2 aspect-video bg-gray-100 border border-gray-200 relative overflow-hidden group">
                 { (editingProduct.video && !deleteVideo) ? (
                   <>
                    <video src={editingProduct.video.url} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                       <button type="button" onClick={() => setDeleteVideo(true)} className="p-2 bg-white text-red-600 rounded-full hover:bg-red-50 transition">
                         <Trash2 size={20} />
                       </button>
                    </div>
                   </>
                 ) : (
                   <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-2 border-2 border-dashed border-gray-200">
                     <Video size={32} />
                     <span className="text-[9px] font-bold uppercase">No Video Linked</span>
                   </div>
                 )}
                 {deleteVideo && <div className="absolute inset-0 bg-red-50/80 flex items-center justify-center text-red-600 font-bold text-[10px] uppercase tracking-widest">Marked for Deletion</div>}
               </div>

               <div className="w-full md:w-1/2 space-y-3">
                  <p className="text-[9px] text-gray-400 uppercase font-bold leading-tight">
                    {newVideoFile ? `Selected: ${newVideoFile.name}` : "Upload new video to replace or add to this product."}
                  </p>
                  <label className="flex items-center justify-center gap-2 w-full py-3 border border-black text-[10px] font-bold uppercase tracking-widest hover:bg-black hover:text-white transition cursor-pointer">
                    <Film size={14} />
                    {editingProduct.video ? "Replace Video" : "Upload Video"}
                    <input type="file" accept="video/*" className="hidden" onChange={handleVideoChange} />
                  </label>
                  {newVideoFile && (
                    <button type="button" onClick={() => setNewVideoFile(null)} className="text-[9px] text-red-500 uppercase font-bold underline">Remove Selection</button>
                  )}
               </div>
            </div>
          </InputGroup>

          <InputGroup label="Image Management (Replace or Add)">
            <div className="grid grid-cols-4 gap-3">
              {editingProduct.images?.map((img, idx) => (
                <div key={idx} className={`relative aspect-[3/4] border overflow-hidden group ${deleteIndexes.includes(idx) ? 'opacity-20 grayscale border-red-500' : ''}`}>
                  <Image src={img.url} alt="" fill className="object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                    <label className="cursor-pointer p-1.5 bg-white text-black hover:bg-amber-300 transition">
                      <Upload size={14} /><input type="file" className="hidden" onChange={(e) => handleFileChange(e, idx)} />
                    </label>
                    <button type="button" onClick={() => setDeleteIndexes(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx])} className="p-1.5 bg-white text-red-600 hover:bg-red-50 transition">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 border-t pt-4">
              <label className="block text-[10px] font-bold uppercase mb-2 text-gray-400">Add New Images</label>
              <input type="file" multiple onChange={(e) => handleFileChange(e)} className="text-xs block w-full file:mr-4 file:py-2 file:px-4 file:border file:border-black file:text-[10px] file:font-bold file:uppercase file:bg-white file:text-black hover:file:bg-black hover:file:text-white transition cursor-pointer" />
            </div>
          </InputGroup>
        </div>

        {/* RIGHT COLUMN */}
        <div className="w-full lg:w-[450px] sticky top-24">
          <div className="flex flex-col">
            <div className="border border-gray-300 p-4 bg-white shadow-sm h-full">
              <label className="block text-[10px] uppercase tracking-widest font-bold text-gray-500 mb-2">Description *</label>
              <div className="flex gap-1 mb-3 p-1 border border-gray-200 bg-gray-50">
                <button type="button" onClick={() => applyFormat('bold')} className="p-2 hover:bg-amber-100 transition"><Bold size={16}/></button>
                <button type="button" onClick={() => applyFormat('italic')} className="p-2 hover:bg-amber-100 transition"><Italic size={16}/></button>
                <button type="button" onClick={() => applyFormat('insertUnorderedList')} className="p-2 hover:bg-amber-100 transition"><List size={16}/></button>
              </div>
              <div ref={descriptionRef} contentEditable onInput={handleDescriptionChange} className="min-h-[400px] max-h-[60vh] border border-gray-300 p-3 outline-none focus:ring-1 focus:ring-amber-300 bg-white overflow-y-auto text-sm leading-relaxed" />
            </div>

            <button disabled={isSaving} type="submit" className="w-full mt-5 py-4 bg-black text-white text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-gray-800 transition shadow-xl flex items-center justify-center disabled:bg-gray-400">
              {isSaving ? <Loader2 className="animate-spin mr-2" size={16} /> : <Save className="mr-2" size={16} />}
              Update Product Information
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}