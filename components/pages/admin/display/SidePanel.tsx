"use client";

import React, { useState, useEffect } from "react";
import { 
  ShoppingBag, 
  Box, 
  Users, 
  Settings, 
  ChevronLeft, 
  Menu,
  ClipboardList,
  ArrowRightFromLine,
  PlayCircle,
  Image as ImageIcon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* ---------- TYPES ---------- */
export type AdminView =
  | "ProductAdd"
  | "ProductEdit"
  | "CategoryAdd"
  | "CategoryEdit"
  | "UsersManagement"
  | "HeroVideoEdit"
  | "BottomCarousalEdit"
  | "FeaturedCategory"
  | "Orders";

/* ---------- MENU ---------- */
const MENU_ITEMS = [
  {
    heading: "Inventory",
    icon: ShoppingBag,
    options: [
      { name: "Add New Product", view: "ProductAdd" as AdminView },
      { name: "Manage Products", view: "ProductEdit" as AdminView },
    ],
  },
  {
    heading: "Collections",
    icon: Box,
    options: [
      { name: "New Category", view: "CategoryAdd" as AdminView },
      { name: "Categories List", view: "CategoryEdit" as AdminView },
      { name: "Featured Picks", view: "FeaturedCategory" as AdminView },
    ],
  },
  {
    heading: "Visuals",
    icon: PlayCircle,
    options: [
      { name: "Hero Video", view: "HeroVideoEdit" as AdminView },
      { name: "Carousel Assets", view: "BottomCarousalEdit" as AdminView },
    ],
  },
  {
    heading: "Customers",
    icon: Users,
    options: [
      { name: "Orders History", view: "Orders" as AdminView },
      { name: "Account Access", view: "UsersManagement" as AdminView },
    ],
  },
];

interface SidePanelProps {
  currentView: AdminView;
  onViewChange: (view: AdminView) => void;
}

export default function SidePanel({ currentView, onViewChange }: SidePanelProps) {
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      setIsOpen(window.innerWidth >= 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleItemClick = (view: AdminView) => {
    onViewChange(view);
    if (window.innerWidth < 1024) setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[55] lg:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ 
          width: isOpen ? "280px" : "0px",
          x: isOpen ? 0 : -20 
        }}
        transition={{ type: "spring", damping: 20, stiffness: 100 }}
        className={`fixed lg:relative h-full bg-white z-[60] border-r border-gray-100 flex flex-col shadow-2xl lg:shadow-none overflow-hidden pt-28`}
      >
        {/* Header Section */}
        <div className="p-8 border-b border-gray-50 flex items-center justify-between min-w-[280px] ">
          <div>
            <h1 className="text-xl font-serif italic tracking-tight text-gray-900">
              Sana <span className="text-amber-400">Urooj</span>
            </h1>
            <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-gray-400">
              Studio Manager
            </p>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-2 hover:bg-gray-50 rounded-full text-gray-400"
          >
            <ChevronLeft size={20} />
          </button>
        </div>

        {/* Scrollable Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-4 no-scrollbar min-w-[280px]">
          {MENU_ITEMS.map((group, groupIdx) => (
            <div key={groupIdx} className="mb-10">
              <div className="flex items-center gap-3 px-4 mb-4">
                <div className="w-1 h-1 bg-amber-400 rounded-full" />
                <span className="text-[10px] uppercase font-bold tracking-[0.4em] text-gray-300">
                  {group.heading}
                </span>
              </div>

              <div className="space-y-1">
                {group.options.map((item) => {
                  const isActive = currentView === item.view;
                  return (
                    <button
                      key={item.view}
                      onClick={() => handleItemClick(item.view)}
                      className={`w-full group relative flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 ${
                        isActive 
                          ? "bg-amber-50/50 text-gray-900" 
                          : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                    >
                      <span className={`text-[11px] font-bold uppercase tracking-[0.15em] transition-all ${
                        isActive ? "translate-x-1" : "group-hover:translate-x-1"
                      }`}>
                        {item.name}
                      </span>
                      
                      {isActive && (
                        <motion.div 
                          layoutId="activePill"
                          className="absolute left-0 w-1 h-6 bg-amber-400 rounded-r-full"
                        />
                      )}
                      
                      {isActive ? (
                        <ArrowRightFromLine size={14} className="text-amber-400 animate-pulse" />
                      ) : (
                        <div className="w-1 h-1 bg-gray-200 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Support Section */}
        <div className="p-6 mt-auto border-t border-gray-50 bg-[#fafafa]/50 min-w-[280px]">
          <div className="flex items-center gap-4 px-2">
            <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-serif italic text-sm border border-amber-200">
              A
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-900">Verified Admin</p>
              <p className="text-[9px] text-gray-400 font-mono tracking-tighter italic">system_root_v2</p>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Floating Toggle Button for when closed */}
      {!isOpen && (
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => setIsOpen(true)}
          className="fixed left-6 top-20 z-[70] p-4 bg-white shadow-xl rounded-full border border-gray-100 text-gray-900 hover:scale-110 transition-transform"
        >
          <Menu size={20} />
        </motion.button>
      )}

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </>
  );
}