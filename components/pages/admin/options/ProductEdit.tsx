"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { 
  Plus, X, Bold, Italic, List, ListOrdered, 
  Loader2, ArrowLeft, Save, Trash2 
} from "lucide-react";

// --- Types ---
interface Media {
  url: string;
  fileId: string;
}

interface Size {
  name: string;
  quantity: number | string;
  addOns: { detail: string; priceAdjustment: number | string }[];
}

interface Product {
  _id: string;
  title: string;
  description: string;
  price: number;
  images: Media[];
  video?: Media | null;
  category: string;
  gender: string;
  sizes: Size[];
  priority: number | "";
  cartLimit: number;
}

export default function ProductEdit() {
  // Navigation State
  const [products, setProducts] = useState<Product[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form State (mirrors ProductAdd)
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<string>("");
  const [category, setCategory] = useState("");
  const [gender, setGender] = useState("Male");
  const [priority, setPriority] = useState<string>("");
  const [cartLimit, setCartLimit] = useState<string>("10");
  const [sizes, setSizes] = useState<Size[]>([]);
  
  // Media State
  const [existingImages, setExistingImages] = useState<Media[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [deleteIndexes, setDeleteIndexes] = useState<number[]>([]);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [deleteVideo, setDeleteVideo] = useState(false);

  const descriptionRef = useRef<HTMLDivElement>(null);

  // 1. Fetch All Products for the Grid
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/products/get");
      const data = await res.json();
      setProducts(data.products || []);
    } catch (err) {
      console.error("Failed to fetch products", err);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Load Product into Editor
  const handleEditClick = (product: Product) => {
    setEditingProduct(product);
    setTitle(product.title);
    setDescription(product.description);
    setPrice(product.price.toString());
    setCategory(product.category || "");
    setGender(product.gender || "Male");
    setPriority(product.priority?.toString() || "");
    setCartLimit(product.cartLimit?.toString() || "10");
    setSizes(product.sizes);
    setExistingImages(product.images);
    setDeleteIndexes([]);
    setNewImages([]);
    setDeleteVideo(false);
    
    // Set rich text content after state update
    setTimeout(() => {
      if (descriptionRef.current) {
        descriptionRef.current.innerHTML = product.description;
      }
    }, 0);
  };

  // 3. Handle Update (PATCH)
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
      
      newImages.forEach(file => formData.append("images", file));
      if (videoFile) formData.append("videoFile", videoFile);
      if (deleteVideo) formData.append("deleteVideo", "true");

      const res = await fetch(`/api/products/${editingProduct._id}`, {
        method: "PATCH",
        body: formData,
      });

      if (res.ok) {
        alert("Product updated successfully!");
        setEditingProduct(null);
        fetchProducts();
      } else {
        const err = await res.json();
        alert(err.error || "Update failed");
      }
    } catch (err) {
      alert("An error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  // --- Grid View Render ---
  if (!editingProduct) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Select Product to Edit</h1>
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {products.map((prod) => (
              <div 
                key={prod._id} 
                onClick={() => handleEditClick(prod)}
                className="group cursor-pointer border rounded-lg overflow-hidden hover:shadow-md transition bg-white"
              >
                <div className="relative aspect-[3/4] bg-gray-100">
                  <Image 
                    src={prod.images[0]?.url || "/placeholder.png"} 
                    alt={prod.title} 
                    fill 
                    className="object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <div className="p-2">
                  <p className="text-xs font-semibold truncate uppercase">{prod.title}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // --- Edit Form Render (Simplified for brevity, use your ProductAdd styles here) ---
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <button 
        onClick={() => setEditingProduct(null)}
        className="flex items-center text-sm text-gray-500 hover:text-black mb-6"
      >
        <ArrowLeft size={16} className="mr-2" /> Back to Products
      </button>

      <form onSubmit={handleUpdate} className="space-y-8">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Editing: {editingProduct.title}</h2>
          <button 
            type="submit" 
            disabled={isSaving}
            className="bg-black text-white px-6 py-2 rounded-md flex items-center disabled:bg-gray-400"
          >
            {isSaving ? <Loader2 className="animate-spin mr-2" size={18} /> : <Save className="mr-2" size={18} />}
            Save Changes
          </button>
        </div>

        {/* Title & Price */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input 
            className="border p-3 rounded" 
            placeholder="Product Title"
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
          />
          <input 
            className="border p-3 rounded" 
            type="number" 
            placeholder="Price"
            value={price} 
            onChange={(e) => setPrice(e.target.value)} 
          />
        </div>

        {/* Description (Rich Text) */}
        <div className="border rounded-md overflow-hidden bg-white">
           {/* Include your Toolbar components here from ProductAdd.tsx */}
           <div 
             ref={descriptionRef}
             contentEditable
             onInput={(e) => setDescription(e.currentTarget.innerHTML)}
             className="min-h-[300px] p-4 outline-none"
           />
        </div>

        {/* Media Management */}
        <div className="space-y-4">
          <label className="font-bold text-sm">Product Images (Max 12)</label>
          <div className="flex flex-wrap gap-4">
            {/* Existing Images */}
            {existingImages.map((img, idx) => (
              <div key={img.fileId} className={`relative w-24 h-32 border rounded ${deleteIndexes.includes(idx) ? 'opacity-30' : ''}`}>
                <Image src={img.url} alt="product" fill className="object-cover" />
                <button 
                  type="button"
                  onClick={() => setDeleteIndexes(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx])}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            {/* Add more logic here for New Images & Video similarly to ProductAdd */}
          </div>
        </div>

        {/* Sizes & Add-ons (Reusable logic from ProductAdd) */}
        {/* ... */}
      </form>
    </div>
  );
}