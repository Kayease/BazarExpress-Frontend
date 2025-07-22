import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/AdminLayout";
import { uploadToCloudinary } from "@/lib/uploadToCloudinary";
import toast from "react-hot-toast";
import { Plus, Layers, IndianRupee, Ruler, Package, Image as ImageIcon, Camera, Globe, Shield, Star, ChevronDown } from "lucide-react";
import { Editor } from '@tinymce/tinymce-react';
import CategoryFormModal from "./CategoryFormModal";
import BrandFormModal from "./BrandFormModal";

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
    const res = await fetch('/api/delete-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageUrl }),
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
    costPrice: "",
    tax: "",
    priceIncludesTax: false,
    sku: "",
    hsn: "",
    stockStatus: true,
    quantity: 0,
    allowBackorders: false,
    lowStockThreshold: 0,
    warehouse: "",
    status: "active",
    image: null as string | null,
    weight: "",
    dimensions: { l: "", w: "", h: "" },
    shippingClass: "",
    returnable: false,
    returnWindow: 0,
    codAvailable: false,
    mainImage: null as string | null,
    galleryImages: [] as string[],
    video: "",
    model3d: null as string | null,
    metaTitle: "",
    metaDescription: "",
    metaKeywords: "",
    canonicalUrl: "",
    legal_hsn: "",
    batchNumber: "",
    manufacturer: "",
    warranty: "",
    certifications: "",
    safetyInfo: "",
    unit: "",
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

  // --- Add state for gallery image files ---
  const [galleryImageFiles, setGalleryImageFiles] = useState<(File | string)[]>([]);

  // --- Add state for modal open/close ---
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSubcategoryModal, setShowSubcategoryModal] = useState(false);
  const [showBrandModal, setShowBrandModal] = useState(false);

  // Add state for search inputs and focus
  const [categorySearch, setCategorySearch] = useState("");
  const [subcategorySearch, setSubcategorySearch] = useState("");
  const [brandSearch, setBrandSearch] = useState("");
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
    return combo.join("::");
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
  const [showLegal, setShowLegal] = useState(false);

  // Fetch categories, brands, warehouses, and taxes
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesRes, brandsRes, warehousesRes, taxesRes] = await Promise.all([
          fetch(`${API_URL}/categories`),
          fetch(`${API_URL}/brands`),
          fetch(`${API_URL}/warehouses`),
          fetch(`${API_URL}/taxes`),
        ]);
        const categoriesData = await categoriesRes.json();
        const brandsData = await brandsRes.json();
        const warehousesData = await warehousesRes.json();
        const taxesData = await taxesRes.json();
        setCategories(categoriesData);
        setBrands(brandsData);
        setWarehouses(warehousesData);
        setTaxes(taxesData);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, [API_URL]);

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
        canonicalUrl: initialProduct.canonicalUrl || '',
        legal_hsn: initialProduct.legal_hsn || '',
        batchNumber: initialProduct.batchNumber || '',
        manufacturer: initialProduct.manufacturer || '',
        warranty: initialProduct.warranty || '',
        certifications: initialProduct.certifications || '',
        safetyInfo: initialProduct.safetyInfo || '',
        mainImage: initialProduct.mainImage || '',
        video: initialProduct.video || '',
        model3d: initialProduct.model3d || '',
        costPrice: initialProduct.costPrice ?? 0,
        priceIncludesTax: !!initialProduct.priceIncludesTax,
        allowBackorders: !!initialProduct.allowBackorders,
        lowStockThreshold: initialProduct.lowStockThreshold ?? 0,
        weight: initialProduct.weight ?? 0,
        dimensions: initialProduct.dimensions || { l: '', w: '', h: '' },
        shippingClass: initialProduct.shippingClass || '',
        returnable: !!initialProduct.returnable,
        returnWindow: initialProduct.returnWindow ?? 0,
        codAvailable: !!initialProduct.codAvailable,
      }));
      setAttributes(initialProduct.attributes || []);
      setVariants(initialProduct.variants || {});
    }
  }, [initialProduct]);

  // Fetch subcategories when category changes
  useEffect(() => {
    const fetchSubcategories = async () => {
      if (!product.category) {
        setSubcategories([]);
        return;
      }
      
      try {
        const res = await fetch(`${API_URL}/categories/subcategories/${product.category}`);
        if (res.ok) {
          const data = await res.json();
          setSubcategories(data);
        } else {
          setSubcategories([]);
        }
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setProduct((prev: any) => ({ ...prev, image: URL.createObjectURL(file) }));
    }
  };

  // --- Update handleGalleryImagesChange ---
  const handleGalleryImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setGalleryImageFiles((prev: (File | string)[]) => [...prev, ...files]);
    setProduct((prev: any) => ({
      ...prev,
      galleryImages: [...(prev.galleryImages || []), ...files.map(f => URL.createObjectURL(f))],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // --- Custom Validations ---
    const price = Number(product.price) || 0;
    const mrp = Number(product.mrp) || 0;
    const costPrice = Number(product.costPrice) || 0;
    // 1. Main image required
    if (!product.image && !imageFile) {
      toast.error("Main product image is required.");
      return;
    }
    // 2. Cost price < MRP and < selling price
    if (costPrice >= mrp) {
      toast.error("Cost price must be less than MRP.");
      return;
    }
    if (costPrice >= price) {
      toast.error("Cost price must be less than the selling price.");
      return;
    }
    // 3. Selling price <= MRP
    if (price > mrp) {
      toast.error("Selling price cannot be higher than the MRP.");
      return;
    }
    setLoading(true);
    try {
      let imageUrl = product.image;
      if (imageFile) {
        try {
          imageUrl = await uploadToCloudinary(imageFile, `products/${product.category}/${slugify(product.name)}`);
        } catch {
          toast.error("Image upload failed.");
          setLoading(false);
          return;
        }
      }
      // Always use quantity as stock
      const stock = Number(product.quantity) || 0;
      // Upload variant images and handle autoSku
      const updatedVariants = { ...variants };
      for (const key of Object.keys(updatedVariants)) {
        // Upload new images (File objects) for this variant
        if (variantImageFiles[key]) {
          const uploadedImages: string[] = [];
          for (const img of variantImageFiles[key]) {
            if (img instanceof File) {
              const result = await uploadToCloudinary(img, `products/${product.category}/${slugify(product.name)}/variants/${key}`);
              uploadedImages.push(result);
            } else if (typeof img === 'string') {
              uploadedImages.push(img); // already a URL
            }
          }
          updatedVariants[key].images = uploadedImages;
        }
        if (autoSku) {
          updatedVariants[key].sku = key.split("::").map(v => v.replace(/\s+/g, '').toUpperCase()).join('-');
        }
      }
      let galleryImageUrls: string[] = [];
      for (const img of galleryImageFiles) {
        if (img instanceof File) {
          const result = await uploadToCloudinary(img, `products/${product.category}/${slugify(product.name)}/gallery`);
          galleryImageUrls.push(result);
        } else if (typeof img === 'string') {
          galleryImageUrls.push(img);
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
        costPrice: Number(product.costPrice) || 0,
        tax: product.tax || "",
        priceIncludesTax: !!product.priceIncludesTax,
        sku: product.sku || "",
        stock, // always from quantity
        warehouse: product.warehouse || "",
        status: product.status || "active",
        image: imageUrl || "/placeholder.png",
        unit: product.unit || "",
        hsn: product.hsn || "",
        allowBackorders: !!product.allowBackorders,
        lowStockThreshold: Number(product.lowStockThreshold) || 0,
        weight: Number(product.weight) || 0,
        dimensions: product.dimensions || { l: "", w: "", h: "" },
        shippingClass: product.shippingClass || "",
        returnable: !!product.returnable,
        returnWindow: Number(product.returnWindow) || 0,
        codAvailable: !!product.codAvailable,
        mainImage: product.mainImage || "",
        galleryImages: galleryImageUrls,
        video: product.video || "",
        model3d: product.model3d || "",
        metaTitle: product.metaTitle || "",
        metaDescription: product.metaDescription || "",
        metaKeywords: product.metaKeywords || "",
        canonicalUrl: product.canonicalUrl || "",
        legal_hsn: product.legal_hsn || "",
        batchNumber: product.batchNumber || "",
        manufacturer: product.manufacturer || "",
        warranty: product.warranty || "",
        certifications: product.certifications || "",
        safetyInfo: product.safetyInfo || "",
        variants: updatedVariants,
        attributes: attributes !== undefined ? attributes : [],
      };
      // Submitting product data
      const url = mode === "edit" ? `${API_URL}/products/${productId}` : `${API_URL}/products`;
      const method = mode === "edit" ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error(`Failed to ${mode === "edit" ? "update" : "create"} product`);
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
      // Clear galleryImageFiles after successful submit
      setGalleryImageFiles([]);
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
    { key: 'Legal', open: showLegal, setOpen: setShowLegal, icon: <Shield className="text-brand-primary" /> },
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
                <input
                  type="text"
                  value={product.sku ?? ""}
                  onChange={(e) => setProduct({ ...product, sku: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  placeholder="Enter SKU"
                />
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
                    placeholder="Search or select category"
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
                onSuccess={cat => {
                  setCategories((prev: any[]) => [...prev, cat]);
                  setProduct((prev: any) => ({ ...prev, category: cat._id }));
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
                    placeholder="Search or select subcategory"
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
                onSuccess={subcat => {
                  setSubcategories((prev: any[]) => [...prev, subcat]);
                  setProduct((prev: any) => ({ ...prev, subcategory: subcat._id }));
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
                    placeholder="Search or select brand"
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
                onSuccess={brand => {
                  setBrands((prev: any[]) => [...prev, brand]);
                  setProduct((prev: any) => ({ ...prev, brand: brand._id }));
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
                  className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
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
                  className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  placeholder="0"
                  min="0"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Warehouse <span className="text-red-500">*</span>
                </label>
                <select
                  value={product.warehouse ?? ""}
                  onChange={(e) => setProduct({ ...product, warehouse: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  required
                >
                  <option value="">Select Warehouse</option>
                  {warehouses.map((warehouse: any) => (
                    <option key={warehouse._id} value={warehouse._id}>
                      {warehouse.name}
                    </option>
                  ))}
                </select>
              </div>
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
                          <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                          <input type="text" value={product.sku} onChange={e => setProduct({ ...product, sku: e.target.value })} className="w-full border border-gray-300 rounded-lg p-3" placeholder="Enter SKU" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">HSN Code</label>
                          <input type="text" value={product.hsn} onChange={e => setProduct({ ...product, hsn: e.target.value })} className="w-full border border-gray-300 rounded-lg p-3" placeholder="Enter HSN Code" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Stock Status</label>
                          <select value={product.stockStatus ? "in" : "out"} onChange={e => setProduct({ ...product, stockStatus: e.target.value === "in" })} className="w-full border border-gray-300 rounded-lg p-3">
                            <option value="in">In Stock</option>
                            <option value="out">Out of Stock</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                          <input type="number" value={product.quantity} onChange={e => setProduct({ ...product, quantity: Number(e.target.value) })} className="w-full border border-gray-300 rounded-lg p-3" placeholder="0" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Allow Backorders</label>
                          <input type="checkbox" checked={product.allowBackorders} onChange={e => setProduct({ ...product, allowBackorders: e.target.checked })} />
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
                          <input type="number" value={product.price} onChange={e => setProduct({ ...product, price: e.target.value })} className="w-full border border-gray-300 rounded-lg p-3" placeholder="0.00" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price</label>
                          <input type="number" value={product.costPrice} onChange={e => setProduct({ ...product, costPrice: e.target.value })} className="w-full border border-gray-300 rounded-lg p-3" placeholder="0.00" />
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
                          <input type="number" value={product.returnWindow} onChange={e => setProduct({ ...product, returnWindow: e.target.value })} className="w-full border border-gray-300 rounded-lg p-3" placeholder="0" />
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
                                        setAttributes(attrs => attrs.map(a => a.name === attr.name ? { ...a, values: Array.from(new Set([...a.values, ...(attributeValueInputs[attr.name] || "").split(",").map(v => v.trim()).filter(Boolean)])) } : a));
                                        setAttributeValueInputs(inputs => ({ ...inputs, [attr.name]: "" }));
                                      }
                                    }
                                  }}
                                  className="border-b-2 border-brand-primary px-2 py-1 text-base focus:outline-none min-w-[60px]"
                                  placeholder={`Add ${attr.name}`}
                                />
                                <button type="button" onClick={() => {
                                  if ((attributeValueInputs[attr.name] || "").trim()) {
                                    setAttributes(attrs => attrs.map(a => a.name === attr.name ? { ...a, values: Array.from(new Set([...a.values, ...(attributeValueInputs[attr.name] || "").split(",").map(v => v.trim()).filter(Boolean)])) } : a));
                                    setAttributeValueInputs(inputs => ({ ...inputs, [attr.name]: "" }));
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
                                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${autoSku ? 'translate-x-5' : 'translate-x-1'}`}/>
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
                                    const key = combo.join('::');
                                    const variant = variants[key] || { sku: '', price: '', stock: '', image: null };
                                    const generateSku = (combo: string[]) => combo.map(v => v.replace(/\s+/g, '').toUpperCase()).join('-');
                                    return (
                                      <tr key={key} className="hover:bg-gray-50">
                                        {combo.map((val, i) => (
                                          <td key={val + i} className="px-3 py-2 border-b">{val}</td>
                                        ))}
                                        {/* SKU */}
                                        <td className="px-3 py-2 border-b">
                                          <input
                                            type="text"
                                            value={autoSku ? generateSku(combo) : variant.sku}
                                            disabled={autoSku}
                                            onChange={e => setVariants(prev => ({ ...prev, [key]: { ...variant, sku: e.target.value } }))}
                                            className={`w-24 border rounded px-1 py-0.5 ${autoSku ? 'bg-gray-100 text-gray-400' : ''}`}
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
                          <label className="block text-sm font-medium text-gray-700 mb-1">Gallery Images</label>
                          <input type="file" accept="image/*" multiple onChange={handleGalleryImagesChange} className="block w-full text-sm text-gray-500" />
                          <div className="flex gap-2 mt-2">
                            {(product.galleryImages || []).map((img: any, idx: number) => (
                              <div key={idx} className="relative">
                                <img
                                  src={typeof img === 'string' ? img : img?.secure_url}
                                  alt={`Gallery ${idx + 1}`}
                                  className="w-16 h-16 object-cover rounded"
                                />
                                <button type="button" onClick={() => {
                                  const url = typeof img === 'string' ? img : img?.secure_url;
                                  if (url) {
                                    setGalleryImagesToDelete(prev => [...prev, url]);
                                    setProduct((prev: any) => ({ ...prev, galleryImages: prev.galleryImages.filter((_: any, i: number) => i !== idx) }));
                                  }
                                }} className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center">&times;</button>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Product Video URL</label>
                          <input type="url" value={product.video} onChange={e => setProduct({ ...product, video: e.target.value })} className="w-full border border-gray-300 rounded-lg p-3" placeholder="https://youtube.com/..." />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">3D Model (optional)</label>
                          <input type="url" value={product.model3d} onChange={e => setProduct({ ...product, model3d: e.target.value })} className="w-full border border-gray-300 rounded-lg p-3" placeholder="https://..." />
                        </div>
                      </div>
                    )}
                    {key === 'SEO' && showSEO && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Meta Title</label>
                          <input type="text" value={product.metaTitle} onChange={e => setProduct({ ...product, metaTitle: e.target.value })} className="w-full border border-gray-300 rounded-lg p-3" placeholder="Meta title for SEO" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Meta Description</label>
                          <input type="text" value={product.metaDescription} onChange={e => setProduct({ ...product, metaDescription: e.target.value })} className="w-full border border-gray-300 rounded-lg p-3" placeholder="Meta description for SEO" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Meta Keywords (comma separated)</label>
                          <input type="text" value={product.metaKeywords} onChange={e => setProduct({ ...product, metaKeywords: e.target.value })} className="w-full border border-gray-300 rounded-lg p-3" placeholder="keywords1, keywords2" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Canonical URL</label>
                          <input type="url" value={product.canonicalUrl} onChange={e => setProduct({ ...product, canonicalUrl: e.target.value })} className="w-full border border-gray-300 rounded-lg p-3" placeholder="https://yourdomain.com/product-slug" />
                        </div>
                      </div>
                    )}
                    {key === 'Legal' && showLegal && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">HSN (Legal)</label>
                          <input type="text" value={product.legal_hsn} onChange={e => setProduct({ ...product, legal_hsn: e.target.value })} className="w-full border border-gray-300 rounded-lg p-3" placeholder="Legal HSN code" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Batch Number</label>
                          <input type="text" value={product.batchNumber} onChange={e => setProduct({ ...product, batchNumber: e.target.value })} className="w-full border border-gray-300 rounded-lg p-3" placeholder="Batch number" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer</label>
                          <input type="text" value={product.manufacturer} onChange={e => setProduct({ ...product, manufacturer: e.target.value })} className="w-full border border-gray-300 rounded-lg p-3" placeholder="Manufacturer name" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Warranty</label>
                          <input type="text" value={product.warranty} onChange={e => setProduct({ ...product, warranty: e.target.value })} className="w-full border border-gray-300 rounded-lg p-3" placeholder="Warranty status" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Certifications (comma separated)</label>
                          <input type="text" value={product.certifications} onChange={e => setProduct({ ...product, certifications: e.target.value })} className="w-full border border-gray-300 rounded-lg p-3" placeholder="ISO, BIS, ..." />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Safety Info</label>
                          <input type="text" value={product.safetyInfo} onChange={e => setProduct({ ...product, safetyInfo: e.target.value })} className="w-full border border-gray-300 rounded-lg p-3" placeholder="Safety information" />
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
          <CategoryFormModal
            open={showCategoryModal}
            onClose={() => setShowCategoryModal(false)}
            onSuccess={cat => {
              setCategories((prev: any[]) => [...prev, cat]);
              setProduct((prev: any) => ({ ...prev, category: cat._id }));
            }}
            categories={categories}
          />
          <CategoryFormModal
            open={showSubcategoryModal}
            onClose={() => setShowSubcategoryModal(false)}
            onSuccess={subcat => {
              setSubcategories((prev: any[]) => [...prev, subcat]);
              setProduct((prev: any) => ({ ...prev, subcategory: subcat._id }));
            }}
            categories={categories}
            parentId={product.category}
          />
          <BrandFormModal
            open={showBrandModal}
            onClose={() => setShowBrandModal(false)}
            onSuccess={brand => {
              setBrands((prev: any[]) => [...prev, brand]);
              setProduct((prev: any) => ({ ...prev, brand: brand._id }));
            }}
          />
        </div>
      </div>
    </AdminLayout>
  );
}
