import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaShoppingBag,
  FaHeart,
  FaLock,
  FaEdit,
  FaSave,
  FaTimes,
  FaSignOutAlt,
  FaCamera,
  FaChevronRight,
  FaFilePdf,
  FaBolt,
  FaTrashAlt,
  FaEye,
  FaCheckCircle,
  FaClock,
  FaBox,
  FaTruck,
  FaBan,
  FaStore,
  FaListAlt,
  FaPlus,
  FaShoppingCart,
  FaRoute,
  FaChevronDown,
  FaChevronUp,
  FaHeadset,
} from "react-icons/fa";
import ProfileService from "../services/profileService";
import OrderService from "../services/orderService";
import StoreService from "../services/storeService";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useShoppingList } from "../context/ShoppingListContext";
import { useOrder } from "../context/OrderContext";
import { useToast } from "../context/ToastContext";
import {
  OrderCardSkeleton,
  AddressCardSkeleton,
  ProfileFormSkeleton,
  ProductGridSkeleton,
} from "../components/SkeletonLoaders";
import { formatPrice, formatDate, formatStatus } from "../utils/helpers";
import LocationPicker from "../components/LocationPicker";
import OrderSupportModal from "../components/OrderSupportModal";
import "../styles/Profile.css";

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400";

const Profile = () => {
  const { user, isAuthenticated, logout, updateProfile, fetchProfile } =
    useAuth();
  const { cartItemCount, addToCart } = useCart();
  const { wishlistItems, removeFromWishlist, loading: wishlistLoading } =
    useWishlist();
  const {
    lists: shoppingLists,
    loading: shoppingListsLoading,
    fetchLists: fetchShoppingLists,
    createList,
    renameList,
    deleteList,
    removeProductFromList,
    addAllToCart,
  } = useShoppingList();
  const { fetchOrders } = useOrder();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState(
    searchParams.get("tab") || "profile",
  );
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    mobile: user?.mobile || "",
    address: user?.address || "",
  });
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(
    user?.profile_image_url || null,
  );

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [errorMessage, setErrorMessage] = useState("");
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [hidingOrder, setHidingOrder] = useState(false);
  const [supportModalOrder, setSupportModalOrder] = useState(null);

  // Saved stores state
  const [savedStores, setSavedStores] = useState([]);
  const [savedStoresLoading, setSavedStoresLoading] = useState(false);
  const [unsavingStoreId, setUnsavingStoreId] = useState(null);

  // Shopping lists state
  const [newListName, setNewListName] = useState("");
  const [showCreateListModal, setShowCreateListModal] = useState(false);
  const [creatingList, setCreatingList] = useState(false);
  const [editingListId, setEditingListId] = useState(null);
  const [editingListName, setEditingListName] = useState("");
  const [savingRename, setSavingRename] = useState(false);
  const [deletingListId, setDeletingListId] = useState(null);
  const [addingAllListId, setAddingAllListId] = useState(null);
  const [expandedLists, setExpandedLists] = useState({});

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    } else {
      fetchProfile();
    }
  }, [isAuthenticated, navigate, fetchProfile]);

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || "",
        email: user.email || "",
        mobile: user.mobile || "",
        address: user.address || "",
      });
      setProfileImagePreview(user.profile_image_url || null);
    }
  }, [user]);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    if (activeTab === "orders" && isAuthenticated) {
      setOrdersLoading(true);
      const statusParam = orderStatusFilter === "all" ? "" : orderStatusFilter;
      fetchOrders({ status: statusParam })
        .then((result) => {
          if (result && result.success) {
            const apiOrders = (result.data?.orders || []).map((o) => ({
              ...o,
              id: String(o.order_id || o.id),
              createdAt: o.created_at || o.createdAt,
              pricing: {
                total: o.total_amount,
              },
              items: new Array(o.total_items || 0),
            }));
            setOrders(apiOrders);
          }
          setOrdersLoading(false);
        })
        .catch((err) => {
          console.error("Error fetching orders:", err);
          setOrdersLoading(false);
        });
    }
  }, [activeTab, isAuthenticated, fetchOrders, orderStatusFilter]);

  const [addresses, setAddresses] = useState([]);
  const [addressLoading, setAddressLoading] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null); // null = not editing, 'new' = adding
  const [addressForm, setAddressForm] = useState({
    full_name: "",
    mobile: "",
    address_line1: "",
    address_line2: "",
    landmark: "",
    city: "",
    state: "",
    pincode: "",
    latitude: null,
    longitude: null,
    country: "India",
    is_default: false,
  });
  const [addressError, setAddressError] = useState("");

  useEffect(() => {
    if (activeTab === "addresses") {
      loadAddresses();
    }
  }, [activeTab]);

  const loadAddresses = async () => {
    setAddressLoading(true);
    const result = await ProfileService.getAddresses();
    if (result.success) {
      setAddresses(result.data?.addresses || []);
    }
    setAddressLoading(false);
  };

  const resetAddressForm = () => {
    setAddressForm({
      full_name: "",
      mobile: "",
      address_line1: "",
      address_line2: "",
      landmark: "",
      city: "",
      state: "",
      pincode: "",
      latitude: null,
      longitude: null,
      country: "India",
      is_default: addresses.length === 0, // first address defaults to true
    });
    setAddressError("");
  };

  const startAddAddress = () => {
    resetAddressForm();
    setEditingAddressId("new");
  };

  const startEditAddress = (addr) => {
    setAddressForm({
      full_name: addr.full_name || "",
      mobile: addr.mobile || "",
      address_line1: addr.address_line1 || "",
      address_line2: addr.address_line2 || "",
      landmark: addr.landmark || "",
      city: addr.city || "",
      state: addr.state || "",
      pincode: addr.pincode || "",
      latitude: addr.latitude !== undefined && addr.latitude !== null ? addr.latitude : null,
      longitude: addr.longitude !== undefined && addr.longitude !== null ? addr.longitude : null,
      country: addr.country || "India",
      is_default: !!addr.is_default,
    });
    setAddressError("");
    setEditingAddressId(addr.id);
  };

  const handleAddressFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setAddressForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSaveAddress = async () => {
    setAddressError("");
    const required = [
      "full_name",
      "mobile",
      "address_line1",
      "city",
      "state",
      "pincode",
    ];
    const missing = required.some((f) => !addressForm[f]?.trim());
    if (missing) {
      setAddressError(
        "Please fill all required fields (name, mobile, address, city, state, pincode).",
      );
      return;
    }
    if (!/^[0-9]{10}$/.test(addressForm.mobile.trim())) {
      setAddressError("Mobile number must be exactly 10 digits.");
      return;
    }

    setAddressLoading(true);
    const payload = {
      ...addressForm,
      is_default: addressForm.is_default ? 1 : 0,
    };

    const result =
      editingAddressId === "new"
        ? await ProfileService.saveAddress(payload)
        : await ProfileService.updateAddress(editingAddressId, payload);

    if (result.success) {
      setEditingAddressId(null);
      await loadAddresses();
      showToast(editingAddressId === "new" ? "Address added successfully!" : "Address updated successfully!", "success");
    } else {
      setAddressError(result.error || "Failed to save address.");
    }
    setAddressLoading(false);
  };

  const handleDeleteAddress = async (addressId) => {
    setAddressLoading(true);
    const result = await ProfileService.deleteAddress(addressId);
    if (result.success) {
      await loadAddresses();
      showToast("Address deleted successfully.", "info");
    } else {
      setAddressError(result.error || "Failed to delete address.");
    }
    setAddressLoading(false);
  };

  const handleSetDefault = async (addr) => {
    setAddressLoading(true);
    const result = await ProfileService.updateAddress(addr.id, { is_default: 1 });
    if (result.success) {
      await loadAddresses();
      showToast("Default address updated.", "success");
    } else {
      setAddressError(result.error || "Failed to update default address.");
    }
    setAddressLoading(false);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    setErrorMessage("");
    try {
      const result = await updateProfile({
        name: profileData.name,
        email: profileData.email,
        mobile: profileData.mobile,
        address: profileData.address,
        profile_image: profileImageFile,
      });
      if (result.success) {
        setIsEditing(false);
        setProfileImageFile(null);
        showToast("Profile updated successfully!", "success");
      } else {
        setErrorMessage(result.error || "Failed to update profile.");
      }
    } catch (error) {
      setErrorMessage("An unexpected error occurred while updating.");
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImageFile(file);
      setProfileImagePreview(URL.createObjectURL(file));
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setErrorMessage("");
    setProfileImageFile(null);
    setProfileImagePreview(user?.profile_image_url || null);
    setProfileData({
      name: user?.name || "",
      email: user?.email || "",
      mobile: user?.mobile || "",
      address: user?.address || "",
    });
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  // Saved Stores handlers
  const loadSavedStores = useCallback(async () => {
    setSavedStoresLoading(true);
    try {
      let coords = {};
      try {
        const saved = localStorage.getItem("customer_live_location");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.latitude && parsed.longitude) {
            coords = { latitude: parsed.latitude, longitude: parsed.longitude };
          }
        }
      } catch (e) {}

      const res = await StoreService.getSavedStores(coords);
      if (res.success && res.data?.stores) {
        setSavedStores(res.data.stores);
      } else {
        setSavedStores([]);
      }
    } catch (err) {
      console.error("Error fetching saved stores:", err);
      setSavedStores([]);
    } finally {
      setSavedStoresLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "saved_stores" && isAuthenticated) {
      loadSavedStores();
    }
  }, [activeTab, isAuthenticated, loadSavedStores]);

  useEffect(() => {
    if (activeTab === "shopping_lists" && isAuthenticated) {
      fetchShoppingLists();
    }
  }, [activeTab, isAuthenticated, fetchShoppingLists]);

  const handleUnsaveStore = async (storeId, storeName) => {
    setUnsavingStoreId(storeId);
    try {
      const res = await StoreService.unsaveStore(storeId);
      if (res.success) {
        setSavedStores((prev) => prev.filter((s) => s.id !== storeId));
        showToast(`Removed "${storeName || "store"}" from saved stores`, "info");
      } else {
        showToast(res.error || "Failed to unsave store", "error");
      }
    } catch (err) {
      showToast("Error unsaving store", "error");
    } finally {
      setUnsavingStoreId(null);
    }
  };

  // Shopping lists handlers
  const handleToggleExpandList = (listId) => {
    setExpandedLists((prev) => ({
      ...prev,
      [listId]: prev[listId] === false ? true : false,
    }));
  };

  const handleCreateListSubmit = async (e) => {
    e.preventDefault();
    const trimmed = newListName.trim();
    if (!trimmed) return;
    setCreatingList(true);
    const created = await createList(trimmed);
    setCreatingList(false);
    if (created) {
      setNewListName("");
      setShowCreateListModal(false);
      if (created.id) {
        setExpandedLists((prev) => ({ ...prev, [created.id]: true }));
      }
    }
  };

  const handleStartRename = (list) => {
    setEditingListId(list.id);
    setEditingListName(list.name);
  };

  const handleSaveRename = async (listId) => {
    const trimmed = editingListName.trim();
    if (!trimmed) return;
    setSavingRename(true);
    const success = await renameList(listId, trimmed);
    setSavingRename(false);
    if (success) {
      setEditingListId(null);
      setEditingListName("");
    }
  };

  const handleConfirmDeleteList = async (listId) => {
    await deleteList(listId);
    setDeletingListId(null);
  };

  const handleAddAllToCartClick = async (listId) => {
    setAddingAllListId(listId);
    await addAllToCart(listId);
    setAddingAllListId(null);
  };

  const handleRemoveItem = async (listId, productId) => {
    await removeProductFromList(listId, productId);
  };

  const tabs = [
    { id: "profile", label: "My Profile", icon: FaUser },
    { id: "addresses", label: "Addresses", icon: FaMapMarkerAlt },
    { id: "orders", label: "My Orders", icon: FaShoppingBag },
    { id: "wishlist", label: "Wishlist", icon: FaHeart },
    { id: "saved_stores", label: "Saved Stores", icon: FaStore },
    { id: "shopping_lists", label: "Shopping Lists", icon: FaListAlt },
    // { id: "security", label: "Security", icon: FaLock },
  ];

  const getStatusConfig = (status) => {
    switch (status?.toLowerCase()) {
      case "delivered":
        return {
          label: "Delivered",
          color: "#16A34A",
          bg: "#DCFCE7",
          border: "#BBF7D0",
          icon: FaCheckCircle,
        };
      case "out_for_delivery":
        return {
          label: "Out for Delivery",
          color: "#D97706",
          bg: "#FEF3C7",
          border: "#FDE68A",
          icon: FaTruck,
        };
      case "packed":
        return {
          label: "Packed",
          color: "#2563EB",
          bg: "#DBEAFE",
          border: "#BFDBFE",
          icon: FaBox,
        };
      case "confirmed":
        return {
          label: "Confirmed",
          color: "#0D9488",
          bg: "#CCFBF1",
          border: "#99F6E4",
          icon: FaCheckCircle,
        };
      case "pending":
        return {
          label: "Order Placed",
          color: "#475569",
          bg: "#F1F5F9",
          border: "#CBD5E1",
          icon: FaClock,
        };
      case "cancelled":
        return {
          label: "Cancelled",
          color: "#DC2626",
          bg: "#FEE2E2",
          border: "#FECACA",
          icon: FaBan,
        };
      default:
        return {
          label: formatStatus(status),
          color: "#475569",
          bg: "#F1F5F9",
          border: "#CBD5E1",
          icon: FaClock,
        };
    }
  };

  const handleConfirmHideOrder = async () => {
    if (!orderToDelete) return;
    setHidingOrder(true);
    try {
      const orderIdToHide = orderToDelete.order_id || orderToDelete.id;
      const res = await OrderService.hideOrder(orderIdToHide);
      if (res.success) {
        setOrders((prev) =>
          prev.filter(
            (o) =>
              String(o.id) !== String(orderToDelete.id) &&
              String(o.order_id) !== String(orderIdToHide)
          )
        );
        showToast("Order removed from your history.", "success");
        setOrderToDelete(null);
      } else {
        showToast(res.error || "Failed to remove order.", "error");
      }
    } catch (err) {
      showToast("Error removing order from history.", "error");
    } finally {
      setHidingOrder(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="profile-page">
      {/* Hero */}
      <div className="pf-hero">
        <div className="container">
          <h2 className="mb-2">My Account</h2>
          <nav aria-label="breadcrumb" className="pf-breadcrumb">
            <Link to="/">Home</Link>
            <span className="sep">/</span>
            <span className="active">Profile</span>
          </nav>
        </div>
      </div>

      <div className="container pf-shell pb-5">
        <div className="row g-4">
          {/* Sidebar */}
          <div className="col-lg-3">
            <div className="pf-card pf-user-card mb-3">
              <div className="pf-avatar-wrap">
                <div className="pf-avatar">
                  {profileImagePreview ? (
                    <img src={profileImagePreview} alt="Profile" />
                  ) : (
                    <FaUser size={34} className="text-white" />
                  )}
                </div>
                {activeTab === "profile" && (
                  <label
                    className="pf-avatar-edit"
                    aria-label="Change profile picture"
                  >
                    <FaCamera />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </label>
                )}
              </div>
              <h5 className="pf-name">{user?.name}</h5>
              <p className="pf-email">{user?.email}</p>

              <div className="pf-stats">
                <div className="pf-stat">
                  <div className="num">{orders.length}</div>
                  <div className="lbl">Orders</div>
                </div>
                <div className="pf-stat">
                  <div className="num">{cartItemCount}</div>
                  <div className="lbl">Cart</div>
                </div>
              </div>
            </div>

            {/* Desktop vertical nav */}
            <div className="pf-card mb-3 d-none d-lg-block overflow-hidden">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    className={`pf-nav-item ${activeTab === tab.id ? "active" : ""}`}
                    onClick={() => handleTabChange(tab.id)}
                  >
                    <Icon size={15} />
                    {tab.label}
                    <FaChevronRight size={11} className="pf-chevron" />
                  </button>
                );
              })}
            </div>

            <button
              className="pf-logout-btn d-none d-lg-inline-flex"
              onClick={handleLogout}
            >
              <FaSignOutAlt />
              Logout
            </button>
          </div>

          {/* Main Content */}
          <div className="col-lg-9">
            {/* Mobile horizontal nav */}
            <div className="pf-nav-mobile d-lg-none">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    className={`pf-chip ${activeTab === tab.id ? "active" : ""}`}
                    onClick={() => handleTabChange(tab.id)}
                  >
                    <Icon size={13} />
                    {tab.label}
                  </button>
                );
              })}
            </div>



            {errorMessage && (
              <div className="pf-alert pf-alert--danger">{errorMessage}</div>
            )}

            {/* Profile Tab */}
            {activeTab === "profile" && (
              <div className="pf-card overflow-hidden">
                <div className="pf-section-header">
                  <h5>
                    <FaUser className="me-2" />
                    Personal Information
                  </h5>
                  {!isEditing ? (
                    <button
                      className="pf-btn pf-btn--ghost-light pf-btn--sm"
                      onClick={() => setIsEditing(true)}
                    >
                      <FaEdit /> Edit
                    </button>
                  ) : (
                    <div className="d-flex gap-2">
                      <button
                        className="pf-btn pf-btn--solid pf-btn--sm"
                        onClick={handleSaveProfile}
                        disabled={loading}
                      >
                        {loading ? (
                          <span className="spinner-border spinner-border-sm" />
                        ) : (
                          <>
                            <FaSave /> Save
                          </>
                        )}
                      </button>
                      <button
                        className="pf-btn pf-btn--ghost-light pf-btn--sm"
                        onClick={handleCancelEdit}
                        disabled={loading}
                      >
                        <FaTimes /> Cancel
                      </button>
                    </div>
                  )}
                </div>

                <div className="pf-info-grid">
                  {!user ? (
                    <ProfileFormSkeleton />
                  ) : !isEditing ? (
                    <div className="pf-info-cols">
                      <div className="pf-info-item">
                        <div className="pf-info-icon">
                          <FaUser size={15} />
                        </div>
                        <div>
                          <div className="pf-info-label">Name</div>
                          <div
                            className={`pf-info-value ${!profileData.name ? "muted" : ""}`}
                          >
                            {profileData.name || "Not set"}
                          </div>
                        </div>
                      </div>
                      <div className="pf-info-item">
                        <div className="pf-info-icon">
                          <FaEnvelope size={15} />
                        </div>
                        <div>
                          <div className="pf-info-label">Email</div>
                          <div
                            className={`pf-info-value ${!profileData.email ? "muted" : ""}`}
                          >
                            {profileData.email || "Not set"}
                          </div>
                        </div>
                      </div>
                      <div className="pf-info-item">
                        <div className="pf-info-icon">
                          <FaPhone size={15} />
                        </div>
                        <div>
                          <div className="pf-info-label">Mobile</div>
                          <div
                            className={`pf-info-value ${!profileData.mobile ? "muted" : ""}`}
                          >
                            {profileData.mobile || "Not set"}
                          </div>
                        </div>
                      </div>
                      <div className="pf-info-item">
                        <div className="pf-info-icon">
                          <FaMapMarkerAlt size={15} />
                        </div>
                        <div>
                          <div className="pf-info-label">Address</div>
                          <div
                            className={`pf-info-value ${!profileData.address ? "muted" : ""}`}
                          >
                            {profileData.address || "Not set"}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="pf-form-grid">
                      <div>
                        <label className="pf-label">
                          <FaUser size={13} />
                          Name
                        </label>
                        <input
                          type="text"
                          className="pf-input"
                          name="name"
                          value={profileData.name}
                          onChange={handleProfileChange}
                        />
                      </div>

                      <div>
                        <label className="pf-label">
                          <FaEnvelope size={13} />
                          Email
                        </label>
                        <input
                          type="email"
                          className="pf-input"
                          name="email"
                          value={profileData.email}
                          onChange={handleProfileChange}
                        />
                      </div>

                      <div>
                        <label className="pf-label">
                          <FaPhone size={13} />
                          Mobile
                        </label>
                        <input
                          type="tel"
                          className="pf-input"
                          name="mobile"
                          value={profileData.mobile}
                          onChange={handleProfileChange}
                        />
                      </div>

                      <div>
                        <label className="pf-label">
                          <FaMapMarkerAlt size={13} />
                          Address
                        </label>
                        <input
                          type="text"
                          className="pf-input"
                          name="address"
                          value={profileData.address}
                          onChange={handleProfileChange}
                          placeholder="Street address, city, state, ZIP"
                        />
                      </div>

                      <div className="pf-field--full">
                        <small className="pf-hint">
                          <FaCamera />
                          Tap the camera icon on your avatar to change your
                          profile picture.
                        </small>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === "orders" && (
              <div className="pf-card overflow-hidden">
                <div className="pf-section-header d-flex flex-wrap align-items-center justify-content-between gap-3">
                  <div className="d-flex align-items-center gap-2">
                    <FaShoppingBag className="text-brand-green" />
                    <h5 className="mb-0 fw-bold">Order History</h5>
                    <span
                      className="badge rounded-pill"
                      style={{
                        backgroundColor: "#F1F5F9",
                        color: "var(--pf-navy)",
                        fontSize: "0.8rem",
                        fontWeight: 700,
                      }}
                    >
                      {orders.length}
                    </span>
                  </div>

                  {/* Status filter scrollable pill bar */}
                  <div
                    className="d-flex flex-nowrap gap-2 align-items-center overflow-auto py-1"
                    style={{
                      maxWidth: "100%",
                      scrollbarWidth: "none",
                      msOverflowStyle: "none",
                    }}
                  >
                    {[
                      { key: "all", label: "All Orders" },
                      { key: "pending", label: "Order Placed" },
                      { key: "confirmed", label: "Confirmed" },
                      { key: "packed", label: "Packed" },
                      { key: "out_for_delivery", label: "Out for Delivery" },
                      { key: "delivered", label: "Delivered" },
                      { key: "cancelled", label: "Cancelled" },
                    ].map((st) => {
                      const isActive = orderStatusFilter === st.key;
                      return (
                        <button
                          key={st.key}
                          type="button"
                          onClick={() => setOrderStatusFilter(st.key)}
                          className="btn btn-sm text-nowrap fw-semibold d-inline-flex align-items-center"
                          style={{
                            fontSize: "0.78rem",
                            padding: "6px 14px",
                            borderRadius: "999px",
                            border: isActive
                              ? "1.5px solid var(--pf-green)"
                              : "1.5px solid #E2E8F0",
                            backgroundColor: isActive ? "var(--pf-green-soft)" : "#FFFFFF",
                            color: isActive ? "var(--pf-green-dark)" : "#64748B",
                            boxShadow: isActive ? "0 2px 8px rgba(52, 161, 41, 0.15)" : "none",
                            transition: "all 0.15s ease",
                          }}
                        >
                          {st.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="p-3 p-md-4">
                  {ordersLoading ? (
                    <div className="d-flex flex-column gap-3 py-2">
                      <OrderCardSkeleton />
                      <OrderCardSkeleton />
                      <OrderCardSkeleton />
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="pf-empty-state py-5 text-center">
                      <div
                        className="d-inline-flex align-items-center justify-content-center mb-3"
                        style={{
                          width: "72px",
                          height: "72px",
                          borderRadius: "50%",
                          backgroundColor: "#F1F5F9",
                          color: "#94A3B8",
                        }}
                      >
                        <FaShoppingBag size={32} />
                      </div>
                      <h5 className="fw-bold mb-1" style={{ color: "var(--pf-navy)" }}>
                        {orderStatusFilter === "all"
                          ? "No orders found"
                          : `No ${orderStatusFilter.replace(/_/g, " ")} orders found`}
                      </h5>
                      <p className="text-muted mb-3" style={{ fontSize: "0.9rem" }}>
                        {orderStatusFilter === "all"
                          ? "Looks like you haven't placed any orders yet."
                          : "Try selecting a different status filter above."}
                      </p>
                      {orderStatusFilter !== "all" ? (
                        <button
                          type="button"
                          onClick={() => setOrderStatusFilter("all")}
                          className="btn btn-outline-secondary btn-sm px-3 py-2 fw-semibold"
                          style={{ borderRadius: "8px" }}
                        >
                          View All Orders
                        </button>
                      ) : (
                        <Link
                          to="/products"
                          className="btn btn-sm text-white px-4 py-2 fw-bold"
                          style={{
                            backgroundColor: "var(--pf-green)",
                            borderRadius: "8px",
                            boxShadow: "0 4px 12px rgba(52, 161, 41, 0.25)",
                          }}
                        >
                          Start Shopping
                        </Link>
                      )}
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-3">
                      {orders.map((order) => {
                        const statusCfg = getStatusConfig(order.status);
                        const StatusIcon = statusCfg.icon;
                        const orderNum = order.order_number || String(order.id);
                        const isDelivered = ["delivered", "out_for_delivery"].includes(
                          order.status?.toLowerCase()
                        );

                        return (
                          <div
                            key={order.id}
                            className="bg-white rounded-3 p-3 p-md-4 position-relative"
                            style={{
                              border: "1px solid #E2E8F0",
                              boxShadow: "0 2px 8px rgba(0, 32, 78, 0.04)",
                              transition: "box-shadow 0.2s ease, border-color 0.2s ease",
                            }}
                          >
                            {/* Card Top Row: Order ID, Date, Urgent Badge & Status Chip */}
                            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 pb-3 mb-3 border-bottom">
                              <div className="d-flex flex-wrap align-items-center gap-2">
                                <span
                                  className="fw-bold"
                                  style={{
                                    color: "var(--pf-navy)",
                                    fontSize: "1rem",
                                    letterSpacing: "-0.01em",
                                  }}
                                >
                                  #{orderNum}
                                </span>

                                {order.delivery_type === "urgent" && (
                                  <span
                                    className="badge bg-danger-subtle text-danger border border-danger-subtle d-inline-flex align-items-center py-1 px-2"
                                    style={{ fontSize: "0.7rem", fontWeight: 700 }}
                                  >
                                    <FaBolt size={10} className="me-1" /> Urgent Delivery
                                  </span>
                                )}

                                <span className="text-muted" style={{ fontSize: "0.82rem" }}>
                                  &bull; {formatDate(order.createdAt)}
                                </span>
                              </div>

                              {/* Status Chip */}
                              <div
                                className="d-inline-flex align-items-center gap-1.5 px-3 py-1 rounded-pill fw-bold"
                                style={{
                                  fontSize: "0.76rem",
                                  backgroundColor: statusCfg.bg,
                                  color: statusCfg.color,
                                  border: `1px solid ${statusCfg.border}`,
                                }}
                              >
                                <StatusIcon size={12} />
                                <span>{statusCfg.label}</span>
                              </div>
                            </div>

                            {/* Card Middle: Summary & Price */}
                            <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
                              <div className="d-flex align-items-center gap-3">
                                {order.first_item_image ? (
                                  <img
                                    src={order.first_item_image}
                                    alt="Product"
                                    className="rounded-3 border object-fit-cover flex-shrink-0"
                                    style={{ width: "52px", height: "52px" }}
                                    onError={(e) => {
                                      e.target.style.display = "none";
                                    }}
                                  />
                                ) : (
                                  <div
                                    className="rounded-3 border d-flex align-items-center justify-content-center flex-shrink-0"
                                    style={{
                                      width: "52px",
                                      height: "52px",
                                      backgroundColor: "#F8FAFC",
                                      color: "#94A3B8",
                                    }}
                                  >
                                    <FaBox size={20} />
                                  </div>
                                )}

                                <div>
                                  <div
                                    className="fw-bold text-dark"
                                    style={{ fontSize: "0.92rem", lineHeight: "1.3" }}
                                  >
                                    {order.first_item_name
                                      ? order.first_item_name
                                      : `${order.items?.length || order.total_items || 1} item(s)`}
                                    {order.total_items > 1 && order.first_item_name && (
                                      <span className="text-muted fw-normal ms-1" style={{ fontSize: "0.82rem" }}>
                                        +{order.total_items - 1} more item{order.total_items - 1 > 1 ? "s" : ""}
                                      </span>
                                    )}
                                  </div>

                                  {order.stores && order.stores.length > 0 ? (
                                    <div className="d-flex align-items-center flex-wrap gap-1 mt-1">
                                      {order.stores.map((st, sIdx) => (
                                        <Link
                                          key={sIdx}
                                          to={`/store/${st.vendor_id}`}
                                          className="badge px-2 py-0.5 rounded-pill text-decoration-none"
                                          style={{
                                            backgroundColor: "#f8fafc",
                                            color: "#00204E",
                                            border: "1px solid #cbd5e1",
                                            fontSize: "0.72rem",
                                            fontWeight: 600,
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: "3px",
                                          }}
                                          title={`Sold by ${st.store_name} - Click to visit store`}
                                        >
                                          🏪 {st.store_name}
                                        </Link>
                                      ))}
                                    </div>
                                  ) : order.store_names && order.store_names.length > 0 ? (
                                    <div className="d-flex align-items-center gap-1 mt-1">
                                      <span
                                        className="badge px-2 py-0.5 rounded-pill"
                                        style={{
                                          backgroundColor: "#f8fafc",
                                          color: "#00204E",
                                          border: "1px solid #cbd5e1",
                                          fontSize: "0.72rem",
                                          fontWeight: 600,
                                        }}
                                      >
                                        🏪 {order.store_names.join(", ")}
                                      </span>
                                    </div>
                                  ) : null}

                                  <div className="d-flex flex-wrap align-items-center gap-2 mt-1" style={{ fontSize: "0.8rem", color: "#64748B" }}>
                                    <span>
                                      Payment: <strong className="text-secondary text-uppercase">{order.payment_method || "COD"}</strong>
                                    </span>
                                    <span>&bull;</span>
                                    <span>
                                      Delivery: <strong>{parseFloat(order.delivery_charge || 0) > 0 ? formatPrice(order.delivery_charge) : "Free"}</strong>
                                      {order.distance_km !== undefined && order.distance_km !== null ? ` (${order.distance_km} km)` : ""}
                                    </span>
                                  </div>

                                  {(order.estimated_window_formatted || order.chosen_time_option) && (
                                    <div
                                      className="d-flex align-items-center gap-1 mt-1 text-success fw-semibold"
                                      style={{ fontSize: "0.78rem" }}
                                    >
                                      <FaClock size={11} />
                                      <span>{order.estimated_window_formatted || `Slot: ${order.chosen_time_option}`}</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Price block */}
                              <div className="text-start text-md-end ms-auto ms-md-0">
                                <small className="text-muted d-block text-uppercase fw-semibold" style={{ fontSize: "0.68rem" }}>
                                  Total Amount
                                </small>
                                <span
                                  className="fw-bolder"
                                  style={{
                                    fontSize: "1.25rem",
                                    color: "var(--pf-green-dark)",
                                  }}
                                >
                                  {formatPrice(order.pricing?.total ?? order.total_amount)}
                                </span>
                              </div>
                            </div>

                            {/* Card Footer: View Details, Bill/Invoice, Delete */}
                            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 pt-3 border-top">
                              {/* Left: Customer delete / remove from history */}
                              <button
                                type="button"
                                onClick={() => setOrderToDelete(order)}
                                className="btn btn-sm btn-light text-danger d-inline-flex align-items-center gap-1.5 px-2.5 py-1.5 border-0"
                                style={{
                                  fontSize: "0.8rem",
                                  fontWeight: 600,
                                  backgroundColor: "#FFF1F2",
                                  borderRadius: "6px",
                                }}
                                title="Remove this order from your history"
                              >
                                <FaTrashAlt size={12} />
                                <span>Delete</span>
                              </button>

                              {/* Right: View Details & Bill actions */}
                              <div className="d-flex align-items-center gap-2 ms-auto">
                                <Link
                                  to="/order-confirmation"
                                  state={{ order }}
                                  className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1.5 px-3 py-1.5 fw-semibold"
                                  style={{
                                    fontSize: "0.82rem",
                                    borderRadius: "6px",
                                    borderColor: "#CBD5E1",
                                  }}
                                >
                                  <FaEye size={12} />
                                  <span>View</span>
                                </Link>

                                <button
                                  type="button"
                                  onClick={() => setSupportModalOrder(order)}
                                  className="btn btn-sm btn-outline-success d-inline-flex align-items-center gap-1.5 px-3 py-1.5 fw-semibold"
                                  style={{
                                    fontSize: "0.82rem",
                                    borderRadius: "6px",
                                    borderColor: "#16a34a",
                                    color: "#16a34a",
                                  }}
                                  title="Need help or have an issue with this order?"
                                >
                                  <FaHeadset size={12} />
                                  <span>Need Help?</span>
                                </button>

                                {isDelivered ? (
                                  <a
                                    href={
                                      order.invoice_url ||
                                      OrderService.getInvoiceUrl(order.order_id || order.id)
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="btn btn-sm text-white d-inline-flex align-items-center gap-1.5 px-3 py-1.5 fw-bold"
                                    style={{
                                      fontSize: "0.82rem",
                                      borderRadius: "6px",
                                      backgroundColor: "var(--pf-navy)",
                                    }}
                                    title="View / Print Tax Invoice PDF"
                                  >
                                    <FaFilePdf size={12} />
                                    <span>Bill</span>
                                  </a>
                                ) : (
                                  <button
                                    type="button"
                                    disabled
                                    className="btn btn-sm btn-light text-muted d-inline-flex align-items-center gap-1.5 px-3 py-1.5 fw-semibold"
                                    style={{
                                      fontSize: "0.82rem",
                                      borderRadius: "6px",
                                      border: "1px solid #E2E8F0",
                                      opacity: 0.65,
                                      cursor: "not-allowed",
                                    }}
                                    title="Bill available once delivered"
                                  >
                                    <FaLock size={10} />
                                    <span>Bill</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Addresses Tab */}
            {activeTab === "addresses" && (
              <div className="pf-card overflow-hidden">
                <div className="pf-section-header">
                  <h5>
                    <FaMapMarkerAlt className="me-2" />
                    Delivery Addresses
                  </h5>
                  {editingAddressId === null && (
                    <button
                      className="pf-btn pf-btn--ghost-light pf-btn--sm"
                      onClick={startAddAddress}
                    >
                      + Add New
                    </button>
                  )}
                </div>

                <div className="pf-info-grid">
                  {addressError && (
                    <div className="pf-alert pf-alert--danger">
                      {addressError}
                    </div>
                  )}

                  {/* Add / Edit Form */}
                  {editingAddressId !== null && (
                    <div className="pf-address-form-box">
                      <h6>
                        {editingAddressId === "new"
                          ? "Add New Address"
                          : "Edit Address"}
                      </h6>
                      <div className="pf-form-grid">
                        <div>
                          <label className="pf-label">Full Name</label>
                          <input
                            type="text"
                            className="pf-input"
                            name="full_name"
                            value={addressForm.full_name}
                            onChange={handleAddressFormChange}
                          />
                        </div>
                        <div>
                          <label className="pf-label">Mobile</label>
                          <input
                            type="tel"
                            className="pf-input"
                            name="mobile"
                            maxLength={10}
                            value={addressForm.mobile}
                            onChange={(e) =>
                              setAddressForm((p) => ({
                                ...p,
                                mobile: e.target.value.replace(/\D/g, ""),
                              }))
                            }
                          />
                        </div>
                        <div className="pf-field--full">
                          <label className="pf-label">Address Line 1</label>
                          <input
                            type="text"
                            className="pf-input"
                            name="address_line1"
                            value={addressForm.address_line1}
                            onChange={handleAddressFormChange}
                          />
                        </div>
                        <div className="pf-field--full">
                          <label className="pf-label">
                            Address Line 2 (optional)
                          </label>
                          <input
                            type="text"
                            className="pf-input"
                            name="address_line2"
                            value={addressForm.address_line2}
                            onChange={handleAddressFormChange}
                          />
                        </div>
                        <div>
                          <label className="pf-label">
                            Landmark (optional)
                          </label>
                          <input
                            type="text"
                            className="pf-input"
                            name="landmark"
                            value={addressForm.landmark}
                            onChange={handleAddressFormChange}
                          />
                        </div>
                        <div>
                          <label className="pf-label">City</label>
                          <input
                            type="text"
                            className="pf-input"
                            name="city"
                            value={addressForm.city}
                            onChange={handleAddressFormChange}
                          />
                        </div>
                        <div>
                          <label className="pf-label">State</label>
                          <input
                            type="text"
                            className="pf-input"
                            name="state"
                            value={addressForm.state}
                            onChange={handleAddressFormChange}
                          />
                        </div>
                        <div>
                          <label className="pf-label">Pincode</label>
                          <input
                            type="text"
                            className="pf-input"
                            name="pincode"
                            value={addressForm.pincode}
                            onChange={handleAddressFormChange}
                          />
                        </div>

                        <LocationPicker
                          latitude={addressForm.latitude}
                          longitude={addressForm.longitude}
                          autoLocate={editingAddressId === "new"}
                          onChange={({ latitude, longitude }) => {
                            setAddressForm((prev) => ({
                              ...prev,
                              latitude,
                              longitude,
                            }));
                          }}
                        />

                        <div className="pf-field--full pf-checkbox-row">
                          <input
                            type="checkbox"
                            id="is_default"
                            name="is_default"
                            checked={addressForm.is_default}
                            onChange={handleAddressFormChange}
                          />
                          <label htmlFor="is_default">
                            Set as default delivery address
                          </label>
                        </div>
                      </div>

                      <div className="d-flex gap-2 mt-3">
                        <button
                          className="pf-btn pf-btn--solid"
                          onClick={handleSaveAddress}
                          disabled={addressLoading}
                        >
                          {addressLoading ? (
                            <span className="spinner-border spinner-border-sm" />
                          ) : (
                            "Save Address"
                          )}
                        </button>
                        <button
                          className="pf-btn pf-btn--outline"
                          onClick={() => setEditingAddressId(null)}
                          disabled={addressLoading}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Address List */}
                  {addressLoading && editingAddressId === null ? (
                    <div className="pf-address-grid">
                      <AddressCardSkeleton />
                      <AddressCardSkeleton />
                    </div>
                  ) : addresses.length === 0 && editingAddressId === null ? (
                    <div className="pf-empty-state">
                      <FaMapMarkerAlt size={44} className="mb-3" />
                      <p className="text-muted">No saved addresses yet</p>
                    </div>
                  ) : (
                    <div className="pf-address-grid">
                      {addresses.map((addr) => (
                        <div
                          key={addr.id}
                          className={`pf-address-card${addr.is_default ? " is-default" : ""}`}
                        >
                          {addr.is_default && (
                            <span className="pf-default-badge">Default</span>
                          )}
                          <div className="pf-address-name">
                            {addr.full_name}
                          </div>
                          <div className="pf-address-phone">{addr.mobile}</div>
                          <div className="pf-address-text">
                            {addr.address_line1}
                            {addr.address_line2
                              ? `, ${addr.address_line2}`
                              : ""}
                            {addr.landmark ? ` (near ${addr.landmark})` : ""}
                            <br />
                            {addr.city}, {addr.state} - {addr.pincode},{" "}
                            {addr.country}
                            {addr.latitude && addr.longitude && (
                              <div className="mt-1 small text-success d-flex align-items-center gap-1">
                                <FaMapMarkerAlt size={11} />
                                <span>GPS Pinned ({parseFloat(addr.latitude).toFixed(4)}, {parseFloat(addr.longitude).toFixed(4)})</span>
                              </div>
                            )}
                          </div>

                          <div className="pf-address-actions">
                            <button
                              className="pf-btn pf-btn--outline pf-btn--sm"
                              onClick={() => startEditAddress(addr)}
                            >
                              <FaEdit /> Edit
                            </button>
                            {!addr.is_default && (
                              <button
                                className="pf-btn pf-btn--outline-success pf-btn--sm"
                                onClick={() => handleSetDefault(addr)}
                              >
                                Set Default
                              </button>
                            )}
                            <button
                              className="pf-btn pf-btn--outline-danger pf-btn--sm"
                              onClick={() => handleDeleteAddress(addr.id)}
                            >
                              <FaTimes /> Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Wishlist Tab */}
            {activeTab === "wishlist" && (
              <div className="pf-card overflow-hidden">
                <div className="pf-section-header d-flex flex-wrap align-items-center justify-content-between gap-2">
                  <div className="d-flex align-items-center gap-2">
                    <FaHeart className="text-danger" />
                    <h5 className="mb-0 fw-bold">My Wishlist</h5>
                    <span
                      className="badge rounded-pill"
                      style={{
                        backgroundColor: "#F1F5F9",
                        color: "var(--pf-navy)",
                        fontSize: "0.8rem",
                        fontWeight: 700,
                      }}
                    >
                      {wishlistItems.length}
                    </span>
                  </div>
                  {wishlistItems.length > 0 && (
                    <Link
                      to="/wishlist"
                      className="btn btn-sm btn-outline-success px-3 fw-semibold"
                      style={{ borderRadius: "8px" }}
                    >
                      Full Wishlist Page
                    </Link>
                  )}
                </div>

                <div className="p-3 p-md-4">
                  {wishlistLoading ? (
                    <ProductGridSkeleton count={4} colClass="col-6 col-md-4 col-lg-3" />
                  ) : wishlistItems.length === 0 ? (
                    <div className="pf-empty-state py-5 text-center">
                      <FaHeart
                        size={44}
                        className="mb-3"
                        style={{ color: "#f3d4d4" }}
                      />
                      <h5 className="fw-bold mb-1" style={{ color: "var(--pf-navy)" }}>
                        Your wishlist is empty
                      </h5>
                      <p className="text-muted mb-3" style={{ fontSize: "0.9rem" }}>
                        Save your favorite products to buy them later!
                      </p>
                      <Link to="/products" className="pf-btn pf-btn--solid">
                        Discover Products
                      </Link>
                    </div>
                  ) : (
                    <div className="row g-3">
                      {wishlistItems.map((item) => (
                        <div key={item.id} className="col-6 col-md-4 col-lg-3">
                          <div
                            className="bg-white rounded-3 overflow-hidden h-100 d-flex flex-column"
                            style={{
                              border: "1px solid #E2E8F0",
                              boxShadow: "0 2px 8px rgba(0, 32, 78, 0.04)",
                            }}
                          >
                            <div
                              className="position-relative"
                              style={{ aspectRatio: "1/1", background: "#f8fafc" }}
                            >
                              <Link to={`/product/${item.id}`}>
                                <img
                                  src={item.image || item.image_url || FALLBACK_IMG}
                                  alt={item.name}
                                  className="w-100 h-100 object-fit-contain p-2"
                                  onError={(e) => {
                                    e.target.src = FALLBACK_IMG;
                                  }}
                                />
                              </Link>
                              <button
                                type="button"
                                className="btn btn-sm btn-light position-absolute top-0 end-0 m-2 rounded-circle shadow-sm d-flex align-items-center justify-content-center p-0"
                                style={{ width: "28px", height: "28px" }}
                                onClick={() => removeFromWishlist(item.id)}
                                title="Remove from wishlist"
                              >
                                <FaTrashAlt size={11} className="text-danger" />
                              </button>
                            </div>
                            <div className="p-2.5 d-flex flex-column flex-grow-1 justify-content-between">
                              <div>
                                <Link
                                  to={`/product/${item.id}`}
                                  className="text-decoration-none fw-bold d-block text-truncate mb-1"
                                  style={{ color: "var(--pf-navy)", fontSize: "0.85rem" }}
                                  title={item.name}
                                >
                                  {item.name}
                                </Link>
                                <div
                                  className="fw-bold"
                                  style={{ color: "var(--pf-green)", fontSize: "0.92rem" }}
                                >
                                  {formatPrice(item.price)}
                                </div>
                              </div>
                              <button
                                type="button"
                                className="btn btn-sm text-white w-100 mt-2 d-flex align-items-center justify-content-center gap-1 fw-semibold"
                                style={{
                                  backgroundColor: "var(--pf-green)",
                                  borderRadius: "6px",
                                  fontSize: "0.78rem",
                                  padding: "0.45rem",
                                }}
                                onClick={() => {
                                  addToCart(item, 1);
                                  removeFromWishlist(item.id);
                                }}
                              >
                                <FaShoppingBag size={11} /> Move to Cart
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Saved Stores Tab */}
            {activeTab === "saved_stores" && (
              <div className="pf-card overflow-hidden">
                <div className="pf-section-header d-flex flex-wrap align-items-center justify-content-between gap-2">
                  <div className="d-flex align-items-center gap-2">
                    <FaStore style={{ color: "#34A129" }} />
                    <h5 className="mb-0 fw-bold">Saved Stores</h5>
                    <span
                      className="badge rounded-pill"
                      style={{
                        backgroundColor: "#F1F5F9",
                        color: "var(--pf-navy)",
                        fontSize: "0.8rem",
                        fontWeight: 700,
                      }}
                    >
                      {savedStores.length}
                    </span>
                  </div>
                </div>

                <div className="p-3 p-md-4">
                  {savedStoresLoading ? (
                    <ProductGridSkeleton count={4} colClass="col-12 col-md-6" />
                  ) : savedStores.length === 0 ? (
                    <div className="pf-empty-state py-5 text-center">
                      <div
                        className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                        style={{
                          width: "72px",
                          height: "72px",
                          backgroundColor: "#f0fdf4",
                          color: "#34A129",
                        }}
                      >
                        <FaStore size={36} />
                      </div>
                      <h5 className="fw-bold mb-1" style={{ color: "var(--pf-navy)" }}>
                        No Saved Stores Yet
                      </h5>
                      <p className="text-muted mb-3" style={{ fontSize: "0.9rem" }}>
                        Save your favorite neighborhood stores to reorder quickly anytime!
                      </p>
                      <Link to="/" className="pf-btn pf-btn--solid">
                        Discover Stores
                      </Link>
                    </div>
                  ) : (
                    <div className="row g-3">
                      {savedStores.map((s) => (
                        <div key={s.id} className="col-12 col-md-6">
                          <div
                            className="bg-white rounded-3 p-3 h-100 d-flex flex-column justify-content-between position-relative"
                            style={{
                              border: "1.5px solid #E2E8F0",
                              boxShadow: "0 2px 8px rgba(0, 32, 78, 0.04)",
                              borderRadius: "14px",
                            }}
                          >
                            <div className="d-flex gap-3 align-items-start mb-3">
                              <div
                                className="rounded-3 overflow-hidden flex-shrink-0"
                                style={{
                                  width: "64px",
                                  height: "64px",
                                  backgroundColor: "#f8fafc",
                                  border: "1px solid #e2e8f0",
                                }}
                              >
                                <img
                                  src={s.store_photo_url || FALLBACK_IMG}
                                  alt={s.store_name}
                                  className="w-100 h-100 object-fit-cover"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = FALLBACK_IMG;
                                  }}
                                />
                              </div>
                              <div className="flex-grow-1" style={{ minWidth: 0 }}>
                                <div className="d-flex align-items-center justify-content-between gap-1 mb-1">
                                  <Link
                                    to={`/store/${s.id}`}
                                    className="fw-bold text-truncate text-decoration-none"
                                    style={{ color: "var(--pf-navy)", fontSize: "1rem" }}
                                    title={s.store_name}
                                  >
                                    {s.store_name}
                                  </Link>
                                  {s.is_open ? (
                                    <span
                                      className="badge bg-success-subtle text-success py-0 px-2"
                                      style={{ fontSize: "0.68rem" }}
                                    >
                                      Open
                                    </span>
                                  ) : (
                                    <span
                                      className="badge bg-danger-subtle text-danger py-0 px-2"
                                      style={{ fontSize: "0.68rem" }}
                                    >
                                      Closed
                                    </span>
                                  )}
                                </div>

                                {s.category_summary && (
                                  <div
                                    className="text-muted small text-truncate mb-1"
                                    style={{ fontSize: "0.78rem" }}
                                  >
                                    {s.category_summary}
                                  </div>
                                )}

                                <div
                                  className="d-flex flex-wrap gap-2 text-muted small"
                                  style={{ fontSize: "0.75rem" }}
                                >
                                  {s.address && (
                                    <span
                                      className="d-inline-flex align-items-center gap-1 text-truncate"
                                      style={{ maxWidth: "160px" }}
                                    >
                                      <FaMapMarkerAlt size={10} style={{ color: "#34A129" }} />
                                      {s.address}
                                    </span>
                                  )}
                                  {s.distance_text && (
                                    <span className="d-inline-flex align-items-center gap-1">
                                      <FaRoute size={10} style={{ color: "#34A129" }} />
                                      {s.distance_text}
                                    </span>
                                  )}
                                  {s.total_products > 0 && (
                                    <span className="text-secondary fw-semibold">
                                      • {s.total_products} products
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="d-flex align-items-center justify-content-between pt-2 border-top gap-2">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1 py-1 px-2"
                                style={{ fontSize: "0.78rem", borderRadius: "8px" }}
                                onClick={() => handleUnsaveStore(s.id, s.store_name)}
                                disabled={unsavingStoreId === s.id}
                              >
                                <FaTrashAlt size={11} />
                                {unsavingStoreId === s.id ? "Removing..." : "Unsave"}
                              </button>

                              <Link
                                to={`/store/${s.id}`}
                                className="btn btn-sm btn-success text-white d-inline-flex align-items-center gap-1 py-1 px-3"
                                style={{
                                  fontSize: "0.78rem",
                                  borderRadius: "8px",
                                  fontWeight: 600,
                                }}
                              >
                                <FaStore size={12} /> Visit Store
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

            {/* Shopping Lists Tab */}
            {activeTab === "shopping_lists" && (
              <div className="pf-card overflow-hidden">
                <div className="pf-section-header d-flex flex-wrap align-items-center justify-content-between gap-2">
                  <div className="d-flex align-items-center gap-2">
                    <FaListAlt style={{ color: "#0284c7" }} />
                    <h5 className="mb-0 fw-bold">My Shopping Lists</h5>
                    <span
                      className="badge rounded-pill"
                      style={{
                        backgroundColor: "#F1F5F9",
                        color: "var(--pf-navy)",
                        fontSize: "0.8rem",
                        fontWeight: 700,
                      }}
                    >
                      {shoppingLists.length}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="btn btn-sm btn-success text-white d-inline-flex align-items-center gap-1 px-3 py-1.5 fw-semibold"
                    style={{ borderRadius: "8px" }}
                    onClick={() => setShowCreateListModal(true)}
                  >
                    <FaPlus size={11} /> Create New List
                  </button>
                </div>

                <div className="p-3 p-md-4">
                  {shoppingListsLoading ? (
                    <ProductGridSkeleton count={2} colClass="col-12" />
                  ) : shoppingLists.length === 0 ? (
                    <div className="pf-empty-state py-5 text-center">
                      <div
                        className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                        style={{
                          width: "72px",
                          height: "72px",
                          backgroundColor: "#e0f2fe",
                          color: "#0284c7",
                        }}
                      >
                        <FaListAlt size={36} />
                      </div>
                      <h5 className="fw-bold mb-1" style={{ color: "var(--pf-navy)" }}>
                        No Shopping Lists Yet
                      </h5>
                      <p className="text-muted mb-3" style={{ fontSize: "0.9rem" }}>
                        Create named lists like "Weekly Groceries" or "Party Supplies" and add all items to your cart in one click!
                      </p>
                      <button
                        type="button"
                        className="pf-btn pf-btn--solid"
                        onClick={() => setShowCreateListModal(true)}
                      >
                        <FaPlus size={12} className="me-1" /> Create Your First List
                      </button>
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-3">
                      {shoppingLists.map((list) => {
                        const items = list.items || [];
                        const isExpanded = expandedLists[list.id] !== false;
                        const isAddingAll = addingAllListId === list.id;

                        return (
                          <div
                            key={list.id}
                            className="bg-white rounded-3 overflow-hidden"
                            style={{
                              border: "1.5px solid #E2E8F0",
                              boxShadow: "0 2px 8px rgba(0, 32, 78, 0.04)",
                              borderRadius: "14px",
                            }}
                          >
                            {/* List Header */}
                            <div
                              className="p-3 d-flex flex-wrap align-items-center justify-content-between gap-2 border-bottom"
                              style={{ backgroundColor: "#f8fafc" }}
                            >
                              <div
                                className="d-flex align-items-center gap-2"
                                style={{ cursor: "pointer" }}
                                onClick={() => handleToggleExpandList(list.id)}
                              >
                                <button
                                  type="button"
                                  className="btn btn-sm btn-link p-0 text-muted"
                                  aria-label="Toggle list expand"
                                >
                                  {isExpanded ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
                                </button>
                                <div>
                                  <h6 className="mb-0 fw-bold" style={{ color: "var(--pf-navy)" }}>
                                    {list.name}
                                  </h6>
                                  <small className="text-muted" style={{ fontSize: "0.75rem" }}>
                                    {items.length} {items.length === 1 ? "item" : "items"}
                                  </small>
                                </div>
                              </div>

                              <div className="d-flex align-items-center gap-2 flex-wrap">
                                {items.length > 0 && (
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-success text-white d-inline-flex align-items-center gap-1.5 py-1 px-3"
                                    style={{ borderRadius: "8px", fontWeight: 600, fontSize: "0.82rem" }}
                                    onClick={() => handleAddAllToCartClick(list.id)}
                                    disabled={isAddingAll}
                                  >
                                    <FaShoppingCart size={12} />
                                    {isAddingAll ? "Adding..." : "Add All to Cart"}
                                  </button>
                                )}

                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1 py-1 px-2"
                                  style={{ borderRadius: "8px", fontSize: "0.78rem" }}
                                  onClick={() => handleStartRename(list)}
                                  title="Rename list"
                                >
                                  <FaEdit size={11} /> Rename
                                </button>

                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger d-inline-flex align-items-center gap-1 py-1 px-2"
                                  style={{ borderRadius: "8px", fontSize: "0.78rem" }}
                                  onClick={() => setDeletingListId(list.id)}
                                  title="Delete list"
                                >
                                  <FaTrashAlt size={11} />
                                </button>
                              </div>
                            </div>

                            {/* List Items */}
                            {isExpanded && (
                              <div className="p-3">
                                {items.length === 0 ? (
                                  <div className="text-center py-4 text-muted small">
                                    <p className="mb-2">This list has no items yet.</p>
                                    <Link to="/products" className="btn btn-sm btn-outline-success py-1 px-3">
                                      Browse Products to Add
                                    </Link>
                                  </div>
                                ) : (
                                  <div className="d-flex flex-column gap-2">
                                    {items.map((item) => (
                                      <div
                                        key={item.id}
                                        className="d-flex align-items-center justify-content-between p-2 rounded-2"
                                        style={{ backgroundColor: "#f8fafc", border: "1px solid #f1f5f9" }}
                                      >
                                        <div className="d-flex align-items-center gap-2.5" style={{ minWidth: 0 }}>
                                          <div
                                            className="rounded overflow-hidden flex-shrink-0"
                                            style={{
                                              width: "44px",
                                              height: "44px",
                                              backgroundColor: "#fff",
                                              border: "1px solid #e2e8f0",
                                            }}
                                          >
                                            <img
                                              src={item.image_url || FALLBACK_IMG}
                                              alt={item.name}
                                              className="w-100 h-100 object-fit-contain p-1"
                                              onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = FALLBACK_IMG;
                                              }}
                                            />
                                          </div>
                                          <div className="text-truncate">
                                            <Link
                                              to={`/product/${item.product_id}`}
                                              className="fw-semibold text-truncate d-block text-decoration-none"
                                              style={{ color: "var(--pf-navy)", fontSize: "0.85rem" }}
                                            >
                                              {item.name}
                                            </Link>
                                            <div
                                              className="d-flex align-items-center gap-2 text-muted"
                                              style={{ fontSize: "0.75rem" }}
                                            >
                                              <span className="fw-bold text-success">
                                                {formatPrice(item.sale_price || item.price)}
                                              </span>
                                              {item.store_name && (
                                                <Link
                                                  to={item.vendor_id ? `/store/${item.vendor_id}` : "#"}
                                                  className="text-truncate text-decoration-none text-muted"
                                                  title={`Sold by ${item.store_name} - Click to visit store`}
                                                  style={{ fontWeight: 500 }}
                                                >
                                                  • 🏪 {item.store_name}
                                                </Link>
                                              )}
                                              {item.quantity > 1 && (
                                                <span className="badge bg-light text-secondary border">
                                                  Qty: {item.quantity}
                                                </span>
                                              )}
                                            </div>
                                          </div>
                                        </div>

                                        <div className="d-flex align-items-center gap-2 flex-shrink-0 ms-2">
                                          <button
                                            type="button"
                                            className="btn btn-sm btn-light text-danger p-1 rounded-circle"
                                            style={{ width: "28px", height: "28px" }}
                                            onClick={() => handleRemoveItem(list.id, item.product_id)}
                                            title="Remove item from list"
                                          >
                                            <FaTimes size={11} />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === "security" && (
              <div className="pf-card overflow-hidden">
                <div className="pf-section-header">
                  <h5>
                    <FaLock className="me-2" />
                    Security Settings
                  </h5>
                </div>
                <div className="pf-info-grid">
                  <h6
                    className="fw-bold mb-3"
                    style={{ color: "var(--pf-navy)" }}
                  >
                    Change Password
                  </h6>
                  <form>
                    <div className="pf-form-grid mb-2">
                      <div className="pf-field--full">
                        <label className="pf-label">Current Password</label>
                        <input type="password" className="pf-input" />
                      </div>
                      <div>
                        <label className="pf-label">New Password</label>
                        <input type="password" className="pf-input" />
                      </div>
                      <div>
                        <label className="pf-label">Confirm New Password</label>
                        <input type="password" className="pf-input" />
                      </div>
                    </div>
                    <button type="submit" className="pf-btn pf-btn--solid mt-3">
                      Update Password
                    </button>
                  </form>

                  <hr className="my-4" />

                  <h6
                    className="fw-bold mb-3"
                    style={{ color: "var(--pf-navy)" }}
                  >
                    Two-Factor Authentication
                  </h6>
                  <div className="pf-toggle-row">
                    <div>
                      <p className="mb-0 fw-medium">SMS Authentication</p>
                      <small className="text-muted">
                        Receive a code via SMS when signing in
                      </small>
                    </div>
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input pf-switch"
                        type="checkbox"
                        role="switch"
                        id="twoFactor"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Mobile logout */}
            <button
              className="pf-logout-btn mt-3 d-lg-none"
              onClick={handleLogout}
            >
              <FaSignOutAlt />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Delete / Hide Order Confirmation Modal */}
      {orderToDelete && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{
            backgroundColor: "rgba(0, 32, 78, 0.45)",
            zIndex: 1050,
            backdropFilter: "blur(2px)",
            padding: "1rem",
          }}
        >
          <div
            className="bg-white rounded-3 shadow-lg p-4"
            style={{ maxWidth: "440px", width: "100%", border: "1px solid #E2E8F0" }}
          >
            <div className="d-flex align-items-center gap-3 mb-3">
              <div
                className="d-flex align-items-center justify-content-center flex-shrink-0"
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  backgroundColor: "#FEE2E2",
                  color: "#DC2626",
                }}
              >
                <FaTrashAlt size={18} />
              </div>
              <div>
                <h5 className="mb-0 fw-bold" style={{ color: "var(--pf-navy)" }}>
                  Remove Order from History?
                </h5>
                <small className="text-muted">
                  Order #{orderToDelete.order_number || orderToDelete.id}
                </small>
              </div>
            </div>

            <p className="text-secondary mb-4" style={{ fontSize: "0.92rem", lineHeight: "1.5" }}>
              Remove this order from your history? This won't cancel or delete the actual order.
            </p>

            <div className="d-flex justify-content-end gap-2">
              <button
                type="button"
                disabled={hidingOrder}
                onClick={() => setOrderToDelete(null)}
                className="btn btn-light px-3 py-2 fw-semibold"
                style={{ border: "1px solid #CBD5E1", fontSize: "0.88rem" }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={hidingOrder}
                onClick={handleConfirmHideOrder}
                className="btn btn-danger px-3 py-2 fw-semibold d-inline-flex align-items-center gap-2"
                style={{ fontSize: "0.88rem" }}
              >
                {hidingOrder ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" />
                    <span>Removing...</span>
                  </>
                ) : (
                  <>
                    <FaTrashAlt size={13} />
                    <span>Remove from History</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Shopping List Modal */}
      {showCreateListModal && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{
            backgroundColor: "rgba(0, 32, 78, 0.45)",
            zIndex: 1055,
            backdropFilter: "blur(3px)",
            padding: "1rem",
          }}
          onClick={() => setShowCreateListModal(false)}
        >
          <div
            className="bg-white rounded-4 shadow-lg p-4"
            style={{ width: "100%", maxWidth: "420px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d-flex align-items-center justify-content-between pb-2 border-bottom mb-3">
              <h5 className="mb-0 fw-bold d-flex align-items-center gap-2" style={{ color: "var(--pf-navy)" }}>
                <FaListAlt style={{ color: "#0284c7" }} /> Create New List
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowCreateListModal(false)}
                aria-label="Close"
              />
            </div>
            <form onSubmit={handleCreateListSubmit}>
              <div className="mb-3">
                <label className="form-label small fw-semibold text-secondary">
                  List Name
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Weekly Groceries, Monthly Restock..."
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  autoFocus
                  required
                  maxLength={100}
                />
              </div>
              <div className="d-flex justify-content-end gap-2">
                <button
                  type="button"
                  className="btn btn-light"
                  onClick={() => setShowCreateListModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-success text-white fw-semibold px-3"
                  disabled={creatingList || !newListName.trim()}
                >
                  {creatingList ? "Creating..." : "Create List"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rename Shopping List Modal */}
      {editingListId && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{
            backgroundColor: "rgba(0, 32, 78, 0.45)",
            zIndex: 1055,
            backdropFilter: "blur(3px)",
            padding: "1rem",
          }}
          onClick={() => setEditingListId(null)}
        >
          <div
            className="bg-white rounded-4 shadow-lg p-4"
            style={{ width: "100%", maxWidth: "420px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d-flex align-items-center justify-content-between pb-2 border-bottom mb-3">
              <h5 className="mb-0 fw-bold d-flex align-items-center gap-2" style={{ color: "var(--pf-navy)" }}>
                <FaEdit style={{ color: "#0284c7" }} /> Rename Shopping List
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setEditingListId(null)}
                aria-label="Close"
              />
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveRename(editingListId);
              }}
            >
              <div className="mb-3">
                <label className="form-label small fw-semibold text-secondary">
                  New List Name
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={editingListName}
                  onChange={(e) => setEditingListName(e.target.value)}
                  autoFocus
                  required
                  maxLength={100}
                />
              </div>
              <div className="d-flex justify-content-end gap-2">
                <button
                  type="button"
                  className="btn btn-light"
                  onClick={() => setEditingListId(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-success text-white fw-semibold px-3"
                  disabled={savingRename || !editingListName.trim()}
                >
                  {savingRename ? "Saving..." : "Save Name"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Shopping List Confirmation Modal */}
      {deletingListId && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{
            backgroundColor: "rgba(0, 32, 78, 0.45)",
            zIndex: 1055,
            backdropFilter: "blur(3px)",
            padding: "1rem",
          }}
          onClick={() => setDeletingListId(null)}
        >
          <div
            className="bg-white rounded-4 shadow-lg p-4"
            style={{ width: "100%", maxWidth: "420px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d-flex align-items-center gap-3 mb-3">
              <div
                className="d-flex align-items-center justify-content-center flex-shrink-0"
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  backgroundColor: "#FEE2E2",
                  color: "#DC2626",
                }}
              >
                <FaTrashAlt size={18} />
              </div>
              <div>
                <h5 className="mb-0 fw-bold" style={{ color: "var(--pf-navy)" }}>
                  Delete Shopping List?
                </h5>
                <small className="text-muted">
                  This action cannot be undone.
                </small>
              </div>
            </div>

            <p className="text-secondary mb-4" style={{ fontSize: "0.92rem", lineHeight: "1.5" }}>
              Are you sure you want to delete this shopping list? All items saved within this list will be removed.
            </p>

            <div className="d-flex justify-content-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingListId(null)}
                className="btn btn-light px-3 py-2 fw-semibold"
                style={{ border: "1px solid #CBD5E1", fontSize: "0.88rem" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleConfirmDeleteList(deletingListId)}
                className="btn btn-danger px-3 py-2 fw-semibold d-inline-flex align-items-center gap-2"
                style={{ fontSize: "0.88rem" }}
              >
                <FaTrashAlt size={13} />
                <span>Delete List</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Support Request Modal */}
      <OrderSupportModal
        order={supportModalOrder}
        isOpen={Boolean(supportModalOrder)}
        onClose={() => setSupportModalOrder(null)}
        onSuccess={() => {
          showToast("Support request submitted successfully!", "success");
        }}
      />
    </div>
  );
};

export default Profile;
