import { useState, useEffect, useCallback } from 'react';
import { Category } from '../types';

export function useCategories(selectedCategory?: string, selectedSubcategory?: string) {
  const [parentCategories, setParentCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [selectedParentCategory, setSelectedParentCategory] = useState<Category | null>(null);
  
  // Debug logging
  const logDebug = (message: string, data?: any) => {
    console.log(`[useCategories] ${message}`, data || '');
  };

  // Fetch parent categories on mount
  useEffect(() => {
    fetchParentCategories();
  }, []);

  // Update selected parent category when selectedCategory changes
  useEffect(() => {
    if (selectedCategory && parentCategories.length > 0) {
      const parent = parentCategories.find(cat => cat._id === selectedCategory);
      if (parent) {
        setSelectedParentCategory(parent);
        fetchSubcategories(selectedCategory);
        logDebug('Selected parent category updated', { id: parent._id, name: parent.name });
      }
    } else {
      setSelectedParentCategory(null);
    }
  }, [selectedCategory, parentCategories]);

  // Function to fetch parent categories
  const fetchParentCategories = async () => {
    try {
      setLoadingCategories(true);
      logDebug('Fetching parent categories');
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      const response = await fetch(`${apiUrl}/categories`);
      
      if (response.ok) {
        const data = await response.json();
        // Filter only parent categories (no parentId or empty parentId)
        const parents = data.filter((cat: Category) => !cat.parentId || cat.parentId === '');
        setParentCategories(parents);
        logDebug('Parent categories fetched', { count: parents.length });
        
        // If there's a selected category, find it and fetch subcategories
        if (selectedCategory) {
          const parent = parents.find(cat => cat._id === selectedCategory);
          if (parent) {
            setSelectedParentCategory(parent);
            fetchSubcategories(selectedCategory);
          }
        }
      } else {
        logDebug('Error fetching parent categories', { status: response.status });
      }
    } catch (error) {
      logDebug('Exception fetching categories', { error });
    } finally {
      setLoadingCategories(false);
    }
  };

  // Function to fetch subcategories
  const fetchSubcategories = async (parentId: string) => {
    if (!parentId) return;
    
    try {
      logDebug('Fetching subcategories', { parentId });
      
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      const response = await fetch(`${apiUrl}/categories/subcategories/${parentId}`);
      
      if (response.ok) {
        const subs = await response.json();
        setSubcategories(subs);
        logDebug('Subcategories fetched', { count: subs.length });
      } else {
        logDebug('Error fetching subcategories', { status: response.status });
        setSubcategories([]);
      }
    } catch (error) {
      logDebug('Exception fetching subcategories', { error });
      setSubcategories([]);
    }
  };

  // Get category and subcategory names
  const getCategoryName = useCallback(() => {
    if (!selectedCategory) return '';
    return selectedParentCategory?.name || '';
  }, [selectedCategory, selectedParentCategory]);

  const getSubcategoryName = useCallback(() => {
    if (!selectedSubcategory) return '';
    const sub = subcategories.find(s => s._id === selectedSubcategory);
    return sub?.name || '';
  }, [selectedSubcategory, subcategories]);

  return {
    parentCategories,
    subcategories,
    loadingCategories,
    selectedParentCategory,
    categoryName: getCategoryName(),
    subcategoryName: getSubcategoryName(),
    fetchSubcategories
  };
}