"use client";

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Loader2, AlertTriangle, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface ImageObject { url: string; fileId: string; }
interface VideoObject extends ImageObject { isVideo: true; }
type MediaObject = ImageObject | VideoObject;

interface Size {
  name: string;
  quantity: number;
  _id: string;
}

interface ProductDetails {
  _id: string;
  title: string;
  description: string;
  price: number;
  totalPrice?: number;
  images: ImageObject[];
  video: ImageObject | null;
  sizes: Size[];
  cartLimit: number;
  badges: { saveRs?: { active: boolean; amount: number; } };
  isSoldOut?: boolean;
}

interface ProductPageProps { productId: string; }

const isVideoObject = (media: MediaObject): media is VideoObject => (media as VideoObject).isVideo === true;
const formatPrice = (price: number) => `Rs ${price ? price.toLocaleString() : "0"}`;

export default function ProductPage({ productId }: ProductPageProps) {
  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [isAdding, setIsAdding] = useState(false);
  
  const mediaRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        const res = await fetch(`/api/products/${productId}`);
        const data = await res.json();
        setProduct(data.product);
      } catch (err) {
        setError("Product unavailable.");
      } finally {
        setLoading(false);
      }
    };
    fetchProductDetails();
  }, [productId]);

  const handleAddToCart = () => {
    if (!selectedSize) {
      toast.error("Please select a size", {
        position: "bottom-center",
        autoClose: 2000,
        theme: "dark",
        hideProgressBar: true,
      });
      return;
    }

    setIsAdding(true);
    
    const cartItem = {
      id: product?._id,
      title: product?.title,
      price: product?.totalPrice || product?.price,
      size: selectedSize,
      image: product?.images[0]?.url,
      quantity: 1
    };

    const currentCart = JSON.parse(localStorage.getItem('cart') || '[]');
    localStorage.setItem('cart', JSON.stringify([...currentCart, cartItem]));

    // Update Navbar instantly
    window.dispatchEvent(new Event("cartUpdated"));

    setTimeout(() => {
      setIsAdding(false);
      toast.success("Added to Bag", { position: "bottom-center", theme: "dark" });
    }, 500);
  };

  const handleThumbnailClick = (index: number) => {
    mediaRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveMediaIndex(index);
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-gray-300" /></div>;

  const allMedia: MediaObject[] = product ? [...product.images, ...(product.video ? [{ ...product.video, isVideo: true as const }] : [])] : [];

  return (
    <div className="max-w-[1440px] mx-auto md:px-6 lg:px-24 py-0 md:py-10">
      <ToastContainer />
      <div className="grid grid-cols-1 md:grid-cols-12 gap-y-0 md:gap-x-10 items-start">
        
        {/* STICKY THUMBNAILS */}
        <div className="hidden md:block md:col-span-1 min-h-screen">
          <div className="flex flex-col gap-3 fixed top-32 w-[70px]">
            {allMedia.map((media, index) => (
              <div 
                key={index}
                onClick={() => handleThumbnailClick(index)}
                className={`relative aspect-[3/4] cursor-pointer border transition-all duration-300 overflow-hidden ${
                  activeMediaIndex === index ? 'border-black opacity-100 ring-1 ring-black' : 'border-gray-100 opacity-50 hover:opacity-100'
                }`}
              >
                {!isVideoObject(media) ? (
                  <Image src={media.url} alt="thumb" fill className="object-cover" />
                ) : (
                   <div className="w-full h-full bg-gray-100 flex items-center justify-center text-[8px] font-bold">VIDEO</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* MAIN MEDIA */}
        <div className="col-span-1 md:col-span-6">
          <div className="flex md:flex-col overflow-x-auto md:overflow-hidden snap-x snap-mandatory no-scrollbar">
            {allMedia.map((media, index) => (
              <div 
                key={index}
                ref={(el) => { mediaRefs.current[index] = el; }}
                className="min-w-full w-full aspect-[3/4] relative bg-gray-50 snap-center md:mb-6"
              >
                {isVideoObject(media) ? (
                  <video src={media.url} autoPlay muted loop playsInline className="w-full h-full object-cover" />
                ) : (
                  <Image src={media.url} alt="product" fill priority={index === 0} className="object-cover" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* DETAILS SECTION */}
        <div className="col-span-1 md:col-span-5 px-5 md:px-0">
          <div className="md:sticky md:top-32 space-y-8">
            <div>
              <h1 className="text-2xl font-serif italic tracking-tight text-gray-900 uppercase">{product?.title}</h1>
              <div className="mt-2 flex items-center gap-4">
                <p className="text-xl font-mono font-bold text-gray-900">{formatPrice(product?.totalPrice || product?.price || 0)}</p>
                {product?.badges?.saveRs?.active && (
                  <p className="text-sm text-gray-400 line-through font-mono">{formatPrice(product.price)}</p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Select Size</span>
              <div className="flex flex-wrap gap-2">
                {product?.sizes.map(size => (
                  <button
                    key={size._id}
                    onClick={() => setSelectedSize(size.name)}
                    disabled={size.quantity === 0}
                    className={`w-14 h-14 flex items-center justify-center text-xs border transition-all ${
                      size.quantity === 0 ? 'opacity-20 cursor-not-allowed' :
                      selectedSize === size.name ? 'border-black bg-black text-white' : 'border-gray-200 hover:border-black'
                    }`}
                  >
                    {size.name}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="pt-4">
              <motion.button
                whileHover={{ scale: 1.02, backgroundColor: "#1a1a1a" }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAddToCart}
                disabled={product?.isSoldOut || isAdding}
                className="w-full py-5 bg-black text-white text-[11px] font-bold uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all shadow-xl hover:shadow-2xl"
              >
                {isAdding ? <Loader2 className="animate-spin" size={16} /> : (
                  <>
                    <ShoppingBag size={16} />
                    {product?.isSoldOut ? 'Sold Out' : 'Add to Bag'}
                  </>
                )}
              </motion.button>
            </div>
            
            <div className="pt-8 border-t border-gray-100 pb-10">
              <div 
                className="text-sm text-gray-600 leading-8 prose prose-neutral max-w-none"
                dangerouslySetInnerHTML={{ __html: product?.description || '' }}
              />
            </div>
          </div>
        </div>
      </div>
      <style jsx global>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
    </div>
  );
}