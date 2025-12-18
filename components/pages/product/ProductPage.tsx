"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Check, Loader2, AlertTriangle } from 'lucide-react';

// --- INTERFACES ---
interface ImageObject {
  url: string;
  fileId: string;
}

interface VideoObject extends ImageObject {
  isVideo: true;
}

type MediaObject = ImageObject | VideoObject;

interface Size {
  name: string;
  quantity: number;
  addOns: any[];
  _id: string;
}

interface ProductDetails {
  _id: string;
  title: string;
  description: string;
  price: number;        // Original Price
  totalPrice?: number;  // Discounted Price
  images: ImageObject[];
  video: ImageObject | null;
  sizes: Size[];
  cartLimit: number;
  badges: {
    saveRs?: {
      active: boolean;
      amount: number;
    }
  };
  isSoldOut?: boolean;
}

interface ProductPageProps {
  productId: string;
}

// --- HELPERS ---
const isVideoObject = (media: MediaObject): media is VideoObject => {
  return (media as VideoObject).isVideo === true;
}

const formatPrice = (price: number) => {
  return `Rs ${price ? price.toLocaleString() : "0"}`;
}

export default function ProductPage({ productId }: ProductPageProps) {
  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  
  const mediaRefs = useRef<(HTMLDivElement | null)[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!productId) {
      setError("Invalid product ID.");
      setLoading(false);
      return;
    }

    const fetchProductDetails = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/products/${productId}`);
        if (!res.ok) throw new Error(`Status: ${res.status}`);
        const data = await res.json();
        setProduct(data.product as ProductDetails);
      } catch (err) {
        setError("Could not load product details.");
      } finally {
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [productId]);
  
  const allMedia: MediaObject[] = product ? [
    ...product.images,
    ...(product.video ? [{ ...product.video, isVideo: true as const } as VideoObject] : [])
  ] : [];

  const handleThumbnailClick = (index: number) => {
    const target = mediaRefs.current[index];
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveMediaIndex(index);
    }
  };
  
  const setupIntersectionObserver = useCallback(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const index = mediaRefs.current.findIndex(ref => ref === entry.target);
            if (index !== -1) setActiveMediaIndex(index);
          }
        });
      },
      { root: null, threshold: 0.6 }
    );

    mediaRefs.current.forEach(ref => { if (ref) observer.observe(ref); });
    return () => observer.disconnect();
  }, [allMedia.length]);

  useEffect(() => {
    if (allMedia.length > 0) {
      const cleanup = setupIntersectionObserver();
      return cleanup;
    }
  }, [allMedia.length, setupIntersectionObserver]);

  if (loading) return (
    <div className="flex justify-center items-center h-[50vh]">
      <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
    </div>
  );

  if (error || !product) return (
    <div className="flex flex-col items-center justify-center h-[50vh] text-center p-8">
      <AlertTriangle className="w-10 h-10 text-red-500 mb-4" />
      <p className="text-gray-600">{error || "Product unavailable."}</p>
    </div>
  );
  
  const { title, price, totalPrice, sizes, description, isSoldOut, cartLimit, badges } = product;
  const isSaversActive = badges?.saveRs?.active && (badges?.saveRs?.amount || 0) > 0;
  const saversAmount = badges?.saveRs?.amount;

  return (
    <div className="max-w-[1440px] mx-auto md:px-6 lg:px-24 py-0 md:py-10">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-y-0 md:gap-x-10 items-start">
        
        {/* === COLUMN 1: FIXED THUMBNAILS (Desktop Only) === */}
        <div className="hidden md:block md:col-span-1 min-h-screen">
          <div className="flex flex-col gap-3 fixed top-32 w-[60px]">
            {allMedia.map((media, index) => (
              <div 
                key={index}
                onClick={() => handleThumbnailClick(index)}
                className={`relative w-full aspect-3/4 cursor-pointer border transition-all duration-300 overflow-hidden ${
                  activeMediaIndex === index ? 'border-black opacity-100 ring-1 ring-black' : 'border-gray-100 opacity-60 hover:opacity-100'
                }`}
              >
                {!isVideoObject(media) ? (
                  <Image src={media.url} alt="thumb" fill className="object-cover" />
                ) : (
                   <div className="w-full h-full bg-gray-100 flex items-center justify-center text-[8px] uppercase font-bold text-gray-400">Video</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* === COLUMN 2: MAIN MEDIA (Horizontal Mobile / Vertical Desktop) === */}
        <div className="col-span-1 md:col-span-6 relative">
          <div 
            ref={scrollContainerRef}
            className="flex md:flex-col overflow-x-auto md:overflow-x-hidden snap-x snap-mandatory no-scrollbar"
          >
            {allMedia.map((media, index) => (
              <div 
                key={index}
                ref={(el) => { mediaRefs.current[index] = el; }}
                className="min-w-full md:min-w-0 w-full aspect-3/4 relative bg-gray-50 snap-center md:mb-6 scroll-mt-32"
              >
                {isVideoObject(media) ? (
                  <video 
                    src={media.url} 
                    autoPlay muted loop playsInline 
                    preload="metadata"
                    poster={product.images[0]?.url}
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <Image
                    src={media.url}
                    alt={`${title} view ${index + 1}`}
                    fill
                    priority={index === 0}
                    className="object-cover"
                  />
                )}
                
                {/* SAVERS BADGE ON EVERY IMAGE */}
                {isSaversActive && (
                   <div className="absolute top-4 left-4 z-20 bg-red-600 text-white text-[11px] font-bold px-2 py-1 uppercase shadow-md tracking-tighter">
                     SAVERS {saversAmount}
                   </div>
                )}

                {index === 0 && isSoldOut && (
                  <span className="absolute bottom-4 left-4 bg-white/90 px-3 py-1 text-xs font-bold uppercase tracking-widest text-gray-500">
                    Sold Out
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* DOTS (MOBILE ONLY) */}
          <div className="flex md:hidden justify-center items-center gap-1.5 py-4">
            {allMedia.map((_, index) => (
              <div key={index} className={`transition-all duration-300 rounded-full ${activeMediaIndex === index ? 'w-5 h-1 bg-black' : 'w-1 h-1 bg-gray-300'}`} />
            ))}
          </div>
        </div>

        {/* === COLUMN 3: DETAILS (Sticky Desktop) === */}
        <div className="col-span-1 md:col-span-5 px-5 md:px-0">
          <div className="md:sticky md:top-32 space-y-6 md:space-y-8">
            <div>
              <h1 className="text-xl md:text-2xl font-mono tracking-wider uppercase text-gray-900 leading-tight">{title}</h1>
              <div className="mt-2 flex items-center gap-3">
                {isSaversActive && totalPrice ? (
                  <>
                    <p className="text-lg text-red-600 font-bold">{formatPrice(totalPrice)}</p>
                    <p className="text-sm text-gray-400 line-through mt-1">{formatPrice(price)}</p>
                  </>
                ) : (
                  <p className="text-lg text-gray-600 font-light">{formatPrice(price)}</p>
                )}
              </div>
            </div>

            {/* Size Selector */}
            <div>
              <span className="block text-xs font-bold uppercase tracking-widest text-gray-800 mb-4">Size</span>
              <div className="flex flex-wrap gap-3">
                {sizes.map(size => (
                  <button
                    key={size._id}
                    onClick={() => setSelectedSize(size.name)}
                    disabled={size.quantity === 0}
                    className={`w-12 h-12 flex items-center justify-center text-sm border transition-all duration-200 ${
                      size.quantity === 0 
                        ? 'opacity-30 cursor-not-allowed bg-gray-50 line-through' 
                        : selectedSize === size.name
                          ? 'border-black bg-black text-white'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-black'
                    }`}
                  >
                    {size.name}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="space-y-3">
              <button
                disabled={!selectedSize || isSoldOut}
                className={`w-full py-4 text-xs font-bold uppercase tracking-[0.2em] border transition-colors ${
                  isSoldOut 
                    ? 'bg-gray-100 text-gray-400 border-gray-100 cursor-not-allowed'
                    : 'bg-white text-gray-900 border-gray-300 hover:bg-black hover:text-white'
                }`}
              >
                {isSoldOut ? 'Sold Out' : 'Add to Cart'}
              </button>
              {!isSoldOut && (
                <button className="w-full py-4 text-xs font-bold uppercase tracking-[0.2em] bg-[#5a31f4] text-white shadow-sm">
                  Buy with Shop
                </button>
              )}
            </div>
            
            <div className="pt-6 border-t border-gray-100 pb-20 md:pb-0">
              <div 
                className="text-sm text-gray-600 leading-7 font-light prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: description }}
              />
              {cartLimit > 0 && <p className="mt-4 text-xs text-gray-400 italic">Limit: {cartLimit} per customer</p>}
            </div>
          </div>
        </div>

      </div>
      
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}