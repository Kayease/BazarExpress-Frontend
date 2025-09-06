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
  Truck,
  RefreshCw,
} from "lucide-react";
import { useAppSelector, useAppDispatch } from "../../lib/store";
import { updateProfile, fetchProfile } from "../../lib/slices/authSlice";
import { useCartContext, useWishlistContext } from "../../components/app-provider";
import { canAddToCart, getWarehouseConflictInfo } from "../../lib/warehouse-validation";

// Custom event for wishlist updates
const WISHLIST_UPDATED_EVENT = "wishlistUpdated";
import toast from "react-hot-toast";
import Image from "next/image";
import OrderDetailModal from "../../components/OrderDetailModal";
import ReturnItemsModal from "../../components/ReturnItemsModal";
import CustomerReturnDetailsModal from "../../components/CustomerReturnDetailsModal";

export default function Profile() {
  const user = useAppSelector((state) => state.auth.user);
  const token = useAppSelector((state) => state.auth.token);
  const { cartItems, cartTotal, updateCartItem, addToCart, isItemBeingRemoved, moveToCartFromWishlist } = useCartContext();
  const { wishlistItems, removeFromWishlist: removeFromWishlistContext } = useWishlistContext();
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const [isEditing, setIsEditing] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "profile" | "cart" | "wishlist" | "orders" | "addresses" | "returns"
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

  const [fieldErrors, setFieldErrors] = useState({
    email: "",
    phone: "",
    dateOfBirth: "",
  });

  // Orders state
  const [orders, setOrders] = useState<any[]>([]);
  const [displayedOrders, setDisplayedOrders] = useState<any[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isLoadingMoreOrders, setIsLoadingMoreOrders] = useState(false);
  const [ordersToShow, setOrdersToShow] = useState(10);
  const [orderStats, setOrderStats] = useState({
    totalOrders: 0,
    totalSpent: 0
  });
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<any>(null);
  const [showOrderDetailModal, setShowOrderDetailModal] = useState(false);

  // Return modal state
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedOrderForReturn, setSelectedOrderForReturn] = useState<any>(null);
  const [selectedReturnItems, setSelectedReturnItems] = useState<string[]>([]);
  const [returnReason, setReturnReason] = useState("");
  const [isSubmittingReturn, setIsSubmittingReturn] = useState(false);
  const [refundPreference, setRefundPreference] = useState<{ method: 'upi' | 'bank' | '' ; upiId?: string; bankDetails?: { accountHolderName: string; accountNumber: string; ifsc: string; bankName: string } }>({ method: '' });
  const [existingReturnsByOrderItem, setExistingReturnsByOrderItem] = useState<Record<string, { status: string; returnId: string }>>({});

  // Returns tab state
  const [returnsList, setReturnsList] = useState<any[]>([]);
  const [displayedReturns, setDisplayedReturns] = useState<any[]>([]);
  const [isLoadingReturns, setIsLoadingReturns] = useState(false);
  const [isLoadingMoreReturns, setIsLoadingMoreReturns] = useState(false);
  const [returnsToShow, setReturnsToShow] = useState(10);
  const [showReturnDetailsModal, setShowReturnDetailsModal] = useState(false);
  const [selectedReturnForDetail, setSelectedReturnForDetail] = useState<any>(null);



  // Helpers for Returns tab UI
  const getReturnStatusBadge = (status: string) => {
    const key = (status || '').toLowerCase();
    const label = key === 'requested' ? 'Return Requested'
      : key === 'approved' ? 'Return Approved'
      : key === 'pickup_assigned' ? 'Pickup Scheduled'
      : key === 'pickup_rejected' ? 'Pick-up Rejected'
      : key === 'picked_up' ? 'Return Picked Up'
      : key === 'received' ? 'Return Received'
      : key === 'partially_refunded' ? 'Partially Refunded'
      : key === 'refunded' ? 'Refunded'
      : key === 'rejected' ? 'Return Rejected'
      : (key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '));
    const className = key === 'refunded' ? 'bg-green-100 text-green-800'
      : key === 'approved' ? 'bg-emerald-100 text-emerald-800'
      : key === 'rejected' ? 'bg-red-100 text-red-700'
      : key === 'received' ? 'bg-amber-100 text-amber-800'
      : key === 'partially_refunded' ? 'bg-yellow-100 text-yellow-800'
      : key === 'pickup_assigned' ? 'bg-indigo-100 text-indigo-800'
      : key === 'picked_up' ? 'bg-violet-100 text-violet-800'
      : 'bg-blue-100 text-blue-800';
    return { label, className };
  };

  const getReturnTotalAmount = (ret: any) => {
    try {
      const items = Array.isArray(ret.items) ? ret.items : [];
      const sum = items.reduce((acc: number, it: any) => acc + (Number(it.price) * Number(it.quantity || 1)), 0);
      return isFinite(sum) ? sum : 0;
    } catch {
      return 0;
    }
  };

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

  // Handle URL tab parameter
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const tabParam = urlParams.get('tab');
      if (tabParam && ["profile", "cart", "wishlist", "orders", "addresses", "returns"].includes(tabParam)) {
        setActiveTab(tabParam as "profile" | "cart" | "wishlist" | "orders" | "addresses" | "returns");
      }
    }
  }, []);

  // Wishlist items are now managed by app-provider context

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

  // Fetch orders when orders tab is active or when calculating stats
  const fetchUserOrders = async () => {
    try {
      setIsLoadingOrders(true);
      // Fetch all orders by setting a high limit
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/orders/user?limit=1000`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const data = await response.json();
      const fetchedOrders = data.orders || [];

      console.log('📊 Fetched orders data:', {
        totalFetched: fetchedOrders.length,
        currentOrdersToShow: ordersToShow,
        orders: fetchedOrders.map((order: any) => ({
          orderId: order.orderId,
          status: order.status,
          itemsCount: order.items?.length,
          deliveredAt: order.deliveredAt,
          items: order.items?.map((item: any) => ({
            name: item.name,
            returnable: item.returnable,
            returnWindow: item.returnWindow
          }))
        }))
      });

      setOrders(fetchedOrders);

      // Reset pagination when fetching fresh orders
      const initialOrdersToShow = 10;
      setOrdersToShow(initialOrdersToShow);
      setDisplayedOrders(fetchedOrders.slice(0, initialOrdersToShow));

      console.log('Orders state updated:', {
        totalOrders: fetchedOrders.length,
        initialOrdersToShow,
        displayedCount: fetchedOrders.slice(0, initialOrdersToShow).length
      });

      // Calculate order statistics
      const totalOrders = fetchedOrders.length;
      const totalSpent = fetchedOrders.reduce((sum: number, order: any) => {
        return sum + (order.pricing?.total || 0);
      }, 0);

      setOrderStats({
        totalOrders,
        totalSpent
      });
    } catch (error) {
      console.error("Error fetching orders:", error);
      setOrders([]);
      setDisplayedOrders([]);
      setOrderStats({ totalOrders: 0, totalSpent: 0 });
    } finally {
      setIsLoadingOrders(false);
    }
  };

  // Fetch user's returns
  const fetchUserReturns = async () => {
    try {
      setIsLoadingReturns(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/returns/user?limit=1000`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch returns');
      const data = await response.json();
      const fetched = data.returns || [];
      setReturnsList(fetched);
      const initial = 10;
      setReturnsToShow(initial);
      setDisplayedReturns(fetched.slice(0, initial));
    } catch (e) {
      console.error('Error fetching returns:', e);
      setReturnsList([]);
      setDisplayedReturns([]);
    } finally {
      setIsLoadingReturns(false);
    }
  };

  const handleLoadMoreReturns = () => {
    setIsLoadingMoreReturns(true);
    setTimeout(() => {
      const next = returnsToShow + 10;
      setReturnsToShow(next);
      setDisplayedReturns(returnsList.slice(0, next));
      setIsLoadingMoreReturns(false);
    }, 500);
  };

  const handleViewReturnDetails = (ret: any) => {
    setSelectedReturnForDetail(ret);
    setShowReturnDetailsModal(true);
  };

  const handleCloseReturnDetailsModal = () => {
    setShowReturnDetailsModal(false);
    setSelectedReturnForDetail(null);
  };

  // Load more orders function
  const handleLoadMoreOrders = () => {
    console.log('Load More clicked - Current state:', {
      ordersToShow,
      totalOrders: orders.length,
      displayedOrders: displayedOrders.length
    });

    setIsLoadingMoreOrders(true);
    setTimeout(() => {
      const newOrdersToShow = ordersToShow + 10;
      setOrdersToShow(newOrdersToShow);
      setDisplayedOrders(orders.slice(0, newOrdersToShow));
      setIsLoadingMoreOrders(false);

      console.log('Load More completed - New state:', {
        newOrdersToShow,
        totalOrders: orders.length,
        newDisplayedCount: orders.slice(0, newOrdersToShow).length
      });
    }, 500); // Small delay for better UX
  };

  // Fetch addresses when addresses tab is active
  useEffect(() => {
    if (activeTab === "addresses" && token) {
      fetchUserAddresses();
    }
  }, [activeTab, token]);

  // Fetch orders when component mounts or when orders tab becomes active
  useEffect(() => {
    if (token && user) {
      // Fetch orders on initial load or when switching to orders tab
      if (activeTab === "orders" || orders.length === 0) {
        fetchUserOrders();
      }
      if (activeTab === "returns" && returnsList.length === 0) {
        fetchUserReturns();
      }
    }
  }, [token, user, activeTab]);

  // Check if order is eligible for return
  const isOrderEligibleForReturn = (order: any) => {
    console.log('🔍 Checking return eligibility for order:', {
      orderId: order?.orderId,
      status: order?.status,
      statusLower: order?.status?.toLowerCase(),
      itemsCount: order?.items?.length,
      deliveredAt: order?.deliveredAt,
      actualDeliveryDate: order?.actualDeliveryDate,
      deliveryDateToUse: order?.deliveredAt || order?.actualDeliveryDate,
      fullOrder: order
    });

    if (!order || !order.status) {
      console.log('❌ Order or status missing');
      return false;
    }

    // Define non-returnable statuses
    const nonReturnableStatuses = ['new', 'processing', 'shipped', 'refunded', 'cancelled'];

    // Check if order status is in non-returnable list
    if (nonReturnableStatuses.includes(order.status.toLowerCase())) {
      console.log(`❌ Order ${order.orderId} not eligible: status "${order.status}" is not returnable`);
      return false;
    }

    // ONLY delivered orders can be returned
    if (order.status.toLowerCase() !== 'delivered') {
      console.log(`❌ Order ${order.orderId} not eligible: status "${order.status}" is not delivered`);
      return false;
    }

    // Check if order has items
    if (!order.items || order.items.length === 0) {
      console.log(`❌ Order ${order.orderId} not eligible: no items`);
      return false;
    }

    // Check if delivery date exists (check both deliveredAt and actualDeliveryDate)
    const deliveryDate = order.deliveredAt || order.actualDeliveryDate;
    if (!deliveryDate) {
      console.log(`❌ Order ${order.orderId} not eligible: no delivery date found`);
      return false;
    }

    // Check if any individual product is eligible for return
    const hasAnyReturnableProduct = order.items.some((item: any) => {
      console.log('🔍 Checking product:', {
        name: item.name,
        returnable: item.returnable,
        returnWindow: item.returnWindow,
        productReturnable: item.productId?.returnable,
        productReturnWindow: item.productId?.returnWindow,
        fullItem: item
      });

      // Check if product is returnable (default to true if property doesn't exist)
      // First check if the property exists on the item itself, then on the productId
      const itemReturnable = item.returnable !== undefined ? item.returnable : item.productId?.returnable;
      const isReturnable = itemReturnable !== false; // Only false if explicitly set to false
      if (!isReturnable) {
        console.log(`❌ Product ${item.name} not returnable - returnable property is:`, itemReturnable);
        return false;
      }

      const actualDeliveryDate = new Date(order.deliveredAt || order.actualDeliveryDate);
      const currentDate = new Date();
      const daysSinceDelivery = Math.floor((currentDate.getTime() - actualDeliveryDate.getTime()) / (1000 * 3600 * 24));

      // First check if the property exists on the item itself, then on the productId
      const productReturnWindow = item.returnWindow !== undefined ? item.returnWindow : item.productId?.returnWindow;

      // If no return window is specified, the item is not returnable
      if (productReturnWindow === undefined || productReturnWindow === null) {
        console.log(`❌ Product ${item.name} has no return window specified`);
        return false;
      }

      const isWithinReturnPeriod = daysSinceDelivery <= productReturnWindow;
      console.log(`✅ Product ${item.name} return check:`, {
        daysSinceDelivery,
        productReturnWindow,
        isWithinReturnPeriod,
        deliveryDate: actualDeliveryDate.toISOString(),
        currentDate: currentDate.toISOString()
      });

      return isWithinReturnPeriod;
    });

    console.log(`🎯 Order ${order.orderId} final result: has returnable products = ${hasAnyReturnableProduct}`);
    return hasAnyReturnableProduct;
  };

  // Check if any items in order are eligible for return
  const hasReturnableItems = (order: any) => {
    console.log('🚀 hasReturnableItems called for order:', order?.orderId);
    const result = isOrderEligibleForReturn(order);
    console.log('🚀 hasReturnableItems result:', result);
    return result;
  };

  // Get returnable items from an order
  const getReturnableItems = (order: any) => {
    console.log('🔍 getReturnableItems called for order:', order?.orderId);
    console.log('📦 Order items:', order?.items?.map((item: any) => ({
      name: item.name,
      returnable: item.returnable,
      returnWindow: item.returnWindow,
      fullItem: item
    })));

    const deliveryDate = order.deliveredAt || order.actualDeliveryDate;
    if (!order || !order.items || order.status.toLowerCase() !== 'delivered' || !deliveryDate) {
      console.log('❌ Order not eligible for returns:', {
        hasOrder: !!order,
        hasItems: !!order?.items,
        status: order?.status,
        deliveryDate
      });
      return [];
    }

    const actualDeliveryDate = new Date(deliveryDate);
    const currentDate = new Date();
    const daysSinceDelivery = Math.floor((currentDate.getTime() - actualDeliveryDate.getTime()) / (1000 * 3600 * 24));

    console.log('📅 Delivery calculation:', {
      deliveryDate,
      actualDeliveryDate: actualDeliveryDate.toISOString(),
      currentDate: currentDate.toISOString(),
      daysSinceDelivery
    });

    const returnableItems = order.items.filter((item: any) => {
      console.log(`🔍 Processing item: ${item.name}`, {
        fullItem: item,
        productId: item.productId,
        itemReturnable: item.returnable,
        itemReturnWindow: item.returnWindow,
        productReturnable: item.productId?.returnable,
        productReturnWindow: item.productId?.returnWindow,
        hasReturnableProperty: item.hasOwnProperty('returnable'),
        hasReturnWindowProperty: item.hasOwnProperty('returnWindow'),
        productHasReturnableProperty: item.productId?.hasOwnProperty('returnable'),
        productHasReturnWindowProperty: item.productId?.hasOwnProperty('returnWindow')
      });

      // Check if product is returnable
      // First check if the property exists on the item itself, then on the productId
      const itemReturnable = item.returnable !== undefined ? item.returnable : item.productId?.returnable;
      const isReturnable = itemReturnable !== false; // Default to true if not explicitly false
      
      if (!isReturnable) {
        console.log(`❌ Item ${item.name} not returnable - returnable property is:`, itemReturnable);
        return false;
      }

      // Check if return window has expired
      // First check if the property exists on the item itself, then on the productId
      const itemReturnWindow = item.returnWindow !== undefined ? item.returnWindow : item.productId?.returnWindow;
      const productReturnWindow = itemReturnWindow;
      
      // If no return window is specified, the item is not returnable
      if (productReturnWindow === undefined || productReturnWindow === null) {
        console.log(`❌ Item ${item.name} has no return window specified`);
        return false;
      }
      
      const isWithinReturnPeriod = daysSinceDelivery <= productReturnWindow;

      console.log(`🔍 Item ${item.name} return window check:`, {
        itemReturnable,
        itemReturnWindow,
        productReturnWindow,
        daysSinceDelivery,
        isWithinReturnPeriod,
        willBeIncluded: isWithinReturnPeriod
      });

      return isWithinReturnPeriod;
    });

    console.log('✅ Final returnable items:', returnableItems.map((item: any) => ({
      name: item.name,
      itemReturnWindow: item.returnWindow,
      productReturnWindow: item.productId?.returnWindow,
      finalReturnWindow: item.returnWindow !== undefined ? item.returnWindow : item.productId?.returnWindow,
      itemReturnable: item.returnable,
      productReturnable: item.productId?.returnable,
      finalReturnable: item.returnable !== undefined ? item.returnable : item.productId?.returnable
    })));

    // Flatten the properties so the modal can access them directly
    const flattenedItems = returnableItems.map((item: any) => ({
      ...item,
      // Ensure returnWindow and returnable are available directly on the item
      returnWindow: item.returnWindow !== undefined ? item.returnWindow : item.productId?.returnWindow,
      returnable: item.returnable !== undefined ? item.returnable : item.productId?.returnable
    }));

    console.log('🔍 Returning flattened items:', flattenedItems.map((item: any) => ({
      name: item.name,
      returnWindow: item.returnWindow,
      returnable: item.returnable
    })));

    return flattenedItems;
  };

  // Get return window status for display
  const getReturnWindowStatus = (order: any) => {
    const deliveryDate = order.deliveredAt || order.actualDeliveryDate;
    if (!order || order.status.toLowerCase() !== 'delivered' || !deliveryDate) {
      return null;
    }

    const actualDeliveryDate = new Date(deliveryDate);
    const currentDate = new Date();
    const daysSinceDelivery = Math.floor((currentDate.getTime() - actualDeliveryDate.getTime()) / (1000 * 3600 * 24));

    // Find the maximum return window among all returnable items
    const maxReturnWindow = order.items?.reduce((max: number, item: any) => {
      const isReturnable = item.returnable !== false; // Only false if explicitly set to false
      if (isReturnable) {
        const itemReturnWindow = item.returnWindow;
        return Math.max(max, itemReturnWindow);
      }
      return max;
    }, 0);

    const daysLeft = maxReturnWindow - daysSinceDelivery;

    if (daysLeft > 0) {
      return {
        status: 'active',
        daysLeft,
        message: `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left to return`
      };
    } else {
      return {
        status: 'expired',
        daysLeft: 0,
        message: 'Return window expired'
      };
    }
  };

  // Handle return initiation
  const handleInitiateReturn = (order: any) => {
    setSelectedOrderForReturn(order);
    setSelectedReturnItems([]);
    setReturnReason("");
    setShowReturnModal(true);
    setExistingReturnsByOrderItem({});

    // Fetch user addresses for pickup if not already loaded
    if (savedAddresses.length === 0 && token) {
      fetchUserAddresses();
    }

    // Fetch user's existing returns to gray out items that already have a return
    const fetchExistingReturns = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/returns/user?limit=1000`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (!response.ok) return; // fail silently; UX still works
        const data = await response.json();
        const returns: any[] = data.returns || [];

        // Build a whitelist of valid order item ids from the selected order
        const validOrderItemIds = new Set<string>((order.items || []).map((it: any) => String(it._id)));

        const map: Record<string, { status: string; returnId: string }> = {};
        returns
          .filter((r: any) => r.orderId === order.orderId)
          .forEach((r: any) => {
            const topStatus = r.status;
            (r.items || []).forEach((it: any) => {
              const rawId = it.orderItemId || it.orderItemID || it.itemId || it._id;
              const orderItemId = rawId ? String(rawId) : '';
              // Only keep if this id actually belongs to an item in this order
              if (orderItemId && validOrderItemIds.has(orderItemId)) {
                // Prefer latest status if duplicates
                // Prefer the overall return status over per-item status to reflect latest progression
                map[orderItemId] = { status: (topStatus || it.returnStatus || 'requested'), returnId: r.returnId || r._id };
              }
            });
          });
        console.log('🔁 Existing returns map for order', order.orderId, map);
        setExistingReturnsByOrderItem(map);
      } catch (e) {
        // do nothing; we just won't gray out
        console.error('Failed to fetch existing returns for user', e);
      }
    };
    if (token) {
      void fetchExistingReturns();
    }
  };

  // Handle return item selection
  const handleReturnItemToggle = (itemId: string) => {
    setSelectedReturnItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  // Handle return submission
  const handleSubmitReturn = async () => {
    if (selectedReturnItems.length === 0) {
      toast.error("Please select at least one item to return");
      return;
    }

    if (!returnReason.trim()) {
      toast.error("Please provide a reason for return");
      return;
    }

    setIsSubmittingReturn(true);

    try {
      // Use the delivery address from the order for pickup
      const pickupAddress = selectedOrderForReturn.deliveryInfo?.address;

      if (!pickupAddress) {
        toast.error("Delivery address not found for this order");
        return;
      }

      // Prepare return items data
      const returnItems = selectedReturnItems.map(itemId => {
        const orderItem = selectedOrderForReturn.items.find((item: any) => item._id === itemId);
        console.log('🔍 Processing return item:', {
          selectedItemId: itemId,
          foundOrderItem: !!orderItem,
          orderItemId: orderItem?._id,
          orderItemName: orderItem?.name
        });
        return {
          itemId: itemId,
          quantity: orderItem?.quantity || 1,
          reason: returnReason
        };
      });

      console.log('📦 Final return items being sent to API:', returnItems);
      console.log('📋 All order item IDs:', selectedOrderForReturn.items.map((item: any) => item._id));

      // Submit return request to API
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/returns/create`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId: selectedOrderForReturn.orderId,
          items: returnItems,
          returnReason,
          pickupAddress,
          pickupInstructions: `Please contact ${pickupAddress.phone} before pickup`,
          refundPreference: refundPreference.method ? {
            method: refundPreference.method,
            upiId: refundPreference.upiId,
            bankDetails: refundPreference.bankDetails
          } : undefined
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit return request');
      }

      const data = await response.json();
      console.log('Return request submitted:', data);

      toast.success("Return request submitted successfully!");
      handleCloseReturnModal();

      // Refresh orders to show updated status
      fetchUserOrders();
    } catch (error) {
      console.error('Error submitting return:', error);
      toast.error(error instanceof Error ? error.message : "Failed to submit return request. Please try again.");
    } finally {
      setIsSubmittingReturn(false);
    }
  };

  // Close return modal
  const handleCloseReturnModal = () => {
    setShowReturnModal(false);
    setSelectedOrderForReturn(null);
    setSelectedReturnItems([]);
    setReturnReason("");
  };


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
      // toast.error("Please fix the errors in the form.");
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
  const handleRemoveFromCart = (itemId: string, variantId?: string) => {
    updateCartItem(itemId, 0, variantId);
    // toast.success("Item removed from cart");
  };

  const handleUpdateCartQuantity = (itemId: string, quantity: number, variantId?: string) => {
    updateCartItem(itemId, quantity, variantId);
  };

  // Wishlist operations
  const handleRemoveFromWishlist = (itemId: string, variantId?: string) => {
    removeFromWishlistContext(itemId, variantId);
    // toast.success("Item removed from wishlist");
  };

  // Move item from wishlist to cart
  const handleMoveToCart = async (item: any) => {
    console.log('handleMoveToCart called with item:', item);
    console.log('Current cart items:', cartItems);

    // Check warehouse validation before moving to cart
    if (!canAddToCart(item, cartItems)) {
      console.log('Blocked: Cannot add product due to warehouse conflict');
      const conflictInfo = getWarehouseConflictInfo(item, cartItems);
      if (conflictInfo.hasConflict && conflictInfo.message) {
        toast.error(conflictInfo.message);
      } else {
        toast.error('Cannot add product due to warehouse conflict');
      }
      return;
    }

    try {
      // Use the new moveToCartFromWishlist function
      await moveToCartFromWishlist(item, (id: string, variantId?: string) => {
        removeFromWishlistContext(id, variantId);
      });

      // Check if product already exists in cart to show appropriate message
      const existingCartItem = cartItems.find(cartItem => {
        const idMatch = (cartItem.id || cartItem._id) === (item.id || item._id);
        if (item.variantId) {
          return idMatch && cartItem.variantId === item.variantId;
        }
        return idMatch && !cartItem.variantId;
      });

      if (existingCartItem) {
        //toast.success(`${item.name}${item.variantName ? ` (${item.variantName})` : ''} quantity increased in cart`);
      } else {
        // toast.success(`${item.name}${item.variantName ? ` (${item.variantName})` : ''} added to cart`);
      }
    } catch (error: any) {
      console.error('Error moving item to cart:', error);

      // Handle specific warehouse conflict errors
      if (error && typeof error === 'object' && error.isWarehouseConflict) {
        toast.error(error.message || 'Cannot add product due to warehouse conflict');
      } else {
        toast.error('Failed to move item to cart');
      }
    }
  };



  // Handle order detail modal
  const handleViewOrderDetails = (order: any) => {
    setSelectedOrderForDetail(order);
    setShowOrderDetailModal(true);
  };

  const handleCloseOrderDetailModal = () => {
    setShowOrderDetailModal(false);
    setSelectedOrderForDetail(null);
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
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8">
          {/* Enhanced Header with Glassmorphism */}
          <div className="relative bg-gradient-to-r from-brand-primary via-brand-primary-dark to-purple-600 rounded-3xl shadow-2xl overflow-hidden mb-8">
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="absolute inset-0 backdrop-blur-sm"></div>
            <div className="relative px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12">
              <div className="flex flex-col lg:flex-row items-center space-y-6 lg:space-y-0 lg:space-x-8">
                <div className="relative">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-4 border-white/30 shadow-xl">
                    <UserIcon className="h-12 w-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16 text-white" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full"></div>
                  </div>
                </div>
                <div className="text-white text-center lg:text-left flex-1">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">{user.name}</h1>
                  <p className="text-white/80 text-base sm:text-lg mb-3">{user.email}</p>
                  <div className="flex flex-wrap gap-2 sm:gap-3 justify-center lg:justify-start">
                    <span className="inline-flex items-center bg-white/20 backdrop-blur-sm px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium border border-white/30">
                      <Award className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                      {user.role === "admin"
                        ? "Administrator"
                        : user.role === "product_inventory_management"
                          ? "Product & Inventory Manager"
                          : user.role === "order_warehouse_management"
                            ? "Order & Warehouse Manager"
                            : user.role === "marketing_content_manager"
                              ? "Marketing & Content Manager"
                              : user.role === "customer_support_executive"
                                ? "Customer Support Executive"
                                : user.role === "report_finance_analyst"
                                  ? "Report & Finance Analyst"
                                  : "Premium Customer"}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:gap-4 text-center w-full max-w-xs lg:max-w-none">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/20">
                    <div className="text-lg sm:text-xl lg:text-2xl text-white font-bold">{cartCount}</div>
                    <div className="text-white/80 text-xs sm:text-sm">Cart Items</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/20">
                    <div className="text-lg sm:text-xl lg:text-2xl text-white font-bold">
                      {wishlistItems.length}
                    </div>
                    <div className="text-white/80 text-xs sm:text-sm">Wishlist</div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/20">
                    <div className="text-lg sm:text-xl lg:text-2xl text-white font-bold">{orderStats.totalOrders}</div>
                    <div className="text-white/80 text-xs sm:text-sm">Orders</div>
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
                { id: "returns", label: "Returns", icon: RefreshCw },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center justify-center space-x-1 sm:space-x-2 px-2 sm:px-3 lg:px-6 py-3 sm:py-4 text-sm sm:text-base font-medium transition-all duration-200 flex-1 sm:flex-none min-w-0 ${activeTab === tab.id
                      ? "text-brand-primary border-b-2 border-brand-primary bg-brand-primary/5"
                      : "text-gray-600 hover:text-brand-primary hover:bg-gray-50"
                    }`}
                >
                  <tab.icon className="w-5 h-5 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span className="hidden sm:inline truncate">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="space-y-8">
            {/* Profile Tab */}
            {activeTab === "profile" && (
              <div className="bg-white p-4 sm:p-6 lg:p-12 rounded-2xl shadow-lg overflow-hidden">
                <div className="">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 space-y-4 sm:space-y-0">
                    <h2 className="text-xl sm:text-2xl font-bold text-codGray">
                      Profile Information
                    </h2>
                    {!isEditing ? (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center justify-center sm:justify-start space-x-2 bg-gradient-to-r from-brand-primary to-brand-primary-dark hover:from-brand-primary-dark hover:to-purple-600 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 w-full sm:w-auto"
                      >
                        <Edit3 className="h-4 w-4" />
                        <span>Edit Profile</span>
                      </button>
                    ) : (
                      <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
                        <button
                          onClick={handleSave}
                          className="flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 w-full sm:w-auto"
                        >
                          <Save className="h-4 w-4" />
                          <span>Save</span>
                        </button>
                        <button
                          onClick={handleCancel}
                          className="flex items-center justify-center space-x-2 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 w-full sm:w-auto"
                        >
                          <X className="h-4 w-4" />
                          <span>Cancel</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
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
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary text-sm sm:text-base"
                      />
                    ) : (
                      <p className="px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 rounded-lg text-codGray text-sm sm:text-base">
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
                          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary text-sm sm:text-base"
                        />
                        {fieldErrors.email && (
                          <p className="text-red-500 text-xs mt-1">
                            {fieldErrors.email}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 rounded-lg text-codGray text-sm sm:text-base">
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
                          className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary text-sm sm:text-base"
                        />
                        {fieldErrors.phone && (
                          <p className="text-red-500 text-xs mt-1">
                            {fieldErrors.phone}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 rounded-lg text-codGray text-sm sm:text-base">
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
                        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary text-sm sm:text-base"
                      />
                    ) : (
                      <p className="px-3 sm:px-4 py-2.5 sm:py-3 bg-gray-50 rounded-lg text-codGray text-sm sm:text-base">
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
                <div className="p-3 sm:p-4 lg:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 space-y-2 sm:space-y-0">
                    <h2 className="text-lg sm:text-xl font-bold text-codGray flex items-center">
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      Shopping Cart ({cartCount} items)
                    </h2>

                  </div>

                  {cartItems.length === 0 ? (
                    <div className="text-center py-6 sm:py-8">
                      <ShoppingCart className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3" />
                      <h3 className="text-base sm:text-lg font-semibold text-gray-600 mb-2">
                        Your cart is empty
                      </h3>
                      <p className="text-gray-500 mb-4 text-sm sm:text-base">
                        Add some products to get started!
                      </p>
                      <Link
                        href="/products"
                        className="inline-flex items-center bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm sm:text-base"
                      >
                        <ArrowRight className="w-4 h-4 mr-2" />
                        Continue Shopping
                      </Link>
                    </div>
                  ) : (
                    <div>
                      <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
                        {cartItems.map((item) => (
                          <div
                            key={item.cartItemId || `${item.id || item._id}_${item.variantId || 'no-variant'}`}
                            className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden hover:bg-gray-100 transition-colors"
                          >
                            {/* Mobile Layout */}
                            <div className="block sm:hidden">
                              <div className="flex items-center space-x-3 p-2.5 sm:p-3">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-lg overflow-hidden shadow-sm flex-shrink-0">
                                  <Image
                                    src={
                                      item.image ||
                                      "https://via.placeholder.com/48x48/f3f4f6/9ca3af?text=Product"
                                    }
                                    alt={item.name}
                                    width={48}
                                    height={48}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-medium text-codGray truncate text-sm">
                                    {item.name}
                                  </h3>
                                  {item.variantName && (
                                    <p className="text-xs text-purple-400 font-medium">
                                      Variant: {item.variantName}
                                    </p>
                                  )}
                                  <p className="text-xs text-gray-600">
                                    {item.unit || item.category}
                                  </p>
                                  <p className="text-sm font-bold text-purple-600">
                                    ₹{item.price} x {item.quantity} = ₹{item.price * item.quantity}
                                  </p>
                                </div>
                                <div className="flex items-center space-x-2 flex-shrink-0">
                                  <div className="flex items-center space-x-1">
                                    <button
                                      onClick={() =>
                                        handleUpdateCartQuantity(
                                          item.id || item._id,
                                          item.quantity - 1,
                                          item.variantId
                                        )
                                      }
                                      className="w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
                                    >
                                      <Minus className="w-3 h-3" />
                                    </button>
                                    <span className="w-6 text-center text-sm font-semibold">
                                      {item.quantity}
                                    </span>
                                    <button
                                      onClick={() =>
                                        handleUpdateCartQuantity(
                                          item.id || item._id,
                                          item.quantity + 1,
                                          item.variantId
                                        )
                                      }
                                      className="w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
                                    >
                                      <Plus className="w-3 h-3" />
                                    </button>
                                  </div>
                                  <button
                                    onClick={() => handleRemoveFromCart(item.id || item._id, item.variantId)}
                                    disabled={isItemBeingRemoved(item.id || item._id, item.variantId)}
                                    className={`p-1.5 rounded-lg transition-colors ${isItemBeingRemoved(item.id || item._id, item.variantId)
                                        ? "text-gray-400 cursor-not-allowed"
                                        : "text-red-500 hover:bg-red-50"
                                      }`}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Desktop Layout */}
                            <div className="hidden sm:flex sm:items-center sm:space-x-4 p-2.5 sm:p-3 lg:p-4">
                              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-lg overflow-hidden shadow-sm flex-shrink-0">
                                <Image
                                  src={
                                    item.image ||
                                    "https://via.placeholder.com/48x48/f3f4f6/9ca3af?text=Product"
                                  }
                                  alt={item.name}
                                  width={48}
                                  height={48}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-codGray truncate">
                                  {item.name}
                                </h3>
                                {item.variantName && (
                                  <p className="text-xs text-purple-400 font-medium">
                                    Variant: {item.variantName}
                                  </p>
                                )}
                                <p className="text-xs text-gray-600">
                                  {item.unit || item.category}
                                </p>
                                <p className="text-sm font-bold text-purple-600">
                                  ₹{item.price} x {item.quantity} = ₹{item.price * item.quantity}
                                </p>
                              </div>
                              <div className="flex items-center space-x-3 flex-shrink-0">
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() =>
                                      handleUpdateCartQuantity(
                                        item.id || item._id,
                                        item.quantity - 1,
                                        item.variantId
                                      )
                                    }
                                    className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <span className="w-6 text-center text-sm font-semibold">
                                    {item.quantity}
                                  </span>
                                  <button
                                    onClick={() =>
                                      handleUpdateCartQuantity(
                                        item.id || item._id,
                                        item.quantity + 1,
                                        item.variantId
                                      )
                                    }
                                    className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>
                                <button
                                  onClick={() => handleRemoveFromCart(item.id || item._id, item.variantId)}
                                  disabled={isItemBeingRemoved(item.id || item._id, item.variantId)}
                                  className={`p-1.5 rounded-lg transition-colors ${isItemBeingRemoved(item.id || item._id, item.variantId)
                                      ? "text-gray-400 cursor-not-allowed"
                                      : "text-red-500 hover:bg-red-50"
                                    }`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="bg-purple-50 rounded-lg p-3 sm:p-4 border border-purple-200">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 space-y-2 sm:space-y-0">
                          <div className="text-center sm:text-left">
                            <p className="text-sm text-gray-600">Total Items: {cartCount}</p>
                            <p className="text-base sm:text-lg font-bold text-purple-700">
                              Total Amount: ₹{Math.round(cartTotal)}
                            </p>
                          </div>
                          <Link
                            href="/payment"
                            className="bg-purple-600 text-white px-4 sm:px-6 py-2.5 sm:py-2.5 rounded-lg hover:bg-purple-700 transition-colors font-medium text-center text-sm sm:text-base w-full sm:w-auto"
                          >
                            Proceed to Checkout
                          </Link>
                        </div>

                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Wishlist Tab */}
            {activeTab === "wishlist" && (
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="p-3 sm:p-4 lg:p-6">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <h2 className="text-lg sm:text-xl font-bold text-codGray flex items-center">
                      <Heart className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 text-red-500" />
                      My Wishlist
                    </h2>
                  </div>

                  {wishlistItems.length === 0 ? (
                    <div className="text-center py-6 sm:py-8">
                      <Heart className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3" />
                      <h3 className="text-base sm:text-lg font-semibold text-gray-600 mb-2">
                        Your wishlist is empty
                      </h3>
                      <p className="text-gray-500 mb-4 text-sm sm:text-base">
                        Save your favorite products for later!
                      </p>
                      <Link
                        href="/products"
                        className="inline-flex items-center bg-gradient-to-r from-purple-600 to-purple-500 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl hover:shadow-lg transition-all duration-200 text-sm sm:text-base"
                      >
                        <ArrowRight className="w-4 h-4 mr-2" />
                        Browse Products
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-2 sm:space-y-3 max-h-96 overflow-y-auto">
                      {wishlistItems.map((item) => (
                        <div
                          key={item.wishlistItemId || `${item.id || item._id}_${item.variantId || 'no-variant'}`}
                          className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden"
                        >
                          {/* Mobile Layout */}
                          <div className="block sm:hidden">
                            <div className="flex items-center space-x-3 p-2 sm:p-3">
                              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white rounded-lg overflow-hidden shadow-sm flex-shrink-0">
                                <Image
                                  src={
                                    item.image ||
                                    "https://via.placeholder.com/64x64/f3f4f6/9ca3af?text=Product"
                                  }
                                  alt={item.name}
                                  width={56}
                                  height={56}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-codGray text-sm mb-1">
                                  {item.name}
                                </h3>
                                {item.variantName && (
                                  <p className="text-xs text-purple-600 font-medium mb-1">
                                    Variant: {item.variantName}
                                  </p>
                                )}
                                <p className="text-xs text-gray-600 mb-1">
                                  {item.unit || item.category}
                                </p>
                                <div className="flex items-center mb-1">
                                  <div className="flex items-center">
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${i < (item.rating || 0)
                                            ? "text-yellow-400 fill-current"
                                            : "text-gray-300"
                                          }`}
                                      />
                                    ))}
                                  </div>
                                  <span className="text-xs text-gray-600 ml-1">
                                    ({item.rating || 0})
                                  </span>
                                </div>
                                <div className="mb-1">
                                  <span className="text-sm font-bold text-purple-600">
                                    ₹{item.price}
                                  </span>
                                  {item.mrp && item.mrp > item.price && (
                                    <span className="text-xs text-gray-500 line-through ml-2">
                                      ₹{item.mrp}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-row space-x-2 flex-shrink-0">
                                <button
                                  onClick={() => handleMoveToCart(item)}
                                  className="flex items-center justify-center bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 transition-colors text-xs"
                                >
                                  <ShoppingCart className="w-3 h-3 mr-1" />
                                  Add
                                </button>
                                <button
                                  onClick={() => handleRemoveFromWishlist(item.id || item._id, item.variantId)}
                                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Desktop Layout */}
                          <div className="hidden sm:flex sm:items-center sm:space-x-4 p-2 sm:p-3">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white rounded-lg overflow-hidden shadow-sm flex-shrink-0">
                              <Image
                                src={
                                  item.image ||
                                  "https://via.placeholder.com/64x64/f3f4f6/9ca3af?text=Product"
                                }
                                alt={item.name}
                                width={56}
                                height={56}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-codGray truncate text-sm">
                                {item.name}
                              </h3>
                              {item.variantName && (
                                <p className="text-sm font-medium text-purple-600">
                                  Variant: {item.variantName}
                                </p>
                              )}
                              <p className="text-sm text-gray-600">
                                {item.unit || item.category}
                              </p>
                              <div className="flex items-center mt-1">
                                <div className="flex items-center">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-3 h-3 ${i < (item.rating || 0)
                                          ? "text-yellow-400 fill-current"
                                          : "text-gray-300"
                                        }`}
                                    />
                                  ))}
                                </div>
                                <span className="text-xs text-gray-600 ml-1">
                                  ({item.rating || 0})
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-4 flex-shrink-0">
                              <div className="text-right">
                                <div className="mb-1">
                                  <span className="text-base font-bold text-purple-600">
                                    ₹{item.price}
                                  </span>
                                  {item.mrp && item.mrp > item.price && (
                                    <div className="text-xs text-gray-500 line-through">
                                      ₹{item.mrp}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleMoveToCart(item)}
                                  className="flex items-center bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 transition-colors text-sm"
                                >
                                  <ShoppingCart className="w-3 h-3 mr-1" />
                                  Add
                                </button>
                                <button
                                  onClick={() => handleRemoveFromWishlist(item.id || item._id, item.variantId)}
                                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
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
                <div className="p-3 sm:p-4 lg:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
                    <h2 className="text-lg sm:text-xl font-bold text-codGray flex items-center">
                      <MapPin className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
                      Saved Addresses{" "}
                      {!isLoadingAddresses && `(${savedAddresses.length})`}
                    </h2>
                    <Link
                      href="/addresses"
                      className="flex items-center justify-center sm:justify-start space-x-2 bg-gradient-to-r from-brand-primary to-brand-primary-dark text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 w-full sm:w-auto text-sm sm:text-base"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Manage Addresses</span>
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                    {isLoadingAddresses ? (
                      <div className="col-span-1 lg:col-span-2 text-center py-8 sm:py-12">
                        <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-brand-primary mx-auto mb-4"></div>
                        <p className="text-gray-500 text-sm sm:text-base">Loading addresses...</p>
                      </div>
                    ) : savedAddresses?.length > 0 ? (
                      savedAddresses.map((address) => (
                        <div
                          key={address.id}
                          className="p-3 sm:p-4 lg:p-6 border border-gray-200 rounded-xl hover:border-brand-primary transition-colors"
                        >
                          <div className="flex items-start justify-between mb-2.5 sm:mb-3">
                            <div className="flex items-center space-x-2 sm:space-x-3">
                              {(address.type === "Home" || address.type === "home") && (
                                <Home className="w-4 h-4 sm:w-5 sm:h-5 text-brand-primary" />
                              )}
                              {(address.type === "Office" || address.type === "work") && (
                                <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-brand-primary" />
                              )}
                              {(address.type === "Hotel" || address.type === "hotel") && (
                                <Hotel className="w-4 h-4 sm:w-5 sm:h-5 text-brand-primary" />
                              )}
                              {(address.type === "Other" || address.type === "other") && (
                                <MapPinOff className="w-4 h-4 sm:w-5 sm:h-5 text-brand-primary" />
                              )}
                              <span className="font-semibold capitalize text-sm sm:text-base">
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
                                <p className="text-gray-900 font-medium text-sm sm:text-base">{address.name}</p>
                              )}
                              {address.addressLabel && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">{address.addressLabel}</span>
                              )}
                            </div>

                            {/* Address Details */}
                            <div className="text-gray-600 text-xs sm:text-sm space-y-1">
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
                      <div className="col-span-1 lg:col-span-2 text-center py-8 sm:py-12">
                        <MapPin className="w-16 h-16 sm:w-24 sm:h-24 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-600 mb-2">
                          No addresses saved yet
                        </h3>
                        <p className="text-gray-500 mb-6 text-sm sm:text-base">
                          Add your delivery addresses to make checkout faster!
                        </p>
                        <Link
                          href="/addresses"
                          className="inline-flex items-center bg-gradient-to-r from-brand-primary to-brand-primary-dark text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl hover:shadow-lg transition-all duration-200 text-sm sm:text-base"
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
                <div className="p-3 sm:p-4 lg:p-6">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <h2 className="text-lg sm:text-xl font-bold text-codGray flex items-center">
                      <Package className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
                      Order History
                    </h2>
                  </div>

                  {isLoadingOrders ? (
                    <div className="text-center py-6 sm:py-8">
                      <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-b-2 border-brand-primary mx-auto mb-3"></div>
                      <p className="text-gray-500 text-sm sm:text-base">Loading orders...</p>
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-6 sm:py-8">
                      <Package className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3" />
                      <h3 className="text-base sm:text-lg font-semibold text-gray-600 mb-2">
                        No orders yet
                      </h3>
                      <p className="text-gray-500 mb-4 text-sm sm:text-base">
                        Your order history will appear here once you make your
                        first purchase.
                      </p>
                      <Link
                        href="/products"
                        className="inline-flex items-center bg-gradient-to-r from-brand-primary to-brand-primary-dark text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl hover:shadow-lg transition-all duration-200 text-sm sm:text-base"
                      >
                        <ArrowRight className="w-4 h-4 mr-2" />
                        Start Shopping
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-2 sm:space-y-3 max-h-96 overflow-y-auto">
                      {displayedOrders.map((order: any) => (
                        <div
                          key={order._id}
                          className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                        >
                          {/* Mobile Layout */}
                          <div className="block sm:hidden">
                            <div className="p-2 sm:p-3">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <h3 className="font-semibold text-gray-900 text-sm">
                                    Order #{order.orderId}
                                  </h3>
                                  <p className="text-xs text-gray-500">
                                    {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric'
                                    })}
                                  </p>
                                </div>
                                <div className="text-right ml-3">
                                  <div className="text-base font-bold text-gray-900">
                                    ₹{order.pricing?.total?.toFixed(2) || '0.00'}
                                  </div>
                                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full mt-1 ${order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                      order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                                        order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                                          order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                            'bg-gray-100 text-gray-800'
                                    }`}>
                                    {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
                                  </span>
                                  {/* Return Window Status - Mobile */}

                                </div>
                              </div>

                              <div className="flex items-center space-x-3 mb-2">
                                <div className="flex -space-x-2">
                                  {order.items?.slice(0, 3).map((item: any, index: number) => (
                                    <div
                                      key={index}
                                      className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-gray-100 border-2 border-white flex items-center justify-center overflow-hidden"
                                    >
                                      {item.image ? (
                                        <Image
                                          src={item.image}
                                          alt={item.name}
                                          width={28}
                                          height={28}
                                          className="object-cover w-full h-full"
                                        />
                                      ) : (
                                        <Package className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                                      )}
                                    </div>
                                  ))}
                                  {order.items?.length > 3 && (
                                    <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-600">
                                      +{order.items.length - 3}
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1">
                                  <p className="text-xs text-gray-600">
                                    {order.items?.length} item{order.items?.length !== 1 ? 's' : ''}
                                  </p>
                                </div>
                              </div>

                              {/* Return Items Button - Mobile Layout */}
                              <div className="flex space-x-2">
                                {(() => {
                                  const isReturnable = hasReturnableItems(order);
                                  console.log(`📱 Mobile: Order ${order.orderId} return button check:`, isReturnable);
                                  return isReturnable;
                                })() && (
                                    <button
                                      onClick={() => handleInitiateReturn(order)}
                                      className="flex-1 text-orange-600 hover:text-orange-700 font-medium text-sm flex items-center justify-center py-1.5 border border-orange-600 rounded-lg hover:bg-orange-50 transition-colors"
                                    >
                                      <RefreshCw className="w-3 h-3 mr-1" />
                                      Return Items
                                    </button>
                                  )}

                                <button
                                  onClick={() => handleViewOrderDetails(order)}
                                  className="flex-1 text-brand-primary hover:text-brand-primary-dark font-medium text-sm flex items-center justify-center py-1.5 border border-brand-primary rounded-lg hover:bg-brand-primary/5 transition-colors"
                                >
                                  View Details
                                  <ArrowRight className="w-3 h-3 ml-1" />
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Desktop Layout */}
                          <div className="hidden sm:block p-3 sm:p-4">
                            <div className="flex items-center justify-between mb-2 sm:mb-3">
                              <div>
                                <h3 className="font-semibold text-gray-900 text-sm">
                                  Order #{order.orderId}
                                </h3>
                                <p className="text-xs text-gray-500">
                                  {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="text-base font-bold text-gray-900">
                                  ₹{order.pricing?.total?.toFixed(2) || '0.00'}
                                </div>
                                <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                    order.status === 'shipped' ? 'bg-blue-100 text-blue-800' :
                                      order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                                        order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                          'bg-gray-100 text-gray-800'
                                  }`}>
                                  {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center space-x-4">
                              <div className="flex -space-x-2">
                                {order.items?.slice(0, 3).map((item: any, index: number) => (
                                  <div
                                    key={index}
                                    className="w-8 h-8 rounded-lg bg-gray-100 border-2 border-white flex items-center justify-center overflow-hidden"
                                  >
                                    {item.image ? (
                                      <Image
                                        src={item.image}
                                        alt={item.name}
                                        width={32}
                                        height={32}
                                        className="object-cover w-full h-full"
                                      />
                                    ) : (
                                      <Package className="w-4 h-4 text-gray-400" />
                                    )}
                                  </div>
                                ))}
                                {order.items?.length > 3 && (
                                  <div className="w-8 h-8 rounded-lg bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-600">
                                    +{order.items.length - 3}
                                  </div>
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm text-gray-600">
                                  {order.items?.length} item{order.items?.length !== 1 ? 's' : ''}
                                </p>
                              </div>
                              <div className="flex items-center space-x-5">
                                {/* Return Items Button - Desktop Layout */}
                                {(() => {
                                  const isReturnable = hasReturnableItems(order);
                                  console.log(`💻 Desktop: Order ${order.orderId} return button check:`, isReturnable);
                                  return isReturnable;
                                })() && (
                                    <button
                                      onClick={() => handleInitiateReturn(order)}
                                      className="text-orange-600 hover:text-orange-700 font-medium text-sm flex items-center"
                                    >
                                      <RefreshCw className="w-3 h-3 mr-1" />
                                      Return
                                    </button>
                                  )}
                                <button
                                  onClick={() => handleViewOrderDetails(order)}
                                  className="text-brand-primary hover:text-brand-primary-dark font-medium text-sm flex items-center"
                                >
                                  View Details
                                  <ArrowRight className="w-3 h-3 ml-1" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}

                      {(displayedOrders.length < orders.length || ordersToShow < orders.length) && (
                        <div className="text-center pt-4 sm:pt-6">
                          <div
                            onClick={handleLoadMoreOrders}
                            className="cursor-pointer group flex flex-col items-center space-y-2 text-brand-primary hover:text-brand-primary-dark transition-colors duration-200"
                          >
                            {isLoadingMoreOrders ? (
                              <>
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-brand-primary border-t-transparent"></div>
                                <span className="text-sm font-medium">Loading more orders...</span>
                              </>
                            ) : (
                              <>
                                <span className="text-sm font-medium group-hover:underline">
                                  Load More Orders
                                </span>
                                <div className="animate-bounce">
                                  <svg
                                    className="w-5 h-5 text-brand-primary group-hover:text-brand-primary-dark transition-colors duration-200"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                  </svg>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Order count at bottom */}
                      <div className="text-center pt-2 sm:pt-3">
                        <p className="text-sm text-gray-500">
                          Showing {displayedOrders.length} of {orders.length} orders
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Returns Tab */}
            {activeTab === "returns" && (
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="p-3 sm:p-4 lg:p-6">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <h2 className="text-lg sm:text-xl font-bold text-codGray flex items-center">
                      <RefreshCw className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
                      Return History
                    </h2>
                  </div>

                  {isLoadingReturns ? (
                    <div className="text-center py-6 sm:py-8">
                      <div className="animate-spin rounded-full h-8 w-8 sm:h-10 sm:w-10 border-b-2 border-brand-primary mx-auto mb-3"></div>
                      <p className="text-gray-500 text-sm sm:text-base">Loading returns...</p>
                    </div>
                  ) : returnsList.length === 0 ? (
                    <div className="text-center py-6 sm:py-8">
                      <RefreshCw className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3" />
                      <h3 className="text-base sm:text-lg font-semibold text-gray-600 mb-2">
                        No returns yet
                      </h3>
                      <p className="text-gray-500 mb-4 text-sm sm:text-base">
                        Your return history will appear here after you submit a return.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2 sm:space-y-3 max-h-96 overflow-y-auto">
                      {displayedReturns.map((ret: any) => (
                        <div key={ret._id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                          {/* Mobile Layout */}
                          <div className="block sm:hidden p-2 sm:p-3">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 text-sm">Return #{ret.returnId}</h3>
                                <p className="text-xs text-gray-500">{new Date(ret.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                              </div>
                              <div className="text-right ml-3">
                                <div className="text-base font-bold text-gray-900">₹{getReturnTotalAmount(ret).toFixed(2)}</div>
                                {(() => { const b = getReturnStatusBadge(ret.status); return (
                                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full mt-1 ${b.className}`}>{b.label}</span>
                                ); })()}
                              </div>
                            </div>

                            <div className="flex items-center space-x-3 mb-2">
                              <div className="flex -space-x-2">
                                {(ret.items || []).slice(0, 3).map((item: any, index: number) => (
                                  <div key={index} className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-gray-100 border-2 border-white flex items-center justify-center overflow-hidden">
                                    {item.image ? (
                                      <Image src={item.image} alt={item.name} width={28} height={28} className="object-cover w-full h-full" />
                                    ) : (
                                      <Package className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                                    )}
                                  </div>
                                ))}
                                {(ret.items || []).length > 3 && (
                                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-600">+{ret.items.length - 3}</div>
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="text-xs text-gray-600">{(ret.items || []).length} item{(ret.items || []).length !== 1 ? 's' : ''}</p>
                              </div>
                            </div>

                            <div className="flex">
                              <button onClick={() => handleViewReturnDetails(ret)} className="flex-1 text-brand-primary hover:text-brand-primary-dark font-medium text-sm flex items-center justify-center py-1.5 border border-brand-primary rounded-lg hover:bg-brand-primary/5 transition-colors">
                                View Details
                                <ArrowRight className="w-3 h-3 ml-1" />
                              </button>
                            </div>
                          </div>

                          {/* Desktop Layout */}
                          <div className="hidden sm:block p-3 sm:p-4">
                            <div className="flex items-center justify-between mb-2 sm:mb-3">
                              <div>
                                <h3 className="font-semibold text-gray-900 text-sm">Return #{ret.returnId}</h3>
                                <p className="text-xs text-gray-500">{new Date(ret.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                              </div>
                              <div className="text-right">
                                <div className="text-base font-bold text-gray-900">₹{getReturnTotalAmount(ret).toFixed(2)}</div>
                                {(() => { const b = getReturnStatusBadge(ret.status); return (
                                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${b.className}`}>{b.label}</span>
                                ); })()}
                              </div>
                            </div>

                            <div className="flex items-center space-x-4">
                              <div className="flex -space-x-2">
                                {(ret.items || []).slice(0, 3).map((item: any, index: number) => (
                                  <div key={index} className="w-8 h-8 rounded-lg bg-gray-100 border-2 border-white flex items-center justify-center overflow-hidden">
                                    {item.image ? (
                                      <Image src={item.image} alt={item.name} width={32} height={32} className="object-cover w-full h-full" />
                                    ) : (
                                      <Package className="w-4 h-4 text-gray-400" />
                                    )}
                                  </div>
                                ))}
                                {(ret.items || []).length > 3 && (
                                  <div className="w-8 h-8 rounded-lg bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-600">+{ret.items.length - 3}</div>
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm text-gray-600">{(ret.items || []).length} item{(ret.items || []).length !== 1 ? 's' : ''}</p>
                              </div>
                              <div className="flex items-center space-x-5">
                                <button onClick={() => handleViewReturnDetails(ret)} className="text-brand-primary hover:text-brand-primary-dark font-medium text-sm flex items-center">
                                  View Details
                                  <ArrowRight className="w-3 h-3 ml-1" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}

                      {(displayedReturns.length < returnsList.length || returnsToShow < returnsList.length) && (
                        <div className="text-center pt-4 sm:pt-6">
                          <div onClick={handleLoadMoreReturns} className="cursor-pointer group flex flex-col items-center space-y-2 text-brand-primary hover:text-brand-primary-dark transition-colors duration-200">
                            {isLoadingMoreReturns ? (
                              <>
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-brand-primary border-t-transparent"></div>
                                <span className="text-sm font-medium">Loading more returns...</span>
                              </>
                            ) : (
                              <>
                                <span className="text-sm font-medium group-hover:underline">Load More Returns</span>
                                <div className="animate-bounce">
                                  <svg className="w-5 h-5 text-brand-primary group-hover:text-brand-primary-dark transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                  </svg>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                      <div className="text-center pt-2 sm:pt-3">
                        <p className="text-sm text-gray-500">Showing {displayedReturns.length} of {returnsList.length} returns</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Enhanced Statistics Cards */}
            <div className="space-y-4">
              {/* Top row - Two stats */}
              <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg p-3 sm:p-4 lg:p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-xs sm:text-sm">Total Orders</p>
                      <p className="text-xl sm:text-2xl lg:text-3xl font-bold">{orderStats.totalOrders}</p>
                    </div>
                    <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <Package className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl shadow-lg p-3 sm:p-4 lg:p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-red-100 text-xs sm:text-sm">Wishlist Items</p>
                      <p className="text-xl sm:text-2xl lg:text-3xl font-bold">{wishlistItems.length}</p>
                    </div>
                    <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      <Heart className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom row - One stat full width */}
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg p-3 sm:p-4 lg:p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-xs sm:text-sm">Cart Items</p>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold">{cartCount}</p>
                  </div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Return Items Modal */}
      <ReturnItemsModal
        isOpen={showReturnModal}
        onClose={handleCloseReturnModal}
        order={selectedOrderForReturn}
        selectedItems={selectedReturnItems}
        onItemToggle={handleReturnItemToggle}
        returnReason={returnReason}
        onReasonChange={setReturnReason}
        onSubmit={() => { void handleSubmitReturn(); }}
        isSubmitting={isSubmittingReturn}
        returnableItems={selectedOrderForReturn ? getReturnableItems(selectedOrderForReturn) : []}
        onPaymentChange={setRefundPreference}
        existingReturnStatuses={existingReturnsByOrderItem}
      />

      {/* Return Details Modal (read-only for customer) */}
      {showReturnDetailsModal && selectedReturnForDetail && (
        <CustomerReturnDetailsModal
          open={showReturnDetailsModal}
          onClose={handleCloseReturnDetailsModal}
          data={selectedReturnForDetail}
        />
      )}

      {/* Order Detail Modal */}
      <OrderDetailModal
        isOpen={showOrderDetailModal}
        onClose={handleCloseOrderDetailModal}
        order={selectedOrderForDetail}
      />
    </Layout>
  );
}
