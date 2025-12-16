"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { 
  Plus, X, Bold, Italic, List, ListOrdered, 
  Loader2, ArrowLeft, Save, Trash2, Upload
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
  sizes: Size[];
}

const InputGroup: React.FC<{ label: string; children: React.ReactNode; required?: boolean }> = ({ label, children, required = false }) => (
  <div className="border border-gray-300 rounded-lg p-4 bg-white shadow-sm">
    <label className="block text-sm font-semibold text-gray-700 mb-2">
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

  // Form States
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<string>("");
  const [category, setCategory] = useState("");
  const [gender, setGender] = useState("");
  const [priority, setPriority] = useState<string>("");
  const [cartLimit, setCartLimit] = useState<string>("1");
  const [sizes, setSizes] = useState<Size[]>([]);
  
  const [deleteIndexes, setDeleteIndexes] = useState<number[]>([]);
  const [replaceIndexes, setReplaceIndexes] = useState<number[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);

  const descriptionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

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
    setDeleteIndexes([]);
    setReplaceIndexes([]);
    setNewFiles([]);

    setTimeout(() => {
      if (descriptionRef.current) {
        descriptionRef.current.innerHTML = product.description || "";
      }
    }, 0);
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

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setIsSaving(true);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("price", price);
      formData.append("category", category);
      formData.append("gender", gender);
      formData.append("priority", priority);
      formData.append("cartLimit", cartLimit);
      formData.append("sizes", JSON.stringify(sizes));
      formData.append("deleteIndexes", JSON.stringify(deleteIndexes));
      formData.append("replaceIndexes", JSON.stringify(replaceIndexes));
      newFiles.forEach(file => formData.append("images", file));

      const res = await fetch(`/api/products/${editingProduct._id}`, {
        method: "PATCH",
        body: formData,
      });

      if (res.ok) {
        alert("Product updated!");
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

  if (!editingProduct) {
    return (
      <div className="p-6">
        <h1 className="text-sm tracking-widest font-bold mb-8 uppercase text-gray-500">Select Product to Edit</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 text-center">
          {products?.map((prod) => (
            <div key={prod._id} onClick={() => handleEditClick(prod)} className="group cursor-pointer">
              <div className="relative aspect-[3/4] overflow-hidden bg-gray-100 mb-2">
                <Image src={prod.images?.[0]?.url || ""} alt="" fill className="object-cover group-hover:scale-105 transition duration-500" />
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
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border border-gray-300 rounded-md p-2.5 outline-none focus:ring-2 focus:ring-amber-300 transition" required />
          </InputGroup>

          <div className="grid grid-cols-2 gap-4">
            <InputGroup label="Price (Rs)" required>
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full border border-gray-300 rounded-md p-2.5 outline-none focus:ring-2 focus:ring-amber-300 transition" required />
            </InputGroup>
            <InputGroup label="Cart Limit" required>
              <input type="number" value={cartLimit} onChange={(e) => setCartLimit(e.target.value)} className="w-full border border-gray-300 rounded-md p-2.5 outline-none focus:ring-2 focus:ring-amber-300 transition" required />
            </InputGroup>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <InputGroup label="Category">
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full border border-gray-300 rounded-md p-2.5 outline-none bg-white">
                <option value="">No Category</option>
                {categories?.map(cat => <option key={cat._id} value={cat._id}>{cat.title}</option>)}
              </select>
            </InputGroup>
            <InputGroup label="Gender">
              <select value={gender} onChange={(e) => setGender(e.target.value)} className="w-full border border-gray-300 rounded-md p-2.5 outline-none bg-white">
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
                <div key={sIdx} className="p-4 border border-gray-200 rounded-lg bg-gray-50 relative">
                  <button type="button" onClick={() => setSizes(sizes.filter((_, i) => i !== sIdx))} className="absolute top-2 right-2 text-red-500"><X size={16}/></button>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <input placeholder="Size Name" value={size.name} onChange={(e) => { const ns = [...sizes]; ns[sIdx].name = e.target.value; setSizes(ns); }} className="border border-gray-300 rounded-md p-2 text-sm outline-none bg-white" />
                    <input placeholder="Quantity" type="number" value={size.quantity} onChange={(e) => { const ns = [...sizes]; ns[sIdx].quantity = e.target.value; setSizes(ns); }} className="border border-gray-300 rounded-md p-2 text-sm outline-none bg-white" />
                  </div>
                  <div className="space-y-2 border-t pt-2">
                    {size.addOns?.map((ao, aIdx) => (
                      <div key={aIdx} className="flex gap-2 items-center">
                        <input placeholder="Add-on detail" value={ao.detail} onChange={(e) => { const ns = [...sizes]; ns[sIdx].addOns[aIdx].detail = e.target.value; setSizes(ns); }} className="grow border rounded p-1.5 text-xs" />
                        <input placeholder="Price" type="number" value={ao.priceAdjustment} onChange={(e) => { const ns = [...sizes]; ns[sIdx].addOns[aIdx].priceAdjustment = e.target.value; setSizes(ns); }} className="w-20 border rounded p-1.5 text-xs" />
                        <button type="button" onClick={() => { const ns = [...sizes]; ns[sIdx].addOns.splice(aIdx, 1); setSizes(ns); }}><X size={12} /></button>
                      </div>
                    ))}
                    <button type="button" onClick={() => { const ns = [...sizes]; ns[sIdx].addOns.push({ detail: "", priceAdjustment: "" }); setSizes(ns); }} className="text-[9px] font-bold uppercase text-indigo-600">+ Add Option</button>
                  </div>
                </div>
              ))}
            </div>
          </InputGroup>

          <InputGroup label="Image Management (Replace or Add)">
            <div className="grid grid-cols-4 gap-3">
              {editingProduct.images?.map((img, idx) => (
                <div key={idx} className={`relative aspect-[3/4] border rounded-md overflow-hidden group ${deleteIndexes.includes(idx) ? 'opacity-20 grayscale border-red-500' : ''}`}>
                  <Image src={img.url} alt="" fill className="object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                    <label className="cursor-pointer p-1 bg-white rounded-full text-black hover:bg-amber-300 transition">
                      <Upload size={14} /><input type="file" className="hidden" onChange={(e) => handleFileChange(e, idx)} />
                    </label>
                    <button type="button" onClick={() => setDeleteIndexes(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx])} className="p-1 bg-white rounded-full text-red-600 hover:bg-red-100 transition">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 border-t pt-4">
              <label className="block text-xs font-bold uppercase mb-2">Add New Images</label>
              <input type="file" multiple onChange={(e) => handleFileChange(e)} className="text-xs block w-full file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
            </div>
          </InputGroup>
        </div>

        {/* RIGHT COLUMN: STICKY DESCRIPTION & SAVE */}
        <div className="w-full lg:w-[450px] sticky top-36">
          <div className="flex flex-col">
            <div className="border border-gray-300 rounded-lg p-4 bg-white shadow-sm h-full">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Description *</label>
              <div className="flex gap-2 mb-3 p-2 border border-gray-300 rounded-md bg-gray-50">
                <button type="button" onClick={() => applyFormat('bold')} className="p-2 hover:bg-gray-200 rounded transition"><Bold size={18}/></button>
                <button type="button" onClick={() => applyFormat('italic')} className="p-2 hover:bg-gray-200 rounded transition"><Italic size={18}/></button>
                <button type="button" onClick={() => applyFormat('insertUnorderedList')} className="p-2 hover:bg-gray-200 rounded transition"><List size={18}/></button>
                <button type="button" onClick={() => applyFormat('insertOrderedList')} className="p-2 hover:bg-gray-200 rounded transition"><ListOrdered size={18}/></button>
              </div>
              <div 
                ref={descriptionRef} 
                contentEditable 
                onInput={handleDescriptionChange} 
                className="min-h-[400px] max-h-[60vh] border border-gray-300 rounded-md p-3 outline-none focus:ring-2 focus:ring-amber-300 bg-white overflow-y-auto text-sm leading-relaxed" 
              />
            </div>

            <button 
              disabled={isSaving} 
              type="submit"
              className="w-full mt-5 py-4 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition shadow-xl flex items-center justify-center disabled:bg-gray-400"
            >
              {isSaving ? <Loader2 className="animate-spin mr-2" size={16} /> : <Save className="mr-2" size={16} />}
              Update Product Information
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}