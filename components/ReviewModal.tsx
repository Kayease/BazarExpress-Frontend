"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star, Send, X, AlertCircle, CheckCircle } from "lucide-react";
import { useAppContext } from "@/components/app-provider";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

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
  const { user } = useAppContext();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Please log in to submit a review.");
      setTimeout(() => {
        onClose();
        router.push('/login');
      }, 1500);
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

  if (submitStatus === 'success') {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <div className="text-center py-8">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Review Submitted Successfully!
            </h3>
            <p className="text-gray-600 mb-4">
              Thank you for your feedback. Your review is now pending approval and will be visible once approved by our team.
            </p>
            <Button onClick={handleClose} className="bg-green-600 hover:bg-green-700">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Write a Review</DialogTitle>
          <p className="text-sm text-gray-600 mt-1">{productName}</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Rating */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              Rating <span className="text-red-500">*</span>
            </Label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="p-1 transition-colors"
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => setRating(star)}
                  disabled={isSubmitting}
                >
                  <Star
                    className={`h-6 w-6 transition-colors ${
                      star <= (hoveredRating || rating)
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-300 hover:text-yellow-200"
                    }`}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-2 text-sm text-gray-600">
                  {rating === 1 && "Poor"}
                  {rating === 2 && "Fair"}
                  {rating === 3 && "Good"}
                  {rating === 4 && "Very Good"}
                  {rating === 5 && "Excellent"}
                </span>
              )}
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              Review Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Summarize your experience"
              maxLength={60}
              disabled={isSubmitting}
              className="w-full"
            />
            <p className="text-xs text-gray-500">{title.length}/60</p>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label htmlFor="comment" className="text-sm font-medium">
              Your Review <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your thoughts about this product..."
              rows={3}
              maxLength={500}
              disabled={isSubmitting}
              className="w-full resize-none"
            />
            <p className="text-xs text-gray-500">{comment.length}/500</p>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || rating === 0 || !title.trim() || !comment.trim()}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit
                </>
              )}
            </Button>
          </div>
        </form>

        {!user && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-yellow-800">
                  Please log in to submit a review. Only customers who have purchased and received this product can write reviews.
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  onClose();
                  router.push('/login');
                }}
                className="bg-yellow-600 hover:bg-yellow-700 text-white text-xs px-3 py-1 h-auto"
              >
                Login
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}