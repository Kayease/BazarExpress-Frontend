"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, Send, X, AlertCircle, CheckCircle, MessageSquare, ThumbsUp, User } from "lucide-react";
import { useAppContext } from "@/components/app-provider";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import LoginModal from "@/components/login-modal";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  productImage?: string;
  onReviewSubmitted: () => void;
}

export function ReviewModal({
  isOpen,
  onClose,
  productId,
  productName,
  productImage,
  onReviewSubmitted,
}: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const { user } = useAppContext();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      // Close review modal and open login modal
      onClose();
      setIsLoginModalOpen(true);
      toast.error("Please log in to submit a review.");
      return;
    }

    if (rating === 0) {
      toast.error("Please select a rating before submitting.");
      return;
    }

    if (!title.trim() || !comment.trim()) {
      toast.error("Please provide both a title and comment for your review.");
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId,
          rating,
          title: title.trim(),
          comment: comment.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to submit review');
      }

      setSubmitStatus('success');
      toast.success("Review submitted successfully! It will appear after admin approval.", {
        duration: 4000,
        icon: '✅',
      });

      // Reset form
      setRating(0);
      setTitle("");
      setComment("");
      
      // Call callback to refresh reviews
      onReviewSubmitted();
      
      // Close modal after a short delay
      setTimeout(() => {
        onClose();
        setSubmitStatus('idle');
      }, 2000);

    } catch (error) {
      console.error('Error submitting review:', error);
      setSubmitStatus('error');
      
      let errorMessage = "Failed to submit review. Please try again.";
      if (error instanceof Error) {
        if (error.message.includes("haven't purchased")) {
          errorMessage = "You can't review a product you haven't purchased.";
        } else if (error.message.includes("before it's delivered")) {
          errorMessage = "You can't review this product before it's delivered.";
        } else if (error.message.includes('already reviewed')) {
          errorMessage = "You have already reviewed this product.";
        } else if (error.message.includes('login') || error.message.includes('authentication')) {
          errorMessage = "Please log in to submit a review.";
          // Close review modal and open login modal
          onClose();
          setIsLoginModalOpen(true);
        } else {
          errorMessage = error.message;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setRating(0);
      setHoveredRating(0);
      setTitle("");
      setComment("");
      setSubmitStatus('idle');
      onClose();
    }
  };

  const handleLoginModalClose = () => {
    setIsLoginModalOpen(false);
  };

  if (submitStatus === 'success') {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="w-[95vw] max-w-xs mx-auto sm:mx-0 sm:w-full max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white to-gray-50 rounded-xl border-0 shadow-xl [&>button]:hidden">
          <div className="text-center py-4 px-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full blur-lg opacity-30 animate-pulse"></div>
              <CheckCircle className="relative h-10 w-10 text-emerald-500 mx-auto mb-3" />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-2 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Review Submitted!
            </h3>
            <p className="text-xs text-gray-600 mb-3 px-1 leading-relaxed">
              Thank you for your valuable feedback! Your review is now pending approval and will be visible once approved by our team.
            </p>
            <Button 
              onClick={handleClose} 
              className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border-0 px-5 py-2 rounded-lg text-sm"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="w-[95vw] z-[999] max-w-sm mx-auto sm:mx-0 sm:w-full max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white to-gray-50 rounded-xl border-0 shadow-xl [&>button]:hidden">
          <DialogHeader className="px-3 pt-3 pb-1">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <div className="p-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-md">
                    <MessageSquare className="h-3.5 w-3.5 text-white" />
                  </div>
                  <div>
                    <DialogTitle className="text-base font-bold text-gray-900">
                      Write a Review
                    </DialogTitle>
                    <p className="text-xs text-gray-600 mt-0 flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {productName}
                    </p>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                disabled={isSubmitting}
                className="h-6 w-6 p-0 hover:bg-gray-100 rounded-full"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-3 px-3 pb-3">
            {/* Rating Section */}
            <div className="space-y-1.5">
              <Label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                <Star className="h-3.5 w-3.5 text-yellow-500" />
                Rating <span className="text-red-500">*</span>
              </Label>
              <div className="flex items-center gap-1 flex-wrap">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className="group p-1 transition-all duration-300 hover:scale-110 hover:rotate-12"
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    onClick={() => setRating(star)}
                    disabled={isSubmitting}
                  >
                    <Star
                      className={`h-5 w-5 transition-all duration-300 ${
                        star <= (hoveredRating || rating)
                          ? "text-yellow-400 fill-yellow-400 drop-shadow-lg"
                          : "text-gray-300 group-hover:text-yellow-200"
                      }`}
                    />
                  </button>
                ))}
                {rating > 0 && (
                  <div className="ml-1.5 px-1.5 py-0.5 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-full">
                    <span className="text-xs font-medium text-yellow-800">
                      {rating === 1 && "Poor"}
                      {rating === 2 && "Fair"}
                      {rating === 3 && "Good"}
                      {rating === 4 && "Very Good"}
                      {rating === 5 && "Excellent"}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Title Section */}
            <div className="space-y-1">
              <Label htmlFor="title" className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                <ThumbsUp className="h-3.5 w-3.5 text-blue-500" />
                Review Title <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Summarize your experience in a few words..."
                  maxLength={60}
                  disabled={isSubmitting}
                  className="w-full border-2 border-gray-200 hover:border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 rounded-md h-9 text-sm placeholder:text-xs"
                />
                <div className="absolute right-1.5 top-1/2 transform -translate-y-1/2">
                  <span className={`text-xs font-medium px-1 py-0.5 rounded-full ${
                    title.length > 45 ? 'bg-red-100 text-red-700' : 
                    title.length > 30 ? 'bg-yellow-100 text-yellow-700' : 
                    'bg-green-100 text-green-700'
                  }`}>
                    {title.length}/60
                  </span>
                </div>
              </div>
            </div>

            {/* Comment Section */}
            <div className="space-y-1">
              <Label htmlFor="comment" className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-purple-500" />
                Your Review <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your detailed thoughts about this product... What did you like? What could be improved?"
                  rows={2}
                  maxLength={500}
                  disabled={isSubmitting}
                  className="w-full resize-none border-2 border-gray-200 hover:border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all duration-300 rounded-md text-sm placeholder:text-xs"
                />
                <div className="absolute right-1.5 bottom-1.5">
                  <span className={`text-xs font-medium px-1 py-0.5 rounded-full ${
                    comment.length > 400 ? 'bg-red-100 text-red-700' : 
                    comment.length > 300 ? 'bg-yellow-100 text-yellow-700' : 
                    'bg-green-100 text-green-700'
                  }`}>
                    {comment.length}/500
                  </span>
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex flex-col sm:flex-row gap-1.5 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1 h-9 border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-300 font-medium rounded-md text-gray-700 text-sm"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || rating === 0 || !title.trim() || !comment.trim()}
                className="flex-1 h-9 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border-0 rounded-md disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1.5"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-3 w-3 mr-1.5" />
                    Submit Review
                  </>
                )}
              </Button>
            </div>

            {/* Help Text */}
            <div className="text-center pt-0.5">
              <p className="text-xs text-gray-500">
                Your review will be visible to other customers after approval
              </p>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Login Modal */}
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={handleLoginModalClose} 
      />
    </>
  );
}