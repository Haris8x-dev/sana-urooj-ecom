"use client";

import React from "react";
import Image from "next/image";
import { ShoppingBag, Heart, ShieldCheck, Truck } from "lucide-react";

const AboutPage = () => {
  const values = [
    {
      icon: <ShoppingBag className="w-6 h-6" />,
      title: "Curated Excellence",
      description: "Every piece in our collection is hand-picked to ensure it meets our standards of timeless elegance.",
    },
    {
      icon: <Heart className="w-6 h-6" />,
      title: "Customer First",
      description: "We believe in building relationships, not just processing orders. Your satisfaction is our heartbeat.",
    },
    {
      icon: <ShieldCheck className="w-6 h-6" />,
      title: "Authentic Quality",
      description: "We partner with trusted artisans and brands to bring you 100% authentic products.",
    },
    {
      icon: <Truck className="w-6 h-6" />,
      title: "Seamless Experience",
      description: "From a smooth checkout to swift delivery, we ensure your shopping journey is effortless.",
    },
  ];

  return (
    <div className="bg-white text-gray-900">
      {/* --- HERO SECTION --- */}
      {/* pt-32 ensures the heading is at the top with descent padding */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden bg-stone-50 pt-32 pb-20 sm:pt-40 sm:pb-32">
        <div className="container mx-auto px-6 text-center z-10">
          <span className="text-amber-500 uppercase tracking-[0.4em] text-xs font-bold mb-4 block">
            Established 2024
          </span>
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif tracking-tight text-gray-900 mb-6">
            The Essence of <br />
            <span className="italic relative">
                Sana Urooj
                <span className="absolute bottom-2 left-0 w-full h-3 bg-amber-300/40 -z-10"></span>
            </span>
          </h1>
          <p className="max-w-2xl mx-auto text-gray-600 text-base sm:text-xl font-light leading-relaxed">
            Redefining modern elegance through curated collections that speak to the soul.
          </p>
        </div>
        
        {/* Decorative Theme Elements */}
        <div className="absolute top-0 right-0 w-1/4 h-full bg-amber-300/10 -skew-x-12 translate-x-1/2 hidden md:block" />
        <div className="absolute bottom-0 left-0 w-1/4 h-full bg-amber-300/5 skew-x-12 -translate-x-1/2 hidden md:block" />
      </section>

      {/* --- BRAND STORY SECTION --- */}
      <section className="py-16 sm:py-24 container mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Responsive Image container */}
          <div className="relative h-[350px] sm:h-[450px] lg:h-[600px] rounded-2xl overflow-hidden shadow-2xl order-2 lg:order-1">
            <div className="absolute inset-0 bg-stone-200">
                <Image 
                  src="/images/about-brand.jpg" 
                  alt="Sana Urooj Collection" 
                  fill 
                  className="object-cover transition-transform duration-700 hover:scale-105"
                />
            </div>
          </div>
          
          <div className="space-y-8 order-1 lg:order-2">
            <h2 className="text-3xl sm:text-4xl font-serif text-gray-800">Our Heritage</h2>
            <div className="w-20 h-1.5 bg-amber-300"></div>
            
            <p className="text-gray-600 text-base sm:text-lg leading-relaxed">
              Founded on the principles of grace and individuality, <span className="font-semibold text-gray-900">Sana Urooj</span> began as a vision to bring premium fashion to those who appreciate the finer details.
            </p>
            <p className="text-gray-600 text-base sm:text-lg leading-relaxed">
              We believe that clothing is more than just fabric; it is a canvas for self-expression. Every item in our store is selected for its quality, craftsmanship, and ability to make you feel extraordinary.
            </p>
            
            <div className="bg-amber-50 border-l-4 border-amber-300 p-6 italic text-gray-700 font-serif text-lg sm:text-xl shadow-sm">
              &quot;Style is a reflection of your attitude and your personality. We provide the tools; you create the masterpiece.&quot;
            </div>
          </div>
        </div>
      </section>

      {/* --- CORE VALUES --- */}
      <section className="py-20 bg-stone-50">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-serif mb-12 sm:mb-16">Our Philosophy</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="group bg-white p-10 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-amber-300 text-gray-900 rounded-full mb-6 group-hover:rotate-12 transition-transform">
                  {value.icon}
                </div>
                <h3 className="font-bold text-lg mb-3 tracking-wide uppercase">{value.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- FOUNDER'S NOTE --- */}
      <section className="py-24 sm:py-32 container mx-auto px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xs uppercase tracking-[0.5em] text-amber-500 font-bold mb-8">A Note From the Heart</h2>
          <p className="text-2xl sm:text-4xl font-serif italic text-gray-800 leading-tight mb-12">
            &quot;I want every person who shops at Sana Urooj to feel a sense of belonging. My goal is to bridge the gap between luxury and everyday comfort.&quot;
          </p>
          
          <div className="flex flex-col items-center">
             <div className="w-20 h-20 rounded-full bg-amber-300 mb-4 overflow-hidden relative border-4 border-white shadow-lg">
                <Image src="/images/founder.jpg" alt="Sana Urooj" fill className="object-cover" />
             </div>
             <h4 className="font-bold text-xl tracking-tighter">SANA UROOJ</h4>
             <p className="text-amber-600 text-xs font-bold uppercase tracking-widest mt-1">Founder & CEO</p>
          </div>
        </div>
      </section>

      {/* --- CTA SECTION --- */}
      <section className="py-20 bg-gray-900 text-white overflow-hidden relative">
        <div className="container mx-auto px-6 text-center relative z-10">
          <h2 className="text-3xl sm:text-5xl font-serif mb-8">Discover Your Next Favorite Piece</h2>
          <p className="text-gray-400 text-base sm:text-lg mb-10 max-w-xl mx-auto font-light">
            Join the Sana Urooj family and experience elegance that never goes out of style.
          </p>
          <button className="bg-amber-300 text-gray-900 px-12 py-4 font-bold rounded-full hover:bg-white hover:scale-105 transition-all duration-300 shadow-xl">
            EXPLORE COLLECTIONS
          </button>
        </div>
        
        {/* Background Accent */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-amber-300 rounded-full blur-[120px]" />
        </div>
      </section>
    </div>
  );
};

export default AboutPage;