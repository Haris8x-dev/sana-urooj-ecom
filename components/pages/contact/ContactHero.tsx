"use client";
import { motion } from "framer-motion";

export default function ContactHero() {
  return (
    <section className="h-[40vh] flex flex-col items-center justify-center bg-[#fafafa] border-b border-gray-100">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center pt-20"
      >
        <span className="text-[10px] uppercase tracking-[0.5em] text-gray-400 mb-4 block">Get in Touch</span>
        <h1 className="text-4xl md:text-6xl font-serif text-gray-900 tracking-tight">
          Contact <span className="text-amber-400 italic">Us</span>
        </h1>
        <div className="mt-6 h-[1px] w-20 bg-amber-400 mx-auto" />
      </motion.div>
    </section>
  );
}