// components/pages/admin/display/Display.tsx

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

// Placeholder components for other pages
const PlaceholderComponent: React.FC<{ title: string }> = ({ title }) => (
  <div className="p-12 text-center text-gray-500">
    <h2 className="text-4xl font-bold mb-4">{title}</h2>
    <p>UI for this section will be implemented next.</p>
  </div>
);

export default function Display() {
  const [currentView, setCurrentView] = useState<AdminView>('ProductAdd');

  const renderContent = () => {
    switch (currentView) {
      case 'ProductAdd':
        return <ProductAdd />;
      case 'ProductEdit':
        return <ProductEdit/>;
      case 'CategoryAdd':
        return <CategoryAdd/>;
      case 'CategoryEdit':
        return <CategoryEdit/>;
      case 'FeaturedCategory':
        return <FeaturedCategory/>  
      case 'UsersManagement':
        return <PlaceholderComponent title="Manage Users" />;
      case 'HeroVideoEdit':
        return <HeroVideo/>;
      case 'BottomCarousalEdit':
        return <BottomCarousal/>;
      default:
        return <PlaceholderComponent title="Admin Dashboard" />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      
      {/* Side Panel */}
      <SidePanel 
        currentView={currentView} 
        onViewChange={setCurrentView} 
      />

      {/* Main Content Area - Full Width */}
      <main className="flex-1 overflow-y-auto">
        {/* Content Header */}
        <div className="bg-white border-b border-gray-300 px-8 py-5 sticky top-0 z-10">
          <h1 className="text-2xl font-semibold text-gray-800">
            {currentView.replace(/([A-Z])/g, ' $1').trim()}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your store data and assets
          </p>
        </div>
        
        {/* Render the selected component - Full Width */}
        <div className="pt-8">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}