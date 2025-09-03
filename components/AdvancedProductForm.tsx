import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/AdminLayout";
import { uploadToCloudinary } from "@/lib/uploadToCloudinary";
import toast from "react-hot-toast";
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api-client';
import { Plus, Layers, IndianRupee, Ruler, Package, Image as ImageIcon, Camera, Globe, Shield, Star, ChevronDown } from "lucide-react";
import { Editor } from '@tinymce/tinymce-react';
import CategoryFormModal from "./CategoryFormModal";
import BrandFormModal from "./BrandFormModal";
import TaxFormModal from "../app/admin/taxes/TaxFormModal";
import WarehouseFormModal from "./WarehouseFormModal";
import WarehouseSelector from "./WarehouseSelector";
import { useRoleAccess } from "./RoleBasedAccess";
import { validateFile, validateFiles, FILE_VALIDATION_CONFIG, formatFileSize } from '@/lib/fileValidation';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

function base64ToFile(base64: string, filename: string): File {
  const arr = base64.split(",");
  const match = arr[0].match(/:(.*?);/);
  const mime = match ? match[1] : "";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

function slugify(str: string) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/--+/g, '-');
}

// Helper to delete image from Cloudinary by imageUrl, with toast notifications
async function deleteImageFromCloudinary(imageUrl: string): Promise<boolean> {
  if (!imageUrl) return false;
  
  try {
    // Extract public ID from Cloudinary URL
    let publicId = '';
    if (imageUrl.includes('cloudinary.com')) {
      // Extract the path after the cloud name and before the file extension
      const urlParts = imageUrl.split('/');
      const cloudNameIndex = urlParts.findIndex(part => part.includes('cloudinary.com'));
      if (cloudNameIndex !== -1 && cloudNameIndex + 2 < urlParts.length) {
        // Get the folder path and filename without extension
        const folderPath = urlParts.slice(cloudNameIndex + 2, -1).join('/');
        const filename = urlParts[urlParts.length - 1].split('.')[0];
        publicId = folderPath ? `${folderPath}/${filename}` : filename;
      }
    }
    
    if (!publicId) {
      console.warn('Could not extract public ID from URL:', imageUrl);
      return false;
    }
    
    const res = await fetch('/api/delete-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publicId }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      // No success toast here
      return true;
    } else {
      toast.error(data.error || 'Failed to delete image from Cloudinary');
      return false;
    }
  } catch (err: any) {
    toast.error('Error deleting image from Cloudinary');
    return false;
  }
}

