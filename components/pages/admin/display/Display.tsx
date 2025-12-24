"use client";

import React, { useState } from "react";
import SidePanel, { AdminView } from './SidePanel';
import ProductAdd from '../options/ProductAdd'; 
import ProductEdit from "../options/ProductEdit";
import CategoryAdd from "../options/CategoryAdd";
import CategoryEdit from "../options/CategoryEdit";
import FeaturedCategory from "../options/FeaturedCategory";
import HeroVideo from "../options/HeroVideo";
import BottomCarousal from "../options/BottomCarousal";
import UsersManagement from "../options/UsersManagement";
import OrdersPage from "../options/OrdersPage";

export default function Display() {
  const [currentView, setCurrentView] = useState<AdminView>('ProductAdd');

  const renderContent = () => {
    switch (currentView) {
      case 'ProductAdd': return <ProductAdd />;
      case 'ProductEdit': return <ProductEdit />;
      case 'CategoryAdd': return <CategoryAdd />;
      case 'CategoryEdit': return <CategoryEdit />;
      case 'FeaturedCategory': return <FeaturedCategory />;
      case 'UsersManagement': return <UsersManagement />;
      case 'HeroVideoEdit': return <HeroVideo />;
      case 'BottomCarousalEdit': return <BottomCarousal />;
      case 'Orders': return <OrdersPage />;
      default: return (
        <div className="flex items-center justify-center h-full text-gray-300 font-serif italic text-2xl">
          Select a module to manage your store
        </div>
      );
    }
  };

  const getTitle = () => {
    // Format camelCase to readable title
    return currentView.replace(/([A-Z])/g, ' $1').trim();
  };

  return (
    <div className="flex h-screen bg-[#fafafa] font-sans selection:bg-amber-100 selection:text-amber-900">
      <SidePanel 
        currentView={currentView} 
        onViewChange={setCurrentView} 
      />

      <main className="flex-1 flex flex-col min-w-0">
        {/* Elegant Header */}
        <header className="h-[90px] bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-12 sticky top-0 z-50">
          <div>
            <p className="text-[9px] uppercase tracking-[0.4em] text-gray-400 font-bold mb-1">Management Console</p>
            <h1 className="text-xl font-serif italic text-gray-900 capitalize tracking-tight">
              {getTitle()}
            </h1>
          </div>

          <div className="flex items-center gap-6">
            <div className="h-8 w-[1px] bg-gray-100" />
            <div className="text-right hidden md:block">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-900">Administrator</p>
              <p className="text-[10px] text-amber-400 font-mono">Verified Access</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 font-serif italic">
              S
            </div>
          </div>
        </header>

        {/* Content Wrapper */}
        <div className="flex-1 overflow-y-auto p-12 no-scrollbar">
          <div className="max-w-7xl mx-auto">
             {renderContent()}
          </div>
        </div>
      </main>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}