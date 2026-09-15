import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  FaLock,
  FaCheck,
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaPlus,
  FaClock,
} from "react-icons/fa";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useOrder } from "../context/OrderContext";
import { useToast } from "../context/ToastContext";
import ProfileService from "../services/profileService";
import OrderService from "../services/orderService";
import { formatPrice } from "../utils/helpers";
import "../styles/Checkout.css";

const Checkout = () => {
  const { cartItems, cartTotal, refreshCart, deliveryType, setDeliveryType } = useCart();
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
  const [availableSlots, setAvailableSlots] = useState([]);
  const [chosenTimeOption, setChosenTimeOption] = useState("immediately");
  const [customDeliveryTime, setCustomDeliveryTime] = useState("");

  useEffect(() => {
    if (selectedAddressId) {
      const fetchDeliveryEstimate = async () => {
        setDistanceLoading(true);
        try {
          const res = await OrderService.calculateDeliveryCharge({
            addressId: selectedAddressId,
            deliveryType,
          });
          if (res.success && res.data) {
            const dist = res.data.distance_km ?? res.data.distance;
            setDistance(dist !== null && dist !== undefined ? parseFloat(dist) : 0);
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
                  setChosenTimeOption(res.data.slots[0].id || res.data.slots[0].option);
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
  }, [selectedAddressId, deliveryType]);

  const baseCharge = distance !== null ? Math.round(distance * 10) : 0;
  const normalCharge = baseCharge;
  const urgentCharge = baseCharge + 50;
  const deliveryCharge = serverDeliveryCharge !== null
    ? serverDeliveryCharge
    : (deliveryType === "urgent" ? urgentCharge : normalCharge);
  const finalTotal = cartTotal + deliveryCharge;

  const renderDeliveryOptionCard = () => (
    <div className="ck-card mb-3 mt-3">
      <div className="ck-card-header ck-card-header--plain" style={{ borderLeft: "4px solid var(--ck-green, #28a745)" }}>
        <span className="font-weight-bold" style={{ color: "var(--ck-green, #28a745)" }}>Delivery Option</span>
      </div>
      <div className="ck-card-body">
        <div className="d-flex flex-column gap-3">
          <label 
            className={`d-flex align-items-center p-3 border rounded ${deliveryType === "normal" ? "border-success bg-light" : ""}`} 
            style={{ cursor: "pointer", transition: "all 0.2s" }}
          >
            <input
              type="radio"
              name="deliveryType"
              value="normal"
              checked={deliveryType === "normal"}
              onChange={() => setDeliveryType("normal")}
              className="me-3"
              style={{ accentColor: "var(--ck-green)", width: "18px", height: "18px" }}
            />
            <div className="flex-grow-1">
              <strong className="d-block text-dark">Normal Delivery</strong>
              <span className="text-muted small">Delivered in 3-5 business days</span>
            </div>
            <span className="fw-bold text-dark">
              {formatPrice(normalCharge)}
            </span>
          </label>

          <label 
            className={`d-flex align-items-center p-3 border rounded ${deliveryType === "urgent" ? "border-success bg-light" : ""}`} 
            style={{ cursor: "pointer", transition: "all 0.2s" }}
          >
            <input
              type="radio"
              name="deliveryType"
              value="urgent"
              checked={deliveryType === "urgent"}
              onChange={() => setDeliveryType("urgent")}
              className="me-3"
              style={{ accentColor: "var(--ck-green)", width: "18px", height: "18px" }}
            />
            <div className="flex-grow-1">
              <strong className="d-block text-dark">
                Urgent Delivery
                <span style={{ color: "#dc3545", fontSize: "0.8rem", marginLeft: "8px", fontWeight: "600" }}>(+ ₹50.00 Extra)</span>
              </strong>
              <span className="text-muted small">Delivered within 24 hours</span>
            </div>
            <span className="fw-bold text-dark">
              {formatPrice(urgentCharge)}
            </span>
          </label>
        </div>
      </div>
    </div>
  );

  const renderDeliveryTimeSlotCard = () => {
    // Default fallback slots if server hasn't returned them yet
    const slots =
      availableSlots.length > 0
        ? availableSlots
        : [
            {
              id: "immediately",
              title: "Immediately",
              subtitle: "Deliver ASAP (Prep + travel time)",
              formatted_window: "Fastest dispatch",
            },
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
          ];

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
                        </strong>
                        <span className="text-muted small">{slot.subtitle}</span>
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
      deliveryType,
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

                {renderDeliveryOptionCard()}

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

                <div className="ck-card">
                  <div className="ck-card-header ck-card-header--plain">
                    <span>Order Items ({cartItems.length})</span>
                  </div>
                  <div className="ck-card-body pb-2">
                    {cartItems.map((item) => (
                      <div className="ck-review-item" key={item.id}>
                        <img
                          src={
                            item.image ||
                            "https://images.unsplash.com/photo-1542838132-92c53300491e?w=100"
                          }
                          alt={item.name}
                          className="ck-review-thumb"
                        />
                        <div>
                          <p className="ck-review-item-name">{item.name}</p>
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
                 <div className="ck-summary-row align-items-center" style={{ background: "#e8f4fd", padding: "6px 10px", borderRadius: "6px", margin: "6px 0" }}>
                  <span className="ck-label font-weight-bold" style={{ color: "#00204E", margin: 0 }}>Delivery Mode</span>
                  <span className="text-capitalize font-weight-bold badge text-white" style={{ backgroundColor: deliveryType === "urgent" ? "#dc3545" : "#00204E", padding: "4px 8px", borderRadius: "4px" }}>
                    {deliveryType}
                  </span>
                </div>
                <div className="ck-summary-row align-items-center" style={{ background: "#f8f9fa", padding: "6px 10px", borderRadius: "6px", margin: "6px 0" }}>
                  <span className="ck-label font-weight-bold" style={{ color: "#00204E", margin: 0 }}>Delivery Slot</span>
                  <span className="text-capitalize font-weight-bold badge" style={{ backgroundColor: "#00204E", color: "#fff", padding: "4px 8px", borderRadius: "4px" }}>
                    {chosenTimeOption}
                  </span>
                </div>
                <div className="ck-summary-row">
                  <span className="ck-label">Delivery Charge</span>
                  <span>
                    {distanceLoading ? (
                      <span className="text-muted small">Calculating...</span>
                    ) : distance === null ? (
                      <span className="text-muted small">Select address</span>
                    ) : (
                      formatPrice(deliveryCharge)
                    )}
                  </span>
                </div>
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
