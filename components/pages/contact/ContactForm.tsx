"use client";
import { Mail, Phone, MapPin, Send, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function ContactForm() {
  return (
    <section className="min-h-[80vh] py-12 md:py-20 px-6 lg:px-24 max-w-[1440px] mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-stretch">
        
        {/* LEFT SIDE: CREATIVE CONTACT INFO */}
        <div className="lg:col-span-5 flex flex-col justify-center space-y-10 pr-0 lg:pr-10">
          <div className="space-y-4">
            <h2 className="text-3xl md:text-4xl font-serif italic text-gray-900 leading-tight">
              Let's craft your <br />
              <span className="text-amber-400">perfect silhouette.</span>
            </h2>
            <p className="text-sm text-gray-500 font-light leading-relaxed max-w-sm">
              Whether it's a custom fitting or an order inquiry, our concierge team is here to provide a seamless experience.
            </p>
          </div>

          <div className="grid gap-6">
            {[
              { icon: <Mail size={22} />, label: "Email Support", val: "concierge@sanaurooj.com" },
              { icon: <MessageCircle size={22} />, label: "WhatsApp", val: "+92 300 1234567" },
              { icon: <MapPin size={22} />, label: "Flagship Studio", val: "Defense Phase VI, Karachi" }
            ].map((item, i) => (
              <motion.div 
                key={i}
                whileHover={{ x: 10 }}
                className="flex items-center gap-5 p-5 rounded-xl bg-gray-50/50 border border-transparent hover:border-amber-100 hover:bg-white hover:shadow-sm transition-all duration-300"
              >
                <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-white rounded-full shadow-sm text-amber-400">
                  {item.icon}
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400">{item.label}</p>
                  <p className="text-md font-medium text-gray-800 tracking-tight">{item.val}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* RIGHT SIDE: POPPING CONTACT FORM */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="lg:col-span-7 relative"
        >
          {/* Decorative background element for "Pop" */}
          <div className="absolute -top-4 -right-4 w-24 h-24 bg-amber-50 rounded-full -z-10 blur-2xl opacity-60" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-gray-100 rounded-full -z-10 blur-3xl opacity-50" />

          <div className="bg-white rounded-2xl p-8 md:p-12 shadow-[0_30px_100px_rgba(0,0,0,0.08)] border border-gray-100">
            <form className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="relative group">
                  <input 
                    type="text" 
                    required
                    className="w-full bg-transparent border-b-2 border-gray-100 py-3 outline-none focus:border-amber-400 transition-colors font-medium text-base text-gray-900 peer placeholder-transparent"
                    placeholder="Full Name"
                    id="name"
                  />
                  <label htmlFor="name" className="absolute left-0 -top-4 text-[11px] uppercase tracking-widest font-bold text-amber-400 transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3 peer-focus:-top-4 peer-focus:text-amber-400 peer-focus:text-[11px]">
                    Your Name
                  </label>
                </div>

                <div className="relative group">
                  <input 
                    type="email" 
                    required
                    className="w-full bg-transparent border-b-2 border-gray-100 py-3 outline-none focus:border-amber-400 transition-colors font-medium text-base text-gray-900 peer placeholder-transparent"
                    placeholder="Email"
                    id="email"
                  />
                  <label htmlFor="email" className="absolute left-0 -top-4 text-[11px] uppercase tracking-widest font-bold text-amber-400 transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3 peer-focus:-top-4 peer-focus:text-amber-400 peer-focus:text-[11px]">
                    Email Address
                  </label>
                </div>
              </div>

              <div className="relative group">
                <select className="w-full bg-transparent border-b-2 border-gray-100 py-3 outline-none focus:border-amber-400 transition-colors font-medium text-base text-gray-800 uppercase appearance-none cursor-pointer">
                  <option>Inquiry Category</option>
                  <option>Order Tracking</option>
                  <option>Custom Bridal Inquiry</option>
                  <option>Sizing Assistance</option>
                  <option>Others</option>
                </select>
                <div className="absolute right-0 bottom-4 pointer-events-none text-gray-300">
                  <ChevronDown size={16} />
                </div>
              </div>

              <div className="relative group">
                <textarea 
                  rows={3} 
                  required
                  className="w-full bg-transparent border-b-2 border-gray-100 py-3 outline-none focus:border-amber-400 transition-colors font-medium text-base text-gray-900 peer placeholder-transparent resize-none"
                  placeholder="Message"
                  id="message"
                />
                <label htmlFor="message" className="absolute left-0 -top-4 text-[11px] uppercase tracking-widest font-bold text-amber-400 transition-all peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3 peer-focus:-top-4 peer-focus:text-amber-400 peer-focus:text-[11px]">
                  How can we help?
                </label>
              </div>

              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-black text-white py-6 rounded-xl text-[12px] font-bold uppercase tracking-[0.4em] flex items-center justify-center gap-4 hover:bg-[#1a1a1a] shadow-xl transition-all"
              >
                Send Message
                <Send size={16} className="text-amber-400" />
              </motion.button>
            </form>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// Internal component for the select arrow
const ChevronDown = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
);