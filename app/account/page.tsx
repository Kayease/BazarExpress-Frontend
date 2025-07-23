"use client";

import type React from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Layout from "../../components/Layout";
import {
  UserIcon,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit3,
  Save,
  X,
  ShoppingCart,
  Heart,
  Package,
  TrendingUp,
  Star,
  Home,
  Briefcase,
  Hotel,
  MapPinOff,
  Plus,
  Trash2,
  Minus,
  Eye,
  ArrowRight,
  Gift,
  Award,
  Clock,
  MoreVertical,
  FileText,
  Tag,
  Check,
} from "lucide-react";
import { useAppSelector, useAppDispatch } from "../../lib/store";
import { updateProfile, fetchProfile } from "../../lib/slices/authSlice";
import {
  selectCartItems,
  selectCartCount,
  selectCartTotal,
  removeFromCart,
  updateCartQuantity,
} from "../../lib/slices/cartSlice";
import {
  getWishlistItems,
  removeFromWishlist,
  WishlistItem,
} from "../../lib/wishlist";

// Custom event for wishlist updates
const WISHLIST_UPDATED_EVENT = "wishlistUpdated";
import toast from "react-hot-toast";
import Image from "next/image";

export default function Profile() {
  const user = useAppSelector((state) => state.auth.user);
  const token = useAppSelector((state) => state.auth.token);
  const cartItems = useAppSelector(selectCartItems);
  const cartCount = useAppSelector(selectCartCount);
  const cartTotal = useAppSelector(selectCartTotal);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "profile" | "cart" | "wishlist" | "orders" | "addresses"
  >("profile");
  const [formData, setFormData] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    dateOfBirth: user?.dateOfBirth ?? "",
  });
  const router = useRouter();
  const dispatch = useAppDispatch();
  // Address management moved to a separate page
  const countryOptions = [
    "India",
    "United States",
    "United Kingdom",
    "Canada",
    "Australia",
    "Germany",
    "France",
    "Other",
  ];
  const [fieldErrors, setFieldErrors] = useState({
    email: "",
    phone: "",
    dateOfBirth: "",
  });
  


  useEffect(() => {
    if (!user) {
      router.push("/");
    } else {
      setFormData({
        name: user.name ?? "",
        email: user.email ?? "",
        phone: user.phone ?? "",
        dateOfBirth: user.dateOfBirth ?? "",
      });
    }
  }, [user, router]);

  // Load wishlist items and listen for updates
  useEffect(() => {
    const loadWishlistItems = () => {
      setWishlistItems(getWishlistItems());
    };
    loadWishlistItems();
    // Listen for custom event
    window.addEventListener(WISHLIST_UPDATED_EVENT, loadWishlistItems);
    return () => {
      window.removeEventListener(WISHLIST_UPDATED_EVENT, loadWishlistItems);
    };
  }, []);

  // Utility function to set token as cookie (same as addresses page)
  const setTokenCookie = () => {
    if (token) {
      document.cookie = `token=${token}; path=/; max-age=604800; SameSite=strict`;
    }
  };

  const fetchUserAddresses = async () => {
    try {
      setIsLoadingAddresses(true);
      // Set token as cookie before making the request
      setTokenCookie();

      const response = await fetch(`/api/user/addresses`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch addresses");
      }

      const data = await response.json();
      if (Array.isArray(data.addresses)) {
        // Filter out any addresses that are missing essential data
        const validAddresses = data.addresses.filter((address: any) => 
          address && 
          address.building && 
          address.area && 
          address.city && 
          address.state && 
          address.pincode &&
          address.name
        );
        setSavedAddresses(validAddresses);
      } else {
        setSavedAddresses([]);
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
      setSavedAddresses([]);
    } finally {
      setIsLoadingAddresses(false);
    }
  };

  // Fetch addresses when addresses tab is active
  useEffect(() => {
    if (activeTab === "addresses" && token) {
      fetchUserAddresses();
    }
  }, [activeTab, token]);



  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSave = async () => {
    // Basic form validation
    const nameError = !formData.name.trim() ? "Name is required" : "";
    const emailError = !formData.email.trim()
      ? "Email is required"
      : !/^\S+@\S+\.\S+$/.test(formData.email.trim())
      ? "Invalid email format"
      : "";
    const phoneError = formData.phone.trim()
      ? !/^\d{10}$/.test(formData.phone.trim())
        ? "Phone must be 10 digits"
        : ""
      : "";

    setFieldErrors({
      email: emailError,
      phone: phoneError,
      dateOfBirth: "",
    });

    if (nameError || emailError || phoneError) {
      toast.error("Please fix the errors in the form.");
      return;
    }

    try {
      await dispatch(updateProfile(formData)).unwrap();
      await dispatch(fetchProfile());
      toast.success("Profile updated successfully!");
      setIsEditing(false);
    } catch (err: any) {
      toast.error(err || "Failed to update profile");
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        name: user.name ?? "",
        email: user.email ?? "",
        phone: user.phone ?? "",
        dateOfBirth: user.dateOfBirth ?? "",
      });
    }
    setIsEditing(false);
  };

  // Cart operations
  const handleRemoveFromCart = (itemId: string) => {
    dispatch(removeFromCart(itemId));
    toast.success("Item removed from cart");
  };

  const handleUpdateCartQuantity = (itemId: string, quantity: number) => {
    dispatch(updateCartQuantity({ id: itemId, quantity }));
  };

  // Wishlist operations
  const handleRemoveFromWishlist = (itemId: string) => {
    removeFromWishlist(itemId);
    // Dispatch custom event to notify all listeners
    window.dispatchEvent(new Event(WISHLIST_UPDATED_EVENT));
    toast.success("Item removed from wishlist");
  };



  // Address management moved to separate page

  if (!user) {
    return (
      <Layout>
        <div>Loading...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Enhanced Header with Glassmorphism */}
          <div className="relative bg-gradient-to-r from-brand-primary via-brand-primary-dark to-purple-600 rounded-3xl shadow-2xl overflow-hidden mb-8">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="absolute inset-0 backdrop-blur-sm"></div>
            <div className="relative px-8 py-12">
              <div className="flex flex-col md:flex-row items-center space-y-6 md:space-y-0 md:space-x-8">
                <div className="relative">
                  <div className="w-32 h-32 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-4 border-white/30 shadow-xl">
                    <UserIcon className="h-16 w-16 text-white" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                </div>
                <div className="text-white text-center md:text-left flex-1">
                  <h1 className="text-4xl font-bold mb-2">{user.name}</h1>
                  <p className="text-white/80 text-lg mb-3">{user.email}</p>
                  <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                    <span className="inline-flex items-center bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-medium border border-white/30">
                      <Award className="w-4 h-4 mr-2" />
                      {user.role === "admin"
                        ? "Administrator"
                        : "Premium Customer"}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <div className="text-2xl font-bold">{cartCount}</div>
                    <div className="text-white/80 text-sm">Cart Items</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <div className="text-2xl font-bold">
                      {wishlistItems.length}
                    </div>
                    <div className="text-white/80 text-sm">Wishlist</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                    <div className="text-2xl font-bold">0</div>
                    <div className="text-white/80 text-sm">Orders</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="bg-white rounded-2xl shadow-lg mb-8 overflow-hidden">
            <div className="flex flex-wrap border-b border-gray-200">
              {[
                { id: "profile", label: "Profile", icon: UserIcon },
                {
                  id: "addresses",
                  label: "Saved Addresses",
                  icon: MapPin,
                },
                {
                  id: "cart",
                  label: `Cart (${cartCount})`,
                  icon: ShoppingCart,
                },
                {
                  id: "wishlist",
                  label: `Wishlist (${wishlistItems.length})`,
                  icon: Heart,
                },
                { id: "orders", label: "Orders", icon: Package },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-6 py-4 font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? "text-brand-primary border-b-2 border-brand-primary bg-brand-primary/5"
                      : "text-gray-600 hover:text-brand-primary hover:bg-gray-50"
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="space-y-8">
            {/* Profile Tab */}
            {activeTab === "profile" && (
              <div className="bg-white p-12 rounded-2xl shadow-lg overflow-hidden">
                <div className="">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold text-codGray">
                      Profile Information
                    </h2>
                    {!isEditing ? (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center space-x-2 bg-gradient-to-r from-brand-primary to-brand-primary-dark hover:from-brand-primary-dark hover:to-purple-600 text-white px-6 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                      >
                        <Edit3 className="h-4 w-4" />
                        <span>Edit Profile</span>
                      </button>
                    ) : (
                      <div className="flex space-x-3">
                        <button
                          onClick={handleSave}
                          className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                          <Save className="h-4 w-4" />
                          <span>Save</span>
                        </button>
                        <button
                          onClick={handleCancel}
                          className="flex items-center space-x-2 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white px-6 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                        >
                          <X className="h-4 w-4" />
                          <span>Cancel</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-codGray mb-2">
                      <UserIcon className="inline h-4 w-4 mr-2" />
                      Full Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
                      />
                    ) : (
                      <p className="px-4 py-3 bg-gray-50 rounded-lg text-codGray">
                        {user.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-codGray mb-2">
                      <Mail className="inline h-4 w-4 mr-2" />
                      Email Address
                    </label>
                    {isEditing ? (
                      <div>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
                        />
                        {fieldErrors.email && (
                          <p className="text-red-500 text-xs mt-1">
                            {fieldErrors.email}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="px-4 py-3 bg-gray-50 rounded-lg text-codGray">
                        {user.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-codGray mb-2">
                      <Phone className="inline h-4 w-4 mr-2" />
                      Phone Number
                    </label>
                    {isEditing ? (
                      <div>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="Enter your phone number"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
                        />
                        {fieldErrors.phone && (
                          <p className="text-red-500 text-xs mt-1">
                            {fieldErrors.phone}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="px-4 py-3 bg-gray-50 rounded-lg text-codGray">
                        {formData.phone || "Not provided"}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-codGray mb-2">
                      <Calendar className="inline h-4 w-4 mr-2" />
                      Date of Birth
                    </label>
                    {isEditing ? (
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={formData.dateOfBirth}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary"
                      />
                    ) : (
                      <p className="px-4 py-3 bg-gray-50 rounded-lg text-codGray">
                        {formData.dateOfBirth || "Not provided"}
                      </p>
                    )}
                  </div>

                  {/* Address section removed and moved to a separate tab */}
                </div>
              </div>
            )}

            {/* Cart Tab */}
            {activeTab === "cart" && (
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="p-8">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold text-codGray flex items-center">
                      <ShoppingCart className="w-6 h-6 mr-3" />
                      Shopping Cart ({cartCount} items)
                    </h2>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Total Amount</p>
                      <p className="text-2xl font-bold text-brand-primary">
                        ${cartTotal.toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {cartItems.length === 0 ? (
                    <div className="text-center py-16">
                      <ShoppingCart className="w-24 h-24 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-600 mb-2">
                        Your cart is empty
                      </h3>
                      <p className="text-gray-500 mb-6">
                        Add some products to get started!
                      </p>
                      <Link
                        href="/products"
                        className="inline-flex items-center bg-gradient-to-r from-brand-primary to-brand-primary-dark text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-200"
                      >
                        <ArrowRight className="w-4 h-4 mr-2" />
                        Continue Shopping
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {cartItems.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center space-x-4 p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                        >
                          <div className="w-20 h-20 bg-white rounded-lg overflow-hidden shadow-sm">
                            <Image
                              src={
                                item.image ||
                                "https://via.placeholder.com/80x80/f3f4f6/9ca3af?text=Product"
                              }
                              alt={item.name}
                              width={80}
                              height={80}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-codGray">
                              {item.name}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {item.category}
                            </p>
                            <p className="text-lg font-bold text-brand-primary">
                              ${item.price.toFixed(2)}
                            </p>
                          </div>
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() =>
                                handleUpdateCartQuantity(
                                  item.id,
                                  item.quantity - 1
                                )
                              }
                              className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="w-8 text-center font-semibold">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                handleUpdateCartQuantity(
                                  item.id,
                                  item.quantity + 1
                                )
                              }
                              className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                          <button
                            onClick={() => handleRemoveFromCart(item.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                      <div className="flex justify-between items-center pt-6 border-t border-gray-200">
                        <div className="text-right">
                          <p className="text-lg font-semibold text-codGray">
                            Total:{" "}
                            <span className="text-brand-primary">
                              ${cartTotal.toFixed(2)}
                            </span>
                          </p>
                        </div>
                        <Link
                          href="/checkout"
                          className="bg-gradient-to-r from-brand-primary to-brand-primary-dark text-white px-8 py-3 rounded-xl hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5"
                        >
                          Proceed to Checkout
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Wishlist Tab */}
            {activeTab === "wishlist" && (
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="p-8">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold text-codGray flex items-center">
                      <Heart className="w-6 h-6 mr-3 text-red-500" />
                      My Wishlist ({wishlistItems.length} items)
                    </h2>
                  </div>

                  {wishlistItems.length === 0 ? (
                    <div className="text-center py-16">
                      <Heart className="w-24 h-24 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-600 mb-2">
                        Your wishlist is empty
                      </h3>
                      <p className="text-gray-500 mb-6">
                        Save your favorite products for later!
                      </p>
                      <Link
                        href="/products"
                        className="inline-flex items-center bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-200"
                      >
                        <ArrowRight className="w-4 h-4 mr-2" />
                        Browse Products
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {wishlistItems.map((item) => (
                        <div
                          key={item.id}
                          className="bg-gray-50 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1"
                        >
                          <div className="relative">
                            <div className="w-full h-48 bg-white">
                              <Image
                                src={
                                  item.image ||
                                  "https://via.placeholder.com/300x200/f3f4f6/9ca3af?text=Product"
                                }
                                alt={item.name}
                                width={300}
                                height={200}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <button
                              onClick={() => handleRemoveFromWishlist(item.id)}
                              className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full text-red-500 hover:bg-red-50 transition-colors shadow-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="p-4">
                            <h3 className="font-semibold text-codGray mb-1 line-clamp-2">
                              {item.name}
                            </h3>
                            <p className="text-sm text-gray-600 mb-2">
                              {item.category}
                            </p>
                            <div className="flex items-center mb-3">
                              <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-4 h-4 ${
                                      i < item.rating
                                        ? "text-yellow-400 fill-current"
                                        : "text-gray-300"
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-sm text-gray-600 ml-2">
                                ({item.rating})
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="text-lg font-bold text-brand-primary">
                                  ${item.price.toFixed(2)}
                                </span>
                                {item.originalPrice && (
                                  <span className="text-sm text-gray-500 line-through ml-2">
                                    ${item.originalPrice.toFixed(2)}
                                  </span>
                                )}
                              </div>
                              <Link
                                href={`/products/${item.id}`}
                                className="flex items-center bg-brand-primary text-white px-3 py-2 rounded-lg hover:bg-brand-primary-dark transition-colors text-sm"
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Addresses Tab */}
            {activeTab === "addresses" && (
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="p-8">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold text-codGray flex items-center">
                      <MapPin className="w-6 h-6 mr-3" />
                      Saved Addresses{" "}
                      {!isLoadingAddresses && `(${savedAddresses.length})`}
                    </h2>
                    <Link
                      href="/addresses"
                      className="flex items-center space-x-2 bg-gradient-to-r from-brand-primary to-brand-primary-dark text-white px-6 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Manage Addresses</span>
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {isLoadingAddresses ? (
                      <div className="col-span-2 text-center py-16">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
                        <p className="text-gray-500">Loading addresses...</p>
                      </div>
                    ) : savedAddresses?.length > 0 ? (
                      savedAddresses.map((address) => (
                        <div
                          key={address.id}
                          className="p-6 border border-gray-200 rounded-xl hover:border-brand-primary transition-colors"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              {(address.type === "Home" || address.type === "home") && (
                                <Home className="w-5 h-5 text-brand-primary" />
                              )}
                              {(address.type === "Office" || address.type === "work") && (
                                <Briefcase className="w-5 h-5 text-brand-primary" />
                              )}
                              {(address.type === "Hotel" || address.type === "hotel") && (
                                <Hotel className="w-5 h-5 text-brand-primary" />
                              )}
                              {(address.type === "Other" || address.type === "other") && (
                                <MapPinOff className="w-5 h-5 text-brand-primary" />
                              )}
                              <span className="font-semibold capitalize">
                                {address.type}
                              </span>
                              {address.isDefault && (
                                <span className="px-2 py-1 bg-green-100 text-green-600 text-xs rounded font-medium">Default</span>
                              )}
                            </div>
                          </div>
                          <div className="space-y-1">
                            {/* Name and Address Label */}
                            <div className="flex items-center gap-2 mb-2">
                              {address.name && (
                                <p className="text-gray-900 font-medium">{address.name}</p>
                              )}
                              {address.addressLabel && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">{address.addressLabel}</span>
                              )}
                            </div>
                            
                            {/* Address Details */}
                            <div className="text-gray-600 text-sm space-y-1">
                              {address.building && <p>{address.building}{address.floor ? `, Floor ${address.floor}` : ''}</p>}
                              {address.area && <p>{address.area}</p>}
                              {address.landmark && <p>Near {address.landmark}</p>}
                              <p>{`${address.city || ''}, ${address.state || ''} ${address.pincode || ''}`.trim()}</p>
                              {address.phone && (
                                <p className="text-gray-700">📞 {address.phone}</p>
                              )}
                              {address.additionalInstructions && (
                                <p className="text-gray-500 italic">📝 {address.additionalInstructions}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 text-center py-16">
                        <MapPin className="w-24 h-24 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-600 mb-2">
                          No addresses saved yet
                        </h3>
                        <p className="text-gray-500 mb-6">
                          Add your delivery addresses to make checkout faster!
                        </p>
                        <Link
                          href="/addresses"
                          className="inline-flex items-center bg-gradient-to-r from-brand-primary to-brand-primary-dark text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-200"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add New Address
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === "orders" && (
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="p-8">
                  <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold text-codGray flex items-center">
                      <Package className="w-6 h-6 mr-3" />
                      Order History
                    </h2>
                  </div>

                  <div className="text-center py-16">
                    <Package className="w-24 h-24 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">
                      No orders yet
                    </h3>
                    <p className="text-gray-500 mb-6">
                      Your order history will appear here once you make your
                      first purchase.
                    </p>
                    <Link
                      href="/products"
                      className="inline-flex items-center bg-gradient-to-r from-brand-primary to-brand-primary-dark text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-200"
                    >
                      <ArrowRight className="w-4 h-4 mr-2" />
                      Start Shopping
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Enhanced Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Total Orders</p>
                    <p className="text-3xl font-bold">0</p>
                  </div>
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <Package className="w-6 h-6" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-100 text-sm">Wishlist Items</p>
                    <p className="text-3xl font-bold">{wishlistItems.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <Heart className="w-6 h-6" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Cart Items</p>
                    <p className="text-3xl font-bold">{cartCount}</p>
                  </div>
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <ShoppingCart className="w-6 h-6" />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Total Spent</p>
                    <p className="text-3xl font-bold">
                      ${cartTotal.toFixed(2)}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
