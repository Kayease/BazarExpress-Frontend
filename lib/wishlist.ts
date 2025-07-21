export interface WishlistItem {
  id: string
  name: string
  price: number
  originalPrice?: number
  image: string
  category: string
  rating: number
}

export const getWishlistItems = (): WishlistItem[] => {
  if (typeof window === "undefined") return []
  const wishlistStr = localStorage.getItem("wishlist")
  return wishlistStr ? JSON.parse(wishlistStr) : []
}

export const setWishlistItems = (items: WishlistItem[]) => {
  if (typeof window === "undefined") return
  localStorage.setItem("wishlist", JSON.stringify(items))
}

export const addToWishlist = (product: any) => {
  const items = getWishlistItems()
  const exists = items.find((item) => item.id === product.id)

  if (!exists) {
    items.push({
      id: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice,
      image: product.image,
      category: product.category,
      rating: product.rating,
    })
    setWishlistItems(items)
  }
}

export const removeFromWishlist = (productId: string) => {
  const items = getWishlistItems().filter((item) => item.id !== productId)
  setWishlistItems(items)
}

export const isInWishlist = (productId: string): boolean => {
  return getWishlistItems().some((item) => item.id === productId)
}
