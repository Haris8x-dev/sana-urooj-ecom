"use client";

import { useState } from "react";
import { FiSearch, FiX } from "react-icons/fi";
import { ProductSubOption } from "./AdminSidePanel";

interface AdminTopPanelProps {
  activeProductSubOption: ProductSubOption;
  onSearch: (query: string) => void;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
}

export default function AdminTopPanel({
  activeProductSubOption,
  onSearch,
  searchQuery,
  onSearchQueryChange,
}: AdminTopPanelProps) {
  const [localSearch, setLocalSearch] = useState(searchQuery);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(localSearch);
  };

  const handleClearSearch = () => {
    setLocalSearch("");
    onSearchQueryChange("");
  };

  const getPanelTitle = () => {
    const titles = {
      add: "Add New Product",
      update: "Update Product",
      delete: "Delete Product",
    };
    return titles[activeProductSubOption];
  };

  return (
    <div className="bg-white shadow-sm border-b p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {getPanelTitle()}
          </h1>
          <p className="text-gray-600 mt-1">Manage your products inventory</p>
        </div>

        {/* Search Box - Only show for update/delete operations */}
        {(activeProductSubOption === "update" ||
          activeProductSubOption === "delete") && (
          <form
            onSubmit={handleSearchSubmit}
            className="relative w-full sm:w-80"
          >
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search products by name, description..."
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {localSearch && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <FiX size={18} />
              </button>
            )}
            <button
              type="submit"
              className="absolute right-10 top-1/2 transform -translate-y-1/2 text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              Search
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
