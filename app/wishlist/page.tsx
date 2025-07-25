"use client";
import { useAppContext } from "@/components/app-provider";
import { Button } from "@/components/ui/button";
import { Heart, ShoppingCart, ArrowLeft, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function WishlistPage() {
  const { wishlistItems, removeFromWishlist, addToCart, isInWishlist } = useAppContext();
  const router = useRouter();

  const moveToCart = (item: any) => {
    addToCart(item);
    removeFromWishlist(item.id);
  };

  if (wishlistItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="container mx-auto px-4 py-12">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="outline"
              size="icon"
              onClick={() => router.back()}
              className="rounded-full hover:scale-105 transition-transform"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Heart className="h-8 w-8 text-red-500" fill="#ef4444" strokeWidth={0} />
              My Wishlist
            </h1>
          </div>

          {/* Empty Wishlist */}
          <div className="text-center py-20">
            <div className="bg-white rounded-3xl p-12 shadow-xl border border-gray-100 max-w-md mx-auto">
              <Heart className="h-24 w-24 text-gray-300 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Your wishlist is empty</h2>
              <p className="text-gray-500 mb-8">Save items you love for later by clicking the heart icon.</p>
              <Link href="/search">
                <Button className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                  Start Shopping
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.back()}
            className="rounded-full hover:scale-105 transition-transform"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Heart className="h-8 w-8 text-red-500" fill="#ef4444" strokeWidth={0} />
            My Wishlist
          </h1>
          <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
            {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'}
          </span>
        </div>

        {/* Wishlist Items Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {wishlistItems.map((item) => {
            const hasDiscount = item.mrp != null && item.mrp > item.price;
            const discountPercent = hasDiscount ? Math.round((((item.mrp ?? 0) - item.price) / (item.mrp ?? 1)) * 100) : 0;
            return (
              <div key={item.id || item._id} className="min-w-[180px] max-w-[180px] bg-white border border-gray-200 rounded-xl flex flex-col relative group font-sans" style={{ fontFamily: 'Sinkin Sans, sans-serif', boxShadow: 'none' }}>
                {/* Discount Badge */}
                {hasDiscount && (
                  <div className="absolute left-3 top-0 z-10 flex items-center justify-center" style={{ width: '29px', height: '28px' }}>
                    <svg width="29" height="28" viewBox="0 0 29 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M28.9499 0C28.3999 0 27.9361 1.44696 27.9361 2.60412V27.9718L24.5708 25.9718L21.2055 27.9718L17.8402 25.9718L14.4749 27.9718L11.1096 25.9718L7.74436 27.9718L4.37907 25.9718L1.01378 27.9718V2.6037C1.01378 1.44655 0.549931 0 0 0H28.9499Z" fill="#256fef"></path>
                    </svg>
                    <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center text-center text-[9px] font-extrabold text-white z-20" style={{ pointerEvents: 'none' }}>
                      {discountPercent}%<br/>OFF
                    </div>
                  </div>
                )}
                {/* Remove from Wishlist Button */}
                <button
                  className="absolute top-2 right-2 z-10 p-1 rounded-full bg-white shadow hover:bg-gray-100"
                  onClick={() => removeFromWishlist(item.id || item._id)}
                  aria-label="Remove from wishlist"
                >
                  <Trash2 className="w-5 h-5 text-red-500" />
                </button>
                {/* Product Image */}
                <div className="flex justify-center items-center h-32 pt-2">
                  <Image src={item.image || "/placeholder.svg"} alt={item.name} width={120} height={120} className="w-[120px] h-[120px] object-contain" />
                </div>
                <div className="px-3 py-2 flex-1 flex flex-col">
                  {/* Product Name */}
                  <div className="text-[12px] font-bold text-gray-900 line-clamp-2 mb-2 leading-snug">
                    {item.name}
                  </div>
                  {/* Variant/Weight/Unit */}
                  <div className="text-xs text-gray-500 mb-2 font-normal">
                    {item.unit}
                  </div>
                  {/* Bottom Section: Price, MRP, Add to Cart button */}
                  <div className="flex items-end justify-between mt-2">
                    <div>
                      <div className="text-[15px] font-bold text-gray-900 leading-none mb-1">₹{item.price}</div>
                      {hasDiscount && (
                        <div className="text-xs text-gray-400 line-through leading-none font-normal">₹{item.mrp}</div>
                      )}
                    </div>
                    <button
                      className="border border-green-600 text-green-700 font-medium text-[15px] bg-white hover:bg-green-50 transition rounded h-8 px-3"
                      onClick={() => moveToCart(item)}
                    >ADD</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Continue Shopping */}
        <div className="flex justify-center mt-12">
          <Link href="/search" className="flex">
            <Button className="bg-gradient-to-r from-green-500 to-green-700 hover:from-green-600 hover:to-green-800 text-white px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 text-lg font-semibold flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 mr-2" />
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}