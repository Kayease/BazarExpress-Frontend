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
            <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
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
          <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
          <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
            {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'}
          </span>
        </div>

        {/* Wishlist Items Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {wishlistItems.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 group">
              {/* Product Image */}
              <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 mb-4">
                <Link href={`/products/${item.id}`}>
                  <Image
                    src={item.image || '/placeholder.svg'}
                    alt={item.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </Link>
                <button
                  onClick={() => removeFromWishlist(item.id)}
                  className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors shadow-lg hover:scale-110 transform duration-200"
                  aria-label="Remove from wishlist"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Product Details */}
              <div className="space-y-3">
                <Link href={`/products/${item.id}`}>
                  <h3 className="font-semibold text-gray-900 text-lg line-clamp-2 hover:text-green-600 transition-colors">
                    {item.name}
                  </h3>
                </Link>
                
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{item.category}</span>
                  <span>{item.brand}</span>
                </div>

                <div className="text-2xl font-bold text-green-600">
                  ₹{item.price.toLocaleString()}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => moveToCart(item)}
                    className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-2 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Add to Cart
                  </Button>
                  <Link href={`/products/${item.id}`}>
                    <Button
                      variant="outline"
                      className="px-4 py-2 rounded-xl border-2 hover:bg-gray-50 transition-colors"
                    >
                      View
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Continue Shopping */}
        <div className="text-center mt-12">
          <Link href="/search">
            <Button variant="outline" className="px-8 py-3 rounded-xl border-2 hover:bg-gray-50 transition-colors">
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}