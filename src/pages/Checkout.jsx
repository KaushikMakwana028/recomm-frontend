import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  FaLock,
  FaCheck,
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaPlus,
  FaClock,
  FaStore,
} from "react-icons/fa";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useOrder } from "../context/OrderContext";
import { useToast } from "../context/ToastContext";
import ProfileService from "../services/profileService";
import OrderService from "../services/orderService";
import { formatPrice, getImageUrl } from "../utils/helpers";
import "../styles/Checkout.css";

const Checkout = () => {
  const {
    cartItems,
    cartTotal,
    refreshCart,
    storeGroups,
    isMultiStore,
    storesCount,
  } = useCart();
  const { isAuthenticated } = useAuth();
  const { placeOrder } = useOrder();
  const { showBigAlert } = useToast();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1); // 1: Address, 2: Review & Place
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [addresses, setAddresses] = useState([]);
  const [addressLoading, setAddressLoading] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (cartItems.length === 0) {
      navigate("/cart");
      return;
    }
    if (!isAuthenticated) {
      navigate("/login?redirect=/checkout");
      return;
    }
    loadAddresses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadAddresses = async () => {
    setAddressLoading(true);
    const result = await ProfileService.getAddresses();
    if (result.success) {
      const list = result.data?.addresses || [];
      setAddresses(list);
      const defaultAddr = list.find((a) => a.is_default) || list[0];
      if (defaultAddr) setSelectedAddressId(defaultAddr.id);
    }
    setAddressLoading(false);
  };

  const [distance, setDistance] = useState(null);
  const [distanceLoading, setDistanceLoading] = useState(false);
  const [serverDeliveryCharge, setServerDeliveryCharge] = useState(null);
  const [ratePerKm, setRatePerKm] = useState(10);
  const [immediateDeliveryCharge, setImmediateDeliveryCharge] = useState(50);
  const [billedDistanceKm, setBilledDistanceKm] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [chosenTimeOption, setChosenTimeOption] = useState("later");
  const [customDeliveryTime, setCustomDeliveryTime] = useState("");

  useEffect(() => {
    if (selectedAddressId) {
      const fetchDeliveryEstimate = async () => {
        setDistanceLoading(true);
        try {
          const res = await OrderService.calculateDeliveryCharge({
            addressId: selectedAddressId,
            chosenTimeOption,
            deliveryType: chosenTimeOption === "immediately" ? "immediately" : "normal",
          });
          if (res.success && res.data) {
            const dist = res.data.distance_km ?? res.data.distance;
            setDistance(dist !== null && dist !== undefined ? parseFloat(dist) : 0);
            if (res.data.rate_per_km !== undefined) {
              setRatePerKm(parseFloat(res.data.rate_per_km));
            }
            if (res.data.immediate_delivery_charge !== undefined) {
              setImmediateDeliveryCharge(parseFloat(res.data.immediate_delivery_charge));
            }
            if (res.data.billed_distance_km !== undefined) {
              setBilledDistanceKm(parseInt(res.data.billed_distance_km, 10));
            }
            if (res.data.total_delivery_charge !== undefined) {
              setServerDeliveryCharge(parseFloat(res.data.total_delivery_charge));
            }
            if (res.data.slots && Array.isArray(res.data.slots)) {
              setAvailableSlots(res.data.slots);
              // Ensure chosenTimeOption exists in the active slots
              if (res.data.slots.length > 0) {
                const hasCurrent = res.data.slots.some(
                  (s) => (s.id || s.option) === chosenTimeOption,
                );
                if (!hasCurrent) {
                  // Default to first non-immediate slot
                  const defaultSlot = res.data.slots.find(
                    (s) => (s.id || s.option) !== "immediately",
                  ) || res.data.slots[0];
                  setChosenTimeOption(defaultSlot.id || defaultSlot.option);
                }
              }
            }
          }
        } catch (err) {
          console.error("Server delivery charge calculation error:", err);
        } finally {
          setDistanceLoading(false);
        }
      };
      fetchDeliveryEstimate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAddressId, chosenTimeOption]);

  // Rounding rule: under 1km = 1km, 1km+ = round(dist) (e.g. 2.4km -> 2km, 2.5km -> 3km, 2.6km -> 3km)
  const billedKm = billedDistanceKm !== null
    ? billedDistanceKm
    : (distance !== null ? (distance < 1.0 ? 1 : Math.max(1, Math.round(distance))) : 0);
  const baseDeliveryFee = billedKm * (ratePerKm || 10);
  const isImmediate = chosenTimeOption === "immediately";
  const immediateSurcharge = isImmediate ? (immediateDeliveryCharge || 50) : 0;

  const multiDeliveryBase = storeGroups.length > 0
    ? storeGroups.reduce((acc, g) => acc + (Number(g.delivery_charge) || 0), 0)
    : 0;

  const deliveryCharge = serverDeliveryCharge !== null
    ? serverDeliveryCharge
    : ((isMultiStore && storeGroups.length > 1) ? multiDeliveryBase : (baseDeliveryFee + immediateSurcharge));
  const finalTotal = cartTotal + deliveryCharge;

  const renderDeliveryTimeSlotCard = () => {
    // Default fallback slots if server hasn't returned them yet
    const rawSlots =
      availableSlots.length > 0
        ? availableSlots
        : [
            {
              id: "later",
              title: "Later (After 3–4 Hours)",
              subtitle: "Scheduled delivery after 3 to 4 hours",
              formatted_window: "In 3–4 hours",
            },
            {
              id: "lunch",
              title: "Lunch Delivery",
              subtitle: "Delivered during store lunch window",
              formatted_window: "12:00 PM – 02:00 PM",
            },
            {
              id: "dinner",
              title: "Dinner Delivery",
              subtitle: "Delivered during store dinner window",
              formatted_window: "07:00 PM – 09:00 PM",
            },
            {
              id: "custom",
              title: "Custom Date & Time",
              subtitle: "Specify your preferred time",
              formatted_window: "Choose time below",
            },
            {
              id: "immediately",
              title: "⚡ Immediately (Express Dispatch)",
              subtitle: "Deliver ASAP (Prep + travel time)",
              formatted_window: "Fastest dispatch",
            },
          ];

    // Standard/later slots first, express immediately slot clearly distinguished
    const slots = rawSlots.slice().sort((a, b) => {
      const aId = a.id || a.option;
      const bId = b.id || b.option;
      if (aId === "immediately") return 1;
      if (bId === "immediately") return -1;
      return 0;
    });

    return (
      <div className="ck-card mb-3">
        <div
          className="ck-card-header ck-card-header--plain"
          style={{ borderLeft: "4px solid #00204E" }}
        >
          <div className="d-flex align-items-center gap-2">
            <FaClock style={{ color: "#00204E" }} />
            <span className="font-weight-bold" style={{ color: "#00204E" }}>
              Delivery Time Slot
            </span>
          </div>
        </div>
        <div className="ck-card-body">
          <p className="text-muted small mb-3">
            Choose your preferred delivery window. Our system calculates realistic times based on vendor prep time and distance.
          </p>
          <div className="d-flex flex-column gap-2">
            {slots.map((slot) => {
              const slotId = slot.id || slot.option;
              const isSelected = chosenTimeOption === slotId;
              return (
                <div
                  key={slotId}
                  onClick={() => setChosenTimeOption(slotId)}
                  className={`p-3 border rounded-3 d-flex flex-column gap-1 ${isSelected ? "border-primary bg-light" : ""}`}
                  style={{
                    cursor: "pointer",
                    transition: "all 0.2s",
                    borderWidth: isSelected ? "2px" : "1px",
                    borderColor: isSelected ? "#00204E" : "#dee2e6",
                    backgroundColor: isSelected ? "rgba(0, 32, 78, 0.04)" : "#fff",
                  }}
                >
                  <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                    <div className="d-flex align-items-center gap-3">
                      <input
                        type="radio"
                        name="chosenTimeOption"
                        value={slotId}
                        checked={isSelected}
                        onChange={() => setChosenTimeOption(slotId)}
                        style={{
                          accentColor: "#00204E",
                          width: "18px",
                          height: "18px",
                          cursor: "pointer",
                        }}
                      />
                      <div>
                        <strong
                          className="text-dark d-block"
                          style={{ fontSize: "0.95rem" }}
                        >
                          {slot.title ||
                            slotId.charAt(0).toUpperCase() + slotId.slice(1)}
                          {slotId === "immediately" && (
                            <span 
                              className="badge bg-danger ms-2"
                              style={{ fontSize: "0.72rem", verticalAlign: "middle" }}
                            >
                              + ₹{Number(immediateDeliveryCharge || 50).toFixed(0)} Extra
                            </span>
                          )}
                        </strong>
                        <span className="text-muted small">
                          {slotId === "immediately" 
                            ? `Fastest dispatch ASAP (+ ₹${Number(immediateDeliveryCharge || 50).toFixed(0)} flat surcharge)`
                            : slot.subtitle}
                        </span>
                      </div>
                    </div>
                    {slot.formatted_window && (
                      <span
                        className="badge px-2 py-1 rounded-pill"
                        style={{
                          backgroundColor: isSelected ? "#e6f4ea" : "#f1f3f4",
                          color: isSelected ? "#137333" : "#5f6368",
                          fontSize: "0.78rem",
                          fontWeight: 600,
                        }}
                      >
                        🕒 {slot.formatted_window}
                      </span>
                    )}
                  </div>

                  {slotId === "custom" && isSelected && (
                    <div
                      className="mt-2 pt-2 border-top"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <label className="small text-muted mb-1 fw-semibold">
                        Select Delivery Date &amp; Time:
                      </label>
                      <input
                        type="datetime-local"
                        className="form-control form-control-sm"
                        value={customDeliveryTime}
                        onChange={(e) => setCustomDeliveryTime(e.target.value)}
                        min={new Date().toISOString().slice(0, 16)}
                        style={{ maxWidth: "280px" }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const handleContinueToReview = () => {
    if (!selectedAddressId) {
      setError("Please select a delivery address.");
      return;
    }
    setError("");
    setCurrentStep(2);
    window.scrollTo(0, 0);
  };

  const handlePlaceOrder = async () => {
    if (chosenTimeOption === "custom" && !customDeliveryTime) {
      setError("Please select your preferred custom delivery date and time.");
      return;
    }

    setLoading(true);
    setError("");

    const result = await placeOrder({
      addressId: selectedAddressId,
      notes,
      deliveryCharge,
      deliveryType: chosenTimeOption === "immediately" ? "immediately" : "normal",
      distance,
      chosenTimeOption,
      customDeliveryTime:
        chosenTimeOption === "custom" ? customDeliveryTime : null,
    });

    if (result.success) {
      await refreshCart(); // cart already cleared server-side; sync local state
      showBigAlert({
        title: "Order Placed Successfully!",
        message: "Thank you for your order. We are preparing it for delivery.",
        buttonText: "View Order Details",
        onConfirm: () => {
          navigate("/order-confirmation", { state: { order: result.data } });
        },
      });
    } else {
      setError(result.error || "Failed to place order. Please try again.");
    }
    setLoading(false);
  };

  if (cartItems.length === 0 || !isAuthenticated) return null;

  const selectedAddress = addresses.find((a) => a.id === selectedAddressId);

  return (
    <div className="checkout-page py-4">
      <div className="container ck-container">
        {/* Page Header */}
        <div className="mb-4">
          <h2 className="ck-title">
            <FaLock />
            Secure Checkout
          </h2>
          <nav aria-label="breadcrumb" className="ck-breadcrumb">
            <Link to="/">Home</Link>
            <span className="sep">/</span>
            <Link to="/cart">Cart</Link>
            <span className="sep">/</span>
            <span className="current">Checkout</span>
          </nav>
        </div>

        {/* Progress Steps */}
        <div className="ck-card mb-4">
          <div className="ck-progress">
            <div className="ck-progress-track">
              <div
                className={`ck-progress-step${currentStep > 1 ? " is-done" : currentStep === 1 ? " is-active" : ""}`}
              >
                <span className="ck-progress-line" />
                <span className="ck-progress-dot">
                  {currentStep > 1 ? <FaCheck size={14} /> : "1"}
                </span>
                <span className="ck-progress-label">Delivery Address</span>
              </div>
              <div
                className={`ck-progress-step${currentStep >= 2 ? " is-active" : ""}`}
              >
                <span className="ck-progress-line" />
                <span className="ck-progress-dot">2</span>
                <span className="ck-progress-label">
                  Review &amp; Place Order
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Multi-Store Guidance Banner */}
        {isMultiStore && storeGroups.length > 1 && (
          <div
            className="p-3 mb-4 rounded-3 d-flex align-items-center gap-3"
            style={{
              backgroundColor: "#eef6ff",
              border: "1.5px solid #bddbff",
              color: "#00204E",
            }}
          >
            <div
              className="d-flex align-items-center justify-content-center flex-shrink-0"
              style={{
                width: 42,
                height: 42,
                borderRadius: "50%",
                backgroundColor: "#dbeafe",
                color: "#00204E",
              }}
            >
              <FaStore size={20} />
            </div>
            <div>
              <div className="fw-bold" style={{ fontSize: "0.95rem" }}>
                Multi-Store Order ({storesCount || storeGroups.length} Stores)
              </div>
              <div className="small text-muted" style={{ fontSize: "0.82rem" }}>
                Your cart contains items from {storesCount || storeGroups.length} different stores. A single unified order will be placed with all items organized by their respective stores.
              </div>
            </div>
          </div>
        )}

        {error && <div className="ck-alert">{error}</div>}

        <div className="row g-4">
          {/* Main Content */}
          <div className="col-lg-8">
            {/* Step 1: Select Address */}
            {currentStep === 1 && (
              <div className="ck-card">
                  <div className="ck-card-header ck-card-header--blue">
                    <span>
                      <FaMapMarkerAlt className="me-2" />
                      Select Delivery Address
                    </span>
                    <Link
                      to="/profile?tab=addresses"
                      className="ck-btn ck-btn--outline-light"
                    >
                      <FaPlus size={11} /> Add New
                    </Link>
                  </div>
                  <div className="ck-card-body">
                    {addressLoading ? (
                      <div className="text-center py-4">
                        <div
                          className="spinner-border text-brand-green"
                          role="status"
                        />
                      </div>
                    ) : addresses.length === 0 ? (
                      <div className="ck-empty-state">
                        <p className="mb-3">No saved addresses yet.</p>
                        <Link
                          to="/profile?tab=addresses"
                          className="ck-btn ck-btn--solid"
                        >
                          Add Delivery Address
                        </Link>
                      </div>
                    ) : (
                      <div className="ck-address-grid">
                        {addresses.map((addr) => {
                          const isSelected = selectedAddressId === addr.id;
                          const isDefault =
                            addr.is_default === 1 || addr.is_default === true;
                          return (
                            <label
                              key={addr.id}
                              className={`ck-address-card${isSelected ? " is-selected" : ""}`}
                            >
                              <input
                                type="radio"
                                name="deliveryAddress"
                                checked={isSelected}
                                onChange={() => setSelectedAddressId(addr.id)}
                              />
                              <div>
                                <span className="ck-address-name">
                                  {addr.full_name}
                                  {isDefault && (
                                    <span className="ck-badge-default">
                                      Default
                                    </span>
                                  )}
                                </span>
                                <p className="ck-address-phone">{addr.mobile}</p>
                                <p className="ck-address-text">
                                  {addr.address_line1}
                                  {addr.address_line2
                                    ? `, ${addr.address_line2}`
                                    : ""}
                                  {addr.landmark
                                    ? ` (near ${addr.landmark})`
                                    : ""}
                                  <br />
                                  {addr.city}, {addr.state} - {addr.pincode}
                                </p>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    )}

                    <div className="mt-4">
                      <label className="ck-notes-label">
                        Order Notes (optional)
                      </label>
                      <textarea
                        className="ck-textarea"
                        rows="2"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Any delivery instructions..."
                      />
                    </div>

                    <div className="ck-step-actions">
                      <Link to="/cart" className="ck-btn ck-btn--ghost">
                        Back to Cart
                      </Link>
                      <button
                        className="ck-btn ck-btn--solid"
                        onClick={handleContinueToReview}
                        disabled={addresses.length === 0}
                      >
                        Continue to Review
                      </button>
                    </div>
                  </div>
                </div>
            )}

            {/* Step 2: Review Order */}
            {currentStep === 2 && (
              <div>
                <div className="ck-card mb-3">
                  <div className="ck-card-header ck-card-header--plain">
                    <span>Delivery Address</span>
                    <button
                      className="ck-btn--link"
                      onClick={() => setCurrentStep(1)}
                    >
                      Change
                    </button>
                  </div>
                  <div className="ck-card-body ck-review-address">
                    {selectedAddress && (
                      <>
                        <p>
                          <strong>{selectedAddress.full_name}</strong>
                        </p>
                        <p>
                          {selectedAddress.address_line1}
                          {selectedAddress.address_line2
                            ? `, ${selectedAddress.address_line2}`
                            : ""}
                        </p>
                        <p>
                          {selectedAddress.city}, {selectedAddress.state} -{" "}
                          {selectedAddress.pincode}
                        </p>
                        <p className="mb-0">Phone: {selectedAddress.mobile}</p>
                      </>
                    )}
                  </div>
                </div>

                {renderDeliveryTimeSlotCard()}

                <div className="ck-card mb-3">
                  <div className="ck-card-header ck-card-header--plain">
                    <span>
                      <FaMoneyBillWave className="me-2" />
                      Payment Method
                    </span>
                  </div>
                  <div className="ck-card-body">
                    <p className="ck-payment-row mb-0">
                      Cash on Delivery (COD)
                    </p>
                  </div>
                </div>

                {/* Review Items: Multi-Store vs Single Store */}
                {isMultiStore && storeGroups.length > 1 ? (
                  <div className="mb-3">
                    <h5 className="fw-bold text-dark mb-3" style={{ fontSize: "1rem" }}>
                      Order Items by Store ({storesCount || storeGroups.length} Stores)
                    </h5>
                    {storeGroups.map((group, gIdx) => (
                      <div className="ck-card mb-3" key={group.vendor_id || gIdx}>
                        <div
                          className="ck-card-header ck-card-header--plain d-flex justify-content-between align-items-center"
                          style={{ backgroundColor: "#f8fafd", borderBottom: "1.5px solid #edf2f7" }}
                        >
                          <div className="d-flex align-items-center gap-2">
                            <span
                              className="badge"
                              style={{ backgroundColor: "#00204E", color: "#fff", fontSize: "0.72rem" }}
                            >
                              STORE {String.fromCharCode(65 + gIdx)}
                            </span>
                            <strong className="text-dark">{group.store_name}</strong>
                            {group.distance_text && (
                              <span className="text-muted small">({group.distance_text})</span>
                            )}
                          </div>
                          <span className="text-muted small">
                            {group.items_count || group.items?.length} items
                          </span>
                        </div>
                        <div className="ck-card-body pb-2">
                          {(group.items || []).map((item, itemIdx) => (
                            <div className="ck-review-item" key={item.id || item.product_id || itemIdx}>
                              <img
                                src={
                                  getImageUrl(item.image_url || item.image)
                                }
                                alt={item.name || item.product_name || "Product"}
                                className="ck-review-thumb"
                              />
                              <div>
                                <p className="ck-review-item-name">{item.name || item.product_name}</p>
                                <span className="ck-review-item-qty">
                                  Qty: {item.quantity}
                                </span>
                              </div>
                              <span className="ck-review-item-price">
                                {formatPrice(item.price * item.quantity)}
                              </span>
                            </div>
                          ))}
                          <div
                            className="d-flex justify-content-between align-items-center pt-2 mt-2 border-top text-muted small"
                          >
                            <span>Store Subtotal + Delivery:</span>
                            <span className="fw-bold text-dark">
                              {formatPrice(group.subtotal)} + {formatPrice(group.delivery_charge)} = {formatPrice(group.store_total || (Number(group.subtotal) + Number(group.delivery_charge)))}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="ck-card">
                    <div className="ck-card-header ck-card-header--plain">
                      <span>
                        Order Items ({cartItems.length})
                        {storeGroups[0]?.store_name && (
                          <span className="text-muted small ms-2">
                            • {storeGroups[0].store_name}
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="ck-card-body pb-2">
                      {cartItems.map((item, itemIdx) => (
                        <div className="ck-review-item" key={item.id || item.product_id || itemIdx}>
                          <img
                            src={
                              getImageUrl(item.image_url || item.image)
                            }
                            alt={item.name || item.product_name || "Product"}
                            className="ck-review-thumb"
                          />
                          <div>
                            <p className="ck-review-item-name">{item.name || item.product_name}</p>
                            <span className="ck-review-item-qty">
                              Qty: {item.quantity}
                            </span>
                          </div>
                          <span className="ck-review-item-price">
                            {formatPrice(item.price * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="ck-step-actions">
                  <button
                    className="ck-btn ck-btn--ghost"
                    onClick={() => setCurrentStep(1)}
                  >
                    Back
                  </button>
                  <button
                    className="ck-btn ck-btn--solid ck-btn--lg"
                    onClick={handlePlaceOrder}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm" />
                        Placing Order...
                      </>
                    ) : (
                      "Place Order (COD)"
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="col-lg-4">
            <div className="ck-card ck-summary-card">
              <div className="ck-card-header ck-card-header--blue">
                <span>Order Summary</span>
              </div>
              <div className="ck-card-body">
                <div className="ck-summary-row">
                  <span className="ck-label">Subtotal</span>
                  <span>{formatPrice(cartTotal)}</span>
                </div>
                <div className="ck-summary-row align-items-center" style={{ background: isImmediate ? "#fef2f2" : "#f0fdf4", padding: "6px 10px", borderRadius: "6px", margin: "6px 0", border: `1px solid ${isImmediate ? "#fecaca" : "#bbf7d0"}` }}>
                  <span className="ck-label font-weight-bold" style={{ color: isImmediate ? "#991b1b" : "#166534", margin: 0 }}>Delivery Slot</span>
                  <span className="text-capitalize font-weight-bold badge" style={{ backgroundColor: isImmediate ? "#dc2626" : "#00204E", color: "#fff", padding: "4px 8px", borderRadius: "4px" }}>
                    {isImmediate ? "⚡ Immediately" : (chosenTimeOption === "later" ? "Standard / Later" : chosenTimeOption.charAt(0).toUpperCase() + chosenTimeOption.slice(1))}
                  </span>
                </div>
                <div className="ck-summary-row">
                  <span className="ck-label">
                    {isMultiStore && storeGroups.length > 1
                      ? `Delivery Charges (${storesCount || storeGroups.length} stores)`
                      : "Delivery Charge"}
                  </span>
                  <span className="fw-bold" style={{ color: "#00204E" }}>
                    {distanceLoading ? (
                      <span className="text-muted small">Calculating...</span>
                    ) : distance === null && !(isMultiStore && storeGroups.length > 1) ? (
                      <span className="text-muted small">Select address</span>
                    ) : (
                      formatPrice(deliveryCharge)
                    )}
                  </span>
                </div>
                {distance !== null && !(isMultiStore && storeGroups.length > 1) && (
                  <div className="p-2 mb-2 rounded" style={{ background: "#f8fafc", fontSize: "0.78rem", border: "1px solid #e2e8f0" }}>
                    <div className="d-flex justify-content-between text-muted py-1">
                      <span>Distance ({distance} km → {billedKm} km @ ₹{ratePerKm}/km):</span>
                      <span className="fw-semibold text-dark">{formatPrice(baseDeliveryFee)}</span>
                    </div>
                    {isImmediate && (
                      <div className="d-flex justify-content-between text-danger py-1">
                        <span>⚡ Immediate Surcharge:</span>
                        <span className="fw-bold text-danger">+ {formatPrice(immediateSurcharge)}</span>
                      </div>
                    )}
                  </div>
                )}
                {isMultiStore && storeGroups.length > 1 && (
                  <div className="p-2 mb-2 rounded" style={{ background: "#f8fafd", fontSize: "0.75rem", border: "1px solid #edf2f7" }}>
                    {storeGroups.map((g, idx) => (
                      <div key={g.vendor_id || idx} className="d-flex justify-content-between text-muted py-1">
                        <span className="text-truncate me-2" style={{ maxWidth: "150px" }}>
                          • {g.store_name}
                        </span>
                        <span>{formatPrice(g.delivery_charge)}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="ck-summary-total">
                  <span className="ck-total-label">Estimated Total</span>
                  <span className="ck-total-value">
                    {formatPrice(finalTotal)}
                  </span>
                </div>
                <small className="ck-summary-note">
                  Final total (incl. any applicable GST) is confirmed on the
                  next screen after placing your order.
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
