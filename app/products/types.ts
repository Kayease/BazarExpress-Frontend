export interface Category {
  _id: string;
  name: string;
  parentId: string;
  hide: boolean;
  popular: boolean;
  icon: string;
  description?: string;
  slug?: string;
  thumbnail?: string;
  showOnHome: boolean;
  productCount?: number;
}

export interface Brand {
  _id: string;
  name: string;
  slug: string;
  logo?: string;
  productCount?: number;
}

export interface Product {
  _id: string;
  name: string;
  price: number;
  description?: string;
  images: string[];
  category?: string | Category;
  subcategory?: string | Category;
  brand?: string | Brand;
  variants?: Record<string, {
    name: string;
    price: number;
    stock: number;
  }>;
  createdAt: string;
}

export type ViewMode = "grid" | "list";

export interface ProductFiltersState {
  brand?: string[];
  sort?: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface CategoryState {
  category?: string;
  subcategory?: string;
}
