import React, { useState, useEffect } from "react";
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
} from "react-icons/fa";
import ProfileService from "../services/profileService";
import OrderService from "../services/orderService";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
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
import "../styles/Profile.css";

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400";

const Profile = () => {
  const { user, isAuthenticated, logout, updateProfile, fetchProfile } =
    useAuth();
  const { cartItemCount, addToCart } = useCart();
  const { wishlistItems, removeFromWishlist, loading: wishlistLoading } =
    useWishlist();
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

  if (!isAuthenticated) return null;

  const tabs = [
    { id: "profile", label: "My Profile", icon: FaUser },
    { id: "addresses", label: "Addresses", icon: FaMapMarkerAlt },
    { id: "orders", label: "My Orders", icon: FaShoppingBag },
    { id: "wishlist", label: "Wishlist", icon: FaHeart },
    { id: "security", label: "Security", icon: FaLock },
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
    </div>
  );
};

export default Profile;
