"use client";

import { useState } from 'react';
import { useCategories, useBrands, useProductsByLocation } from '@/hooks/use-api';

export default function DebugAPI() {
  const [testPincode, setTestPincode] = useState('302001');
  const [testCategory, setTestCategory] = useState('');
  
  const { data: categories, isLoading: categoriesLoading, error: categoriesError } = useCategories();
  const { data: brands, isLoading: brandsLoading, error: brandsError } = useBrands();
  const { 
    data: products, 
    isLoading: productsLoading, 
    error: productsError 
  } = useProductsByLocation(testPincode, {
    category: testCategory || undefined,
    limit: 5
  });

  return (
    <div className="p-4 bg-gray-100 rounded-lg">
      <h3 className="text-lg font-bold mb-4">API Debug Panel</h3>
      
      <div className="space-y-4">
        <div>
          <h4 className="font-semibold">Categories:</h4>
          {categoriesLoading && <p>Loading categories...</p>}
          {categoriesError && <p className="text-red-500">Error: {categoriesError.message}</p>}
          {categories && (
            <div>
              <p>Found {categories.length} categories</p>
              <select 
                value={testCategory} 
                onChange={(e) => setTestCategory(e.target.value)}
                className="mt-2 p-2 border rounded"
              >
                <option value="">All Categories</option>
                {categories.map((cat: any) => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div>
          <h4 className="font-semibold">Brands:</h4>
          {brandsLoading && <p>Loading brands...</p>}
          {brandsError && <p className="text-red-500">Error: {brandsError.message}</p>}
          {brands && <p>Found {brands.length} brands</p>}
        </div>

        <div>
          <h4 className="font-semibold">Products by Location:</h4>
          <input 
            type="text" 
            value={testPincode} 
            onChange={(e) => setTestPincode(e.target.value)}
            placeholder="Enter pincode"
            className="p-2 border rounded mr-2"
          />
          {productsLoading && <p>Loading products...</p>}
          {productsError && (
            <div className="text-red-500">
              <p>Error: {productsError.message}</p>
              <pre className="text-xs bg-red-50 p-2 rounded mt-2">
                {JSON.stringify(productsError, null, 2)}
              </pre>
            </div>
          )}
          {products && (
            <div>
              <p>Success: {products.success ? 'Yes' : 'No'}</p>
              <p>Found {products.products?.length || 0} products</p>
              <p>Total: {products.totalProducts || 0}</p>
              {products.error && <p className="text-red-500">API Error: {products.error}</p>}
              {products.products && products.products.length > 0 && (
                <div className="mt-2">
                  <h5 className="font-medium">Sample Products:</h5>
                  {products.products.slice(0, 3).map((product: any) => (
                    <div key={product._id} className="text-sm bg-white p-2 rounded mt-1">
                      <p><strong>{product.name}</strong></p>
                      <p>Price: ₹{product.price}</p>
                      <p>Stock: {product.stock}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}