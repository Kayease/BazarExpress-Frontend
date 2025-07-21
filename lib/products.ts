export interface Product {
  galleryImages: any
  id: string
  name: string
  price: number
  originalPrice?: number
  images: string[]
  category: string
  rating: number
  reviewCount: number
  description: string
  features: string[]
  specifications: Record<string, string>
  isNew?: boolean
  isSale?: boolean
  inStock: boolean
  stockCount: number
  brand: string
  sku: string
}

export interface Review {
  id: string
  userId: string
  userName: string
  rating: number
  title: string
  comment: string
  date: string
  verified: boolean
  helpful: number
}

// Mock products database
export const products: Product[] = [
  {
    id: "1",
    name: "Wireless Bluetooth Headphones",
    price: 79.99,
    originalPrice: 99.99,
    images: [
      "/placeholder.svg?height=600&width=600",
      "/placeholder.svg?height=600&width=600",
      "/placeholder.svg?height=600&width=600",
      "/placeholder.svg?height=600&width=600",
    ],
    category: "Electronics",
    rating: 4.5,
    reviewCount: 128,
    description:
      "Experience premium sound quality with these wireless Bluetooth headphones. Featuring active noise cancellation, 30-hour battery life, and comfortable over-ear design perfect for music lovers and professionals.",
    features: [
      "Active Noise Cancellation",
      "30-hour battery life",
      "Bluetooth 5.0 connectivity",
      "Quick charge - 5 min for 2 hours playback",
      "Comfortable over-ear design",
      "Built-in microphone for calls",
    ],
    specifications: {
      "Driver Size": "40mm",
      "Frequency Response": "20Hz - 20kHz",
      Impedance: "32 Ohm",
      "Battery Life": "30 hours",
      "Charging Time": "2 hours",
      Weight: "250g",
      Connectivity: "Bluetooth 5.0, 3.5mm jack",
    },
    isNew: true,
    isSale: true,
    inStock: true,
    stockCount: 15,
    brand: "AudioTech",
    sku: "AT-WBH-001",
  },
  {
    id: "2",
    name: "Smart Fitness Watch",
    price: 199.99,
    images: [
      "/placeholder.svg?height=600&width=600",
      "/placeholder.svg?height=600&width=600",
      "/placeholder.svg?height=600&width=600",
    ],
    category: "Electronics",
    rating: 4.8,
    reviewCount: 89,
    description:
      "Track your fitness goals with this advanced smartwatch. Features heart rate monitoring, GPS tracking, sleep analysis, and 7-day battery life. Compatible with iOS and Android.",
    features: [
      "Heart rate monitoring",
      "Built-in GPS",
      "Sleep tracking",
      "7-day battery life",
      "Water resistant (5ATM)",
      "50+ workout modes",
    ],
    specifications: {
      Display: '1.4" AMOLED',
      "Battery Life": "7 days",
      "Water Resistance": "5ATM",
      Connectivity: "Bluetooth 5.0, WiFi",
      Sensors: "Heart rate, GPS, Accelerometer",
      Compatibility: "iOS 12+, Android 6.0+",
    },
    isNew: true,
    inStock: true,
    stockCount: 8,
    brand: "FitTech",
    sku: "FT-SW-002",
  },
  {
    id: "3",
    name: "Premium Coffee Maker",
    price: 149.99,
    originalPrice: 179.99,
    images: ["/placeholder.svg?height=600&width=600", "/placeholder.svg?height=600&width=600"],
    category: "Home & Kitchen",
    rating: 4.3,
    reviewCount: 67,
    description:
      "Brew the perfect cup every time with this premium coffee maker. Features programmable settings, thermal carafe, and built-in grinder for the freshest coffee experience.",
    features: [
      "Built-in coffee grinder",
      "Programmable timer",
      "Thermal carafe keeps coffee hot",
      "Auto shut-off safety feature",
      "Easy-clean design",
      "Makes 12 cups",
    ],
    specifications: {
      Capacity: "12 cups",
      "Carafe Type": "Thermal stainless steel",
      Grinder: "Burr grinder",
      Timer: "24-hour programmable",
      Power: "1200W",
      Dimensions: '14" x 10" x 16"',
    },
    isSale: true,
    inStock: true,
    stockCount: 12,
    brand: "BrewMaster",
    sku: "BM-PCM-003",
  },
  {
    id: "4",
    name: "Organic Cotton T-Shirt",
    price: 29.99,
    images: ["/placeholder.svg?height=600&width=600", "/placeholder.svg?height=600&width=600"],
    category: "Fashion",
    rating: 4.6,
    reviewCount: 45,
    description:
      "Comfortable and sustainable organic cotton t-shirt. Made from 100% certified organic cotton with a relaxed fit perfect for everyday wear.",
    features: [
      "100% organic cotton",
      "GOTS certified",
      "Pre-shrunk fabric",
      "Tagless for comfort",
      "Available in multiple colors",
      "Unisex design",
    ],
    specifications: {
      Material: "100% Organic Cotton",
      Fit: "Relaxed",
      Care: "Machine wash cold",
      Certification: "GOTS",
      Origin: "Made in USA",
      Sizes: "XS - XXL",
    },
    inStock: true,
    stockCount: 25,
    brand: "EcoWear",
    sku: "EW-OCT-004",
  },
]

// Mock reviews database
export const reviews: Record<string, Review[]> = {
  "1": [
    {
      id: "r1",
      userId: "u1",
      userName: "Sarah M.",
      rating: 5,
      title: "Amazing sound quality!",
      comment:
        "These headphones exceeded my expectations. The noise cancellation is fantastic and the battery life is exactly as advertised. Perfect for my daily commute.",
      date: "2024-03-10",
      verified: true,
      helpful: 12,
    },
    {
      id: "r2",
      userId: "u2",
      userName: "Mike R.",
      rating: 4,
      title: "Great value for money",
      comment:
        "Really impressed with the build quality and sound. Only minor complaint is they can get a bit warm during long listening sessions.",
      date: "2024-03-08",
      verified: true,
      helpful: 8,
    },
    {
      id: "r3",
      userId: "u3",
      userName: "Jennifer L.",
      rating: 5,
      title: "Perfect for work calls",
      comment:
        "The microphone quality is excellent for video calls. My colleagues say I sound crystal clear. Highly recommend for remote work.",
      date: "2024-03-05",
      verified: true,
      helpful: 15,
    },
  ],
  "2": [
    {
      id: "r4",
      userId: "u4",
      userName: "David K.",
      rating: 5,
      title: "Best fitness tracker I've owned",
      comment:
        "Accurate heart rate monitoring and GPS tracking. The battery really does last a full week with moderate use. Love the sleep tracking feature.",
      date: "2024-03-12",
      verified: true,
      helpful: 9,
    },
    {
      id: "r5",
      userId: "u5",
      userName: "Lisa P.",
      rating: 4,
      title: "Great features, minor app issues",
      comment:
        "The watch itself is fantastic, but the companion app could use some improvements. Overall very happy with the purchase.",
      date: "2024-03-07",
      verified: true,
      helpful: 6,
    },
  ],
}

export const getProductById = (id: string): Product | undefined => {
  return products.find((product) => product.id === id)
}

export const getProductBySlug = (slug: string): Product | undefined => {
  // For mock, use name to slug conversion
  const slugify = (str: string) =>
    str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return products.find((product) => slugify(product.name) === slug);
};

export const getRelatedProducts = (productId: string, category: string, limit = 4): Product[] => {
  return products.filter((product) => product.id !== productId && product.category === category).slice(0, limit)
}

export const getProductReviews = (productId: string): Review[] => {
  return reviews[productId] || []
}
