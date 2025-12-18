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
  price: number;      // Original Price
  totalPrice: number; // Final Price (from DB)
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

// --- TYPE GUARDS & HELPERS ---
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
        if (res.status === 404) {
          setError("Product not found.");
          return;
        }
        if (!res.ok) throw new Error(`Status: ${res.status}`);
        
        const data = await res.json();
        setProduct(data.product as ProductDetails);
      } catch (err) {
        console.error("Error fetching product:", err);
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
            if (index !== -1) {
              setActiveMediaIndex(index);
            }
          }
        });
      },
      {
        root: null,
        rootMargin: '-40% 0px -40% 0px',
        threshold: 0.2, 
      }
    );

    mediaRefs.current.forEach(ref => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [allMedia.length]);

  useEffect(() => {
    if (allMedia.length > 0) {
      const cleanup = setupIntersectionObserver();
      return cleanup;
    }
  }, [allMedia.length, setupIntersectionObserver]);

  const handleAddToCart = () => {
    if (!selectedSize) {
      alert("Please select a size first.");
      return;
    }
    console.log(`Added ${product?.title} size ${selectedSize}`);
  };

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
  
  // Sale Logic
  const isSaversActive = badges?.saveRs?.active && (badges?.saveRs?.amount || 0) > 0;
  const saversAmount = badges?.saveRs?.amount;

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-24 py-10">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-y-10 md:gap-x-10 items-start">
        
        {/* === COLUMN 1: STICKY THUMBNAILS === */}
        <div className="hidden md:block md:col-span-1">
          <div className="flex flex-col gap-3 fixed top-32">
            {allMedia.map((media, index) => (
              <div 
                key={index}
                onClick={() => handleThumbnailClick(index)}
                className={`
                  relative w-[60px] aspect-3/4 cursor-pointer 
                  border transition-all duration-300 overflow-hidden
                  ${activeMediaIndex === index ? 'border-black opacity-100 ring-1 ring-black' : 'border-gray-100 opacity-60 hover:opacity-100'}
                `}
              >
                {isVideoObject(media) ? (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center text-[8px] uppercase font-bold text-gray-400">
                    Video
                  </div>
                ) : (
                  <Image
                    src={media.url}
                    alt={`Thumbnail ${index}`}
                    fill
                    className="object-cover"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* === COLUMN 2: MAIN IMAGES (Vertical Flow) === */}
        <div className="col-span-1 md:col-span-6 flex flex-col gap-4 md:gap-6">
          {allMedia.map((media, index) => (
            <div 
              key={index}
              className="w-full aspect-3/4 relative bg-gray-50 scroll-mt-32"
              ref={(el) => { mediaRefs.current[index] = el; }}
            >
              {isVideoObject(media) ? (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <p className="text-gray-400 text-sm font-medium">Video Content</p>
                </div>
              ) : (
                <Image
                  src={media.url}
                  alt={`${title} view ${index + 1}`}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority={index === 0}
                  className="object-cover"
                />
              )}
              
              {/* SAVERS BADGE ON MAIN IMAGE */}
              {index === 0 && isSaversActive && (
                 <div className="absolute top-4 left-4 z-20 bg-red-600 text-white text-[11px] font-bold px-2 py-1 tracking-tighter uppercase shadow-sm">
                    SAVERS {saversAmount}
                 </div>
              )}

              {index === 0 && isSoldOut && (
                <span className={`absolute bottom-4 left-4 bg-white/90 px-3 py-1 text-xs font-bold uppercase tracking-widest text-gray-500`}>
                  Sold Out
                </span>
              )}
            </div>
          ))}
        </div>

        {/* === COLUMN 3: PRODUCT DETAILS (Sticky Right) === */}
        <div className="col-span-1 md:col-span-5 relative">
          <div className="sticky top-32 space-y-8">
            <div>
              <h1 className="text-2xl font-mono tracking-wider uppercase text-gray-900">
                {title}
              </h1>
              <div className="mt-2 flex items-center gap-3">
                {isSaversActive ? (
                  <>
                    <p className="text-lg text-red-600 font-bold">
                      {formatPrice(totalPrice)}
                    </p>
                    <p className="text-sm text-gray-400 line-through mt-1">
                      {formatPrice(price)}
                    </p>
                  </>
                ) : (
                  <p className="text-lg text-gray-600 font-light">
                    {formatPrice(totalPrice || price)}
                  </p>
                )}
              </div>
            </div>

            {/* Size Selector */}
            <div>
              <span className="block text-xs font-bold uppercase tracking-widest text-gray-800 mb-4">
                Size
              </span>
              <div className="flex flex-wrap gap-3">
                {sizes.map(size => (
                  <button
                    key={size._id || size.name}
                    onClick={() => setSelectedSize(size.name)}
                    disabled={size.quantity === 0}
                    className={`
                      w-12 h-12 flex items-center justify-center text-sm border transition-all duration-200
                      ${size.quantity === 0 
                        ? 'opacity-30 cursor-not-allowed bg-gray-50 line-through' 
                        : selectedSize === size.name
                          ? 'border-black bg-black text-white'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-black'
                      }
                    `}
                  >
                    {size.name}
                  </button>
                ))}
              </div>
              
              {selectedSize && (
                <div className="mt-3 text-xs text-green-700 flex items-center gap-1">
                  <span className="flex items-center gap-1"><Check size={12} /> Selected: <span className="font-semibold">{selectedSize}</span></span>
                </div>
              )}
            </div>
            
            <div className="space-y-3">
              <button
                onClick={handleAddToCart}
                disabled={!selectedSize || isSoldOut}
                className={`w-full py-4 text-xs font-bold uppercase tracking-[0.2em] border transition-colors ${
                  isSoldOut 
                    ? 'bg-gray-100 text-gray-400 border-gray-100 cursor-not-allowed'
                    : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50 hover:border-gray-900'
                }`}
              >
                {isSoldOut ? 'Sold Out' : 'Add to Cart'}
              </button>

              {!isSoldOut && (
                <button
                  className="w-full py-4 text-xs font-bold uppercase tracking-[0.2em] bg-[#5a31f4] hover:bg-[#4825c9] text-white shadow-sm"
                >
                  Buy with Shop
                </button>
              )}
            </div>
            
            {/* Description Area */}
            <div className="pt-6 border-t border-gray-100">
              <div 
                className="text-sm text-gray-600 leading-7 font-light prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: description }}
              />
              
              <div className="mt-6 space-y-2 text-sm text-gray-500 font-light">
                {cartLimit > 0 && (
                  <p>Limit: <span className="text-gray-900 font-normal">{cartLimit} per customer</span></p>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}