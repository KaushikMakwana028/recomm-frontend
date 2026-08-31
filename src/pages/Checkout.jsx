import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  FaLock,
  FaCheck,
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaPlus,
} from "react-icons/fa";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useOrder } from "../context/OrderContext";
import { useToast } from "../context/ToastContext";
import ProfileService from "../services/profileService";
import ProductService from "../services/productService";
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

  const [vendorPincode, setVendorPincode] = useState("");
  const [distance, setDistance] = useState(null);
  const [distanceLoading, setDistanceLoading] = useState(false);

  useEffect(() => {
    if (cartItems.length > 0) {
      const fetchVendorPincode = async () => {
        try {
          const firstItem = cartItems[0];
          const result = await ProductService.getProductDetail(firstItem.id);
          if (result.success && result.data) {
            const address = result.data.store_address || "";
            const match = address.match(/\b\d{6}\b/);
            if (match) {
              setVendorPincode(match[0]);
            } else {
              setVendorPincode("382330"); // Fallback to database vendor pincode
            }
          }
        } catch (e) {
          console.error("Failed to fetch vendor pincode", e);
          setVendorPincode("382330"); // Fallback
        }
      };
      fetchVendorPincode();
    }
  }, [cartItems]);

  const calculateDistance = async (vendorPin, customerPin) => {
    if (!vendorPin || !customerPin) return;
    setDistanceLoading(true);
    try {
      // 1. Fetch vendor coordinates
      const vendorUrl = `https://nominatim.openstreetmap.org/search?postalcode=${vendorPin}&country=India&format=json`;
      const vendorRes = await fetch(vendorUrl, {
        headers: { "Accept": "application/json" }
      });
      if (!vendorRes.ok) throw new Error("Failed to reach geocoding service");
      const vendorData = await vendorRes.json();
      if (!vendorData || vendorData.length === 0) throw new Error("Vendor coords not found");
      const vendorCoords = {
        lat: parseFloat(vendorData[0].lat),
        lon: parseFloat(vendorData[0].lon)
      };

      // 2. Fetch customer coordinates
      const customerUrl = `https://nominatim.openstreetmap.org/search?postalcode=${customerPin}&country=India&format=json`;
      const customerRes = await fetch(customerUrl, {
        headers: { "Accept": "application/json" }
      });
      if (!customerRes.ok) throw new Error("Failed to reach geocoding service");
      const customerData = await customerRes.json();
      if (!customerData || customerData.length === 0) throw new Error("Customer coords not found");
      const customerCoords = {
        lat: parseFloat(customerData[0].lat),
        lon: parseFloat(customerData[0].lon)
      };

      // 3. Haversine distance
      const R = 6371; // Earth's radius in KM
      const dLat = (customerCoords.lat - vendorCoords.lat) * Math.PI / 180;
      const dLon = (customerCoords.lon - vendorCoords.lon) * Math.PI / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(vendorCoords.lat * Math.PI / 180) * Math.cos(customerCoords.lat * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const rawDistance = R * c;

      // Approximate road distance (scale straight-line by 1.3)
      const approximatedDistance = Math.round(rawDistance * 1.3 * 10) / 10;
      setDistance(approximatedDistance);
    } catch (err) {
      console.error("Distance calculation failed:", err);
      // Fallback distance e.g. 5 KM if APIs fail
      setDistance(5);
    } finally {
      setDistanceLoading(false);
    }
  };

  useEffect(() => {
    if (selectedAddressId && addresses.length > 0 && vendorPincode) {
      const addr = addresses.find((a) => a.id === selectedAddressId);
      if (addr && addr.pincode) {
        calculateDistance(vendorPincode, addr.pincode);
      }
    }
  }, [selectedAddressId, addresses, vendorPincode]);

  const baseCharge = distance !== null ? Math.round(distance * 10) : 0;
  const normalCharge = baseCharge;
  const urgentCharge = baseCharge + 50;
  const deliveryCharge = deliveryType === "urgent" ? urgentCharge : normalCharge;
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
    setLoading(true);
    setError("");

    const result = await placeOrder({
      addressId: selectedAddressId,
      notes,
      deliveryCharge,
      deliveryType,
      distance,
    });

    if (result.success) {
      await refreshCart(); // cart already cleared server-side; sync local state
      showBigAlert({
        title: "Order Placed Successfully!",
        message: "Thank you for your order. We are preparing it for delivery.",
        buttonText: "View Order Details",
        onConfirm: () => {
          navigate("/order-confirmation", { state: { order: result.data } });
        }
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
