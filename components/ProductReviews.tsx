import React, { memo } from 'react';
import { Button } from "@/components/ui/button";
import { Star, User, CheckCircle, ThumbsUp, ThumbsDown, MessageSquare } from "lucide-react";

interface ProductReviewsProps {
  reviews: any[];
  reviewsLoading: boolean;
  displayRating: number;
  displayReviewCount: number;
  setIsReviewModalOpen: (open: boolean) => void;
  handleMarkHelpful: (reviewId: string, helpful: boolean) => void;
}

const ProductReviews = memo(({ 
  reviews, 
  reviewsLoading, 
  displayRating, 
  displayReviewCount, 
  setIsReviewModalOpen, 
  handleMarkHelpful 
}: ProductReviewsProps) => {
  if (reviewsLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse border border-gray-200 rounded-lg p-3 bg-gray-50/30">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
              <div className="space-y-1.5 flex-1">
                <div className="h-3 bg-gray-200 rounded w-24"></div>
                <div className="h-2.5 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="h-3 bg-gray-200 rounded w-full"></div>
              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8 bg-white border border-gray-200 rounded-lg">
        <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 mb-4">No reviews yet</p>
        <Button 
          onClick={() => setIsReviewModalOpen(true)} 
          variant="outline"
          className="bg-white hover:bg-brand-primary hover:text-white hover:border-brand-primary transition-all duration-300 border-2 font-medium"
        >
          Be the first to review
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Overall Rating Section */}
      <div className="bg-gradient-to-r from-gray-50 to-white rounded-lg p-6 border border-gray-200">
        <div className="grid grid-cols-3 gap-6 items-center">
          {/* Left: Stars and Rating */}
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center gap-1 mb-3">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-6 w-6 ${i < Math.floor(displayRating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                />
              ))}
            </div>
            <div className="text-center">
              <span className="text-2xl font-bold text-gray-900">{displayRating.toFixed(1)}</span>
              <span className="text-sm text-gray-500 ml-1">out of 5</span>
            </div>
          </div>
          
          {/* Center: Total Reviews */}
          <div className="flex flex-col items-center text-center border-l border-r border-gray-200 px-6">
            <div className="text-3xl font-bold text-gray-900 mb-1">{displayReviewCount}</div>
            <div className="text-sm text-gray-500">Total Reviews</div>
          </div>
          
          {/* Right: Write Review Button */}
          <div className="flex justify-center">
            <Button 
              onClick={() => setIsReviewModalOpen(true)} 
              className="bg-gradient-to-r from-brand-primary to-brand-primary-dark hover:from-brand-primary-dark hover:to-brand-primary text-white font-semibold shadow-lg transition-all duration-300 px-8 py-3 text-base"
            >
              <MessageSquare className="h-5 w-5 mr-2" />
              Write a Review
            </Button>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-3">
        {reviews.slice(0, 5).map((review: any) => (
          <div key={review._id} className="border border-gray-200 rounded-lg p-3 bg-gray-50/30 hover:bg-gray-50/60 transition-all duration-200">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-brand-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="h-4 w-4 text-brand-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-1">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-gray-900 text-sm truncate">{review.user.name}</p>
                      {review.verified && (
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white text-xs font-medium rounded-full">
                          <CheckCircle className="h-3 w-3" />
                          Verified
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mb-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-3 w-3 ${i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`} />
                      ))}
                      <span className="text-xs text-gray-500 ml-1">{review.rating}/5</span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 flex-shrink-0">{new Date(review.createdAt).toLocaleDateString()}</span>
                </div>
                {review.title && (
                  <h4 className="font-medium text-gray-900 text-sm mb-1 line-clamp-1">{review.title}</h4>
                )}
                <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">{review.comment}</p>
                
                {/* Review Actions */}
                {review.helpful !== undefined && (
                  <div className="flex items-center gap-3 mt-2 pt-2 border-t border-gray-200/50">
                    <button
                      onClick={() => handleMarkHelpful(review._id, true)}
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-green-600 transition-colors"
                    >
                      <ThumbsUp className="h-3 w-3" />
                      Helpful ({review.helpful || 0})
                    </button>
                    <button
                      onClick={() => handleMarkHelpful(review._id, false)}
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-600 transition-colors"
                    >
                      <ThumbsDown className="h-3 w-3" />
                      Not helpful
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {/* View All Reviews Button */}
        {reviews.length > 5 && (
          <div className="text-center pt-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full border-2 border-gray-200 hover:border-brand-primary hover:bg-brand-primary hover:text-white transition-all duration-300"
            >
              View All {displayReviewCount} Reviews
            </Button>
          </div>
        )}
      </div>
    </div>
  );
});

ProductReviews.displayName = 'ProductReviews';

export default ProductReviews;
