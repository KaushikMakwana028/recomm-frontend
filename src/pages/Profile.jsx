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
} from "react-icons/fa";
import ProfileService from "../services/profileService";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useOrder } from "../context/OrderContext";
import { useToast } from "../context/ToastContext";
import { formatPrice, formatDate, formatStatus } from "../utils/helpers";
import "../styles/Profile.css";

const Profile = () => {
  const { user, isAuthenticated, logout, updateProfile, fetchProfile } =
    useAuth();
  const { cartItemCount } = useCart();
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
  const [errorMessage, setErrorMessage] = useState("");

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
      fetchOrders()
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
  }, [activeTab, isAuthenticated, fetchOrders]);

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

  const statusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "pf-badge--pending";
      case "confirmed":
        return "pf-badge--confirmed";
      case "processing":
        return "pf-badge--processing";
      case "packed":
        return "pf-badge--packed";
      case "out_for_delivery":
        return "pf-badge--out-for-delivery";
      case "delivered":
        return "pf-badge--delivered";
      case "cancelled":
        return "pf-badge--cancelled";
      default:
        return "pf-badge--warning";
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
                  {!isEditing ? (
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
                <div className="pf-section-header">
                  <h5>
                    <FaShoppingBag className="me-2" />
                    Order History ({orders.length})
                  </h5>
                </div>

                <div>
                  {ordersLoading ? (
                    <div className="text-center py-5">
                      <div
                        className="spinner-border text-brand-green"
                        role="status"
                      >
                        <span className="visually-hidden">
                          Loading orders...
                        </span>
                      </div>
                      <p className="text-muted mt-2">Loading your orders...</p>
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="pf-empty-state">
                      <FaShoppingBag size={54} className="mb-3" />
                      <h5 className="text-muted">No orders yet</h5>
                      <p className="text-muted mb-3">
                        Your order history will appear here
                      </p>
                      <Link to="/products" className="pf-btn pf-btn--solid">
                        Start Shopping
                      </Link>
                    </div>
                  ) : (
                    <>
                      {/* Desktop table */}
                      <div className="pf-table-wrap d-none d-md-block">
                        <table className="pf-table">
                          <thead>
                            <tr>
                              <th>Order ID</th>
                              <th>Date</th>
                              <th>Items</th>
                              <th>Total</th>
                              <th>Status</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {orders.map((order) => (
                              <tr key={order.id}>
                                <td
                                  className="fw-bold"
                                  style={{ color: "var(--pf-navy)" }}
                                >
                                  #
                                  {order.order_number ||
                                    String(order.id).slice(0, 8)}
                                </td>
                                <td>{formatDate(order.createdAt)}</td>
                                <td>{order.items?.length} items</td>
                                <td
                                  className="fw-bold"
                                  style={{ color: "var(--pf-green-dark)" }}
                                >
                                  {formatPrice(order.pricing?.total)}
                                </td>
                                <td>
                                  <span
                                    className={`pf-badge ${statusBadgeClass(order.status)}`}
                                  >
                                    {formatStatus(order.status)}
                                  </span>
                                </td>
                                <td>
                                  <Link
                                    to="/order-confirmation"
                                    state={{ order }}
                                    className="pf-btn pf-btn--outline pf-btn--sm"
                                  >
                                    View
                                  </Link>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Mobile stacked cards */}
                      <div className="d-md-none p-3">
                        {orders.map((order) => (
                          <div className="pf-order-card" key={order.id}>
                            <div className="pf-order-card-top">
                              <span
                                className="fw-bold"
                                style={{ color: "var(--pf-navy)" }}
                              >
                                #
                                {order.order_number ||
                                  String(order.id).slice(0, 8)}
                              </span>
                              <span
                                className={`pf-badge ${statusBadgeClass(order.status)}`}
                              >
                                {formatStatus(order.status)}
                              </span>
                            </div>
                            <div className="pf-order-card-meta">
                              <span>{formatDate(order.createdAt)}</span>
                              <span>{order.items?.length} items</span>
                            </div>
                            <div className="pf-order-card-footer">
                              <span
                                className="fw-bold"
                                style={{ color: "var(--pf-green-dark)" }}
                              >
                                {formatPrice(order.pricing?.total)}
                              </span>
                              <Link
                                to="/order-confirmation"
                                state={{ order }}
                                className="pf-btn pf-btn--outline pf-btn--sm"
                              >
                                View
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
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
                    <div className="text-center py-4">
                      <div
                        className="spinner-border text-brand-green"
                        role="status"
                      />
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
                <div className="pf-section-header">
                  <h5>
                    <FaHeart className="me-2" />
                    My Wishlist
                  </h5>
                </div>
                <div className="pf-empty-state">
                  <FaHeart
                    size={44}
                    className="mb-3"
                    style={{ color: "#f3d4d4" }}
                  />
                  <p className="text-muted mb-3">
                    View and manage all your saved items on the dedicated
                    wishlist page.
                  </p>
                  <Link to="/wishlist" className="pf-btn pf-btn--solid">
                    Go to Wishlist
                  </Link>
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
    </div>
  );
};

export default Profile;
