"use client";

import { useEffect, useState } from "react";
import { getSession } from "next-auth/react";
import { FiX } from "react-icons/fi";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Trash2 } from "lucide-react";

interface ProfileImage {
  url: string;
  fileId: string;
}

interface Review {
  _id?: string;
  userId: { _id: string; fullName: string; profileImage?: ProfileImage };
  rating: number;
  comment: string;
}

interface Image {
  url: string;
}

interface Product {
  _id: string;
  title: string;
  name: string;
  description: string;
  price: number;
  images: Image[];
  reviews: Review[];
}

interface ProductBoxProps {
  product: Product;
  onClose: () => void;
  addToCart: (productId: string) => void;
  currentUserId: string;
}

export default function ProductBox({
  product,
  onClose,
  addToCart,
}: ProductBoxProps) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [reviews, setReviews] = useState<Review[]>(product.reviews || []);
  const [newComment, setNewComment] = useState("");
  const [newRating, setNewRating] = useState(5);
  const [loadingReview, setLoadingReview] = useState(false);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);
  const [showReviewsDropdown, setShowReviewsDropdown] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const handleAddToCart = async (productId: string) => {
    try {
      const res = await fetch(`/api/cart/${productId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Product added to cart!");
      } else {
        toast.error(data.error || "Failed to add to cart");
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error("Failed to add product to cart");
    }
  };

  // ✅ Fetch logged-in user ID from NextAuth JWT session
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const session = await getSession();
        if (session?.user?.id) {
          setCurrentUserId(session.user.id);
        }
      } catch (err) {
        console.error("Error fetching session:", err);
      }
    };
    fetchUserId();
  }, []);

  // ✅ Add Review
  const handleAddReview = async () => {
    if (!newComment.trim()) {
      toast.warn("Please write a review before submitting!");
      return;
    }

    setLoadingReview(true);
    try {
      const res = await fetch(`/api/products/reviews/${product._id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: newRating, comment: newComment }),
      });
      const json = await res.json();
      if (res.ok) {
        setReviews(json.product.reviews);
        setNewComment("");
        setNewRating(5);
        toast.success("Review added successfully!");
      } else {
        toast.error(json.error || "Failed to add review");
      }
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong while adding review");
    }
    setLoadingReview(false);
  };

  // ✅ Delete Review (Correct API route)
  const handleDeleteReview = async (reviewId: string) => {
    setDeletingReviewId(reviewId);
    try {
      const res = await fetch(
        `/api/products/reviews/${product._id}/delete/${reviewId}`,
        { method: "DELETE" }
      );

      const json = await res.json();

      if (res.ok) {
        setReviews(json.product.reviews);
        toast.success("Review deleted successfully!");
      } else {
        toast.error(json.error || "Failed to delete review");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error deleting review");
    } finally {
      setDeletingReviewId(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex justify-center items-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-3xl flex flex-col md:flex-row max-w-6xl w-full overflow-hidden shadow-2xl relative transition-all duration-300">
        {/* Toast Container */}
        <ToastContainer position="bottom-right" autoClose={2000} theme="dark" />

        {/* Left: Product Image + Details */}
        <div className="flex flex-col md:w-1/2 p-4 gap-4">
          <img
            src={product.images[selectedImage]?.url || "/placeholder.png"}
            alt={product.title}
            className="rounded-xl w-full h-64 object-cover"
          />
          <h2 className="text-2xl font-bold">{product.title}</h2>
          <p className="text-gray-600 dark:text-gray-300">
            {product.description}
          </p>
          <p className="text-indigo-600 font-bold text-xl">${product.price}</p>
          <button
            onClick={() => handleAddToCart(product._id)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-semibold w-fit"
          >
            Add to Cart
          </button>
        </div>

        {/* Right: Thumbnails + Reviews */}
        <div className="md:w-1/2 flex flex-col p-4 gap-4">
          {/* Thumbnails */}
          <div className="flex gap-2 overflow-x-auto mb-2">
            {product.images.map((img, idx) => (
              <img
                key={idx}
                src={img.url}
                alt={`thumb-${idx}`}
                className={`w-16 h-16 rounded-lg cursor-pointer border-2 ${
                  idx === selectedImage
                    ? "border-indigo-500"
                    : "border-transparent"
                }`}
                onClick={() => setSelectedImage(idx)}
              />
            ))}
          </div>

          {/* Reviews */}
          <div>
            <button
              className="bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded-lg"
              onClick={() => setShowReviewsDropdown(!showReviewsDropdown)}
            >
              {showReviewsDropdown ? "Hide Reviews" : "Show Reviews"}
            </button>

            {showReviewsDropdown && (
              <div className="mt-2 max-h-64 overflow-y-auto flex flex-col gap-2">
                {reviews.length === 0 && (
                  <p className="text-sm text-gray-500">No reviews yet.</p>
                )}

                {reviews.map((rev) => {
                  const canDelete =
                    rev?.userId?._id?.toString() === currentUserId?.toString();

                  return (
                    <div
                      key={rev._id}
                      className="flex justify-between items-start bg-gray-100 dark:bg-gray-700 rounded-lg p-2 gap-2"
                    >
                      <div className="flex gap-2 items-center">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-400">
                          <img
                            src={
                              rev.userId?.profileImage?.url ||
                              "/placeholder.png"
                            }
                            alt={rev.userId?.fullName || "User"}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-semibold">
                            {rev.userId?.fullName}
                          </p>
                          <p className="text-sm">
                            {rev.comment}{" "}
                            <span className="text-yellow-500 font-semibold">
                              ({rev.rating}/5)
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* 🗑️ Delete Button */}
                      {canDelete && (
                        <button
                          disabled={deletingReviewId === rev._id}
                          onClick={() => handleDeleteReview(rev._id!)}
                          className={`text-red-600 hover:text-red-800 transition ${
                            deletingReviewId === rev._id
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }`}
                          title="Delete Review"
                        >
                          {deletingReviewId === rev._id ? (
                            <span className="animate-spin">⏳</span>
                          ) : (
                            <Trash2 size={18} />
                          )}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Add Review */}
          <div className="flex flex-col gap-2 mt-auto">
            <input
              type="text"
              placeholder="Write a review..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="border rounded-lg p-2 bg-gray-50 dark:bg-gray-700 dark:text-white"
            />
            <input
              type="number"
              min={1}
              max={5}
              value={newRating}
              onChange={(e) => setNewRating(Number(e.target.value))}
              className="border rounded-lg p-2 w-20 bg-gray-50 dark:bg-gray-700 dark:text-white"
            />
            <button
              onClick={handleAddReview}
              disabled={loadingReview}
              className={`px-4 py-2 rounded-lg font-semibold w-fit text-white ${
                loadingReview
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {loadingReview ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Adding...
                </span>
              ) : (
                "Add Review"
              )}
            </button>
          </div>
        </div>

        {/* ❌ Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <FiX size={24} />
        </button>
      </div>
    </div>
  );
}
