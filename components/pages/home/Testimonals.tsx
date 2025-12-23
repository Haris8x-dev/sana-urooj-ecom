"use client";

import React from "react";
import { Star } from "lucide-react";

interface Testimonial {
  id: number;
  name: string;
  location: string;
  text: string;
}

const testimonialsTop: Testimonial[] = [
  { id: 1, name: "Ayesha Khan", location: "Lahore", text: "The craftsmanship on the velvet pishwas is unparalleled. Truly a masterpiece of Urooj Sana. The fabric feels incredibly premium and the fit is perfect." },
  { id: 2, name: "Sara Malik", location: "London", text: "Exceptional quality and the fit was exactly as promised. Perfect for my engagement. I received so many compliments on the intricate hand-work." },
  { id: 3, name: "Zainab J.", location: "Karachi", text: "I've never felt more elegant. The attention to detail in the embroidery is breathtaking and the customer service was very helpful." },
  { id: 4, name: "Fatima Noor", location: "Dubai", text: "Shipping was surprisingly fast for such intricate couture work. Highly recommended for anyone looking for authentic luxury wear." },
];

const testimonialsBottom: Testimonial[] = [
  { id: 5, name: "Maria B.", location: "Islamabad", text: "The modern silhouette blended with traditional work is exactly what I was looking for. It bridges the gap between heritage and style." },
  { id: 6, name: "Hina Qasim", location: "New York", text: "Simply stunning. Urooj Sana is now my go-to for all luxury formal wear. The packaging itself felt like a royal experience." },
  { id: 7, name: "Noreen Ali", location: "Birmingham", text: "The fabric feels so premium. You can tell it's high-end couture from the first touch. Definitely worth the investment for special occasions." },
  { id: 8, name: "Rabia S.", location: "Faisalabad", text: "Elegant, sophisticated, and timeless. Every piece tells a beautiful story of craftsmanship and dedication to art." },
];

const TestimonialCard = ({ testimonial }: { testimonial: Testimonial }) => (
  <div className="flex-shrink-0 w-[300px] md:w-[400px] mx-4 p-6 md:p-8 bg-white border border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.05)]">
    <div className="flex gap-1 mb-4">
      {[...Array(5)].map((_, i) => (
        <Star key={i} size={12} className="fill-[var(--primary-color)]  text-[var(--primary-color)] " />
      ))}
    </div>
    {/* Fixed overflow: removed whitespace-nowrap from parent and added normal wrap here */}
    <p className="text-gray-700 italic font-primary text-sm md:text-base leading-relaxed mb-6 whitespace-normal break-words">
      "{testimonial.text}"
    </p>
    <div className="border-t border-gray-200 pt-4">
      <h4 className="text-gray-900 font-bold text-[11px] uppercase tracking-[0.3em]">
        {testimonial.name}
      </h4>
      <p className="text-[var(--primary-color)]  text-[9px] uppercase tracking-[0.2em] font-medium mt-1">
        {testimonial.location}
      </p>
    </div>
  </div>
);

export default function Testimonials() {
  return (
    <section className="w-full bg-white pb-24 overflow-hidden">
      {/* HEADER */}
      <div className="text-center mb-12 px-6">
        <span className="text-[10px] uppercase tracking-[0.6em] font-bold block mb-3">
          Client Voices
        </span>
        <h2 className="text-4xl md:text-6xl font-primary italic text-gray-900 tracking-tighter">
          The <span className="text-[var(--primary-color)] ">Urooj Sana</span> Experience
        </h2>
        <div className="w-16 h-[1px] bg-[var(--primary-color)] /40 mx-auto mt-6" />
      </div>

      {/* ROW 1: LEFT TO RIGHT */}
      <div className="relative flex mb-8">
        {/* The container below still needs whitespace-nowrap for the flex layout, 
            but the Card inside now has whitespace-normal to wrap the text */}
        <div className="flex animate-marquee-right whitespace-nowrap">
          {[...testimonialsTop, ...testimonialsTop].map((t, i) => (
            <TestimonialCard key={`top-${i}`} testimonial={t} />
          ))}
        </div>
      </div>

      {/* ROW 2: RIGHT TO LEFT */}
      <div className="relative flex">
        <div className="flex animate-marquee-left whitespace-nowrap">
          {[...testimonialsBottom, ...testimonialsBottom].map((t, i) => (
            <TestimonialCard key={`bottom-${i}`} testimonial={t} />
          ))}
        </div>
      </div>


      {/* TAILWIND ANIMATION CONFIG */}
      <style jsx global>{`
        @keyframes marquee-left {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes marquee-right {
          0% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        .animate-marquee-left {
          animation: marquee-left 50s linear infinite;
        }
        .animate-marquee-right {
          animation: marquee-right 50s linear infinite;
        }
        .animate-marquee-left:hover, .animate-marquee-right:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
  );
}