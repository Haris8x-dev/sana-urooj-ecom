"use client";
import {
  FiUsers,
  FiPackage,
  FiGrid,
  FiShoppingCart,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiUserCheck,
  FiUserX,
} from "react-icons/fi";

export type MainOption = "users" | "products" | "categories" | "orders";
export type ProductSubOption = "add" | "update" | "delete";
export type UserSubOption = "manage" | "roles";
export type CategorySubOption = "add" | "update" | "delete";

interface AdminSidePanelProps {
  activeMainOption: MainOption;
  onMainOptionChange: (option: MainOption) => void;
  activeProductSubOption: ProductSubOption;
  onProductSubOptionChange: (option: ProductSubOption) => void;
  activeUserSubOption: UserSubOption;
  onUserSubOptionChange: (option: UserSubOption) => void;
  activeCategorySubOption: CategorySubOption;
  onCategorySubOptionChange: (option: CategorySubOption) => void;
}

export default function AdminSidePanel({
  activeMainOption,
  onMainOptionChange,
  activeProductSubOption,
  onProductSubOptionChange,
  activeUserSubOption,
  onUserSubOptionChange,
  activeCategorySubOption,
  onCategorySubOptionChange,
}: AdminSidePanelProps) {
  const mainOptions = [
    { id: "users" as MainOption, label: "Users Management", icon: FiUsers },
    { id: "products" as MainOption, label: "Products", icon: FiPackage },
    { id: "categories" as MainOption, label: "Categories", icon: FiGrid },
    { id: "orders" as MainOption, label: "Orders", icon: FiShoppingCart },
  ];

  const productSubOptions = [
    { id: "add" as ProductSubOption, label: "Add Product", icon: FiPlus },
    { id: "update" as ProductSubOption, label: "Update Product", icon: FiEdit },
    {
      id: "delete" as ProductSubOption,
      label: "Delete Product",
      icon: FiTrash2,
    },
  ];

  const userSubOptions = [
    { id: "manage" as UserSubOption, label: "Manage Users", icon: FiUserCheck },
    { id: "roles" as UserSubOption, label: "User Roles", icon: FiUserX },
  ];

  const categorySubOptions = [
    { id: "add" as CategorySubOption, label: "Add Category", icon: FiPlus },
    {
      id: "update" as CategorySubOption,
      label: "Update Category",
      icon: FiEdit,
    },
    {
      id: "delete" as CategorySubOption,
      label: "Delete Category",
      icon: FiTrash2,
    },
  ];

  return (
    <div className="w-64 bg-white shadow-lg h-full flex flex-col">
      {/* Main Header */}
      <div className="p-6 border-b">
        <h1 className="text-xl font-bold text-gray-800">Admin Panel</h1>
        <p className="text-sm text-gray-600">Management Dashboard</p>
      </div>

      {/* Main Options */}
      <div className="flex-1 p-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">
          Management
        </h2>
        <div className="space-y-2">
          {mainOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.id}
                onClick={() => onMainOptionChange(option.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition ${
                  activeMainOption === option.id
                    ? "bg-blue-50 text-blue-600 border border-blue-200"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Icon size={18} />
                <span className="font-medium">{option.label}</span>
              </button>
            );
          })}
        </div>

        {/* Product Sub-options (only show when products is selected) */}
        {activeMainOption === "products" && (
          <div className="mt-8">
            <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">
              Product Actions
            </h2>
            <div className="space-y-2">
              {productSubOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.id}
                    onClick={() => onProductSubOptionChange(option.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition ${
                      activeProductSubOption === option.id
                        ? "bg-green-50 text-green-600 border border-green-200"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Icon size={16} />
                    <span className="font-medium text-sm">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* User Sub-options (only show when users is selected) */}
        {activeMainOption === "users" && (
          <div className="mt-8">
            <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">
              User Actions
            </h2>
            <div className="space-y-2">
              {userSubOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.id}
                    onClick={() => onUserSubOptionChange(option.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition ${
                      activeUserSubOption === option.id
                        ? "bg-purple-50 text-purple-600 border border-purple-200"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Icon size={16} />
                    <span className="font-medium text-sm">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Category Sub-options (only show when categories is selected) */}
        {activeMainOption === "categories" && (
          <div className="mt-8">
            <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">
              Category Actions
            </h2>
            <div className="space-y-2">
              {categorySubOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.id}
                    onClick={() => onCategorySubOptionChange(option.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition ${
                      activeCategorySubOption === option.id
                        ? "bg-indigo-50 text-indigo-600 border border-indigo-200"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Icon size={16} />
                    <span className="font-medium text-sm">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
