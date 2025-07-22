import React, { useState, useRef } from "react";
import ReactDOM from "react-dom";
import { X } from "lucide-react";
import toast from "react-hot-toast";

interface Brand {
  _id?: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  bannerImage?: string;
  isPopular: boolean;
  showOnHome: boolean;
  status: "active" | "inactive";
}

interface BrandFormModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (brand: Brand) => void;
}

const defaultBrand: Brand = {
  name: "",
  slug: "",
  description: "",
  logo: "",
  bannerImage: "",
  isPopular: false,
  showOnHome: false,
  status: "active",
};

function slugify(str: string) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/--+/g, "-");
}

export default function BrandFormModal({ open, onClose, onSuccess }: BrandFormModalProps) {
  const [form, setForm] = useState<Brand>(defaultBrand);
  const [loading, setLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [bannerPreview, setBannerPreview] = useState<string>("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  React.useEffect(() => {
    if (open) {
      setForm(defaultBrand);
      setLogoPreview("");
      setBannerPreview("");
      setLogoFile(null);
      setBannerFile(null);
      if (logoInputRef.current) logoInputRef.current.value = "";
      if (bannerInputRef.current) bannerInputRef.current.value = "";
    }
  }, [open]);

  if (!open) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({
      ...f,
      [name]: type === "checkbox" ? checked : value,
      slug: name === "name" ? slugify(value) : f.slug,
      status: name === "status" ? (checked ? "active" : "inactive") : f.status,
    }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
      setForm(f => ({ ...f, logo: "" }));
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
      setForm(f => ({ ...f, bannerImage: "" }));
    }
  };

  const handleRemoveLogo = () => {
    setLogoPreview("");
    setLogoFile(null);
    setForm(f => ({ ...f, logo: "" }));
    if (logoInputRef.current) logoInputRef.current.value = "";
  };

  const handleRemoveBanner = () => {
    setBannerPreview("");
    setBannerFile(null);
    setForm(f => ({ ...f, bannerImage: "" }));
    if (bannerInputRef.current) bannerInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    let logoUrl = form.logo;
    let bannerUrl = form.bannerImage;
    try {
      if (logoFile) {
        const formData = new FormData();
        formData.append("file", logoFile);
        formData.append("upload_preset", "bazarxpress");
        const res = await fetch("https://api.cloudinary.com/v1_1/demo/image/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        logoUrl = data.secure_url;
      }
      if (bannerFile) {
        const formData = new FormData();
        formData.append("file", bannerFile);
        formData.append("upload_preset", "bazarxpress");
        const res = await fetch("https://api.cloudinary.com/v1_1/demo/image/upload", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        bannerUrl = data.secure_url;
      }
      const payload = {
        ...form,
        logo: logoUrl,
        bannerImage: bannerUrl,
      };
      const res = await fetch(`${API_URL}/brands`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to add brand");
      const data = await res.json();
      toast.success("Brand added");
      onSuccess(data);
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Error adding brand");
    } finally {
      setLoading(false);
    }
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4 p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-red-500 text-2xl"
          aria-label="Close"
        >
          <X />
        </button>
        <div className="text-xl font-semibold mb-4">Add Brand</div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Brand Name</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-brand-primary"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
            <input
              type="text"
              name="slug"
              value={form.slug}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-brand-primary"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-brand-primary"
              rows={2}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Logo <span className="text-red-500">*</span></label>
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              ref={logoInputRef}
              className="block mt-1 w-full"
            />
            {logoPreview && (
              <div className="mt-2 flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <img src={logoPreview} alt="Logo Preview" className="w-16 h-16 object-cover rounded border" />
                <button type="button" className="text-red-500 text-xs" onClick={handleRemoveLogo}>Remove</button>
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Banner Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleBannerChange}
              ref={bannerInputRef}
              className="block mt-1 w-full"
            />
            {bannerPreview && (
              <div className="mt-2 flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <img src={bannerPreview} alt="Banner Preview" className="w-32 h-16 object-cover rounded border" />
                <button type="button" className="text-red-500 text-xs" onClick={handleRemoveBanner}>Remove</button>
              </div>
            )}
          </div>
          <div className="flex gap-4 items-center">
            <label className="flex items-center gap-2">
              <input type="checkbox" name="isPopular" checked={form.isPopular} onChange={handleChange} />
              <span>Popular</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="status" checked={form.status === "active"} onChange={handleChange} />
              <span>Active</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="showOnHome" checked={form.showOnHome} onChange={handleChange} />
              <span>Show on Home Page</span>
            </label>
          </div>
          <div className="flex gap-2 mt-4 justify-end">
            <button
              type="button"
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 px-6 rounded-lg transition-colors"
              onClick={onClose}
              disabled={loading}
            >Cancel</button>
            <button
              type="submit"
              className="bg-brand-primary hover:bg-brand-primary-dark text-white font-semibold py-2 px-6 rounded-lg transition-colors"
              disabled={loading}
            >{loading ? 'Saving...' : 'Add Brand'}</button>
          </div>
        </form>
      </div>
    </div>,
    typeof window !== 'undefined' ? document.body : (null as any)
  );
} 