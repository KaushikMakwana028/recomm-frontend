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
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { formatPrice, formatDate, getLocalStorage } from "../utils/helpers";

const NAVY = "#00204E";
const GREEN = "#34A129";

const Profile = () => {
  const { user, isAuthenticated, logout, updateProfile } = useAuth();
  const { cartItemCount } = useCart();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState(
    searchParams.get("tab") || "profile",
  );
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

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
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    if (activeTab === "orders") {
      const savedOrders = getLocalStorage("recomm_orders", []);
      const userOrders = savedOrders.filter((o) => o.userId === user?.id);
      setOrders(userOrders);
    }
  }, [activeTab, user]);

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
        profileImageFile,
      });
      if (result.success) {
        setIsEditing(false);
        setProfileImageFile(null);
        setSuccessMessage("Profile updated successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);
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
    { id: "orders", label: "My Orders", icon: FaShoppingBag },
    { id: "wishlist", label: "Wishlist", icon: FaHeart },
    { id: "security", label: "Security", icon: FaLock },
  ];

  const statusBadgeClass = (status) =>
    status === "delivered"
      ? "bg-success"
      : status === "shipped"
        ? "bg-info text-dark"
        : status === "cancelled"
          ? "bg-danger"
          : "bg-warning text-dark";

  return (
    <div className="profile-page bg-light">
      <style>{`
        .pf-hero {
          background: linear-gradient(135deg, ${NAVY} 0%, #003a7a 100%);
          padding: 2.25rem 0 4.5rem;
        }
        .pf-hero h2 { color: #fff; }
        .pf-breadcrumb a { color: rgba(255,255,255,0.7); text-decoration: none; }
        .pf-breadcrumb a:hover { color: #fff; }
        .pf-breadcrumb .active { color: ${GREEN}; font-weight: 600; }

        .pf-shell { margin-top: -3.25rem; }

        .pf-card {
          background: #fff;
          border: none;
          border-radius: 16px;
          box-shadow: 0 6px 24px rgba(0,32,78,0.08);
        }

        .pf-user-card { padding: 1.75rem 1.5rem; text-align: center; }

        .pf-avatar-wrap { position: relative; width: 92px; height: 92px; margin: 0 auto 1rem; }
        .pf-avatar {
          width: 92px; height: 92px; border-radius: 50%;
          background: ${GREEN}; display: flex; align-items: center; justify-content: center;
          overflow: hidden; border: 4px solid #fff; box-shadow: 0 0 0 3px rgba(52,161,41,0.25);
        }
        .pf-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .pf-avatar-edit {
          position: absolute; bottom: -2px; right: -2px; width: 30px; height: 30px;
          border-radius: 50%; background: ${NAVY}; color: #fff; display: flex;
          align-items: center; justify-content: center; border: 2px solid #fff; cursor: pointer;
          font-size: 0.7rem;
        }
        .pf-avatar-edit input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }

        .pf-name { color: ${NAVY}; font-weight: 700; }
        .pf-email { color: #6c757d; font-size: 0.85rem; word-break: break-word; }

        .pf-stats { border-top: 1px solid #eef1f5; margin-top: 1.1rem; padding-top: 1.1rem; }
        .pf-stats .num { color: ${GREEN}; font-weight: 700; font-size: 1.15rem; }
        .pf-stats .lbl { color: #8a93a3; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.03em; }

        .pf-nav-item {
          display: flex; align-items: center; gap: 0.75rem;
          width: 100%; border: none; background: transparent;
          padding: 0.85rem 1.25rem; font-weight: 500; color: #45526b;
          border-left: 3px solid transparent; text-align: left;
          transition: background-color .15s ease, color .15s ease;
        }
        .pf-nav-item:hover { background: #f4f7fb; color: ${NAVY}; }
        .pf-nav-item.active {
          background: rgba(52,161,41,0.08);
          color: ${GREEN};
          border-left-color: ${GREEN};
          font-weight: 700;
        }
        .pf-nav-item svg { flex-shrink: 0; }

        .pf-nav-mobile {
          display: flex; gap: 0.5rem; overflow-x: auto; padding: 0.35rem 0.1rem 0.85rem;
          -webkit-overflow-scrolling: touch;
        }
        .pf-nav-mobile::-webkit-scrollbar { display: none; }
        .pf-chip {
          flex: 0 0 auto; display: flex; align-items: center; gap: 0.4rem;
          padding: 0.5rem 0.95rem; border-radius: 999px; border: 1px solid #dde3ec;
          background: #fff; color: #45526b; font-size: 0.85rem; font-weight: 600; white-space: nowrap;
        }
        .pf-chip.active { background: ${GREEN}; border-color: ${GREEN}; color: #fff; }

        .pf-section-header {
          background: ${NAVY};
          color: #fff;
          border-radius: 16px 16px 0 0;
          padding: 1rem 1.35rem;
        }

        .pf-info-grid { padding: 1.5rem; }
        .pf-info-item { display: flex; gap: 0.85rem; padding: 0.9rem 0; }
        .pf-info-icon {
          width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0;
          background: rgba(0,32,78,0.06); color: ${NAVY};
          display: flex; align-items: center; justify-content: center;
        }
        .pf-info-label { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.04em; color: #8a93a3; margin-bottom: 0.15rem; }
        .pf-info-value { color: ${NAVY}; font-weight: 600; word-break: break-word; }
        .pf-info-value.muted { color: #adb5bd; font-weight: 500; }

        .pf-input:focus {
          border-color: ${GREEN} !important;
          box-shadow: 0 0 0 3px rgba(52,161,41,0.15) !important;
        }

        .pf-btn-cta { background: ${GREEN}; border-color: ${GREEN}; font-weight: 600; }
        .pf-btn-cta:hover { background: #2c8c22; border-color: #2c8c22; }

        .pf-order-card {
          border: 1px solid #eef1f5; border-radius: 12px; padding: 1rem; margin-bottom: 0.75rem;
        }

        @media (max-width: 991.98px) {
          .pf-hero { padding: 1.75rem 0 3.5rem; }
          .pf-shell { margin-top: -2.5rem; }
        }
      `}</style>

      {/* Hero */}
      <div className="pf-hero">
        <div className="container">
          <h2 className="fw-bold mb-2">My Account</h2>
          <nav aria-label="breadcrumb" className="pf-breadcrumb">
            <ol className="breadcrumb mb-0">
              <li className="breadcrumb-item">
                <Link to="/">Home</Link>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                Profile
              </li>
            </ol>
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
              <h5 className="pf-name mb-1">{user?.name}</h5>
              <p className="pf-email mb-0">{user?.email}</p>

              <div className="row pf-stats text-center g-0">
                <div className="col-6 border-end">
                  <div className="num">{orders.length}</div>
                  <div className="lbl">Orders</div>
                </div>
                <div className="col-6">
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
                    <FaChevronRight size={11} className="ms-auto opacity-50" />
                  </button>
                );
              })}
            </div>

            <button
              className="btn btn-outline-danger w-100 d-none d-lg-inline-flex align-items-center justify-content-center"
              onClick={handleLogout}
            >
              <FaSignOutAlt className="me-2" />
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

            {successMessage && (
              <div
                className="alert alert-success alert-dismissible fade show mb-3"
                role="alert"
              >
                {successMessage}
              </div>
            )}

            {errorMessage && (
              <div
                className="alert alert-danger alert-dismissible fade show mb-3"
                role="alert"
              >
                {errorMessage}
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === "profile" && (
              <div className="pf-card">
                <div className="pf-section-header d-flex justify-content-between align-items-center flex-wrap gap-2">
                  <h5 className="mb-0 d-flex align-items-center">
                    <FaUser className="me-2" />
                    Personal Information
                  </h5>
                  {!isEditing ? (
                    <button
                      className="btn btn-sm btn-outline-light"
                      onClick={() => setIsEditing(true)}
                    >
                      <FaEdit className="me-1" /> Edit
                    </button>
                  ) : (
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-sm pf-btn-cta text-white"
                        onClick={handleSaveProfile}
                        disabled={loading}
                      >
                        {loading ? (
                          <span className="spinner-border spinner-border-sm" />
                        ) : (
                          <>
                            <FaSave className="me-1" /> Save
                          </>
                        )}
                      </button>
                      <button
                        className="btn btn-sm btn-outline-light"
                        onClick={handleCancelEdit}
                        disabled={loading}
                      >
                        <FaTimes className="me-1" /> Cancel
                      </button>
                    </div>
                  )}
                </div>

                <div className="pf-info-grid">
                  {!isEditing ? (
                    <div className="row g-0">
                      <div className="col-md-6">
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
                      </div>
                      <div className="col-md-6">
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
                      </div>
                      <div className="col-md-6">
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
                      </div>
                      <div className="col-md-6">
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
                    </div>
                  ) : (
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label
                          className="form-label fw-bold"
                          style={{ color: NAVY }}
                        >
                          <FaUser className="me-2" size={13} />
                          Name
                        </label>
                        <input
                          type="text"
                          className="form-control pf-input"
                          name="name"
                          value={profileData.name}
                          onChange={handleProfileChange}
                        />
                      </div>

                      <div className="col-md-6">
                        <label
                          className="form-label fw-bold"
                          style={{ color: NAVY }}
                        >
                          <FaEnvelope className="me-2" size={13} />
                          Email
                        </label>
                        <input
                          type="email"
                          className="form-control pf-input"
                          name="email"
                          value={profileData.email}
                          onChange={handleProfileChange}
                        />
                      </div>

                      <div className="col-md-6">
                        <label
                          className="form-label fw-bold"
                          style={{ color: NAVY }}
                        >
                          <FaPhone className="me-2" size={13} />
                          Mobile
                        </label>
                        <input
                          type="tel"
                          className="form-control pf-input"
                          name="mobile"
                          value={profileData.mobile}
                          onChange={handleProfileChange}
                        />
                      </div>

                      <div className="col-md-6">
                        <label
                          className="form-label fw-bold"
                          style={{ color: NAVY }}
                        >
                          <FaMapMarkerAlt className="me-2" size={13} />
                          Address
                        </label>
                        <input
                          type="text"
                          className="form-control pf-input"
                          name="address"
                          value={profileData.address}
                          onChange={handleProfileChange}
                          placeholder="Street address, city, state, ZIP"
                        />
                      </div>

                      <div className="col-12">
                        <small className="text-muted">
                          <FaCamera className="me-1" />
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
                  <h5 className="mb-0 d-flex align-items-center">
                    <FaShoppingBag className="me-2" />
                    Order History ({orders.length})
                  </h5>
                </div>

                <div>
                  {orders.length === 0 ? (
                    <div className="text-center py-5 px-3">
                      <FaShoppingBag size={54} className="text-muted mb-3" />
                      <h5 className="text-muted">No orders yet</h5>
                      <p className="text-muted">
                        Your order history will appear here
                      </p>
                      <Link
                        to="/products"
                        className="btn pf-btn-cta text-white"
                      >
                        Start Shopping
                      </Link>
                    </div>
                  ) : (
                    <>
                      {/* Desktop table */}
                      <div className="table-responsive d-none d-md-block">
                        <table className="table table-hover mb-0 align-middle">
                          <thead className="table-light">
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
                                <td className="fw-bold" style={{ color: NAVY }}>
                                  #{order.id.slice(0, 8)}
                                </td>
                                <td>{formatDate(order.createdAt)}</td>
                                <td>{order.items?.length} items</td>
                                <td
                                  className="fw-bold"
                                  style={{ color: GREEN }}
                                >
                                  {formatPrice(order.pricing?.total)}
                                </td>
                                <td>
                                  <span
                                    className={`badge ${statusBadgeClass(order.status)}`}
                                  >
                                    {order.status}
                                  </span>
                                </td>
                                <td>
                                  <Link
                                    to="/order-confirmation"
                                    state={{ order }}
                                    className="btn btn-sm btn-outline-primary"
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
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <span className="fw-bold" style={{ color: NAVY }}>
                                #{order.id.slice(0, 8)}
                              </span>
                              <span
                                className={`badge ${statusBadgeClass(order.status)}`}
                              >
                                {order.status}
                              </span>
                            </div>
                            <div className="d-flex justify-content-between text-muted small mb-2">
                              <span>{formatDate(order.createdAt)}</span>
                              <span>{order.items?.length} items</span>
                            </div>
                            <div className="d-flex justify-content-between align-items-center">
                              <span
                                className="fw-bold"
                                style={{ color: GREEN }}
                              >
                                {formatPrice(order.pricing?.total)}
                              </span>
                              <Link
                                to="/order-confirmation"
                                state={{ order }}
                                className="btn btn-sm btn-outline-primary"
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

            {/* Wishlist Tab */}
            {activeTab === "wishlist" && (
              <div className="pf-card">
                <div className="pf-section-header">
                  <h5 className="mb-0 d-flex align-items-center">
                    <FaHeart className="me-2" />
                    My Wishlist
                  </h5>
                </div>
                <div className="p-4 text-center">
                  <FaHeart
                    size={44}
                    className="mb-3"
                    style={{ color: "#f3d4d4" }}
                  />
                  <p className="text-muted mb-3">
                    View and manage all your saved items on the dedicated
                    wishlist page.
                  </p>
                  <Link to="/wishlist" className="btn pf-btn-cta text-white">
                    Go to Wishlist
                  </Link>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === "security" && (
              <div className="pf-card">
                <div className="pf-section-header">
                  <h5 className="mb-0 d-flex align-items-center">
                    <FaLock className="me-2" />
                    Security Settings
                  </h5>
                </div>
                <div className="p-4">
                  <h6 className="fw-bold mb-3" style={{ color: NAVY }}>
                    Change Password
                  </h6>
                  <form>
                    <div className="row g-3 mb-2">
                      <div className="col-md-12">
                        <label className="form-label">Current Password</label>
                        <input
                          type="password"
                          className="form-control pf-input"
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">New Password</label>
                        <input
                          type="password"
                          className="form-control pf-input"
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          className="form-control pf-input"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="btn pf-btn-cta text-white mt-3"
                    >
                      Update Password
                    </button>
                  </form>

                  <hr className="my-4" />

                  <h6 className="fw-bold mb-3" style={{ color: NAVY }}>
                    Two-Factor Authentication
                  </h6>
                  <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <div>
                      <p className="mb-0 fw-medium">SMS Authentication</p>
                      <small className="text-muted">
                        Receive a code via SMS when signing in
                      </small>
                    </div>
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        role="switch"
                        id="twoFactor"
                        style={{ width: "2.5em", height: "1.4em" }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Mobile logout */}
            <button
              className="btn btn-outline-danger w-100 mt-3 d-lg-none d-flex align-items-center justify-content-center"
              onClick={handleLogout}
            >
              <FaSignOutAlt className="me-2" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
