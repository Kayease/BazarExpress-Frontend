import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.toLowerCase() || '';
  const category = searchParams.get('category') || '';

  // Fetch all products from backend
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products`);
  const products = await res.json();

  // Fetch all categories from backend
  const catRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories`);
  const allCategories = await catRes.json();
  const mainCategories = allCategories.filter((cat: any) => !cat.parent || cat.parent === null);

  // Filter products by name/description and category
  const filteredProducts = products.filter((prod: any) => {
    const matchesQuery =
      prod.name.toLowerCase().includes(q) ||
      (prod.description && prod.description.toLowerCase().includes(q));
    const matchesCategory =
      !category ||
      (prod.category && prod.category._id && String(prod.category._id) === String(category));
    return matchesQuery && matchesCategory;
  });

  return NextResponse.json({
    products: filteredProducts,
    categories: mainCategories,
  });
} 