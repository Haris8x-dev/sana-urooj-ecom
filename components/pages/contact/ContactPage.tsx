"use client";

import React, { useState } from "react";
import { 
  Mail, 
  Phone, 
  MapPin, 
  Instagram, 
  Facebook, 
  Twitter, 
  ArrowRight,
  Loader2,
  CheckCircle2
} from "lucide-react";

export default function Contact() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsSubmitting(false);
    setIsSent(true);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-gray-900 selection:bg-black selection:text-white">
      {/* 1. Header Section */}
      <div className="pt-32 pb-16 px-6 text-center border-b border-gray-200">
        <h1 className="text-[10px] tracking-[0.4em] uppercase font-bold text-gray-400 mb-4">
          Get In Touch
        </h1>
        <h2 className="text-4xl md:text-5xl font-serif italic tracking-tight">
          Sana Urooj <span className="text-sm font-mono not-italic tracking-tighter align-top ml-2">Concierge</span>
        </h2>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
          
          {/* 2. Left Side: Brand Information */}
          <div className="space-y-12">
            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] mb-6 text-black border-b border-black w-fit pb-1">
                Client Relations
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed max-w-md">
                Our advisors are available to assist you with style advice, size guidance, 
                and detailed product information. Experience the bespoke service of Sana Urooj.
              </p>
            </div>

            <div className="space-y-8">
              {/* Contact Item 1 */}
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white border border-gray-200 rounded-full">
                  <Phone size={16} strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Call Us</p>
                  <p className="text-sm font-medium mt-1">+92 300 1234567</p>
                  <p className="text-[10px] text-gray-400 mt-1 uppercase">Mon - Sat | 10AM - 7PM</p>
                </div>
              </div>

              {/* Contact Item 2 */}
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white border border-gray-200 rounded-full">
                  <Mail size={16} strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Email Us</p>
                  <p className="text-sm font-medium mt-1">concierge@sanaurooj.com</p>
                </div>
              </div>

              {/* Contact Item 3 */}
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white border border-gray-200 rounded-full">
                  <MapPin size={16} strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Flagship Store</p>
                  <p className="text-sm font-medium mt-1">Plot 45-C, Lane 2, Bukhari Commercial</p>
                  <p className="text-sm font-medium">Phase 6, DHA, Karachi</p>
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="pt-12">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] mb-4 text-gray-400">Follow the Journey</p>
              <div className="flex gap-6">
                <a href="#" className="hover:text-amber-600 transition-colors"><Instagram size={20} strokeWidth={1.5}/></a>
                <a href="#" className="hover:text-amber-600 transition-colors"><Facebook size={20} strokeWidth={1.5}/></a>
                <a href="#" className="hover:text-amber-600 transition-colors"><Twitter size={20} strokeWidth={1.5}/></a>
              </div>
            </div>
          </div>

          {/* 3. Right Side: Contact Form */}
          <div className="bg-white border border-gray-200 p-8 md:p-12 shadow-sm relative overflow-hidden">
            {isSent ? (
              <div className="h-full flex flex-col items-center justify-center text-center animate-in fade-in zoom-in duration-500">
                <CheckCircle2 size={48} className="text-green-500 mb-6" />
                <h3 className="text-xl font-serif italic mb-2">Message Received</h3>
                <p className="text-xs text-gray-500 uppercase tracking-widest">Our concierge will contact you shortly.</p>
                <button 
                  onClick={() => setIsSent(false)}
                  className="mt-8 text-[10px] font-bold uppercase tracking-widest border-b border-black pb-1 hover:text-gray-500 hover:border-gray-500 transition"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="group">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 group-focus-within:text-black transition">Full Name</label>
                    <input 
                      required
                      type="text" 
                      className="w-full bg-transparent border-b border-gray-200 py-2 outline-none focus:border-black transition"
                      placeholder="e.g. Jane Doe"
                    />
                  </div>
                  <div className="group">
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 group-focus-within:text-black transition">Email Address</label>
                    <input 
                      required
                      type="email" 
                      className="w-full bg-transparent border-b border-gray-200 py-2 outline-none focus:border-black transition"
                      placeholder="jane@example.com"
                    />
                  </div>
                </div>

                <div className="group">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 group-focus-within:text-black transition">Subject</label>
                  <select className="w-full bg-transparent border-b border-gray-200 py-2 outline-none focus:border-black transition text-sm cursor-pointer">
                    <option>Order Inquiry</option>
                    <option>Product Information</option>
                    <option>Returns & Exchanges</option>
                    <option>Press & Media</option>
                    <option>Other</option>
                  </select>
                </div>

                <div className="group">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 group-focus-within:text-black transition">Message</label>
                  <textarea 
                    required
                    rows={4}
                    className="w-full bg-transparent border-b border-gray-200 py-2 outline-none focus:border-black transition resize-none"
                    placeholder="How can we assist you?"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-black text-white py-4 text-[10px] font-bold uppercase tracking-[0.3em] flex items-center justify-center gap-2 hover:bg-gray-800 transition shadow-xl disabled:bg-gray-400"
                >
                  {isSubmitting ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>
                      Send Inquiry <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* 4. Mini Map / Visual Placeholder */}
      <div className="w-full h-[400px] bg-gray-200 relative grayscale hover:grayscale-0 transition duration-1000">
          <div className="absolute inset-0 flex items-center justify-center">
             <span className="text-[10px] font-bold uppercase tracking-[1em] text-gray-400">Location Map Placeholder</span>
          </div>
          {/* Replace this div with an actual Google Maps Iframe if needed */}
      </div>
    </div>
  );
}