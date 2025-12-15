// components/pages/product/ProductPage.tsx
"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Ruler, Check, ChevronDown, Loader2, AlertTriangle } from 'lucide-react';

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
  price: number;
  images: ImageObject[];
  video: ImageObject | null;
  sizes: Size[];
  cartLimit: number;
  badges: any;
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
  return `Rs ${price ? price.toLocaleString() : "N/A"}`;
}

export default function ProductPage({ productId }: ProductPageProps) {
  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  
  // Refs for scroll handling
  const mediaRefs = useRef<(HTMLDivElement | null)[]>([]);

  // --- DATA FETCHING ---
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
  
  // --- MEDIA PREPARATION ---
  // MODIFIED: Removed the check/inclusion for video property logic if null
  // If product.video exists, we add it. If not, we just spread images.
  const allMedia: MediaObject[] = product ? [
    ...product.images,
    ...(product.video ? [{ ...product.video, isVideo: true as const } as VideoObject] : [])
  ] : [];

  // --- SCROLL & INTERACTION LOGIC ---

  // 1. Scroll to image when thumbnail is clicked
  const handleThumbnailClick = (index: number) => {
    const target = mediaRefs.current[index];
    if (target) {
        // 'scroll-mt-32' class on the element handles the offset
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setActiveMediaIndex(index);
    }
  };
  
  // 2. Observer: Updates active thumbnail as you scroll the PAGE
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
        root: null, // null = viewport
        rootMargin: '-40% 0px -40% 0px', // Trigger when image is in the middle 20% of screen
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

  // --- ADD TO CART HANDLER ---
  const handleAddToCart = () => {
    if (!selectedSize) {
      alert("Please select a size first.");
      return;
    }
    // Logic here
    console.log(`Added ${product?.title} size ${selectedSize}`);
  };

  // --- RENDERING STATES ---
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
  
  const { title, price, sizes, description, isSoldOut, cartLimit } = product;
  
  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-42 py-10">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-y-10 md:gap-x-10 items-start">
        
        {/* === COLUMN 1: THUMBNAILS (Sticky Left) === */}
        <div className="hidden md:block md:col-span-1">
          <div className="sticky top-32 flex flex-col gap-4">
            {allMedia.map((media, index) => (
              <div 
                key={index}
                onClick={() => handleThumbnailClick(index)}
                className={`
                    relative w-full aspect-[3/4] cursor-pointer 
                    border transition-all duration-300
                    ${activeMediaIndex === index ? 'border-black opacity-100 ring-1 ring-black' : 'border-transparent opacity-60 hover:opacity-100'}
                `}
              >
                {isVideoObject(media) ? (
                    <div className="w-full h-full bg-black text-white flex items-center justify-center text-[10px] uppercase font-bold">
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

        {/* === COLUMN 2: MAIN IMAGES (Natural Flow) === */}
        {/* Removed max-h and overflow-y-auto. Now allows full page scroll. */}
        <div className="col-span-1 md:col-span-6 flex flex-col gap-4 md:gap-8">
            {allMedia.map((media, index) => (
                <div 
                    key={index}
                    // scroll-mt-32 ensures the header doesn't cover the image when scrolling
                    className="w-full aspect-[3/4] relative bg-gray-50 scroll-mt-32"
                    ref={(el: HTMLDivElement | null): void => { mediaRefs.current[index] = el; }}
                >
                    {isVideoObject(media) ? (
                        <div className="w-full h-full flex items-center justify-center bg-gray-200">
                             <p className="text-gray-500 font-medium">Video Player Placeholder</p>
                        </div>
                    ) : (
                        <Image
                            src={media.url}
                            alt={`${title} view ${index + 1}`}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            priority={index === 0}
                            className="object-cover"
                        />
                    )}
                    
                    {/* Sold Out Badge on First Image */}
                    {index === 0 && isSoldOut && (
                        <span className="absolute top-4 left-4 bg-white/90 px-3 py-1 text-xs font-bold uppercase tracking-widest text-gray-500">
                            Sold Out
                        </span>
                    )}
                </div>
            ))}
        </div>

        {/* === COLUMN 3: PRODUCT DETAILS (Sticky Right) === */}
        {/* sticky top-32 keeps it pinned while you scroll the images */}
        <div className="col-span-1 md:col-span-5 relative">
          <div className="sticky top-32 space-y-8">
            
            {/* Header */}
            <div>
                <h1 className="text-2xl font-mono tracking-wider uppercase text-gray-900 navItems">
                    {title}
                </h1>
                <p className="mt-2 text-lg text-gray-600 font-light">
                    {formatPrice(price)}
                </p>
            </div>

            {/* Size Selector */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold uppercase tracking-widest text-gray-800">
                  Size
                </span>
              </div>
              
              <div className="flex flex-wrap gap-3">
                {sizes.map(size => (
                  <button
                    key={size._id || size.name}
                    onClick={() => setSelectedSize(size.name)}
                    disabled={size.quantity === 0}
                    className={`
                        w-12 h-12 flex items-center justify-center text-sm border transition-all duration-200
                        ${size.quantity === 0 
                            ? 'opacity-40 cursor-not-allowed bg-gray-50 decoration-slate-500 line-through' 
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
                  <div className="mt-3 text-xs text-green-700 flex items-center gap-1 animate-in fade-in slide-in-from-left-2">
                      <Check size={12} /> Selected: <span className="font-semibold">{selectedSize}</span>
                  </div>
              )}
            </div>
            
            {/* Actions */}
            <div className="space-y-3">
                <button
                    onClick={handleAddToCart}
                    disabled={!selectedSize || isSoldOut}
                    className={`
                        w-full py-4 text-xs font-bold uppercase tracking-[0.2em] border transition-colors
                        ${isSoldOut 
                            ? 'bg-gray-100 text-gray-400 border-gray-100 cursor-not-allowed'
                            : 'bg-white text-gray-900 border-gray-300 hover:bg-gray-50 hover:border-gray-900'
                        }
                    `}
                >
                    {isSoldOut ? 'Sold Out' : 'Add to Cart'}
                </button>

                <button
                    disabled={!selectedSize || isSoldOut}
                    className={`
                        w-full py-4 text-xs font-bold uppercase tracking-[0.2em] transition-opacity
                        ${isSoldOut
                            ? 'bg-gray-300 text-white cursor-not-allowed hidden' // Hide buy now if sold out
                            : 'bg-[#5a31f4] hover:bg-[#4825c9] text-white shadow-sm'
                        }
                    `}
                >
                    Buy with Shop
                </button>
            </div>
            
            {/* Description & Details */}
            <div className="pt-6 border-t border-gray-100">
                <p className="text-sm text-gray-600 leading-7 font-light whitespace-pre-line">
                    {description}
                </p>
                
                <div className="mt-6 space-y-2 text-sm text-gray-500 font-light">
                     {/* Placeholder data removed to keep it cleaner, re-add if needed */}
                     {/* <p>SKU: <span className="text-gray-900 font-normal">JU-2402-01-26</span></p> */}
                     {/* <p>Includes: <span className="text-gray-900 font-normal">Kaftan, Pants</span></p> */}
                     {/* <p>Fabric: <span className="text-gray-900 font-normal">Velvet</span></p> */}
                     {cartLimit > 0 && (
                         <p>Limit: <span className="text-gray-900 font-normal">{cartLimit} per customer</span></p>
                     )}
                </div>
            </div>

            {/* Accordions */}
            {/* <div className="border-t border-gray-100 pt-2">
                 {['Delivery & Returns', 'Care Instructions'].map((item) => (
                     <div key={item} className="flex justify-between items-center py-4 cursor-pointer group">
                         <span className="text-xs font-bold uppercase tracking-widest text-gray-700 group-hover:text-black">
                             {item}
                         </span>
                         <ChevronDown size={16} className="text-gray-400 group-hover:text-black" />
                     </div>
                 ))}
            </div> */}

          </div>
        </div>

      </div>
    </div>
  );
}