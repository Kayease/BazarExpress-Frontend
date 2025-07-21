"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AdvancedProductForm from "@/components/AdvancedProductForm";

export default function EditProductPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${id}`)
      .then(res => res.json())
      .then(data => {
        setProduct(data);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className="p-8">Loading...</div>;
  if (!product) return <div className="p-8 text-red-500">Product not found</div>;

  return <AdvancedProductForm mode="edit" initialProduct={product} productId={id} />;
} 