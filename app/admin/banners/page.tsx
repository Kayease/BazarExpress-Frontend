"use client"

import { useState, useEffect } from "react"
import AdminLayout from "../../../components/AdminLayout"
import { Plus, Pencil, Trash2, ShoppingBag, Cat, Baby } from "lucide-react"
import { useAppSelector } from '../../../lib/store'
import { isAdminUser, hasAccessToSection } from '../../../lib/adminAuth';
import { useRouter } from 'next/navigation';
import toast from "react-hot-toast";
import { uploadToCloudinary } from "../../../lib/uploadToCloudinary";
import { apiPost, apiPut, apiDelete, apiGet } from "../../../lib/api-client";

// Banner type
interface Banner {
  _id?: string;
  id?: string;
  image: string;
  name: string;
  active: boolean;
  categoryId?: string;
  bannerType?: 'regular' | 'banner1' | 'banner2' | 'banner3';
}

interface Category {
  _id: string;
  name: string;
}

export default function AdminBanner() {
  const user = useAppSelector((state) => state.auth.user);
  const router = useRouter();

  const [banners, setBanners] = useState<Banner[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Banner | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    image: "",
    name: "",
    active: true,
    categoryId: "",
    bannerType: "regular" as 'regular' | 'banner1' | 'banner2' | 'banner3',
  })
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageDeleting, setImageDeleting] = useState(false);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [bannerToDelete, setBannerToDelete] = useState<Banner | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  // Add state for image to delete
  const [imageToDelete, setImageToDelete] = useState<string | null>(null);

  // Add state for special banners
  const [specialBanners, setSpecialBanners] = useState({
    banner1: null as Banner | null,
    banner2: null as Banner | null,
    banner3: null as Banner | null,
  });
  const [activeTab, setActiveTab] = useState<'regular' | 'special'>('regular');
  const [currentPage, setCurrentPage] = useState(1);
  const BANNERS_PER_PAGE = 10;
  const totalPages = Math.ceil(banners.length / BANNERS_PER_PAGE);
  const paginatedBanners = banners.slice((currentPage - 1) * BANNERS_PER_PAGE, currentPage * BANNERS_PER_PAGE);

  useEffect(() => {
    if (!user || !isAdminUser(user.role) || !hasAccessToSection(user.role, 'banners')) {
      router.push("/")
      return
    }
    fetchBanners();
    fetchCategories();
  }, [user]);

  const fetchBanners = async (showToast = true) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/banners`);
      if (!res.ok) throw new Error("Failed to fetch banners");
      const data = await res.json();
      
      // Separate regular and special banners
      const regularBanners = data.filter((b: Banner) => !b.bannerType || b.bannerType === 'regular');
      setBanners(regularBanners);
      
      // Update special banners
      const banner1 = data.find((b: Banner) => b.bannerType === 'banner1') || null;
      const banner2 = data.find((b: Banner) => b.bannerType === 'banner2') || null;
      const banner3 = data.find((b: Banner) => b.bannerType === 'banner3') || null;
      
      setSpecialBanners({
        banner1,
        banner2,
        banner3
      });

      // Log the data to debug
      console.log('Fetched banners:', data);
    } catch (err) {
      toast.error("Could not load banners");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_URL}/categories`);
      if (!res.ok) throw new Error("Failed to fetch categories");
      const data = await res.json();
      setCategories(data);
    } catch (err) {
      toast.error("Could not load categories");
    }
  };

  const openAdd = (bannerType: 'regular' | 'banner1' | 'banner2' | 'banner3' = 'regular') => {
    setEditing(null)
    setForm({ 
      image: "", 
      name: "", 
      active: true, 
      categoryId: "",
      bannerType 
    })
    setImagePreview(null)
    setShowModal(true)
  }
  
  const openEdit = (b: Banner) => {
    console.log('Opening edit for banner:', b);
    
    // Ensure we have the most up-to-date banner data with populated categoryId
    const fetchBannerDetails = async () => {
      try {
        const bannerData = await apiGet(`${API_URL}/banners/${b._id || b.id}`);
        console.log('Fetched banner details:', bannerData);
        
        setEditing(bannerData);
        setForm({ 
          image: bannerData.image, 
          name: bannerData.name, 
          active: bannerData.active, 
          categoryId: bannerData.categoryId?._id || bannerData.categoryId || "",
          bannerType: bannerData.bannerType || "regular"
        });
        setImagePreview(bannerData.image);
      } catch (error) {
        console.error('Error fetching banner details:', error);
        // Fallback to using the provided banner data
        setEditing(b);
        setForm({ 
          image: b.image, 
          name: b.name, 
          active: b.active, 
          categoryId: b.categoryId || "",
          bannerType: b.bannerType || "regular"
        });
        setImagePreview(b.image);
      }
    };
    
    fetchBannerDetails();
    setShowModal(true);
  }
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setForm({ ...form, image: "" });
    }
  };

  const createBanner = async (imageUrl: string) => {
    const toastId = toast.loading("Creating banner...");
    const payload = {
      ...form,
      image: imageUrl
    };
    
    try {
      const data = await apiPost(`${API_URL}/banners`, payload);
      toast.success("Banner created", { id: toastId });
      return data;
    } catch (err: any) {
      toast.error(err.message || "Failed to create banner", { id: toastId });
      throw err;
    }
  };

  const editBanner = async (imageUrl: string) => {
    const toastId = toast.loading("Updating banner...");
    const payload = {
      ...form,
      image: imageUrl
    };
    
    try {
      const data = await apiPut(`${API_URL}/banners/${editing?._id || editing?.id}`, payload);
      toast.success("Banner updated", { id: toastId });
      return data;
    } catch (err: any) {
      toast.error(err.message || "Failed to update banner", { id: toastId });
      throw err;
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!imagePreview && !imageFile) {
        toast.error("Banner image is required");
        setLoading(false);
        return;
      }
      
      if (!form.categoryId) {
        toast.error("Category is required");
        setLoading(false);
        return;
      }
      
      // Log the form data for debugging
      console.log('Submitting banner form:', { ...form });
      
      let imageUrl = form.image;
      if (imageFile) {
        try {
          imageUrl = await uploadToCloudinary(imageFile, "banners");
        } catch {
          toast.error("Could not upload image to Cloudinary.");
          setLoading(false);
          return;
        }
      }
      
      const payload = {
        ...form,
        image: imageUrl
      };
      
      console.log('Sending payload to server:', payload);
      
      let response;
      if (editing) {
        response = await editBanner(imageUrl);
      } else {
        response = await createBanner(imageUrl);
      }
      
      console.log('Server response:', response);
      
      setShowModal(false);
      setImageFile(null);
      setImagePreview(null);
      await fetchBanners(false);
      // On form submit, after DB update, delete the marked image from Cloudinary
      if (imageToDelete) {
        await deleteImageFromCloudinary(imageToDelete);
      }
      // After deletion, clear the toDelete state
      setImageToDelete(null);
    } catch (err: any) {
      toast.error(err.message || "Could not submit banner.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (banner: Banner) => {
    setBannerToDelete(banner);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!bannerToDelete) return;
    setDeleteLoading(true);
    const toastId = toast.loading("Deleting banner...");
    try {
      // Delete banner from backend (this will also delete the image from Cloudinary)
      const deleteUrl = `${API_URL}/banners/${bannerToDelete._id || bannerToDelete.id}`;
      await apiDelete(deleteUrl);
      toast.success("Banner deleted successfully", { id: toastId });
      setDeleteModalOpen(false);
      setBannerToDelete(null);
      await fetchBanners(false);
    } catch (err: any) {
      toast.error(err.message || "Could not delete banner.", { id: toastId });
    } finally {
      setDeleteLoading(false);
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

  // Helper to get category name by ID or object
  const getCategoryName = (categoryId: any) => {
    if (!categoryId) return 'None';
    // If categoryId is an object (populated), use its _id
    if (typeof categoryId === 'object' && categoryId._id) {
      const category = categories.find(c => c._id === categoryId._id);
      return category ? category.name : (categoryId.name || 'None');
    }
    // If categoryId is a string (just the ID)
    const category = categories.find(c => c._id === categoryId);
    return category ? category.name : 'None';
  };

  const renderSpecialBannerCard = (
    type: 'banner1' | 'banner2' | 'banner3',
    title: string,
    icon: React.ReactNode,
    description: string
  ) => {
    const banner = specialBanners[type];
    
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-full bg-brand-primary/10 text-brand-primary">
            {icon}
          </div>
          <div>
            <h3 className="font-semibold text-lg">{title}</h3>
            <p className="text-sm text-gray-500">{description}</p>
          </div>
        </div>
        
        {banner ? (
          <div className="space-y-4">
            <div className="aspect-[16/9] rounded-lg overflow-hidden">
              <img 
                src={banner.image} 
                alt={banner.name} 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="font-medium">{banner.name}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${banner.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                  {banner.active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <span className="text-xs text-gray-500">
                Category: {getCategoryName(banner.categoryId)}
              </span>
            </div>
            <div className="flex gap-2 mt-2">
              <button 
                onClick={() => openEdit(banner)}
                className="flex-1 py-2 bg-brand-primary/10 text-brand-primary hover:bg-brand-primary/20 rounded-lg font-medium text-sm"
              >
                Edit
              </button>
              <button 
                onClick={() => handleDeleteClick(banner)}
                className="flex-1 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-medium text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-gray-200 rounded-lg">
            <div className="text-gray-400 mb-3">{icon}</div>
            <p className="text-gray-500 mb-4 text-center">No banner available</p>
            <button
              onClick={() => openAdd(type)}
              className="bg-brand-primary hover:bg-brand-primary-dark text-white font-medium px-4 py-2 rounded-lg text-sm"
            >
              Add Banner
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <AdminLayout>
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-text-primary">Banners</h1>
          <div className="flex gap-2">
            <button 
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${activeTab === 'regular' ? 'bg-brand-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              onClick={() => setActiveTab('regular')}
            >
              Regular Banners
            </button>
            <button 
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${activeTab === 'special' ? 'bg-brand-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              onClick={() => setActiveTab('special')}
            >
              Special Banners
            </button>
            {activeTab === 'regular' && (
              <button className="bg-brand-primary hover:bg-brand-primary-dark text-white font-semibold px-5 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-colors" onClick={() => openAdd('regular')}>
                <Plus className="h-5 w-5" /> Add Banner
              </button>
            )}
          </div>
        </div>

        {activeTab === 'regular' ? (
          <div className="w-full bg-white rounded-2xl shadow-lg p-0 overflow-x-auto">
            <table className="min-w-[900px] w-full text-left">
              <thead>
                <tr className="bg-gray-50">
                  <th className="py-3.5 px-6 font-semibold text-sm">Image</th>
                  <th className="py-3.5 px-6 font-semibold text-sm">Name</th>
                  <th className="py-3.5 px-6 font-semibold text-sm">Category</th>
                  <th className="py-3.5 px-6 font-semibold text-sm">Active</th>
                  <th className="py-3.5 px-6 font-semibold text-sm text-center"> </th>
                </tr>
              </thead>
              <tbody>
                {paginatedBanners.length === 0 && (
                  <tr>
                    <td colSpan={5}>
                      <div className="flex flex-col items-center justify-center py-16">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-brand-primary mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        <div className="text-lg text-gray-500 mb-2">No banners yet.</div>
                        <div className="text-sm text-gray-400 mb-6">Click the + button or the button below to add your first banner.</div>
                        <button
                          className="bg-brand-primary hover:bg-brand-primary-dark text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                          onClick={() => openAdd('regular')}
                        >
                          Add Banner
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
                {paginatedBanners.map(b => (
                  <tr key={b._id || b.id} className="border-b last:border-b-0 hover:bg-gray-50 transition">
                    <td className="py-4 px-6 align-middle text-sm">
                      {b.image ? (
                        <img src={b.image} alt="Banner" className="h-12 w-24 object-cover rounded-lg shadow" />
                      ) : (
                        <div className="h-12 w-24 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">No Image</div>
                      )}
                    </td>
                    <td className="py-4 px-6 align-middle text-sm">
                      <span className="text-brand-primary font-semibold">{b.name}</span>
                    </td>
                    <td className="py-4 px-6 align-middle text-sm">
                      {b.categoryId ? getCategoryName(b.categoryId) : 'None'}
                    </td>
                    <td className="py-4 px-6 align-middle text-sm">
                      <span className={b.active ? "text-brand-success font-semibold" : "text-brand-error font-semibold"}>{b.active ? "Active" : "Inactive"}</span>
                    </td>
                    <td className="py-4 px-6 align-middle text-center text-sm">
                      <div className="flex items-center justify-center gap-2">
                        <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-brand-primary text-white hover:bg-brand-primary-dark transition-colors" onClick={() => openEdit(b)} aria-label="Edit">
                          <Pencil className="h-4 w-4" />
                        </button>
                        {(b._id || b.id) && (
                          <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-brand-error text-white hover:bg-brand-error-dark transition-colors" onClick={() => handleDeleteClick(b)} aria-label="Delete">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-end items-center space-x-2 mt-6 mb-2 pr-2">
                <button
                  className="px-2 py-1 rounded border text-xs font-medium bg-gray-50 hover:bg-gray-100 disabled:opacity-50"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    className={`px-2 py-1 rounded text-xs font-medium border mx-0.5 ${currentPage === page ? 'bg-brand-primary text-white border-brand-primary' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ))}
                <button
                  className="px-2 py-1 rounded border text-xs font-medium bg-gray-50 hover:bg-gray-100 disabled:opacity-50"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {renderSpecialBannerCard(
              'banner1',
              'Banner 1',
              <ShoppingBag className="h-6 w-6" />,
              'Special promotional banner'
            )}
            
            {renderSpecialBannerCard(
              'banner2',
              'Banner 2',
              <Cat className="h-6 w-6" />,
              'Special promotional banner'
            )}
            
            {renderSpecialBannerCard(
              'banner3',
              'Banner 3',
              <Baby className="h-6 w-6" />,
              'Special promotional banner'
            )}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
            <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full mx-4 p-3 relative border-4 border-brand-primary/20">
              {loading && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-50">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-primary"></div>
                </div>
              )}
              <div className="text-2xl font-bold mb-4 text-brand-primary">
                {editing ? "Edit" : "Add"} {form.bannerType !== 'regular' ? form.bannerType.charAt(0).toUpperCase() + form.bannerType.slice(1) + ' ' : ''}Banner
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block font-medium mb-1 text-sm">Image</label>
                  <div className="border-2 border-dashed border-brand-primary/40 rounded-lg flex flex-col items-center justify-center py-4 px-2 cursor-pointer hover:border-brand-primary transition-colors min-h-[120px] max-h-[140px]" onClick={() => document.getElementById('banner-image-input')?.click()}>
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="h-20 object-contain mb-2 rounded shadow" />
                    ) : (
                      <>
                        <svg width="32" height="32" fill="none" stroke="currentColor" className="text-brand-primary" strokeWidth="2" viewBox="0 0 24 24"><path d="M16 16v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2" /><rect x="8" y="2" width="8" height="8" rx="2" /><line x1="12" y1="12" x2="12" y2="16" /><line x1="10" y1="14" x2="14" y2="14" /></svg>
                        <div className="font-medium text-text-primary mt-1 text-sm">Upload Banner Image</div>
                        <div className="text-text-secondary text-xs">Upload jpg, png images</div>
                      </>
                    )}
                    <input
                      id="banner-image-input"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                  </div>
                  {imagePreview && (
                    <div className="flex items-center gap-2 mt-1">
                      <button type="button" className="text-red-500 text-xs" onClick={() => {
                        if (imagePreview && !imageFile) {
                          setImageToDelete(imagePreview);
                          setImagePreview(null);
                          setForm({ ...form, image: "" });
                          setImageFile(null);
                        } else {
                          setImagePreview(null);
                          setForm({ ...form, image: "" });
                          setImageFile(null);
                        }
                      }} disabled={imageDeleting}>Remove</button>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block font-medium mb-1 text-sm">Name</label>
                  <input className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div>
                  <label className="block font-medium mb-1 text-sm">Category (for redirection) <span className="text-red-500">*</span></label>
                  <select 
                    className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" 
                    value={form.categoryId} 
                    onChange={e => setForm({ ...form, categoryId: e.target.value })}
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map(category => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                {form.bannerType === 'regular' && (
                  <div>
                    <label className="block font-medium mb-1 text-sm">Banner Type</label>
                    <select 
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" 
                      value={form.bannerType} 
                      onChange={e => setForm({ ...form, bannerType: e.target.value as any })}
                    >
                      <option value="regular">Regular</option>
                      <option value="banner1">Banner 1</option>
                      <option value="banner2">Banner 2</option>
                      <option value="banner3">Banner 3</option>
                    </select>
                  </div>
                )}
                <div>
                  <label className="block font-medium mb-1 text-sm">Active</label>
                  <select className="w-full border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary" value={form.active ? "true" : "false"} onChange={e => setForm({ ...form, active: e.target.value === "true" })}>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
                <div className="flex gap-2 mt-2">
                  <button type="submit" className="bg-brand-primary hover:bg-brand-primary-dark text-white font-semibold py-2 px-4 rounded-lg flex items-center gap-2 shadow-sm transition-colors justify-center text-sm" disabled={loading || imageDeleting}>
                    {(loading || imageDeleting) && (
                      <svg className="animate-spin h-5 w-5 mr-2 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                      </svg>
                    )}
                    {imageDeleting ? 'Deleting...' : loading ? 'Saving...' : 'Save'}
                  </button>
                  <button type="button" className="bg-surface-secondary hover:bg-surface-tertiary text-text-primary font-semibold py-2 px-4 rounded-lg transition-colors text-sm" onClick={() => setShowModal(false)} disabled={loading}>Cancel</button>
                </div>
              </form>
              <button className="absolute top-3 right-3 text-text-secondary hover:text-brand-error text-2xl" onClick={() => setShowModal(false)} aria-label="Close">&times;</button>
            </div>
          </div>
        )}
        {deleteModalOpen && bannerToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8 relative border-4 border-brand-error/20">
              {deleteLoading && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-50">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-error"></div>
                </div>
              )}
              <div className="text-xl font-bold mb-4 text-brand-error">Delete Banner?</div>
              <div className="mb-6 text-gray-700">Are you sure you want to delete this banner? This will also delete the image from Cloudinary.</div>
              <div className="flex gap-2 justify-end">
                <button className="bg-surface-secondary hover:bg-surface-tertiary text-text-primary font-semibold py-2 px-6 rounded-lg transition-colors" onClick={() => { setDeleteModalOpen(false); setBannerToDelete(null); }} disabled={deleteLoading}>Cancel</button>
                <button className="bg-brand-error hover:bg-brand-error-dark text-white font-semibold py-2 px-6 rounded-lg shadow-lg transition-transform" onClick={confirmDelete} disabled={deleteLoading}>{deleteLoading ? "Deleting..." : "Delete"}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}