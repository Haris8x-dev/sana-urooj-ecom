"use client";

export default function ContactFooter() {
  return (
    <section className="py-24 bg-[#111] text-white">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-24 text-center">
        <h2 className="text-3xl font-serif italic mb-6">Visit our Studio</h2>
        <p className="text-[11px] uppercase tracking-[0.4em] text-gray-400 max-w-lg mx-auto leading-relaxed">
          Experience the craftsmanship in person. Our flagship studio is open Monday to Saturday for private consultations.
        </p>
        
        <div className="mt-12 w-full h-[400px] grayscale invert opacity-80 border border-white/10 overflow-hidden relative group">
           {/* Replace with your actual Google Maps Embed or Image */}
           <div className="absolute inset-0 bg-neutral-900 flex items-center justify-center">
             <span className="text-[10px] uppercase tracking-widest border border-white/20 p-4 group-hover:border-amber-400 transition-colors">
                View On Google Maps
             </span>
           </div>
        </div>

        <div className="mt-20 flex flex-col items-center">
          <p className="text-amber-400 font-serif italic text-xl mb-4">Follow the Journey</p>
          <div className="flex gap-10 text-[10px] uppercase tracking-[0.3em] font-bold text-gray-500">
            <a href="#" className="hover:text-white transition-colors">Instagram</a>
            <a href="#" className="hover:text-white transition-colors">Facebook</a>
            <a href="#" className="hover:text-white transition-colors">Pinterest</a>
          </div>
        </div>
      </div>
    </section>
  );
}