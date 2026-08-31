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
import { formatPrice } from "../utils/helpers";
import "../styles/Checkout.css";

const FREE_DELIVERY_THRESHOLD = 500;
const FLAT_DELIVERY_CHARGE = 49;

const Checkout = () => {
  const { cartItems, cartTotal, refreshCart } = useCart();
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

  const deliveryCharge =
    cartTotal >= FREE_DELIVERY_THRESHOLD ? 0 : FLAT_DELIVERY_CHARGE;
  const finalTotal = cartTotal + deliveryCharge;

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
                <div className="ck-summary-row">
                  <span className="ck-label">Delivery</span>
                  <span>
                    {deliveryCharge === 0 ? (
                      <span style={{ color: "var(--ck-green)" }}>FREE</span>
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
