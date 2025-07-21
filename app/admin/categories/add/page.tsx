"use client"
import { useState, useRef, useEffect } from "react";
import AdminLayout from "../../../../components/AdminLayout";
import * as LucideIcons from "lucide-react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import imageCompression from 'browser-image-compression';
import { uploadToCloudinary } from '../../../../lib/uploadToCloudinary';

const AddCategoryPage = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    sortOrder: 0,
    parentId: "",
    icon: "Box",
    hide: false,
    popular: false,
    thumbnail: undefined as string | undefined,
    slugEdited: false,
    showOnHome: false,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const BackedUrl = process.env.NEXT_PUBLIC_API_URL;
  const [loading, setLoading] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailDeleting, setThumbnailDeleting] = useState(false);
  // Add state for image to delete
  const [thumbnailToDelete, setThumbnailToDelete] = useState<string | null>(null);

  // Calculate the next available sort order
  const calculateNextSortOrder = (categories: any[]) => {
    if (!categories || categories.length === 0) return 0;
    
    // Find the highest sort order across all categories
    const highestSortOrder = Math.max(...categories.map((cat: any) => cat.sortOrder || 0));
    return highestSortOrder + 1;
  };
  
  // Fetch categories for parent dropdown
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${BackedUrl}/categories`);
        if (!res.ok) throw new Error("Failed to fetch categories");
        const data = await res.json();
        
        // Filter to only include parent categories (those with no parentId)
        const parentCategories = data.filter((cat: any) => !cat.parentId);
        console.log('Parent categories for dropdown:', parentCategories);
        
        setCategories(parentCategories);
        
        // Automatically set the next available sort order using a single continuous sequence
        const nextSortOrder = calculateNextSortOrder(data);
        console.log('Setting next sort order:', nextSortOrder);
        setForm(prev => ({ ...prev, sortOrder: nextSortOrder }));
      } catch (error) {
        console.error("Error fetching categories:", error);
        toast.error("Could not load parent categories");
      }
    };
    
    fetchCategories();
  }, [BackedUrl]);

  function slugify(str: string) {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/--+/g, '-');
  }

  // Utility to sanitize icon input
  function sanitizeIconInput(input: string) {
    return input.replace(/<|>|\//g, '').trim();
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setForm(prev => ({
      ...prev,
      name,
      slug: prev.slugEdited ? prev.slug : slugify(name),
    }));
  };
  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({
      ...prev,
      slug: slugify(e.target.value),
      slugEdited: true,
    }));
  };
  const handleThumbnailChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      setForm(prev => ({ ...prev, thumbnail: URL.createObjectURL(file) }));
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };
  const handleCancel = () => {
    router.push("/admin/categories");
  };
  const IconComponent = (LucideIcons as any)[sanitizeIconInput(form.icon)] || LucideIcons["Box"];

  const checkSortOrderUnique = async (sortOrder: number) => {
    try {
      const res = await fetch(`${BackedUrl}/categories?sortOrder=${sortOrder}`);
      if (!res.ok) return false;
      const categories = await res.json();
      return !categories.some((cat: any) => cat.sortOrder === sortOrder);
    } catch {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading("Creating category...");
    if (!form.thumbnail && !thumbnailFile) {
      toast.dismiss(toastId);
      toast.error("Category image is required.");
      setLoading(false);
      return;
    }
    
    let thumbnailUrl = form.thumbnail;
    if (thumbnailFile) {
      try {
        thumbnailUrl = await uploadToCloudinary(thumbnailFile, `categories/${form.slug || form.name || 'category'}`);
      } catch {
        toast.dismiss(toastId);
        toast.error("Image upload failed.");
        setLoading(false);
        return;
      }
    }
    const payload = {
      name: form.name,
      slug: form.slug,
      description: form.description,
      sortOrder: form.sortOrder,
      parentId: form.parentId,
      icon: sanitizeIconInput(form.icon),
      hide: form.hide,
      popular: form.popular,
      thumbnail: thumbnailUrl,
      showOnHome: form.showOnHome,
    };
    try {
      const res = await fetch(`${BackedUrl}/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      toast.dismiss(toastId);
      if (!res.ok) {
        const error = await res.json();
        toast.error(error.error || error.message || 'Failed to add category', { id: toastId });
        setLoading(false);
        return;
      }
      toast.success("Category added successfully", { id: toastId });
      router.push("/admin/categories");
    } catch (error) {
      toast.dismiss(toastId);
      toast.error("Failed to add category", { id: toastId });
    } finally {
      setLoading(false);
      setThumbnailFile(null);
      // On form submit, after DB update, delete the marked image from Cloudinary
      if (thumbnailToDelete) {
        await deleteImageFromCloudinary(thumbnailToDelete);
      }
      // After deletion, clear the toDelete state:
      setThumbnailToDelete(null);
    }
  };

  // Helper to delete image from Cloudinary
  async function deleteImageFromCloudinary(imageUrl: string) {
    if (!imageUrl) return true;
    try {
      const res = await fetch("/api/delete-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl }),
      });
      if (!res.ok) throw new Error();
      return true;
    } catch {
      return false;
    }
  }

  // When deleting a category, delete the image from Cloudinary first
  const handleDeleteCategory = async (category: any) => {
    if (category.thumbnail) {
      await deleteImageFromCloudinary(category.thumbnail);
    }
    // The original code had a deleteImageFromCloudinary call here, but it was removed.
    // If the intent was to delete the image from Cloudinary when deleting a category,
    // it should be re-added here or in a separate function.
    // For now, keeping the original logic as is, but noting the potential for re-adding.
  };

  return (
    <AdminLayout>
      <section className="w-full bg-white py-8 px-2 md:px-8 lg:px-16 xl:px-32">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6">Add Category</h2>
          <form className="grid grid-cols-1 md:grid-cols-2 gap-6" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name<span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={handleNameChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Slug<span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={form.slug || slugify(form.name)}
                  onChange={handleSlugChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary lowercase"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={form.description || ""}
                  onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary min-h-[60px]"
                  placeholder="Category description"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Sort Order <span className="text-gray-500 text-xs">(auto-assigned)</span></label>
                <input
                  type="number"
                  value={typeof form.sortOrder === 'number' ? form.sortOrder : 0}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary bg-gray-50"
                  placeholder="0"
                  readOnly
                />
                <p className="text-xs text-gray-500 mt-1">Sort order is automatically assigned based on existing categories.</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Parent Category (optional)</label>
                <select
                  value={form.parentId}
                  onChange={e => setForm(prev => ({ ...prev, parentId: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                >
                  <option value="">None</option>
                  {categories.map((cat: any) => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-6 mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-sm">Hide</span>
                  <input
                    type="checkbox"
                    checked={!!form.hide}
                    onChange={e => setForm(prev => ({ ...prev, hide: e.target.checked }))}
                    className="form-checkbox h-5 w-5 text-brand-primary rounded focus:ring-brand-primary"
                  />
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-sm">Popular</span>
                  <input
                    type="checkbox"
                    checked={!!form.popular}
                    onChange={e => setForm(prev => ({ ...prev, popular: e.target.checked }))}
                    className="form-checkbox h-5 w-5 text-brand-primary rounded focus:ring-brand-primary"
                  />
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-sm">Show on Home</span>
                  <input
                    type="checkbox"
                    checked={!!form.showOnHome}
                    onChange={e => setForm(prev => ({ ...prev, showOnHome: e.target.checked }))}
                    className="form-checkbox h-5 w-5 text-brand-primary rounded focus:ring-brand-primary"
                  />
                </label>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">Icon Name</label>
                  <input
                    type="text"
                    value={form.icon}
                    onChange={e => setForm(prev => ({ ...prev, icon: sanitizeIconInput(e.target.value) }))}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    placeholder="Box"
                  />
                </div>
                <div className="flex flex-col items-center justify-center mt-6">
                  <IconComponent className="h-8 w-8 text-brand-primary" />
                  <span className="text-xs text-gray-400 mt-1">Preview</span>
                </div>
              </div>
              <div>
                <a
                  href="https://lucide.dev/icons/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-primary hover:underline text-sm inline-block"
                >
                  Browse Categories Icons
                </a>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Thumbnail Image<span className="text-red-500">*</span></label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-1">
                  <label
                    htmlFor="category-thumbnail-upload"
                    className="relative flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-brand-primary rounded-lg bg-brand-primary/5 hover:bg-brand-primary/10 transition-colors cursor-pointer group focus:outline-none"
                  >
                    {form.thumbnail ? (
                      <>
                        <img
                          src={form.thumbnail}
                          alt="Thumbnail Preview"
                          className="w-full h-full object-cover rounded-lg"
                        />
                        <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                          <span className="text-white text-xs font-semibold px-2 py-1 bg-brand-primary/80 rounded">Change</span>
                        </span>
                      </>
                    ) : (
                      <>
                        <svg className="w-10 h-10 text-brand-primary mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span className="text-brand-primary text-xs font-medium">Upload Image</span>
                        <span className="text-gray-400 text-[10px] mt-1">PNG, JPG, JPEG, GIF</span>
                      </>
                    )}
                    <input
                      id="category-thumbnail-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleThumbnailChange}
                      ref={fileInputRef}
                      className="hidden"
                    />
                  </label>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-gray-500">Recommended: 256x256px or larger, square image.</span>
                    {form.thumbnail && (
                      <button
                        type="button"
                        className="text-xs text-brand-error hover:underline mt-1"
                        onClick={() => {
                          if (form.thumbnail && !thumbnailFile) {
                            setThumbnailToDelete(form.thumbnail);
                            setForm(prev => ({ ...prev, thumbnail: undefined }));
                            setThumbnailFile(null);
                            if (fileInputRef.current) fileInputRef.current.value = "";
                          } else {
                            setForm(prev => ({ ...prev, thumbnail: undefined }));
                            setThumbnailFile(null);
                            if (fileInputRef.current) fileInputRef.current.value = "";
                          }
                        }}
                        disabled={thumbnailDeleting}
                      >
                        Remove Image
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="col-span-1 md:col-span-2 flex justify-end gap-2 pt-4">
              <button
                type="button"
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-700"
                onClick={handleCancel}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded bg-brand-primary hover:bg-brand-primary-dark text-white font-semibold flex items-center justify-center"
                disabled={loading || thumbnailDeleting}
              >
                {(loading || thumbnailDeleting) && (
                  <svg className="animate-spin h-5 w-5 mr-2 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                  </svg>
                )}
                {thumbnailDeleting ? 'Deleting...' : loading ? 'Saving...' : 'Add Category'}
              </button>
            </div>
          </form>
        </div>
      </section>
    </AdminLayout>
  );
};

export default AddCategoryPage; 