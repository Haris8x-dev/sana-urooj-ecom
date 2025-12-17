"use client";

import React, { useState, useEffect } from "react";
import {
  ShoppingBag,
  Box,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";


/* ---------- TYPES ---------- */
export type AdminView =
  | "ProductAdd"
  | "ProductEdit"
  | "CategoryAdd"
  | "CategoryEdit"
  | "UsersManagement"
  | "HeroVideoEdit"
  | "BottomCarousalEdit";

/* ---------- MENU ---------- */
const MENU_ITEMS = [
  {
    heading: "Products",
    icon: ShoppingBag,
    options: [
      { name: "Add New Product", view: "ProductAdd" as AdminView },
      { name: "Edit / Manage Products", view: "ProductEdit" as AdminView },
    ],
  },
  {
    heading: "Categories",
    icon: Box,
    options: [
      { name: "Add New Category", view: "CategoryAdd" as AdminView },
      { name: "Edit / Manage Categories", view: "CategoryEdit" as AdminView },
      { name: "Manage F.Category", view: "FeaturedCategory" as AdminView },
    ],
  },
  {
    heading: "Site Assets",
    icon: Settings,
    options: [
      { name: "Hero Video", view: "HeroVideoEdit" as AdminView },
      { name: "Bottom Carousal", view: "BottomCarousalEdit" as AdminView },
    ],
  },
  {
    heading: "User Accounts",
    icon: Users,
    options: [
      { name: "Manage Users", view: "UsersManagement" as AdminView },
    ],
  },
];

interface SidePanelProps {
  currentView: AdminView;
  onViewChange: (view: AdminView) => void;
}

export default function SidePanel({
  currentView,
  onViewChange,
}: SidePanelProps) {
  // 1. Initialize based on screen size (default true for SSR, then adjusted in useEffect)
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    // Set initial state based on window width
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsOpen(false);
      } else {
        setIsOpen(true);
      }
    };

    // Run on mount
    handleResize();

    // Optional: Update on window resize
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 2. Function to handle menu clicks
  const handleItemClick = (view: AdminView) => {
    onViewChange(view);
    
    // Auto-close if on mobile/tablet screen
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative h-full">
      {/* PANEL */}
      <aside
        className={`
          relative h-full bg-white
          border-r border-gray-200
          transition-all duration-300 ease-in-out
          overflow-hidden
          ${isOpen ? "w-64 translate-x-0" : "w-0 -translate-x-full"}
        `}
      >
        <div className="w-64">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-xl font-bold tracking-wider text-gray-900">
              ADMIN PANEL
            </h1>
            <p className="text-xs text-gray-500 mt-1">Store Management</p>
          </div>

          {/* Navigation */}
          <nav className="p-4 space-y-6">
            {MENU_ITEMS.map((group, index) => (
              <div key={index}>
                <div className="flex items-center text-xs font-bold uppercase text-gray-500 mb-3 mt-4 px-3">
                  {React.createElement(group.icon, {
                    size: 14,
                    className: "mr-2",
                  })}
                  {group.heading}
                </div>

                <div className="space-y-2">
                  {group.options.map((item) => (
                    <button
                      key={item.view}
                      onClick={() => handleItemClick(item.view)}
                      className="w-full text-left px-3 pl-8 cursor-pointer py-2 text-sm text-gray-700 transition-colors duration-200 hover:text-gray-900 relative group"
                    >
                      <span className="relative inline-block">
                        {item.name}
                        {currentView === item.view && (
                          <span className="absolute left-0 right-0 -bottom-1 h-0.5 bg-amber-400"></span>
                        )}
                        {currentView !== item.view && (
                          <span className="absolute left-0 -bottom-1 h-0.5 bg-amber-300 w-0 group-hover:w-full transition-all duration-300 ease-out"></span>
                        )}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </div>
      </aside>

      {/* TOGGLE BUTTON */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={`
          absolute top-1/2 -translate-y-1/2
          ${isOpen ? "left-64" : "left-0"}
          z-50
          w-6 h-16
          flex items-center justify-center
          border border-gray-300 rounded-r-md
          bg-white
          hover:bg-gray-50
          transition-all duration-300
          shadow-sm
        `}
      >
        {isOpen ? (
          <ChevronLeft size={16} className="text-gray-600" />
        ) : (
          <ChevronRight size={16} className="text-gray-600" />
        )}
      </button>
    </div>
  );
}