export default function AdvancedProductForm({ mode, initialProduct = null, productId = "" }: { mode: 'add' | 'edit', initialProduct?: any, productId?: string }) {
  const router = useRouter();
  const { canCreateWarehouse, canCreateTax, isWarehouseRestricted } = useRoleAccess();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [taxes, setTaxes] = useState<any[]>([]);
  const [product, setProduct] = useState<any>(initialProduct || {
    name: "",
    description: "",
    category: "",
    subcategory: "",
    brand: "",
    price: "",
    mrp: "",
    tax: "",
    priceIncludesTax: true, // Default to true
    sku: "",
    hsn: "",
    stockStatus: true,
    quantity: 0,
    lowStockThreshold: 0,
    warehouse: "",
    status: "active",
    image: null as string | null,
    weight: "",
    dimensions: { l: "", w: "", h: "" },
    shippingClass: "",
    returnable: false,
    returnWindow: 0,
    codAvailable: true,
    mainImage: null as string | null,
    galleryImages: [] as string[],
    metaTitle: "",
    metaDescription: "",
    metaKeywords: "",
    unit: "",
    locationName: "", // New field for product location
  });
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageDeleting, setImageDeleting] = useState(false);

  // 1. Update variant image input logic to store File objects, not upload immediately
  // 2. On submit, upload all new variant images
  // 3. Fix duplicate toasts on deletion

  // --- 1. State: Store variant image files ---
  // Add to the component state:
  const [variantImageFiles, setVariantImageFiles] = useState<{ [key: string]: (File | string)[] }>({});

  // --- Add state for images to delete ---
  const [mainImageToDelete, setMainImageToDelete] = useState<string | null>(null);
  const [galleryImagesToDelete, setGalleryImagesToDelete] = useState<string[]>([]);
  const [variantImagesToDelete, setVariantImagesToDelete] = useState<{ [key: string]: string[] }>({});

  // Track new gallery media (images and videos) separately from existing ones
  const [newGalleryMedia, setNewGalleryMedia] = useState<File[]>([]);

  // --- Add state for modal open/close ---
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSubcategoryModal, setShowSubcategoryModal] = useState(false);
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [showTaxModal, setShowTaxModal] = useState(false);
  const [showWarehouseModal, setShowWarehouseModal] = useState(false);

  // Add refresh trigger for WarehouseSelector
  const [warehouseRefreshTrigger, setWarehouseRefreshTrigger] = useState(0);

  // Add state for SKU validation
  const [skuValidation, setSkuValidation] = useState<{
    isChecking: boolean;
    isValid: boolean;
    message: string;
  }>({
    isChecking: false,
    isValid: true,
    message: ''
  });

  // Add state for search inputs and focus
  const [categorySearch, setCategorySearch] = useState(() => {
    if (mode === 'edit' && initialProduct && initialProduct.category) {
      if (typeof initialProduct.category === 'object' && initialProduct.category.name) return initialProduct.category.name;
      // fallback: try to find in categories
      const found = categories.find(cat => cat._id === initialProduct.category);
      if (found) return found.name;
    }
    return "";
  });
  const [subcategorySearch, setSubcategorySearch] = useState(() => {
    if (mode === 'edit' && initialProduct && initialProduct.subcategory) {
      if (typeof initialProduct.subcategory === 'object' && initialProduct.subcategory.name) return initialProduct.subcategory.name;
      const found = subcategories.find(subcat => subcat._id === initialProduct.subcategory);
      if (found) return found.name;
    }
    return "";
  });
  const [brandSearch, setBrandSearch] = useState(() => {
    if (mode === 'edit' && initialProduct && initialProduct.brand) {
      if (typeof initialProduct.brand === 'object' && initialProduct.brand.name) return initialProduct.brand.name;
      const found = brands.find(brand => brand._id === initialProduct.brand);
      if (found) return found.name;
    }
    return "";
  });
  const [categoryFocused, setCategoryFocused] = useState(false);
  const [subcategoryFocused, setSubcategoryFocused] = useState(false);
  const [brandFocused, setBrandFocused] = useState(false);

  // Variants state and utilities
  const [attributes, setAttributes] = useState<{ name: string; values: string[] }[]>([]);
  const [attributeInput, setAttributeInput] = useState("");
  const [attributeValueInputs, setAttributeValueInputs] = useState<{ [attr: string]: string }>({});
  const [variants, setVariants] = useState<{ [key: string]: any }>({});
  const [autoSku, setAutoSku] = useState(true);
  const [bulkPrice, setBulkPrice] = useState("");
  const [bulkStock, setBulkStock] = useState("");

  function cartesian(arr: string[][]): string[][] {
    return arr.reduce((a, b) => a.flatMap(d => b.map(e => [...d, e])), [[]] as string[][]);
  }
  function getVariantKey(combo: string[]): string {
    // Normalize to uppercase for consistency
    return combo.map(v => v.toUpperCase()).join("::");
  }

  // Function to normalize attribute values - uppercase for strings, preserve numbers
  function normalizeAttributeValue(value: string): string {
    const trimmedValue = value.trim();
    
    // Check if it's a number (including decimal numbers)
    if (/^\d+(\.\d+)?$/.test(trimmedValue)) {
      return trimmedValue; // Keep numbers as-is
    }
    
    // For strings, convert to uppercase
    return trimmedValue.toUpperCase();
  }

  // Update variants when autoSku is toggled
  useEffect(() => {
    if (autoSku && attributes.length > 0) {
      const updatedVariants = { ...variants };
      const combinations = cartesian(attributes.map(a => a.values.length ? a.values : [""]));
      
      combinations.forEach(combo => {
        const key = getVariantKey(combo);
        const normalizedCombo = combo.map(normalizeAttributeValue);
        const generatedSku = normalizedCombo.map(v => v.replace(/\s+/g, '')).join('');
        
        if (updatedVariants[key]) {
          updatedVariants[key].sku = generatedSku;
        }
      });
      
      setVariants(updatedVariants);
    }
  }, [autoSku, attributes]);
  
  function calculateTotalVariantStock(): number {
    return Object.values(variants).reduce((total: number, variant: any) => {
      const stock = parseInt(variant.stock) || 0;
      return total + stock;
    }, 0);
  }
  function regenerateVariants(newAttributes = attributes) {
    // Only generate variants if there is at least one attribute with values
    if (!newAttributes.length || newAttributes.every(a => !a.values.length)) {
      setVariants({});
      return;
    }
    const combos = cartesian(newAttributes.map(a => a.values.length ? a.values : [""]));
    setVariants(prev => {
      const newVariants: { [key: string]: any } = {};
      combos.forEach(combo => {
        const key = getVariantKey(combo);
        newVariants[key] = prev[key] || { sku: "", price: "", stock: "", image: null };
      });
      return newVariants;
    });
  }
  useEffect(() => { regenerateVariants(); }, [attributes]);

  // Restore advanced section toggles
  const [showInventory, setShowInventory] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [showPhysical, setShowPhysical] = useState(false);
  const [showVariants, setShowVariants] = useState(false);
  const [showMedia, setShowMedia] = useState(false);
  const [showSEO, setShowSEO] = useState(false);

  // Fetch categories, brands, warehouses, and taxes
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesData, brandsData, warehousesData, taxesData] = await Promise.all([
          apiGet(`${API_URL}/categories`),
          apiGet(`${API_URL}/brands`),
          apiGet(`${API_URL}/warehouses`),
          apiGet(`${API_URL}/taxes`),
        ]);
        setCategories(categoriesData);
        setBrands(brandsData);
        setWarehouses(warehousesData);
        setTaxes(taxesData);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load form data");
      }
    };
    fetchData();
  }, [API_URL]);

  // Function to normalize variant keys to uppercase
  const normalizeVariants = (variants: any) => {
    if (!variants || typeof variants !== 'object') return {};
    
    const normalizedVariants: any = {};
    Object.entries(variants).forEach(([key, value]) => {
      // Convert variant key to uppercase format
      const normalizedKey = key.split('::').map(v => v.toUpperCase()).join('::');
      normalizedVariants[normalizedKey] = value;
    });
    return normalizedVariants;
  };

  // Function to normalize attributes (both names and values)
  const normalizeAttributes = (attributes: any[]) => {
    if (!attributes || !Array.isArray(attributes)) return [];
    
    return attributes.map(attr => ({
      ...attr,
      values: attr.values.map((value: string) => normalizeAttributeValue(value))
    }));
  };

  useEffect(() => {
    if (initialProduct) {
      setProduct((prev: any) => ({
        ...prev,
        ...initialProduct,
        category: typeof initialProduct.category === 'object' && initialProduct.category ? initialProduct.category._id : initialProduct.category || '',
        subcategory: typeof initialProduct.subcategory === 'object' && initialProduct.subcategory ? initialProduct.subcategory._id : initialProduct.subcategory || '',
        brand: typeof initialProduct.brand === 'object' && initialProduct.brand ? initialProduct.brand._id : initialProduct.brand || '',
        warehouse: typeof initialProduct.warehouse === 'object' && initialProduct.warehouse ? initialProduct.warehouse._id : initialProduct.warehouse || '',
        tax: typeof initialProduct.tax === 'object' && initialProduct.tax ? initialProduct.tax._id : initialProduct.tax || '',
        sku: initialProduct.sku || '',
        price: initialProduct.price ?? '',
        mrp: initialProduct.mrp ?? '',
        quantity: initialProduct.quantity ?? initialProduct.stock ?? 0,
        status: initialProduct.status || 'active',
        unit: initialProduct.unit || '',
        image: initialProduct.image || null,
        description: initialProduct.description || '',
        galleryImages: initialProduct.galleryImages || [],
        metaTitle: initialProduct.metaTitle || '',
        metaDescription: initialProduct.metaDescription || '',
        metaKeywords: initialProduct.metaKeywords || '',
        mainImage: initialProduct.mainImage || '',
        priceIncludesTax: initialProduct.priceIncludesTax !== undefined ? !!initialProduct.priceIncludesTax : true, // Default to true
        lowStockThreshold: initialProduct.lowStockThreshold ?? 0,
        weight: initialProduct.weight ?? 0,
        dimensions: initialProduct.dimensions || { l: '', w: '', h: '' },
        shippingClass: initialProduct.shippingClass || '',
        returnable: !!initialProduct.returnable,
        returnWindow: initialProduct.returnWindow ?? 0,
        codAvailable: !!initialProduct.codAvailable,
        locationName: initialProduct.locationName || '', // New field
      }));
      
      
      
      // Normalize attributes and variant keys to uppercase
      setAttributes(normalizeAttributes(initialProduct.attributes || []));
      setVariants(normalizeVariants(initialProduct.variants || {}));
    }
  }, [initialProduct, mode]);

  // Fetch subcategories when category changes
  useEffect(() => {
    const fetchSubcategories = async () => {
      if (!product.category) {
        setSubcategories([]);
        return;
      }

      try {
        const data = await apiGet(`${API_URL}/categories/subcategories/${product.category}`);
        setSubcategories(data);
      } catch (error) {
        console.error("Error fetching subcategories:", error);
        setSubcategories([]);
      }
    };

    fetchSubcategories();
  }, [product.category, API_URL]);

  // Reset subcategory when category changes
  useEffect(() => {
    if (product.category) {
      setProduct((prev: any) => ({ ...prev, subcategory: "" }));
    }
  }, [product.category]);

  // Auto-generate slug when name changes
  useEffect(() => {
    if (product.name) {
      setProduct((prev: any) => ({ ...prev, slug: slugify(product.name) }));
    }
  }, [product.name]);

  // Auto-adjust stock status based on quantity
  useEffect(() => {
    setProduct((prev: any) => ({
      ...prev,
      stockStatus: prev.quantity > 0
    }));
  }, [product.quantity]);

  // Calculate total quantity from variants when variants exist
  useEffect(() => {
    const hasVariants = Object.keys(variants).length > 0;
    if (hasVariants) {
      const totalVariantStock = calculateTotalVariantStock();
      
      setProduct((prev: any) => ({
        ...prev,
        quantity: totalVariantStock
      }));
    }
  }, [variants]);

  // When variants exist, sync product selling price with the first variant's price
  useEffect(() => {
    const keys = Object.keys(variants);
    if (keys.length > 0) {
      const firstKey = keys[0];
      const firstVariantPrice = (variants[firstKey]?.price ?? '') as string;
      setProduct((prev: any) => ({ ...prev, price: firstVariantPrice }));
    }
  }, [variants]);

  // Auto-generate SEO fields
  const generateSEOFields = (productData: any, categoriesData: any[], brandsData: any[]) => {
    const { name, description, category, brand, price } = productData;
    
    if (!name) return { metaTitle: '', metaDescription: '', metaKeywords: '' };

    // Get category and brand names
    const categoryObj = categoriesData.find(cat => cat._id === category);
    const brandObj = brandsData.find(br => br._id === brand);
    const categoryName = categoryObj?.name || '';
    const brandName = brandObj?.name || '';

    // Generate Meta Title (60 characters max for SEO)
    let metaTitle = name;
    if (brandName) metaTitle = `${brandName} ${name}`;
    if (categoryName && metaTitle.length < 50) metaTitle += ` - ${categoryName}`;
    if (metaTitle.length > 60) metaTitle = metaTitle.substring(0, 57) + '...';

    // Generate Meta Description (160 characters max for SEO)
    let metaDescription = '';
    if (description) {
      // Strip HTML tags and get plain text
      const plainDescription = description.replace(/<[^>]*>/g, '').trim();
      metaDescription = plainDescription;
    } else {
      metaDescription = `Buy ${name}`;
      if (brandName) metaDescription += ` by ${brandName}`;
      if (categoryName) metaDescription += ` in ${categoryName}`;
      if (price) metaDescription += ` at best price of ₹${price}`;
      metaDescription += '. High quality products with fast delivery.';
    }
    if (metaDescription.length > 160) metaDescription = metaDescription.substring(0, 157) + '...';

    // Generate Meta Keywords (comma separated)
    const keywords = [];
    if (name) keywords.push(name.toLowerCase());
    if (brandName) keywords.push(brandName.toLowerCase());
    if (categoryName) keywords.push(categoryName.toLowerCase());
    
    // Add variations of the product name
    const nameWords = name.toLowerCase().split(' ').filter((word: string) => word.length > 2);
    keywords.push(...nameWords);
    
    // Add common e-commerce keywords
    keywords.push('buy online', 'best price', 'quality product');
    if (categoryName) keywords.push(`${categoryName.toLowerCase()} online`);
    
    // Remove duplicates and join
    const uniqueKeywords = [...new Set(keywords)];
    const metaKeywords = uniqueKeywords.slice(0, 10).join(', '); // Limit to 10 keywords

    return { metaTitle, metaDescription, metaKeywords };
  };

  // Auto-generate SEO fields when product data changes
  useEffect(() => {
    if (product.name && categories.length && brands.length) {
      const seoFields = generateSEOFields(product, categories, brands);
      setProduct((prev: any) => ({
        ...prev,
        ...seoFields
      }));
    }
  }, [product.name, product.description, product.category, product.brand, product.price, categories, brands]);





  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate the main product image with stricter requirements
      validateFile(file, {
        allowedTypes: ['image'],
        maxSize: FILE_VALIDATION_CONFIG.images.maxSize,
        checkDimensions: true
      }).then(result => {
        if (result.isValid) {
          if (result.warning) {
            toast.error(result.warning);
          }
          setImageFile(file);
          setProduct((prev: any) => ({ ...prev, image: URL.createObjectURL(file) }));
        } else {
          toast.error(result.error || 'Invalid file');
          // Reset the input
          e.target.value = '';
        }
      }).catch(error => {
        toast.error(`Validation error: ${error.message}`);
        e.target.value = '';
      });
    }
  };

  // --- Update handleGalleryMediaChange ---
  const handleGalleryMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // Validate all files using the new validation system
    validateFiles(files, {
      allowedTypes: ['image', 'video'],
      maxFiles: FILE_VALIDATION_CONFIG.general.maxFilesPerUpload,
      checkDimensions: true
    }).then(({ validFiles, invalidFiles }) => {
      // Show errors for invalid files
      invalidFiles.forEach(({ file, error }) => {
        toast.error(`${file.name}: ${error}`);
      });

      // Show warnings for valid files
      validFiles.forEach(async (file) => {
        const result = await validateFile(file, { allowedTypes: ['image', 'video'], checkDimensions: true });
        if (result.warning) {
          toast.error(`${file.name}: ${result.warning}`);
        }
      });

      if (validFiles.length > 0) {
        // Add new files to newGalleryMedia
        setNewGalleryMedia(prev => [...prev, ...validFiles]);
        
        // Update the product state to show preview with file type information
        setProduct((prev: any) => ({
          ...prev,
          galleryImages: [
            ...(prev.galleryImages || []), 
            ...validFiles.map(f => ({
              file: f,
              preview: URL.createObjectURL(f),
              type: f.type.startsWith('video/') ? 'video' : 'image',
              size: formatFileSize(f.size)
            }))
          ],
        }));
      }

      // Reset input if no valid files
      if (validFiles.length === 0) {
        e.target.value = '';
      }
    }).catch(error => {
      toast.error(`Validation error: ${error.message}`);
      e.target.value = '';
    });
  };

  // Function to check if SKU already exists in the selected warehouse
  const checkSKUExists = async (sku: string, warehouseId: string, excludeProductId?: string) => {
    try {
      const response = await apiGet(`${API_URL}/products/check-sku?sku=${encodeURIComponent(sku)}&warehouse=${encodeURIComponent(warehouseId)}${excludeProductId ? `&excludeId=${excludeProductId}` : ''}`);
      return response;
    } catch (error) {
      console.error('Error checking SKU:', error);
      return { exists: false };
    }
  };

  // Debounced SKU validation for real-time feedback
  useEffect(() => {
    const validateSKU = async () => {
      if (!product.sku || !product.warehouse || product.sku.trim() === '') {
        setSkuValidation({ isChecking: false, isValid: true, message: '' });
        return;
      }

      setSkuValidation({ isChecking: true, isValid: true, message: 'Checking SKU...' });

      try {
        const result = await checkSKUExists(product.sku, product.warehouse, mode === 'edit' ? productId : undefined);
        if (result.exists) {
          let message = `SKU already exists in this warehouse`;
          if (result.productName) {
            if (result.isVariant && result.variantName) {
              message += ` (${result.productName} - ${result.variantName})`;
            } else {
              message += ` (${result.productName})`;
            }
          }
          setSkuValidation({
            isChecking: false,
            isValid: false,
            message: message
          });
        } else {
          setSkuValidation({
            isChecking: false,
            isValid: true,
            message: 'SKU is available'
          });
        }
      } catch (error) {
        setSkuValidation({
          isChecking: false,
          isValid: true,
          message: ''
        });
      }
    };

    const timeoutId = setTimeout(validateSKU, 500); // 500ms debounce
    return () => clearTimeout(timeoutId);
  }, [product.sku, product.warehouse, mode, productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // --- Custom Validations ---
    const price = Number(product.price) || 0;
    const mrp = Number(product.mrp) || 0;
    
    // 1. SKU is required
    if (!product.sku || product.sku.trim() === "") {
      toast.error("SKU is required.");
      return;
    }

    // 2. Warehouse is required
    if (!product.warehouse || product.warehouse.trim() === "") {
      toast.error("Please select a warehouse.");
      return;
    }

    // 3. Check for duplicate SKU in the selected warehouse
    try {
      const skuResult = await checkSKUExists(product.sku, product.warehouse, mode === 'edit' ? productId : undefined);
      if (skuResult.exists) {
        let errorMessage = `SKU "${product.sku}" already exists in the selected warehouse`;
        if (skuResult.productName) {
          if (skuResult.isVariant && skuResult.variantName) {
            errorMessage += ` (${skuResult.productName} - ${skuResult.variantName})`;
          } else {
            errorMessage += ` (${skuResult.productName})`;
          }
        }
        errorMessage += '. Please use a different SKU.';
        toast.error(errorMessage);
        return;
      }
    } catch (error) {
      toast.error("Error validating SKU. Please try again.");
      return;
    }
    // 4. Main image required
    if (!product.image && !imageFile) {
      toast.error("Main product image is required.");
      return;
    }
    // 5. Selling price <= MRP
    if (price > mrp) {
      toast.error("Selling price cannot be higher than the MRP.");
      return;
    }
    // 6. Return window validation - if product is returnable, return window must be greater than 0
    if (product.returnable && (product.returnWindow || 0) <= 0) {
      toast.error("Return window must be greater than 0 days when product is returnable.");
      return;
    }
    // 7. Auto-generate SKUs if enabled and validate variant SKUs if variants exist
    const updatedVariantsForValidation = { ...variants };
    if (Object.keys(updatedVariantsForValidation).length > 0) {
      // Auto-generate SKUs if enabled
      if (autoSku) {
        for (const key of Object.keys(updatedVariantsForValidation)) {
          updatedVariantsForValidation[key].sku = key.split("::").map(v => v.replace(/\s+/g, '')).join('');
        }
      }
      
      // Validate that all variants have SKUs
      for (const [key, variant] of Object.entries(updatedVariantsForValidation)) {
        if (!variant.sku || variant.sku.trim() === "") {
          toast.error(`SKU is required for variant: ${key}`);
          return;
        }
        
        // Check if variant SKU already exists in the selected warehouse
        try {
          const variantSkuResult = await checkSKUExists(variant.sku, product.warehouse, mode === 'edit' ? productId : undefined);
          if (variantSkuResult.exists) {
            let errorMessage = `Variant SKU "${variant.sku}" for variant "${key}" already exists in the selected warehouse`;
            if (variantSkuResult.productName) {
              if (variantSkuResult.isVariant && variantSkuResult.variantName) {
                errorMessage += ` (${variantSkuResult.productName} - ${variantSkuResult.variantName})`;
              } else {
                errorMessage += ` (${variantSkuResult.productName})`;
              }
            }
            errorMessage += '. Please use a different SKU.';
            toast.error(errorMessage);
            return;
          }
        } catch (error) {
          toast.error(`Error validating variant SKU for "${key}". Please try again.`);
          return;
        }
      }
      
      // Update the variants state with auto-generated SKUs
      if (autoSku) {
        setVariants(updatedVariantsForValidation);
      }
    }
    setLoading(true);
    try {
      let imageUrl = product.image;
      if (imageFile) {
        try {
          imageUrl = await uploadToCloudinary(imageFile, `products/${product.category}/${slugify(product.name)}`, {
            validateBeforeUpload: true,
            allowedTypes: ['image'],
            maxSize: FILE_VALIDATION_CONFIG.images.maxSize
          });
        } catch {
          toast.error("Image upload failed.");
          setLoading(false);
          return;
        }
      }
      // Always use quantity as stock
      const stock = Number(product.quantity) || 0;
      // Upload variant images (SKUs are already handled in validation)
      const updatedVariants = { ...variants };
      for (const key of Object.keys(updatedVariants)) {
        // Upload new images (File objects) for this variant
        if (variantImageFiles[key]) {
          const uploadedImages: string[] = [];
          for (const img of variantImageFiles[key]) {
            if (img instanceof File) {
              const result = await uploadToCloudinary(img, `products/${product.category}/${slugify(product.name)}/variants/${key}`, {
                validateBeforeUpload: true,
                allowedTypes: ['image'],
                maxSize: FILE_VALIDATION_CONFIG.images.maxSize
              });
              uploadedImages.push(result);
            } else if (typeof img === 'string') {
              uploadedImages.push(img); // already a URL
            }
          }
          updatedVariants[key].images = uploadedImages;
        }
      }
      let galleryImageUrls: string[] = [];
      // Process gallery images - keep existing URLs and upload new files
      
      // For edit mode, preserve existing images that haven't been deleted
      if (mode === 'edit') {
        const existingImages = (product.galleryImages || []).filter((img: any) => {
          // Skip preview objects (new files) and deleted images
          if (img && typeof img === 'object' && img.preview) {
            return false; // Skip new file previews
          }
          const imgUrl = typeof img === 'string' ? img : img?.secure_url;
          return imgUrl && !galleryImagesToDelete.includes(imgUrl);
        });
        galleryImageUrls.push(...existingImages);
      }
      
                    // Upload and add new gallery media (images and videos)
       for (const media of newGalleryMedia) {
         try {
           const result = await uploadToCloudinary(media, `products/${product.category}/${slugify(product.name)}/gallery`, {
             validateBeforeUpload: true,
             allowedTypes: ['image', 'video'],
             maxSize: media.type.startsWith('video/') ? FILE_VALIDATION_CONFIG.videos.maxSize : FILE_VALIDATION_CONFIG.images.maxSize
           });
           galleryImageUrls.push(result);
         } catch (error) {
           console.error('Failed to upload media:', media.name, error);
           toast.error(`Failed to upload ${media.name}. Please try again.`);
           setLoading(false);
           return;
         }
       }
      const { _id, createdAt, updatedAt, __v, stockStatus, ...rest } = product;
      const payload = {
        ...rest,
        name: product.name || "",
        slug: slugify(product.name),
        description: product.description || "",
        category: product.category || "",
        subcategory: product.subcategory || "",
        brand: product.brand || "",
        price: Number(product.price) || 0,
        mrp: Number(product.mrp) || 0,
        tax: product.tax || "",
        priceIncludesTax: !!product.priceIncludesTax,
        sku: product.sku || "",
        stock, // always from quantity
        warehouse: product.warehouse || "",
        status: product.status || "active",
        image: imageUrl || "/placeholder.png",
        unit: product.unit || "",
        hsn: product.hsn || "",
        lowStockThreshold: Number(product.lowStockThreshold) || 0,
        weight: Number(product.weight) || 0,
        dimensions: product.dimensions || { l: "", w: "", h: "" },
        shippingClass: product.shippingClass || "",
        returnable: !!product.returnable,
        returnWindow: Number(product.returnWindow) || 0,
        codAvailable: !!product.codAvailable,
        mainImage: product.mainImage || "",
        galleryImages: galleryImageUrls,
        metaTitle: product.metaTitle || "",
        metaDescription: product.metaDescription || "",
        metaKeywords: product.metaKeywords || "",
        locationName: product.locationName || "", // New field
        variants: updatedVariants,
        attributes: attributes !== undefined ? attributes : [],
      };
      // Submitting product data
      if (mode === "edit") {
        await apiPut(`${API_URL}/products/${productId}`, payload);
      } else {
        await apiPost(`${API_URL}/products`, payload);
      }
      toast.success(`Product ${mode === "edit" ? "updated" : "created"} successfully!`);
      setTimeout(() => router.push("/admin/products"), 1200);
    } catch (error: any) {
      toast.error(`Failed to ${mode === "edit" ? "update" : "create"} product: ${error.message}`);
    } finally {
      setLoading(false);
      setImageFile(null);
      setVariantImageFiles({}); // Clear variant image files after successful submit
      // --- On form submit, after DB update, delete all marked images from Cloudinary ---
      if (mainImageToDelete) {
        await deleteImageFromCloudinary(mainImageToDelete);
      }
      for (const url of galleryImagesToDelete) {
        await deleteImageFromCloudinary(url);
      }
      for (const key of Object.keys(variantImagesToDelete)) {
        for (const url of variantImagesToDelete[key]) {
          await deleteImageFromCloudinary(url);
        }
      }
      // After deletion, clear the toDelete states:
      setMainImageToDelete(null);
      setGalleryImagesToDelete([]);
      setVariantImagesToDelete({});
             // Clear new gallery media after successful submit
       setNewGalleryMedia([]);
    }
  };

  // Helper for sections
  const sectionConfigs = [
    { key: 'Inventory', open: showInventory, setOpen: setShowInventory, icon: <Layers className="text-brand-primary" /> },
    { key: 'Pricing', open: showPricing, setOpen: setShowPricing, icon: <IndianRupee className="text-brand-primary" /> },
    { key: 'Physical Attributes', open: showPhysical, setOpen: setShowPhysical, icon: <Ruler className="text-brand-primary" /> },
    { key: 'Variants', open: showVariants, setOpen: setShowVariants, icon: <Package className="text-brand-primary" /> },
    { key: 'Media', open: showMedia, setOpen: setShowMedia, icon: <Camera className="text-brand-primary" /> },
    { key: 'SEO', open: showSEO, setOpen: setShowSEO, icon: <Globe className="text-brand-primary" /> },
  ];

  const categoryInputRef = useRef<HTMLInputElement>(null);
  const subcategoryInputRef = useRef<HTMLInputElement>(null);
  const brandInputRef = useRef<HTMLInputElement>(null);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/admin/products')}
              className="p-2 text-text-tertiary hover:text-brand-primary transition-colors"
            >
              <ChevronDown className="h-5 w-5 rotate-180" />
            </button>
            <div>
              <h2 className="text-2xl font-bold text-text-primary">{mode === 'edit' ? 'Edit Product' : 'Add New Product'}</h2>
              <p className="text-text-secondary">{mode === 'edit' ? 'Update product details' : 'Create a new product for your store'}</p>
            </div>
          </div>
        </div>

        {/* Product Form */}
        <div className="bg-surface-primary rounded-lg shadow-md">
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {uploading && <div className="text-brand-primary font-semibold mb-2 flex items-center gap-2"><svg className="animate-spin h-5 w-5 text-brand-primary" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg>Uploading images, please wait...</div>}

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={product.name ?? ""}
                  onChange={(e) => setProduct({ ...product, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  placeholder="Enter product name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SKU <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={product.sku ?? ""}
                    onChange={(e) => setProduct({ ...product, sku: e.target.value })}
                    className={`w-full border rounded-lg p-3 focus:outline-none focus:ring-2 pr-10 ${
                      skuValidation.isValid 
                        ? 'border-gray-300 focus:ring-brand-primary' 
                        : 'border-red-300 focus:ring-red-500'
                    }`}
                    placeholder="Enter SKU"
                    required
                  />
                  {skuValidation.isChecking && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <svg className="animate-spin h-4 w-4 text-gray-400" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                    </div>
                  )}
                  {!skuValidation.isChecking && product.sku && product.warehouse && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {skuValidation.isValid ? (
                        <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </div>
                  )}
                </div>
                {skuValidation.message && (
                  <p className={`text-xs mt-1 ${skuValidation.isValid ? 'text-green-600' : 'text-red-600'}`}>
                    {skuValidation.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category <span className="text-red-500">*</span>
                </label>
                <div className="flex items-stretch gap-2 relative">
                  <input
                    ref={categoryInputRef}
                    type="text"
                    value={categorySearch}
                    onChange={e => setCategorySearch(e.target.value)}
                    placeholder={categorySearch || (mode === 'edit' && initialProduct && initialProduct.category && typeof initialProduct.category === 'object' && initialProduct.category.name ? initialProduct.category.name : 'Search or select category')}
                    className="w-full border border-gray-300 rounded-l-lg p-3 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    style={{ height: "48px" }}
                    onFocus={() => setCategoryFocused(true)}
                    onBlur={() => setTimeout(() => setCategoryFocused(false), 100)}
                  />
                  <button
                    type="button"
                    className="ml-0 h-[48px] px-4 bg-brand-primary text-white rounded-r-lg text-lg flex items-center justify-center"
                    style={{ minWidth: "48px" }}
                    onClick={() => setShowCategoryModal(true)}
                  >
                    +
                  </button>
                  {categoryFocused && (
                    <div className="absolute left-0 top-full z-10 bg-white border border-gray-200 rounded w-full max-w-[calc(100%-56px)] max-h-48 overflow-y-auto shadow-lg">
                      {categories.filter(cat => !cat.parentId && cat.name.toLowerCase().includes(categorySearch.toLowerCase())).map(cat => (
                        <div
                          key={cat._id}
                          className={`px-3 py-2 cursor-pointer hover:bg-brand-primary/10 ${product.category === cat._id ? 'bg-brand-primary/10 font-semibold' : ''}`}
                          onMouseDown={() => {
                            setProduct({ ...product, category: cat._id });
                            setCategorySearch(cat.name);
                            setCategoryFocused(false);
                            if (categoryInputRef.current) categoryInputRef.current.blur();
                          }}
                        >
                          {cat.name}
                        </div>
                      ))}
                      {categories.filter(cat => !cat.parentId && cat.name.toLowerCase().includes(categorySearch.toLowerCase())).length === 0 && (
                        <div className="px-3 py-2 text-gray-400">No results</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {/* CategoryFormModal */}
              <CategoryFormModal
                open={showCategoryModal}
                onClose={() => setShowCategoryModal(false)}
                onSuccess={async (cat: any) => {
                  setShowCategoryModal(false);
                  // Refetch categories and update state
                  const data = await apiGet(`${API_URL}/categories`);
                  setCategories(data);
                  if (cat && cat._id) {
                    setProduct((prev: any) => ({ ...prev, category: cat._id }));
                    setCategorySearch(cat.name);
                  }
                }}
                categories={categories}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subcategory
                </label>
                <div className="flex items-stretch gap-2 relative">
                  <input
                    ref={subcategoryInputRef}
                    type="text"
                    value={subcategorySearch}
                    onChange={e => setSubcategorySearch(e.target.value)}
                    placeholder={subcategorySearch || (mode === 'edit' && initialProduct && initialProduct.subcategory && typeof initialProduct.subcategory === 'object' && initialProduct.subcategory.name ? initialProduct.subcategory.name : 'Search or select subcategory')}
                    className="w-full border border-gray-300 rounded-l-lg p-3 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    style={{ height: "48px" }}
                    onFocus={() => setSubcategoryFocused(true)}
                    onBlur={() => setTimeout(() => setSubcategoryFocused(false), 100)}
                    disabled={!product.category || subcategories.length === 0}
                  />
                  <button
                    type="button"
                    className="ml-0 h-[48px] px-4 bg-brand-primary text-white rounded-r-lg text-lg flex items-center justify-center"
                    style={{ minWidth: "48px" }}
                    onClick={() => setShowSubcategoryModal(true)}
                    disabled={!product.category}
                  >
                    +
                  </button>
                  {subcategoryFocused && (
                    <div className="absolute left-0 top-full z-10 bg-white border border-gray-200 rounded w-full max-w-[calc(100%-56px)] max-h-48 overflow-y-auto shadow-lg">
                      {subcategories.filter(subcat => subcat.name.toLowerCase().includes(subcategorySearch.toLowerCase())).map(subcat => (
                        <div
                          key={subcat._id}
                          className={`px-3 py-2 cursor-pointer hover:bg-brand-primary/10 ${product.subcategory === subcat._id ? 'bg-brand-primary/10 font-semibold' : ''}`}
                          onMouseDown={() => {
                            setProduct({ ...product, subcategory: subcat._id });
                            setSubcategorySearch(subcat.name);
                            setSubcategoryFocused(false);
                            if (subcategoryInputRef.current) subcategoryInputRef.current.blur();
                          }}
                        >
                          {subcat.name}
                        </div>
                      ))}
                      {subcategories.filter(subcat => subcat.name.toLowerCase().includes(subcategorySearch.toLowerCase())).length === 0 && (
                        <div className="px-3 py-2 text-gray-400">No results</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {/* CategoryFormModal */}
              <CategoryFormModal
                open={showSubcategoryModal}
                onClose={() => setShowSubcategoryModal(false)}
                onSuccess={async (subcat: any) => {
                  setShowSubcategoryModal(false);
                  // Refetch subcategories and update state
                  if (product.category) {
                    const data = await apiGet(`${API_URL}/categories/subcategories/${product.category}`);
                    setSubcategories(data);
                    if (subcat && subcat._id) {
                      setProduct((prev: any) => ({ ...prev, subcategory: subcat._id }));
                      setSubcategorySearch(subcat.name);
                    }
                  }
                }}
                categories={categories}
                parentId={product.category}
              />
              {product.category && subcategories.length === 0 && (
                <p className="text-xs text-gray-500 mt-1">No subcategories available for this category</p>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Brand <span className="text-red-500">*</span>
                </label>
                <div className="flex items-stretch gap-2 relative">
                  <input
                    ref={brandInputRef}
                    type="text"
                    value={brandSearch}
                    onChange={e => setBrandSearch(e.target.value)}
                    placeholder={brandSearch || (mode === 'edit' && initialProduct && initialProduct.brand && typeof initialProduct.brand === 'object' && initialProduct.brand.name ? initialProduct.brand.name : 'Search or select brand')}
                    className="w-full border border-gray-300 rounded-l-lg p-3 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    style={{ height: "48px" }}
                    onFocus={() => setBrandFocused(true)}
                    onBlur={() => setTimeout(() => setBrandFocused(false), 100)}
                  />
                  <button
                    type="button"
                    className="ml-0 h-[48px] px-4 bg-brand-primary text-white rounded-r-lg text-lg flex items-center justify-center"
                    style={{ minWidth: "48px" }}
                    onClick={() => setShowBrandModal(true)}
                  >
                    +
                  </button>
                  {brandFocused && (
                    <div className="absolute left-0 top-full z-10 bg-white border border-gray-200 rounded w-full max-w-[calc(100%-56px)] max-h-48 overflow-y-auto shadow-lg">
                      {brands.filter(brand => brand.name.toLowerCase().includes(brandSearch.toLowerCase())).map(brand => (
                        <div
                          key={brand._id}
                          className={`px-3 py-2 cursor-pointer hover:bg-brand-primary/10 ${product.brand === brand._id ? 'bg-brand-primary/10 font-semibold' : ''}`}
                          onMouseDown={() => {
                            setProduct({ ...product, brand: brand._id });
                            setBrandSearch(brand.name);
                            setBrandFocused(false);
                            if (brandInputRef.current) brandInputRef.current.blur();
                          }}
                        >
                          {brand.name}
                        </div>
                      ))}
                      {brands.filter(brand => brand.name.toLowerCase().includes(brandSearch.toLowerCase())).length === 0 && (
                        <div className="px-3 py-2 text-gray-400">No results</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {/* BrandFormModal */}
              <BrandFormModal
                open={showBrandModal}
                onClose={() => setShowBrandModal(false)}
                onSuccess={async (brand: any) => {
                  setShowBrandModal(false);
                  // Refetch brands and update state
                  const data = await apiGet(`${API_URL}/brands`);
                  setBrands(data);
                  if (brand && brand._id) {
                    setProduct((prev: any) => ({ ...prev, brand: brand._id }));
                    setBrandSearch(brand.name);
                  }
                }}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Selling Price <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={product.price ?? ""}
                  onChange={(e) => setProduct({ ...product, price: e.target.value })}
                  className={`w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-brand-primary ${Object.keys(variants).length > 0 ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
                  readOnly={Object.keys(variants).length > 0}
                  title={Object.keys(variants).length > 0 ? 'Selling price is controlled by the first variant' : ''}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  MRP <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={product.mrp ?? ""}
                  onChange={(e) => setProduct({ ...product, mrp: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={product.quantity ?? ""}
                  onChange={e => setProduct({ ...product, quantity: e.target.value === "" ? "" : Number(e.target.value) })}
                  className={`w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-brand-primary ${Object.keys(variants).length > 0 ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  placeholder="0"
                  min="0"
                  required
                  readOnly={Object.keys(variants).length > 0}
                />
                {Object.keys(variants).length > 0 && (
                  <p className="text-xs text-blue-600 mt-1">
                    Quantity is automatically calculated from variant stocks ({Object.keys(variants).length} variants)
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tax <span className="text-red-500">*</span>
                </label>
                <div className="flex items-stretch gap-2 relative">
                  <select
                    value={product.tax ?? ""}
                    onChange={e => setProduct({ ...product, tax: e.target.value })}
                    className="w-full border border-gray-300 rounded-l-lg p-3 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    required
                  >
                    <option value="">Select Tax</option>
                    {taxes.map((tax: any) => (
                      <option key={tax._id} value={tax._id}>{tax.name}</option>
                    ))}
                  </select>
                  {canCreateTax() && (
                    <button
                      type="button"
                      className="ml-0 h-[48px] px-4 bg-brand-primary text-white rounded-r-lg text-lg flex items-center justify-center"
                      style={{ minWidth: "48px" }}
                      onClick={() => setShowTaxModal(true)}
                    >
                      +
                    </button>
                  )}
                </div>
                {!canCreateTax() && (
                  <p className="text-xs text-gray-500 mt-1">
                    Contact administrator to add new taxes
                  </p>
                )}
              </div>
              <TaxFormModal
                open={showTaxModal}
                onClose={() => setShowTaxModal(false)}
                tax={null}
                onSuccess={async function (newTax: any) {
                  setShowTaxModal(false);
                  // Refetch taxes and update state
                  const data = await apiGet(`${API_URL}/taxes`);
                  setTaxes(data);
                  if (newTax && newTax._id) {
                    setProduct((prev: any) => ({ ...prev, tax: newTax._id }));
                  }
                }}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Warehouse <span className="text-red-500">*</span>
                </label>
                <div className="flex items-stretch gap-2 relative">
                  <WarehouseSelector
                    value={product.warehouse ?? ""}
                    onChange={(warehouseId) => setProduct({ ...product, warehouse: warehouseId })}
                    required
                    className="rounded-l-lg"
                    refreshTrigger={warehouseRefreshTrigger}
                  />
                  {canCreateWarehouse() && (
                    <button
                      type="button"
                      className="ml-0 h-[48px] px-4 bg-brand-primary text-white rounded-r-lg text-lg flex items-center justify-center"
                      style={{ minWidth: "48px" }}
                      onClick={() => setShowWarehouseModal(true)}
                    >
                      +
                    </button>
                  )}
                </div>
                {!canCreateWarehouse() && (
                  <p className="text-xs text-gray-500 mt-1">
                    Contact administrator to add new warehouses
                  </p>
                )}
              </div>
              <WarehouseFormModal
                open={showWarehouseModal}
                onClose={() => setShowWarehouseModal(false)}
                warehouse={null}
                onSuccess={async (newWarehouse: any) => {
                  setShowWarehouseModal(false);
                  // Refetch warehouses and update state
                  const data = await apiGet(`${API_URL}/warehouses`);
                  setWarehouses(data);
                  if (newWarehouse && newWarehouse._id) {
                    setProduct((prev: any) => ({ ...prev, warehouse: newWarehouse._id }));
                  }
                }}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={product.status ?? ""}
                  onChange={(e) => setProduct({ ...product, status: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={product.unit ?? ""}
                    onChange={e => setProduct({ ...product, unit: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    placeholder="1 L, 500 ml, 200 g, etc."
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Location Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={product.locationName ?? ""}
                    onChange={e => setProduct({ ...product, locationName: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    placeholder="Enter product location name"
                    required
                  />
                </div>
              </div>
            </div>
            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <div className="w-full bg-white border border-gray-300 rounded-lg p-2">
                <Editor
                  apiKey="yapzaxocernrvcfg37vobqi7uk31wza7hii4fhsgi6j2838d"
                  value={product.description ?? ""}
                  onEditorChange={(val: string) => setProduct({ ...product, description: val ?? "" })}
                  init={{
                    height: 250,
                    menubar: false,
                    plugins: [
                      'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview', 'anchor',
                      'searchreplace', 'visualblocks', 'code', 'fullscreen',
                      'insertdatetime', 'media', 'table', 'help', 'wordcount'
                    ],
                    toolbar:
                      'undo redo | formatselect | bold italic underline | ' +
                      'alignleft aligncenter alignright alignjustify | ' +
                      'bullist numlist outdent indent | removeformat | help'
                  }}
                />
              </div>
            </div>
            {/* Product Image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Image <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand-primary file:text-white hover:file:bg-brand-primary-dark"
                />
                {product.image && (
                  <div className="flex items-center gap-2 mt-2">
                    <img src={product.image} alt="Product preview" className="w-20 h-20 object-cover rounded border" />
                    <button
                      type="button"
                      className="text-xs text-brand-error hover:underline"
                      onClick={async () => {
                        if (product.image && !imageFile) {
                          setMainImageToDelete(product.image);
                          setProduct((prev: any) => ({ ...prev, image: null }));
                          setImageFile(null);
                        } else {
                          setProduct((prev: any) => ({ ...prev, image: null }));
                          setImageFile(null);
                        }
                      }}
                      disabled={imageDeleting}
                    >Remove</button>
                  </div>
                )}
              </div>
            </div>
            {/* Collapsible Advanced Sections */}
            <div className="space-y-4">
              {sectionConfigs.map(({ key, open, setOpen, icon }) => (
                <div key={key} className="rounded-xl border border-gray-200 bg-white shadow-sm transition-all">
                  <button
                    type="button"
                    onClick={() => setOpen((v: boolean) => !v)}
                    className={`flex items-center w-full px-6 py-4 text-lg font-semibold text-brand-primary hover:bg-brand-primary/5 transition rounded-xl focus:outline-none`}
                    aria-expanded={open}
                  >
                    <span className="mr-3">{icon}</span>
                    <span className="flex-1 text-left">{key}</span>
                    <ChevronDown className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
                  </button>
                  <div className={`overflow-hidden transition-all duration-300 ${open ? "max-h-[2000px] py-6 px-8 bg-gray-50" : "max-h-0 p-0"}`}>
                    {key === 'Inventory' && showInventory && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            SKU <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            value={product.sku}
                            onChange={e => setProduct({ ...product, sku: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg p-3"
                            placeholder="Enter SKU"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">HSN Code</label>
                          <input type="text" value={product.hsn} onChange={e => setProduct({ ...product, hsn: e.target.value })} className="w-full border border-gray-300 rounded-lg p-3" placeholder="Enter HSN Code" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Stock Status</label>
                          <input
                            type="text"
                            value={product.quantity > 0 ? "In Stock" : "Out of Stock"}
                            className="w-full border border-gray-300 rounded-lg p-3 bg-gray-100"
                            readOnly
                          />
                          <p className="text-xs text-gray-500 mt-1">Auto-adjusted based on quantity</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                          <input 
                            type="number" 
                            value={product.quantity} 
                            onChange={e => setProduct({ ...product, quantity: Number(e.target.value) })} 
                            className={`w-full border border-gray-300 rounded-lg p-3 ${Object.keys(variants).length > 0 ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                            placeholder="0" 
                            readOnly={Object.keys(variants).length > 0}
                          />
                          {Object.keys(variants).length > 0 && (
                            <p className="text-xs text-blue-600 mt-1">
                              Auto-calculated from {Object.keys(variants).length} variant(s)
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Threshold</label>
                          <input type="number" value={product.lowStockThreshold} onChange={e => setProduct({ ...product, lowStockThreshold: Number(e.target.value) })} className="w-full border border-gray-300 rounded-lg p-3" placeholder="0" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse Location</label>
                          <select value={product.warehouse} onChange={e => setProduct({ ...product, warehouse: e.target.value })} className="w-full border border-gray-300 rounded-lg p-3">
                            <option value="">Select Warehouse</option>
                            {warehouses.map((warehouse: any) => (
                              <option key={warehouse._id} value={warehouse._id}>{warehouse.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                    {key === 'Pricing' && showPricing && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">MRP</label>
                          <input type="number" value={product.mrp} onChange={e => setProduct({ ...product, mrp: e.target.value })} className="w-full border border-gray-300 rounded-lg p-3" placeholder="0.00" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price</label>
                          <input type="number" value={product.price} onChange={e => setProduct({ ...product, price: e.target.value })} className={`w-full border border-gray-300 rounded-lg p-3 ${Object.keys(variants).length > 0 ? 'bg-gray-100 cursor-not-allowed' : ''}`} placeholder="0.00" readOnly={Object.keys(variants).length > 0} title={Object.keys(variants).length > 0 ? 'Selling price is controlled by the first variant' : ''} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Tax</label>
                          <select value={product.tax} onChange={e => setProduct({ ...product, tax: e.target.value })} className="w-full border border-gray-300 rounded-lg p-3">
                            <option value="">Select Tax</option>
                            {taxes.map((tax: any) => (
                              <option key={tax._id} value={tax._id}>{tax.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-center mt-2">
                          <input type="checkbox" checked={product.priceIncludesTax} onChange={e => setProduct({ ...product, priceIncludesTax: e.target.checked })} />
                          <label className="ml-2 text-sm font-medium text-gray-700">Price Includes Tax</label>
                        </div>
                      </div>
                    )}
                    {key === 'Physical Attributes' && showPhysical && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Weight (g)</label>
                          <input type="number" value={product.weight} onChange={e => setProduct({ ...product, weight: e.target.value })} className="w-full border border-gray-300 rounded-lg p-3" placeholder="0" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Length (cm)</label>
                          <input type="number" value={product.dimensions?.l || ""} onChange={e => setProduct({ ...product, dimensions: { ...product.dimensions, l: e.target.value } })} className="w-full border border-gray-300 rounded-lg p-3" placeholder="0" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Width (cm)</label>
                          <input type="number" value={product.dimensions?.w || ""} onChange={e => setProduct({ ...product, dimensions: { ...product.dimensions, w: e.target.value } })} className="w-full border border-gray-300 rounded-lg p-3" placeholder="0" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
                          <input type="number" value={product.dimensions?.h || ""} onChange={e => setProduct({ ...product, dimensions: { ...product.dimensions, h: e.target.value } })} className="w-full border border-gray-300 rounded-lg p-3" placeholder="0" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Shipping Class</label>
                          <input type="text" value={product.shippingClass} onChange={e => setProduct({ ...product, shippingClass: e.target.value })} className="w-full border border-gray-300 rounded-lg p-3" placeholder="Enter shipping class" />
                        </div>
                        <div className="flex items-center mt-2">
                          <input type="checkbox" checked={product.returnable} onChange={e => setProduct({ ...product, returnable: e.target.checked })} />
                          <label className="ml-2 text-sm font-medium text-gray-700">Returnable</label>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Return Window (days)</label>
                          <input
                            type="number"
                            value={product.returnWindow}
                            onChange={e => setProduct({ ...product, returnWindow: e.target.value === "" ? 0 : Number(e.target.value) })}
                            className={`w-full border border-gray-300 rounded-lg p-3 ${!product.returnable ? 'bg-gray-100' : ''}`}
                            placeholder="0"
                            disabled={!product.returnable}
                          />
                        </div>
                        <div className="flex items-center mt-2">
                          <input type="checkbox" checked={product.codAvailable} onChange={e => setProduct({ ...product, codAvailable: e.target.checked })} />
                          <label className="ml-2 text-sm font-medium text-gray-700">COD Available</label>
                        </div>
                      </div>
                    )}
                    {key === 'Variants' && showVariants && (
                      <div className="bg-gray-50 rounded-xl p-8 border border-brand-primary/10 space-y-8">
                        {/* Attribute Input */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Attributes</label>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {attributes.map(attr => (
                              <span key={attr.name} className="bg-brand-primary/10 text-brand-primary px-3 py-1 rounded-full flex items-center gap-1 text-sm font-medium">
                                {attr.name}
                                <button type="button" onClick={() => {
                                  setAttributes(attributes.filter(a => a.name !== attr.name));
                                  regenerateVariants(attributes.filter(a => a.name !== attr.name));
                                }} className="ml-1 text-xs text-red-500 hover:text-red-700">×</button>
                              </span>
                            ))}
                            <input
                              type="text"
                              value={attributeInput}
                              onChange={e => setAttributeInput(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === "," || e.key === "Enter") {
                                  e.preventDefault();
                                  if (attributeInput.trim() && !attributes.some(a => a.name.toLowerCase() === attributeInput.trim().toLowerCase())) {
                                    setAttributes([...attributes, { name: attributeInput.trim(), values: [] }]);
                                    setAttributeInput("");
                                  }
                                }
                              }}
                              className="border-b-2 border-brand-primary px-2 py-1 text-base focus:outline-none min-w-[80px]"
                              placeholder="Add attribute"
                            />
                            <button type="button" onClick={() => {
                              if (attributeInput.trim() && !attributes.some(a => a.name.toLowerCase() === attributeInput.trim().toLowerCase())) {
                                setAttributes([...attributes, { name: attributeInput.trim(), values: [] }]);
                                setAttributeInput("");
                              }
                            }} className="ml-1 px-2 py-1 bg-brand-primary text-white rounded">+</button>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">Add attributes (e.g. Color, Size, Material). Comma, Enter, or + to add.</p>
                        </div>
                        {/* Attribute Values */}
                        <div className="space-y-2">
                          {attributes.map(attr => (
                            <div key={attr.name} className="flex flex-col md:flex-row md:items-center gap-2">
                              <span className="w-24 text-gray-600 font-medium">{attr.name} values:</span>
                              <div className="flex flex-wrap gap-2">
                                {attr.values.map(val => (
                                  <span key={val} className="bg-brand-primary/10 text-brand-primary px-3 py-1 rounded-full flex items-center gap-1 text-sm font-medium">
                                    {val}
                                    <button type="button" onClick={() => {
                                      setAttributes(attrs => attrs.map(a => a.name === attr.name ? { ...a, values: a.values.filter(v => v !== val) } : a));
                                      regenerateVariants(attributes.map(a => a.name === attr.name ? { ...a, values: a.values.filter(v => v !== val) } : a));
                                    }} className="ml-1 text-xs text-red-500 hover:text-red-700">×</button>
                                  </span>
                                ))}
                                <input
                                  type="text"
                                  value={attributeValueInputs[attr.name] || ""}
                                  onChange={e => setAttributeValueInputs(inputs => ({ ...inputs, [attr.name]: e.target.value }))}
                                  onKeyDown={e => {
                                    if (e.key === "," || e.key === "Enter") {
                                      e.preventDefault();
                                      if ((attributeValueInputs[attr.name] || "").trim()) {
                                        const normalizedValues = (attributeValueInputs[attr.name] || "").split(",").map(v => normalizeAttributeValue(v)).filter(Boolean);
                                        const updatedAttributes = attributes.map(a => a.name === attr.name ? { ...a, values: Array.from(new Set([...a.values, ...normalizedValues])) } : a);
                                        setAttributes(updatedAttributes);
                                        setAttributeValueInputs(inputs => ({ ...inputs, [attr.name]: "" }));
                                        regenerateVariants(updatedAttributes);
                                      }
                                    }
                                  }}
                                  className="border-b-2 border-brand-primary px-2 py-1 text-base focus:outline-none min-w-[60px]"
                                  placeholder={`Add ${attr.name}`}
                                />
                                <button type="button" onClick={() => {
                                  if ((attributeValueInputs[attr.name] || "").trim()) {
                                    const normalizedValues = (attributeValueInputs[attr.name] || "").split(",").map(v => normalizeAttributeValue(v)).filter(Boolean);
                                    const updatedAttributes = attributes.map(a => a.name === attr.name ? { ...a, values: Array.from(new Set([...a.values, ...normalizedValues])) } : a);
                                    setAttributes(updatedAttributes);
                                    setAttributeValueInputs(inputs => ({ ...inputs, [attr.name]: "" }));
                                    regenerateVariants(updatedAttributes);
                                  }
                                }} className="ml-1 px-2 py-1 bg-brand-primary text-white rounded">+</button>
                              </div>
                            </div>
                          ))}
                        </div>
                        {/* Variant Table */}
                        {attributes.length > 0 && cartesian(attributes.map(a => a.values.length ? a.values : [""])).length > 0 && (
                          <div className="mt-6 rounded-xl border border-gray-200 bg-white shadow-sm p-4">
                            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                              <label className="flex items-center gap-2 text-sm font-medium">
                                <span className="text-gray-700">Auto-generate SKUs</span>
                                <button
                                  type="button"
                                  className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none ${autoSku ? 'bg-brand-primary' : 'bg-gray-300'}`}
                                  onClick={() => setAutoSku(v => !v)}
                                >
                                  <span className="sr-only">Toggle Auto SKU</span>
                                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${autoSku ? 'translate-x-5' : 'translate-x-1'}`} />
                                </button>
                              </label>
                              <div className="flex items-center gap-2">
                                <input type="number" placeholder="Bulk Price" value={bulkPrice} onChange={e => setBulkPrice(e.target.value)} className="border px-2 py-1 rounded text-sm w-24" />
                                <button type="button" className="bg-brand-primary text-white px-2 py-1 rounded text-xs" onClick={() => setVariants(prev => { const updated: { [key: string]: any } = {}; Object.keys(prev).forEach(key => { updated[key] = { ...prev[key], price: bulkPrice }; }); return updated; })}>Set All Prices</button>
                              </div>
                              <div className="flex items-center gap-2">
                                <input type="number" placeholder="Bulk Stock" value={bulkStock} onChange={e => setBulkStock(e.target.value)} className="border px-2 py-1 rounded text-sm w-24" />
                                <button type="button" className="bg-brand-primary text-white px-2 py-1 rounded text-xs" onClick={() => setVariants(prev => { const updated: { [key: string]: any } = {}; Object.keys(prev).forEach(key => { updated[key] = { ...prev[key], stock: bulkStock }; }); return updated; })}>Set All Stock</button>
                              </div>
                            </div>
                            <div className="overflow-x-auto rounded border border-gray-200">
                              <table className="min-w-full text-sm">
                                <thead className="bg-gray-50">
                                  <tr>
                                    {attributes.map(attr => (
                                      <th key={attr.name} className="px-3 py-2 font-semibold text-gray-700 border-b">{attr.name}</th>
                                    ))}
                                    <th className="px-3 py-2 font-semibold text-gray-700 border-b">SKU</th>
                                    <th className="px-3 py-2 font-semibold text-gray-700 border-b">Price</th>
                                    <th className="px-3 py-2 font-semibold text-gray-700 border-b">Stock</th>
                                    <th className="px-3 py-2 font-semibold text-gray-700 border-b">Image</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {cartesian(attributes.map(a => a.values.length ? a.values : [""])).map(combo => {
                                    const key = getVariantKey(combo); // Use normalized key
                                    const normalizedCombo = combo.map(normalizeAttributeValue); // Normalize for display
                                    const variant = variants[key] || { sku: '', price: '', stock: '', image: null };
                                    const generateSku = (combo: string[]) => combo.map(v => v.replace(/\s+/g, '')).join('');
                                    return (
                                      <tr key={key} className="hover:bg-gray-50">
                                        {normalizedCombo.map((val, i) => (
                                          <td key={val + i} className="px-3 py-2 border-b">{val}</td>
                                        ))}
                                        {/* SKU */}
                                        <td className="px-3 py-2 border-b">
                                          <input
                                            type="text"
                                            value={autoSku ? generateSku(normalizedCombo) : variant.sku}
                                            disabled={autoSku}
                                            onChange={e => setVariants(prev => ({ ...prev, [key]: { ...variant, sku: e.target.value } }))}
                                            className={`w-24 border rounded px-1 py-0.5 ${autoSku ? 'bg-gray-100 text-gray-400' : ''}`}
                                            required={!autoSku}
                                          />
                                        </td>
                                        {/* Price */}
                                        <td className="px-3 py-2 border-b">
                                          <input
                                            type="number"
                                            value={variant.price || ''}
                                            min={0}
                                            onChange={e => setVariants(prev => ({ ...prev, [key]: { ...variant, price: e.target.value } }))}
                                            className="w-20 border rounded px-1 py-0.5"
                                          />
                                        </td>
                                        {/* Stock */}
                                        <td className="px-3 py-2 border-b">
                                          <input
                                            type="number"
                                            value={variant.stock || ''}
                                            min={0}
                                            onChange={e => setVariants(prev => ({ ...prev, [key]: { ...variant, stock: e.target.value } }))}
                                            className="w-16 border rounded px-1 py-0.5"
                                          />
                                        </td>
                                        {/* Image */}
                                        <td className="px-3 py-2 border-b">
                                          <div className="flex flex-col items-start gap-1">
                                            <input
                                              type="file"
                                              accept="image/*"
                                              multiple
                                              aria-label={`Upload images for ${key}`}
                                              onChange={e => {
                                                const files = Array.from(e.target.files || []);
                                                setVariantImageFiles(prev => ({
                                                  ...prev,
                                                  [key]: [...(prev[key] || []), ...files],
                                                }));
                                                setVariants(prev => ({
                                                  ...prev,
                                                  [key]: {
                                                    ...variant,
                                                    images: [...(variant.images || []), ...files.map(f => URL.createObjectURL(f))],
                                                  },
                                                }));
                                              }}
                                            />
                                            <div className="flex flex-wrap gap-1 mt-1">
                                              {(variant.images || []).map((img: any, imgIdx: number) => (
                                                <div key={imgIdx} className="relative">
                                                  <img
                                                    src={typeof img === 'string' ? img : img?.secure_url}
                                                    alt={`Variant ${key} Image ${imgIdx + 1}`}
                                                    className="w-10 h-10 object-cover rounded border"
                                                  />
                                                  <button
                                                    type="button"
                                                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs"
                                                    onClick={() => {
                                                      const url = typeof img === 'string' ? img : img?.secure_url;
                                                      if (url) {
                                                        setVariantImagesToDelete(prev => ({
                                                          ...prev,
                                                          [key]: [...(prev[key] || []), url],
                                                        }));
                                                        setVariants(prev => ({
                                                          ...prev,
                                                          [key]: {
                                                            ...variant,
                                                            images: (variant.images || []).filter((_: any, i: number) => i !== imgIdx),
                                                          },
                                                        }));
                                                      }
                                                    }}
                                                  >&times;</button>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                            {/* Total Stock Summary */}
                            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-blue-800">Total Stock Across All Variants:</span>
                                <span className="text-lg font-bold text-blue-900">
                                  {calculateTotalVariantStock()} units
                                </span>
                              </div>
                              <p className="text-xs text-blue-600 mt-1">
                                This total will be used as the main product quantity
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                                         {key === 'Media' && showMedia && (
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div>
                           <label className="block text-sm font-medium text-gray-700 mb-1">Main Image</label>
                           <input type="file" accept="image/*" onChange={handleImageChange} className="block w-full text-sm text-gray-500" />
                           {product.image && <img src={product.image} alt="Main" className="w-24 h-24 object-cover mt-2 rounded" />}
                         </div>
                         <div>
                           <label className="block text-sm font-medium text-gray-700 mb-1">Gallery Media (Images & Videos)</label>
                           <input type="file" accept="image/*,video/*" multiple onChange={handleGalleryMediaChange} className="block w-full text-sm text-gray-500" />
                           <p className="text-xs text-gray-500 mt-1">Supports images (JPG, PNG, GIF) and videos (MP4, MOV, AVI)</p>
                           <div className="flex gap-2 mt-2">
                             {(product.galleryImages || []).map((item: any, idx: number) => {
                               // Handle both new preview objects and existing URLs
                               let url: string;
                               let isVideo: boolean;
                               let isNewFile: boolean = false;
                               
                               if (item && typeof item === 'object' && item.preview) {
                                 // New file with preview object
                                 url = item.preview;
                                 isVideo = item.type === 'video';
                                 isNewFile = true;
                               } else {
                                 // Existing URL (from database)
                                 url = typeof item === 'string' ? item : item?.secure_url;
                                 isVideo = Boolean(url && (
                                   url.includes('.mp4') || 
                                   url.includes('.mov') || 
                                   url.includes('.avi') || 
                                   url.includes('video')
                                 ));
                               }
                               
                               return (
                                 <div key={idx} className="relative">
                                   {isVideo ? (
                                     <video
                                       src={url}
                                       className="w-16 h-16 object-cover rounded"
                                       muted
                                       preload="metadata"
                                       onLoadedData={(e) => {
                                         // Pause at first frame
                                         const video = e.target as HTMLVideoElement;
                                         video.currentTime = 0;
                                         video.pause();
                                       }}
                                     />
                                   ) : (
                                     <img
                                       src={url}
                                       alt={`Gallery ${idx + 1}`}
                                       className="w-16 h-16 object-cover rounded"
                                       onError={(e) => {
                                         // If image fails to load, check if it's actually a video
                                         const target = e.target as HTMLImageElement;
                                         const src = target.src;
                                         if (src && (src.includes('.mp4') || src.includes('.mov') || src.includes('.avi'))) {
                                           // Replace broken image with video element
                                           const parent = target.parentElement;
                                           if (parent) {
                                             const video = document.createElement('video');
                                             video.src = src;
                                             video.className = 'w-16 h-16 object-cover rounded';
                                             video.muted = true;
                                             video.preload = 'metadata';
                                             video.onloadeddata = () => {
                                               // Pause at first frame
                                               video.currentTime = 0;
                                               video.pause();
                                             };
                                             parent.replaceChild(video, target);
                                           }
                                         }
                                       }}
                                     />
                                   )}
                                   <button type="button" onClick={() => {
                                     if (url) {
                                       if (isNewFile) {
                                         // Remove new file preview
                                         setProduct((prev: any) => ({ 
                                           ...prev, 
                                           galleryImages: prev.galleryImages.filter((_: any, i: number) => i !== idx) 
                                         }));
                                         // Remove the corresponding file from newGalleryMedia
                                         const fileIndex = idx - (product.galleryImages?.length || 0) + newGalleryMedia.length;
                                         if (fileIndex >= 0 && fileIndex < newGalleryMedia.length) {
                                           setNewGalleryMedia(prev => prev.filter((_, i) => i !== fileIndex));
                                         }
                                       } else {
                                         // Mark existing media for deletion
                                         setGalleryImagesToDelete(prev => [...prev, url]);
                                         setProduct((prev: any) => ({ 
                                           ...prev, 
                                           galleryImages: prev.galleryImages.filter((_: any, i: number) => i !== idx) 
                                         }));
                                       }
                                     }
                                   }} className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center">&times;</button>
                                 </div>
                               );
                             })}
                           </div>
                         </div>
                      </div>
                    )}
                    {key === 'SEO' && showSEO && (
                      <div className="space-y-6">
                        <p className="text-sm text-gray-600">SEO fields are automatically generated based on product details</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Meta Title 
                              <span className="text-xs text-green-600 ml-2">✓ Auto-generated</span>
                            </label>
                            <input 
                              type="text" 
                              value={product.metaTitle} 
                              readOnly 
                              className="w-full border border-gray-300 rounded-lg p-3 bg-gray-50 text-gray-700 cursor-not-allowed" 
                              placeholder="Auto-generated based on product details" 
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Meta Description
                              <span className="text-xs text-green-600 ml-2">✓ Auto-generated</span>
                            </label>
                            <input 
                              type="text" 
                              value={product.metaDescription} 
                              readOnly 
                              className="w-full border border-gray-300 rounded-lg p-3 bg-gray-50 text-gray-700 cursor-not-allowed" 
                              placeholder="Auto-generated based on product details" 
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Meta Keywords (comma separated)
                              <span className="text-xs text-green-600 ml-2">✓ Auto-generated</span>
                            </label>
                            <input 
                              type="text" 
                              value={product.metaKeywords} 
                              readOnly 
                              className="w-full border border-gray-300 rounded-lg p-3 bg-gray-50 text-gray-700 cursor-not-allowed" 
                              placeholder="Auto-generated based on product details" 
                            />
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-8">
              <button
                type="submit"
                disabled={loading || uploading || imageDeleting}
                className="px-6 py-3 bg-brand-primary text-white rounded-lg font-semibold hover:bg-brand-primary-dark transition disabled:opacity-50 flex items-center justify-center"
              >
                {(loading || uploading || imageDeleting) && (
                  <svg className="animate-spin h-5 w-5 mr-2 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                  </svg>
                )}
                {imageDeleting ? 'Deleting...' : loading || uploading ? (mode === 'edit' ? 'Saving...' : 'Adding...') : (mode === 'edit' ? 'Save Changes' : 'Add Product')}
              </button>
            </div>
          </form>
          {/* Move modals here, outside the form to avoid nested form error */}

          <TaxFormModal
            open={showTaxModal}
            onClose={() => setShowTaxModal(false)}
            tax={null}
            onSuccess={async (newTax: any) => {
              setShowTaxModal(false);
              // Refetch taxes and update state
              const data = await apiGet(`${API_URL}/taxes`);
              setTaxes(data);
              if (newTax && newTax._id) {
                setProduct((prev: any) => ({ ...prev, tax: newTax._id }));
              }
            }}
          />
          <WarehouseFormModal
            open={showWarehouseModal}
            onClose={() => setShowWarehouseModal(false)}
            warehouse={{
              name: "",
              address: "",
              location: { lat: null, lng: null },
              contactPhone: "",
              email: "",
              capacity: 0,
              deliverySettings: {
                isDeliveryEnabled: true,
                disabledMessage: "",
                deliveryPincodes: [],
                is24x7Delivery: true,
                deliveryDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
                deliveryHours: {
                  start: "09:00",
                  end: "18:00"
                }
              }
            }}
            onSuccess={async (newWarehouse: any) => {
              setShowWarehouseModal(false);
              // Refetch warehouses and update state
              const data = await apiGet(`${API_URL}/warehouses`);
              setWarehouses(data);
              // Trigger WarehouseSelector refresh
              setWarehouseRefreshTrigger(prev => prev + 1);
              if (newWarehouse && newWarehouse._id) {
                setProduct((prev: any) => ({ ...prev, warehouse: newWarehouse._id }));
                toast.success('Warehouse created successfully');
              }
            }}
          />
        </div>
      </div>
    </AdminLayout>
  );
}
