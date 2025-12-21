"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { 
  CreditCard, 
  Truck, 
  User, 
  ChevronLeft, 
  CheckCircle2, 
  Loader2,
  AlertCircle,
  ShoppingBag
} from "lucide-react";
import { io } from "socket.io-client";
import { toast } from "react-toastify";

// Initialize Socket.io (Ensure your env variable is set)
const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000");

interface CartItem {
  _id: string;
  title: string;
  price: number;
  image: string;
  quantity: number;
  selectedSize: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    contactNumber: "",
    whatsappNumber: "",
    message: "",
  });

  useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem("cart") || "[]");
    if (savedCart.length === 0 && !orderComplete) {
      router.push("/cart");
    }
    setCartItems(savedCart);
  }, [router, orderComplete]);

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

// Inside handlePlaceOrder function in checkoutPage.tsx
const handlePlaceOrder = async () => {
    setIsSubmitting(true);

    const orderData = {
      customer: formData,
      items: cartItems.map(item => ({
        productId: item._id,
        title: item.title,
        price: item.price,
        quantity: item.quantity,
        itemTotal: item.price * item.quantity,
        selectedSize: item.selectedSize,
        image: item.image
      })),
      totalAmount: subtotal,
      paymentMethod: "Cash on Delivery",
    };

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData),
      });

      const result = await response.json();

      if (result.success) {
        // --- SOCKET EMIT REMOVED ---
        
        localStorage.removeItem("cart");
        window.dispatchEvent(new Event("cartUpdated"));
        setOrderComplete(true);
        toast.success("Order confirmed successfully!", { theme: "dark" });

        setTimeout(() => {
          router.push("/");
        }, 5000);
      } else {
        throw new Error(result.error || "Failed to place order");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again later.");
    } finally {
      setIsSubmitting(false);
      setIsConfirming(false);
    }
  };
  // --- THANK YOU UI (Visible for 5 Seconds) ---
  if (orderComplete) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full space-y-8 animate-in fade-in zoom-in duration-700">
          <div className="flex justify-center">
            <div className="h-24 w-24 bg-black rounded-full flex items-center justify-center shadow-2xl">
              <CheckCircle2 className="text-white" size={48} />
            </div>
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-serif italic text-gray-900">Thank You!</h1>
            <p className="text-[10px] uppercase tracking-[0.4em] font-black text-gray-500">
              Your Order Has Been Placed
            </p>
            <p className="text-sm text-gray-400 italic leading-relaxed">
              "Thank you for shopping at Sana Urooj Shop. We have received your order and will contact you shortly via WhatsApp to confirm shipping."
            </p>
          </div>
          
          <div className="pt-8">
            <div className="w-full h-[2px] bg-gray-100 relative overflow-hidden">
              <div className="absolute inset-0 bg-black animate-progress origin-left"></div>
            </div>
            <p className="text-[9px] uppercase tracking-[0.2em] text-gray-400 mt-4">
              Redirecting you home in a few seconds
            </p>
          </div>
        </div>
        <style jsx>{`
          @keyframes progress {
            0% { transform: scaleX(1); }
            100% { transform: scaleX(0); }
          }
          .animate-progress {
            animation: progress 5s linear forwards;
          }
        `}</style>
      </div>
    );
  }

  // --- CHECKOUT FORM UI ---
  return (
    <div className="min-h-screen bg-[#FDFBF7] pt-28 pb-20 px-4 md:px-10">
      <div className="max-w-7xl mx-auto">
        
        <div className="mb-12 flex items-end justify-between border-b border-gray-200 pb-8">
          <div>
            <h1 className="text-4xl md:text-6xl font-serif italic">Checkout</h1>
            <p className="text-[10px] uppercase tracking-[0.3em] text-gray-400 mt-4">Secure your selection</p>
          </div>
          <button onClick={() => router.back()} className="flex items-center text-[10px] font-bold uppercase tracking-widest hover:text-gray-400 transition-colors">
            <ChevronLeft size={16} /> Back to Bag
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-16">
          
          {/* LEFT: Shipping & Payment */}
          <div className="flex-grow space-y-16">
            
            <section>
              <h2 className="text-[11px] font-black uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                <CreditCard size={14} /> 01. Payment Method
              </h2>
              <div className="border-2 border-black p-6 flex items-center justify-between bg-white shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center gap-5">
                  <div className="h-5 w-5 rounded-full border-2 border-black bg-black flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-white"></div>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest">Cash on Delivery</p>
                    <p className="text-[10px] text-gray-400 mt-1 italic tracking-wider">Pay when you receive your package</p>
                  </div>
                </div>
                <Truck className="text-black" size={24} />
              </div>
            </section>

            <section className="space-y-8">
              <h2 className="text-[11px] font-black uppercase tracking-[0.3em] flex items-center gap-3">
                <User size={14} /> 02. Shipping Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
                <div className="space-y-2 group">
                  <label className="text-[10px] uppercase font-bold text-gray-400 group-focus-within:text-black transition-colors">Full Name</label>
                  <input name="fullName" required value={formData.fullName} onChange={handleInputChange} className="w-full bg-transparent border-b border-gray-300 py-3 text-sm focus:border-black outline-none transition-all" />
                </div>
                <div className="space-y-2 group">
                  <label className="text-[10px] uppercase font-bold text-gray-400 group-focus-within:text-black transition-colors">Email (Optional)</label>
                  <input name="email" value={formData.email} onChange={handleInputChange} className="w-full bg-transparent border-b border-gray-300 py-3 text-sm focus:border-black outline-none transition-all" />
                </div>
                <div className="space-y-2 group">
                  <label className="text-[10px] uppercase font-bold text-gray-400 group-focus-within:text-black transition-colors">Contact Number</label>
                  <input name="contactNumber" required value={formData.contactNumber} onChange={handleInputChange} className="w-full bg-transparent border-b border-gray-300 py-3 text-sm focus:border-black outline-none transition-all" />
                </div>
                <div className="space-y-2 group">
                  <label className="text-[10px] uppercase font-bold text-gray-400 group-focus-within:text-black transition-colors">WhatsApp Number</label>
                  <input name="whatsappNumber" required value={formData.whatsappNumber} onChange={handleInputChange} className="w-full bg-transparent border-b border-gray-300 py-3 text-sm focus:border-black outline-none transition-all" />
                </div>
              </div>
              <div className="space-y-2 pt-4">
                <label className="text-[10px] uppercase font-bold text-gray-400">Order Message</label>
                <textarea name="message" value={formData.message} onChange={handleInputChange} rows={3} className="w-full bg-white border border-gray-200 p-4 text-sm focus:border-black outline-none transition-colors resize-none shadow-sm" placeholder="Message to seller..." />
              </div>
            </section>
          </div>

          {/* RIGHT: Invoice / Order Summary */}
          <div className="w-full lg:w-[450px]">
            <div className="bg-white border border-black p-8 md:p-12 sticky top-32 shadow-[20px_20px_0px_0px_rgba(0,0,0,0.03)]">
              <h2 className="text-xs font-black uppercase tracking-[0.4em] mb-12 border-b-2 border-black pb-5">Invoice Summary</h2>
              
              <div className="space-y-8 mb-12 max-h-[350px] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-black">
                {cartItems.map((item) => (
                  <div key={`${item._id}-${item.selectedSize}`} className="flex gap-5 group">
                    <div className="relative h-20 w-16 bg-gray-50 shrink-0 overflow-hidden">
                      <Image src={item.image} alt={item.title} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div className="flex-grow flex flex-col justify-center">
                      <p className="text-[10px] font-bold uppercase tracking-widest">{item.title}</p>
                      <p className="text-[9px] text-gray-400 italic mt-1">Size: {item.selectedSize} | Qty: {item.quantity}</p>
                      <p className="text-[10px] font-mono font-bold mt-2">Rs. {(item.price * item.quantity).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-5 pt-6 border-t border-gray-100">
                <div className="flex justify-between text-[11px] uppercase tracking-widest text-gray-500">
                  <span>Subtotal</span>
                  <span className="font-mono">Rs. {subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[11px] uppercase tracking-widest text-green-600">
                  <span>Shipping</span>
                  <span className="font-bold underline">FREE</span>
                </div>
                <div className="flex justify-between items-center pt-6 mt-6 border-t-2 border-black">
                  <span className="text-sm font-black uppercase tracking-[0.2em]">Grand Total</span>
                  <span className="text-3xl font-mono font-black">Rs. {subtotal.toLocaleString()}</span>
                </div>
              </div>

              <button 
                onClick={() => setIsConfirming(true)}
                disabled={!formData.fullName || !formData.contactNumber || !formData.whatsappNumber}
                className="w-full mt-12 bg-black text-white py-6 text-[10px] font-bold uppercase tracking-[0.4em] hover:bg-gray-800 transition-all disabled:opacity-20 disabled:grayscale"
              >
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CONFIRMATION MODAL */}
      {isConfirming && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md p-6">
          <div className="bg-white p-10 md:p-14 max-w-md w-full text-center space-y-8 animate-in zoom-in duration-300">
            <AlertCircle className="mx-auto text-black" size={56} />
            <div className="space-y-3">
              <h3 className="text-2xl font-serif italic">Finalize Order?</h3>
              <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 leading-relaxed">
                By clicking confirm, your cash on delivery order will be sent to our team for processing.
              </p>
            </div>
            <div className="flex flex-col gap-4">
              <button onClick={handlePlaceOrder} disabled={isSubmitting} className="w-full bg-black text-white py-5 text-[10px] font-bold uppercase tracking-[0.3em] flex items-center justify-center gap-3">
                {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : "Yes, Confirm Payment"}
              </button>
              <button onClick={() => setIsConfirming(false)} className="w-full bg-transparent text-gray-400 py-2 text-[10px] font-bold uppercase tracking-widest hover:text-black transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}