import React, { useState, useRef } from "react";
import ReactDOM from "react-dom";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import * as LucideIcons from "lucide-react";

interface Category {
  _id?: string;
  name: string;
  slug?: string;
  description?: string;
  icon?: string;
  parentId?: string;
  hide?: boolean;
  popular?: boolean;
  showOnHome?: boolean;
  sortOrder?: number;
  thumbnail?: string;
}

interface CategoryFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (category: Category) => void;
  categories: Category[];
  parentId?: string;
}

const defaultCategory: Category = {
  name: "",
  slug: "",
  description: "",
  icon: "Box",
  parentId: "",
  hide: false,
  popular: false,
  showOnHome: false,
  sortOrder: 0,
  thumbnail: undefined,
};

function slugify(str: string) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/--+/g, "-");
}

function sanitizeIconInput(input: string) {
  return input.replace(/<|>|\//g, '').trim();
}

export default function CategoryFormModal({ open, onClose, onSuccess, categories, parentId }: CategoryFormModalProps) {
  // All hooks at the top
  const [form, setForm] = useState<Category>({ ...defaultCategory, parentId: parentId || "" });
  const [loading, setLoading] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>("");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  // Calculate next sort order (auto-assigned)
  const nextSortOrder = React.useMemo(() => {
    if (!categories || categories.length === 0) return 0;
    const highest = Math.max(...categories.map(cat => cat.sortOrder || 0));
    return highest + 1;
  }, [categories]);

  React.useEffect(() => {
    if (open) {
      setForm({ ...defaultCategory, parentId: parentId || "" });
      setThumbnailPreview("");
      setThumbnailFile(null);
      if (thumbnailInputRef.current) thumbnailInputRef.current.value = "";
    }
  }, [open, parentId]);

  if (!open) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({
      ...f,
      [name]: type === "checkbox" ? checked : value,
      slug: name === "name" ? slugify(value) : f.slug,
      icon: name === "icon" ? sanitizeIconInput(value) : f.icon,
    }));
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      setThumbnailPreview(URL.createObjectURL(file));
      setForm(f => ({ ...f, thumbnail: undefined }));
    }
  };

  const handleRemoveThumbnail = () => {
    setThumbnailPreview("");
    setThumbnailFile(null);
    setForm(f => ({ ...f, thumbnail: undefined }));
    if (thumbnailInputRef.current) thumbnailInputRef.current.value = "";
  };

  const IconComponent = (LucideIcons as any)[sanitizeIconInput(form.icon || "Box")] || LucideIcons["Box"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    let thumbnailUrl = form.thumbnail;
    try {
      if (thumbnailFile) {
        const formData = new FormData();
        formData.append("file", thumbnailFile);
        formData.append("upload_preset", "bazarxpress");
        const res = await fetch("https://api.cloudinary.com/v1_1/demo/image/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        thumbnailUrl = data.secure_url;
      }
      const payload = {
        ...form,
        slug: form.slug || slugify(form.name || ""),
        sortOrder: nextSortOrder,
        icon: sanitizeIconInput(form.icon || "Box"),
        thumbnail: thumbnailUrl,
        parentId: parentId || form.parentId || "",
      };
      const res = await fetch(`${API_URL}/categories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to add category");
      const data = await res.json();
      toast.success("Category added");
      onSuccess(data);
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Error adding category");
    } finally {
      setLoading(false);
    }
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full mx-4 p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-red-500 text-2xl"
          aria-label="Close"
        >
          <X />
        </button>
        <div className="text-xl font-semibold mb-4">Add Category</div>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name<span className="text-red-500">*</span></label>
              <input
                type="text"
                name="name"
                required
                value={form.name}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Slug<span className="text-red-500">*</span></label>
              <input
                type="text"
                name="slug"
                required
                value={form.slug || slugify(form.name || "")}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary lowercase"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                name="description"
                value={form.description || ""}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary min-h-[60px]"
                placeholder="Category description"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Sort Order <span className="text-gray-500 text-xs">(auto-assigned)</span></label>
              <input
                type="number"
                name="sortOrder"
                value={nextSortOrder}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary bg-gray-50"
                placeholder="0"
                readOnly
              />
              <p className="text-xs text-gray-500 mt-1">Sort order is automatically assigned based on existing categories.</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Parent Category (optional)</label>
              <select
                name="parentId"
                value={form.parentId}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-primary"
                disabled={!!parentId}
              >
                <option value="">None</option>
                {categories.filter(cat => !cat.parentId).map(cat => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-6 mt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-sm">Hide</span>
                <input
                  type="checkbox"
                  name="hide"
                  checked={!!form.hide}
                  onChange={handleChange}
                  className="form-checkbox h-5 w-5 text-brand-primary rounded focus:ring-brand-primary"
                />
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-sm">Popular</span>
                <input
                  type="checkbox"
                  name="popular"
                  checked={!!form.popular}
                  onChange={handleChange}
                  className="form-checkbox h-5 w-5 text-brand-primary rounded focus:ring-brand-primary"
                />
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-sm">Show on Home</span>
                <input
                  type="checkbox"
                  name="showOnHome"
                  checked={!!form.showOnHome}
                  onChange={handleChange}
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
                  name="icon"
                  value={form.icon}
                  onChange={handleChange}
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
                  {thumbnailPreview ? (
                    <>
                      <img
                        src={thumbnailPreview}
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
                    ref={thumbnailInputRef}
                    className="hidden"
                  />
                </label>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-gray-500">Recommended: 256x256px or larger, square image.</span>
                  {thumbnailPreview && (
                    <button
                      type="button"
                      className="text-xs text-brand-error hover:underline mt-1"
                      onClick={handleRemoveThumbnail}
                      disabled={loading}
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
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-brand-primary hover:bg-brand-primary-dark text-white font-semibold flex items-center justify-center"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Add Category'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    typeof window !== 'undefined' ? document.body : (null as any)
  );
} 