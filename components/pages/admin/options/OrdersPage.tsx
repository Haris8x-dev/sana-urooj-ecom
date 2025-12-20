"use client";

import React, { useEffect, useState } from "react";
import { 
  Package, Trash2, CheckCircle, Clock, Phone, MessageSquare, 
  Mail, ShoppingBag, ChevronDown, ChevronUp, AlertTriangle 
} from "lucide-react";
import { toast } from "react-toastify";
import Image from "next/image";

interface Order {
  _id: string;
  customer: {
    fullName: string;
    email?: string;
    contactNumber: string;
    whatsappNumber: string;
    message?: string;
  };
  items: {
    productId: string;
    title: string;
    price: number;
    quantity: number;
    itemTotal: number;
    selectedSize: string;
    image: string;
  }[];
  totalAmount: number;
  orderStatus: string;
  createdAt: string;
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders/get");
      const data = await res.json();
      if (data.success) setOrders(data.orders);
    } catch (err) {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedOrder(expandedOrder === id ? null : id);
  };

  const deleteOrder = async (id: string) => {
    if(!confirm("Are you sure you want to delete this order permanently?")) return;
    try {
      const res = await fetch(`/api/orders/get?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setOrders(orders.filter(o => o._id !== id));
        toast.success("Order deleted");
      }
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  if (loading) return <div className="p-20 text-center font-mono text-xs">SYNCING ORDERS...</div>;

  return (
    <div className="min-h-screen bg-[#F9F9F9] p-4 md:p-10">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-serif italic">Incoming Orders</h1>
          <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 mt-2">Detailed Transaction Logs</p>
        </div>

        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order._id} className="bg-white border border-gray-200 overflow-hidden transition-all shadow-sm">
              {/* HEADER ROW */}
              <div 
                className="p-5 flex flex-wrap items-center justify-between cursor-pointer hover:bg-gray-50"
                onClick={() => toggleExpand(order._id)}
              >
                <div className="flex items-center gap-6">
                  <div className="text-[10px] font-mono font-bold bg-gray-100 px-2 py-1">
                    #{order._id.slice(-6).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold">{order.customer.fullName}</p>
                    <p className="text-[10px] text-gray-400">{new Date(order.createdAt).toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  <div className="text-right hidden md:block">
                    <p className="text-[10px] uppercase text-gray-400 font-bold">Total Amount</p>
                    <p className="text-sm font-mono font-bold">Rs. {order.totalAmount.toLocaleString()}</p>
                  </div>
                  <div className={`px-3 py-1 text-[9px] font-bold uppercase rounded-full ${order.orderStatus === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                    {order.orderStatus}
                  </div>
                  {expandedOrder === order._id ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                </div>
              </div>

              {/* DETAILED VIEW */}
              {expandedOrder === order._id && (
                <div className="p-6 border-t border-gray-100 bg-[#FCFCFC] animate-in slide-in-from-top-2 duration-300">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    
                    {/* 1. Customer Info */}
                    <div className="space-y-4">
                      <h4 className="text-[11px] font-black uppercase tracking-widest border-b pb-2">Customer Details</h4>
                      <div className="space-y-3 text-xs">
                        <p className="flex items-center gap-3"><Mail size={14} className="text-gray-400"/> {order.customer.email || "No Email Provided"}</p>
                        <p className="flex items-center gap-3"><Phone size={14} className="text-gray-400"/> {order.customer.contactNumber}</p>
                        <p className="flex items-center gap-3 text-green-600 font-bold"><MessageSquare size={14}/> {order.customer.whatsappNumber}</p>
                        {order.customer.message && (
                          <div className="mt-4 p-3 bg-white border italic text-gray-500 rounded">
                            "{order.customer.message}"
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 2. Order Items */}
                    <div className="lg:col-span-2 space-y-4">
                      <h4 className="text-[11px] font-black uppercase tracking-widest border-b pb-2">Order Items</h4>
                      <div className="space-y-3">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-4 bg-white p-3 border border-gray-100">
                            <div className="relative h-12 w-10 shrink-0">
                              <Image src={item.image} alt={item.title} fill className="object-cover" />
                            </div>
                            <div className="flex-grow">
                              <p className="text-[10px] font-bold uppercase">{item.title}</p>
                              <p className="text-[9px] text-gray-400">Size: {item.selectedSize} | Qty: {item.quantity}</p>
                            </div>
                            <p className="text-xs font-mono font-bold">Rs. {item.itemTotal.toLocaleString()}</p>
                          </div>
                        ))}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex justify-end gap-3 pt-6">
                        <button 
                           onClick={() => deleteOrder(order._id)}
                           className="flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all"
                        >
                          <Trash2 size={14}/> Delete Order
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase bg-black text-white hover:bg-gray-800 transition-all">
                          <CheckCircle size={14}/> Mark as Shipped
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}