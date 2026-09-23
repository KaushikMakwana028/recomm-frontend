import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaTrash,
  FaMinus,
  FaPlus,
  FaShoppingCart,
  FaArrowLeft,
  FaArrowRight,
  FaLock,
  FaStore,
  FaMapMarkerAlt,
} from "react-icons/fa";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import ProfileService from "../services/profileService";
import OrderService from "../services/orderService";
import { formatPrice, getImageUrl } from "../utils/helpers";

const NAVY = "#00204E";
const GREEN = "#34A129";
const Cart = () => {
  const {
    cartItems,
    cartTotal,
    removeFromCart,
    updateQuantity,
    clearCart,
    storeGroups,
    isMultiStore,
    storesCount,
    cartSummary,
  } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleCheckout = () => {
    if (isAuthenticated) {
      navigate("/checkout");
    } else {
      navigate("/login?redirect=/checkout");
    }
  };

  const [selectedAddress, setSelectedAddress] = useState(null);
  const [distance, setDistance] = useState(null);
  const [distanceLoading, setDistanceLoading] = useState(false);
  const [serverDeliveryCharge, setServerDeliveryCharge] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      const loadDefaultAddress = async () => {
        try {
          const result = await ProfileService.getAddresses();
          if (result.success) {
            const list = result.data?.addresses || [];
            const defaultAddr = list.find((a) => a.is_default) || list[0];
            if (defaultAddr) {
              setSelectedAddress(defaultAddr);
            }
          }
        } catch (e) {
          console.error("Failed to load addresses in cart", e);
        }
      };
      loadDefaultAddress();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (selectedAddress?.id) {
      setDistanceLoading(true);
      OrderService.calculateDeliveryCharge({
        addressId: selectedAddress.id,
        deliveryType: "normal",
        chosenTimeOption: "later",
      })
        .then((res) => {
          if (res.success && res.data) {
            const dist = res.data.distance_km ?? res.data.distance;
            setDistance(dist !== null && dist !== undefined ? parseFloat(dist) : 0);
            // Cart ONLY shows distance-based delivery charge, never immediate surcharge
            const charge = res.data.base_delivery_charge !== undefined
              ? parseFloat(res.data.base_delivery_charge)
              : parseFloat(res.data.total_delivery_charge || 0);
            setServerDeliveryCharge(charge);
          }
        })
        .catch((err) => {
          console.error("Delivery charge calculation failed in cart:", err);
        })
        .finally(() => {
          setDistanceLoading(false);
        });
    }
  }, [selectedAddress]);

  // Rounding rule: under 1km = 1km (@ ₹10/km base), 1km+ = round(dist)
  const billedKm = distance !== null ? (distance < 1.0 ? 1 : Math.max(1, Math.round(distance))) : 0;
  const baseCharge = billedKm * 10;
  const multiDeliveryCharge = storeGroups.length > 0
    ? storeGroups.reduce((acc, g) => acc + (Number(g.delivery_charge) || 0), 0)
    : 0;
  const shippingCost = isMultiStore && storeGroups.length > 1
    ? (serverDeliveryCharge !== null ? serverDeliveryCharge : (cartSummary?.total_delivery_charge !== undefined ? Number(cartSummary.total_delivery_charge) : multiDeliveryCharge))
    : (serverDeliveryCharge !== null ? serverDeliveryCharge : baseCharge);
  const tax = 0; // Align with checkout and backend (no tax)
  const finalTotal = isMultiStore && storeGroups.length > 1
    ? (cartSummary?.total_amount !== undefined ? Number(cartSummary.total_amount) : cartTotal + shippingCost)
    : (cartTotal + shippingCost + tax);

  if (cartItems.length === 0) {
    return (
      <div className="ct-page bg-light">
        <style>{`
          .ct-empty-card {
            background: #fff; border-radius: 18px; box-shadow: 0 6px 24px rgba(0,32,78,0.08);
            padding: 3rem 2rem;
          }
          .ct-empty-icon {
            width: 96px; height: 96px; border-radius: 50%; background: rgba(0,32,78,0.06);
            display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem;
            color: ${NAVY};
          }
        `}</style>
        <div className="container py-5">
          <div className="row justify-content-center">
            <div className="col-11 col-sm-8 col-lg-5 text-center">
              <div className="ct-empty-card">
                <div className="ct-empty-icon">
                  <FaShoppingCart size={40} />
                </div>
                <h3 style={{ color: NAVY, fontWeight: 800 }} className="mb-2">
                  Your Cart is Empty
                </h3>
                <p className="text-muted mb-4">
                  Looks like you haven't added any items to your cart yet.
                </p>
                <Link
                  to="/products"
                  className="btn text-white fw-bold px-5 py-2"
                  style={{ background: GREEN, borderRadius: "10px" }}
                >
                  Start Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ct-page bg-light">
      <style>{`
        .ct-wrap { padding-top: 1.75rem; padding-bottom: 3rem; }
        .ct-title { color: ${NAVY}; font-weight: 800; }
        .ct-breadcrumb a { color: #6c7a90; text-decoration: none; }
        .ct-breadcrumb a:hover { color: ${NAVY}; }
        .ct-breadcrumb .active { color: ${GREEN}; font-weight: 600; }

        /* ---------- Items card ---------- */
        .ct-items-card {
          background: #fff; border-radius: 16px; overflow: hidden;
          box-shadow: 0 3px 16px rgba(0,32,78,0.07);
        }
        .ct-items-head {
          background: ${NAVY}; color: #fff; padding: 1rem 1.25rem;
          display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem;
        }
        .ct-items-head h5 { margin: 0; font-weight: 700; font-size: 1.05rem; }
        .ct-clear-btn {
          border: none; background: rgba(255,255,255,0.12); color: #fff; font-weight: 600;
          font-size: 0.82rem; padding: 0.4rem 0.75rem; border-radius: 8px;
          display: flex; align-items: center; gap: 0.4rem;
        }
        .ct-clear-btn:hover { background: rgba(255,255,255,0.22); }

        .ct-item-row {
          display: flex; align-items: center; gap: 1rem; padding: 1.1rem 1.25rem;
          border-bottom: 1px solid #f0f2f6;
        }
        .ct-item-row:last-child { border-bottom: none; }

        .ct-item-img {
          width: 78px; height: 78px; border-radius: 12px; background: #f4f6f9; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center; overflow: hidden;
        }
        .ct-item-img img { width: 100%; height: 100%; object-fit: contain; padding: 0.4rem; }

        .ct-item-info { flex: 1; min-width: 0; }
        .ct-item-name {
          color: ${NAVY}; font-weight: 700; font-size: 0.95rem; text-decoration: none; display: block;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .ct-item-name:hover { color: ${GREEN}; }
        .ct-item-cat { color: #98a2b8; font-size: 0.78rem; }
        .ct-item-price { color: ${GREEN}; font-weight: 700; font-size: 0.9rem; }

        .ct-qty {
          display: flex; align-items: center; border: 1.5px solid #e2e7f0; border-radius: 10px;
          overflow: hidden; flex-shrink: 0;
        }
        .ct-qty button {
          border: none; background: #fff; color: ${NAVY}; width: 30px; height: 30px;
          display: flex; align-items: center; justify-content: center;
        }
        .ct-qty button:hover:not(:disabled) { background: #f4f7fb; }
        .ct-qty button:disabled { color: #cdd4e0; }
        .ct-qty span {
          width: 34px; text-align: center; font-weight: 700; color: ${NAVY}; font-size: 0.88rem;
          border-left: 1.5px solid #e2e7f0; border-right: 1.5px solid #e2e7f0; line-height: 30px;
        }

        .ct-item-subtotal { color: ${NAVY}; font-weight: 800; font-size: 0.95rem; white-space: nowrap; }

        .ct-remove-btn {
          border: none; background: #fdf2f2; color: #d8465f; width: 34px; height: 34px; border-radius: 9px;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .ct-remove-btn:hover { background: #fbe3e6; }

        .ct-continue {
          display: inline-flex; align-items: center; gap: 0.5rem; color: ${NAVY}; font-weight: 700;
          text-decoration: none; font-size: 0.9rem; padding: 0.6rem 0;
        }
        .ct-continue:hover { color: ${GREEN}; }

        /* ---------- Order summary ---------- */
        .ct-summary-card {
          background: #fff; border-radius: 16px; overflow: hidden;
          box-shadow: 0 3px 16px rgba(0,32,78,0.07);
        }
        .ct-summary-head {
          background: ${NAVY}; color: #fff; padding: 1rem 1.25rem; font-weight: 700; font-size: 1.05rem;
        }
        .ct-summary-body { padding: 1.25rem; }

        .ct-promo-group { display: flex; gap: 0.5rem; }
        .ct-promo-group input {
          border-radius: 10px; border: 1.5px solid #e2e7f0; font-size: 0.88rem;
        }
        .ct-promo-group input:focus { border-color: ${GREEN}; box-shadow: 0 0 0 3px rgba(52,161,41,0.12); outline: none; }
        .ct-promo-group button {
          border: 1.5px solid ${NAVY}; color: ${NAVY}; background: #fff; border-radius: 10px;
          font-weight: 700; font-size: 0.85rem; padding: 0 1rem; white-space: nowrap;
        }
        .ct-promo-group button:hover { background: ${NAVY}; color: #fff; }

        .ct-ship-progress {
          background: #eef1f6; border-radius: 999px; height: 6px; overflow: hidden; margin-top: 0.6rem;
        }
        .ct-ship-progress-bar { height: 100%; background: ${GREEN}; border-radius: 999px; transition: width .3s ease; }

        .ct-row { display: flex; justify-content: space-between; align-items: center; font-size: 0.9rem; margin-bottom: 0.65rem; }
        .ct-row .label { color: #6c7a90; }
        .ct-row .value { color: ${NAVY}; font-weight: 700; }
        .ct-divider { height: 1px; background: #eef1f6; margin: 1rem 0; }

        .ct-total-row { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 1.1rem; }
        .ct-total-row .label { color: ${NAVY}; font-weight: 800; font-size: 1.05rem; }
        .ct-total-row .value { color: ${GREEN}; font-weight: 800; font-size: 1.3rem; }

        .ct-checkout-btn {
          width: 100%; background: ${GREEN}; border: none; color: #fff; font-weight: 700;
          padding: 0.85rem; border-radius: 12px; font-size: 1rem;
          display: flex; align-items: center; justify-content: center; gap: 0.5rem;
          box-shadow: 0 6px 16px rgba(52,161,41,0.28);
        }
        .ct-checkout-btn:hover { background: #2c8c22; }

        .ct-save-btn {
          width: 100%; background: #fff; border: 1.5px solid #e2e7f0; color: ${NAVY}; font-weight: 700;
          padding: 0.7rem; border-radius: 12px; margin-top: 0.6rem; font-size: 0.9rem;
        }
        .ct-save-btn:hover { border-color: ${NAVY}; }

        /* ---------- Store group cards ---------- */
        .ct-store-card {
          background: #fff; border-radius: 16px; overflow: hidden;
          box-shadow: 0 3px 16px rgba(0,32,78,0.07);
          border: 1px solid #e8edf5;
        }
        .ct-store-head {
          background: #f8fafd; border-bottom: 1.5px solid #edf2f7;
          padding: 0.9rem 1.25rem;
          display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.5rem;
        }
        .ct-store-badge {
          background: ${NAVY}; color: #fff; font-size: 0.72rem; font-weight: 800;
          letter-spacing: 0.05em; padding: 0.28rem 0.6rem; border-radius: 6px;
          display: inline-flex; align-items: center; gap: 0.35rem;
        }
        .ct-store-title {
          font-weight: 800; color: ${NAVY}; font-size: 1.05rem;
        }
        .ct-store-dist {
          background: #eef7ee; color: ${GREEN}; font-size: 0.76rem; font-weight: 700;
          padding: 0.22rem 0.55rem; border-radius: 999px;
          display: inline-flex; align-items: center; gap: 0.25rem;
        }
        .ct-store-count {
          color: #6c7a90; font-size: 0.82rem; font-weight: 600;
        }
        .ct-store-subhead {
          padding: 0.4rem 1.25rem; background: #fff; border-bottom: 1px solid #f0f2f6;
          font-size: 0.8rem;
        }
        .ct-store-footer {
          background: #fafbfd; border-top: 1.5px solid #edf2f7;
          padding: 0.9rem 1.25rem;
        }
        .ct-store-footer-row {
          display: flex; justify-content: space-between; align-items: center;
          font-size: 0.86rem; color: #6c7a90; margin-bottom: 0.35rem;
        }
        .ct-store-footer-total {
          display: flex; justify-content: space-between; align-items: center;
          padding-top: 0.5rem; margin-top: 0.5rem; border-top: 1px dashed #e2e8f0;
          font-size: 0.92rem; font-weight: 700; color: ${NAVY};
        }
        .ct-store-footer-amount {
          color: ${GREEN}; font-weight: 800; font-size: 1.05rem;
        }

        .ct-payments-card {
          background: #fff; border-radius: 16px; box-shadow: 0 3px 16px rgba(0,32,78,0.07);
          padding: 1.1rem; text-align: center; margin-top: 1rem;
        }
        .ct-payments-card img { height: 26px; }

        /* Sticky summary column — only sticky on large screens where there's room */
        @media (min-width: 992px) {
          .ct-summary-col { position: sticky; top: 90px; align-self: flex-start; }
        }

        @media (max-width: 575.98px) {
          .ct-title { font-size: 1.4rem; }
          .ct-wrap { padding-top: 1.1rem; padding-bottom: 2rem; }
          .ct-item-row { padding: 0.9rem; gap: 0.7rem; flex-wrap: wrap; }
          .ct-item-img { width: 64px; height: 64px; }
          .ct-item-info { width: calc(100% - 64px - 0.7rem - 34px); }
          .ct-item-subtotal { width: 100%; text-align: right; order: 5; margin-top: 0.3rem; }
        }
      `}</style>

      <div className="container ct-wrap">
        {/* Page Header */}
        <div className="row mb-3">
          <div className="col-12">
            <h2 className="ct-title mb-2">Shopping Cart</h2>
            <nav aria-label="breadcrumb" className="ct-breadcrumb">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link to="/">Home</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  Cart
                </li>
              </ol>
            </nav>
          </div>
        </div>

        <div className="row g-4 align-items-start">
          {/* Cart Items */}
          <div className="col-lg-8">
            {isMultiStore && storeGroups.length > 1 ? (
              <>
                {/* Multi-store Notice Banner */}
                <div
                  className="p-3 mb-3 d-flex align-items-center justify-content-between gap-3 rounded-3"
                  style={{
                    backgroundColor: "#eef6ff",
                    border: "1.5px solid #bddbff",
                    color: NAVY,
                  }}
                >
                  <div className="d-flex align-items-center gap-2">
                    <div
                      className="d-flex align-items-center justify-content-center flex-shrink-0"
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: "50%",
                        backgroundColor: "#dbeafe",
                        color: NAVY,
                      }}
                    >
                      <FaStore size={18} />
                    </div>
                    <div>
                      <div className="fw-bold" style={{ fontSize: "0.95rem" }}>
                        Ordering from {storesCount || storeGroups.length} Stores
                      </div>
                      <div className="small text-muted" style={{ fontSize: "0.8rem" }}>
                        Items are grouped below by store with individual subtotals &amp; delivery charges.
                      </div>
                    </div>
                  </div>
                  <button className="ct-clear-btn flex-shrink-0" style={{ background: "#dc3545", color: "#fff" }} onClick={clearCart}>
                    <FaTrash size={11} /> Clear All
                  </button>
                </div>

                {/* Per-Store Group Cards */}
                {storeGroups.map((group, gIdx) => (
                  <div className="ct-store-card mb-4" key={group.vendor_id || gIdx}>
                    <div className="ct-store-head">
                      <div className="d-flex align-items-center gap-2 flex-wrap">
                        <span className="ct-store-badge">
                          <FaStore size={11} /> STORE {String.fromCharCode(65 + gIdx)}
                        </span>
                        <span className="ct-store-title">{group.store_name}</span>
                        {group.distance_text && (
                          <span className="ct-store-dist">
                            <FaMapMarkerAlt size={10} /> {group.distance_text}
                          </span>
                        )}
                      </div>
                      <span className="ct-store-count">
                        {group.items_count || group.items?.length || 0} {(group.items_count || group.items?.length) === 1 ? 'item' : 'items'}
                      </span>
                    </div>

                    {group.store_address && (
                      <div className="ct-store-subhead">
                        <FaMapMarkerAlt size={11} className="me-1 text-muted" />
                        <span className="text-muted">{group.store_address}</span>
                      </div>
                    )}

                    <div className="ct-store-items">
                      {(group.items || []).map((item) => (
                        <div className="ct-item-row" key={item.id}>
                          <div className="ct-item-img">
                            <img src={getImageUrl(item.image)} alt={item.name} />
                          </div>

                          <div className="ct-item-info">
                            <Link to={`/product/${item.id}`} className="ct-item-name">
                              {item.name}
                            </Link>
                            {item.category && (
                              <span className="ct-item-cat">{item.category}</span>
                            )}
                            <div className="ct-item-price mt-1">
                              {formatPrice(item.price)}
                            </div>
                          </div>

                          <div className="ct-qty">
                            <button
                              onClick={() =>
                                updateQuantity(item.id, Number(item.quantity) - 1)
                              }
                              disabled={item.quantity <= 1}
                              aria-label="Decrease quantity"
                            >
                              <FaMinus size={10} />
                            </button>
                            <span>{item.quantity}</span>
                            <button
                              onClick={() =>
                                updateQuantity(item.id, Number(item.quantity) + 1)
                              }
                              aria-label="Increase quantity"
                            >
                              <FaPlus size={10} />
                            </button>
                          </div>

                          <div className="ct-item-subtotal">
                            {formatPrice(item.price * item.quantity)}
                          </div>

                          <button
                            className="ct-remove-btn"
                            onClick={() => removeFromCart(item.id)}
                            aria-label="Remove item"
                          >
                            <FaTrash size={13} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="ct-store-footer">
                      <div className="ct-store-footer-row">
                        <span>Items Subtotal:</span>
                        <strong>{formatPrice(group.subtotal)}</strong>
                      </div>
                      <div className="ct-store-footer-row">
                        <span>Delivery Fee:</span>
                        <span>{formatPrice(group.delivery_charge)}</span>
                      </div>
                      <div className="ct-store-footer-total">
                        <span>{group.store_name} Subtotal:</span>
                        <span className="ct-store-footer-amount">
                          {formatPrice(group.store_total || (Number(group.subtotal) + Number(group.delivery_charge)))}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              /* Single Store Clean View */
              <div className="ct-items-card mb-3">
                <div className="ct-items-head">
                  <h5>
                    Cart Items ({cartItems.length})
                    {storeGroups[0]?.store_name && (
                      <span style={{ fontSize: "0.85rem", fontWeight: 500, opacity: 0.9, marginLeft: 8 }}>
                        • {storeGroups[0].store_name}
                      </span>
                    )}
                  </h5>
                  <button className="ct-clear-btn" onClick={clearCart}>
                    <FaTrash size={11} /> Clear Cart
                  </button>
                </div>

                <div>
                  {cartItems.map((item) => (
                    <div className="ct-item-row" key={item.id}>
                      <div className="ct-item-img">
                        <img src={getImageUrl(item.image)} alt={item.name} />
                      </div>

                      <div className="ct-item-info">
                        <Link to={`/product/${item.id}`} className="ct-item-name">
                          {item.name}
                        </Link>
                        {item.category && (
                          <span className="ct-item-cat">{item.category}</span>
                        )}
                        <div className="ct-item-price mt-1">
                          {formatPrice(item.price)}
                        </div>
                      </div>

                      <div className="ct-qty">
                        <button
                          onClick={() =>
                            updateQuantity(item.id, Number(item.quantity) - 1)
                          }
                          disabled={item.quantity <= 1}
                          aria-label="Decrease quantity"
                        >
                          <FaMinus size={10} />
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          onClick={() =>
                            updateQuantity(item.id, Number(item.quantity) + 1)
                          }
                          aria-label="Increase quantity"
                        >
                          <FaPlus size={10} />
                        </button>
                      </div>

                      <div className="ct-item-subtotal">
                        {formatPrice(item.price * item.quantity)}
                      </div>

                      <button
                        className="ct-remove-btn"
                        onClick={() => removeFromCart(item.id)}
                        aria-label="Remove item"
                      >
                        <FaTrash size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Link to="/products" className="ct-continue">
              <FaArrowLeft size={13} /> Continue Shopping
            </Link>
          </div>

          {/* Order Summary */}
          <div className="col-lg-4 ct-summary-col">
            <div className="ct-summary-card">
              <div className="ct-summary-head">Order Summary</div>

              <div className="ct-summary-body">
                <label
                  className="fw-bold mb-2 d-block"
                  style={{ color: NAVY, fontSize: "0.85rem" }}
                >
                  Promo Code
                </label>
                <div className="ct-promo-group mb-3">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter code"
                  />
                  <button>Apply</button>
                </div>

                <div className="ct-divider" />

                <div className="ct-row">
                  <span className="label">Items Subtotal</span>
                  <span className="value">{formatPrice(cartTotal)}</span>
                </div>

                {isMultiStore && storeGroups.length > 1 ? (
                  <>
                    <div className="ct-row">
                      <span className="label">Delivery ({storesCount || storeGroups.length} stores)</span>
                      <span className="value">
                        {distanceLoading ? (
                          <span className="text-muted small">Calculating...</span>
                        ) : (
                          formatPrice(shippingCost)
                        )}
                      </span>
                    </div>

                    <div className="p-2 mb-2 rounded" style={{ background: "#f8fafd", border: "1px solid #edf2f7", fontSize: "0.78rem" }}>
                      {storeGroups.map((g, idx) => (
                        <div key={g.vendor_id || idx} className="d-flex justify-content-between text-muted py-1">
                          <span className="text-truncate me-2" style={{ maxWidth: "160px" }}>
                            • {g.store_name}
                          </span>
                          <span>{formatPrice(g.delivery_charge)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="ct-row">
                    <span className="label">Shipping</span>
                    <span className="value">
                      {distanceLoading ? (
                        <span className="text-muted small">Calculating...</span>
                      ) : (
                        formatPrice(shippingCost)
                      )}
                    </span>
                  </div>
                )}

                {isAuthenticated && selectedAddress && (
                  <div className="small text-muted mb-2" style={{ fontSize: "0.75rem", marginTop: "-4px" }}>
                    Calculated for pincode: <strong>{selectedAddress.pincode}</strong>
                  </div>
                )}
                {!isAuthenticated && (
                  <div className="small text-muted mb-2" style={{ fontSize: "0.75rem", marginTop: "-4px" }}>
                    Estimated charge (log in to calculate exactly)
                  </div>
                )}

                <div className="ct-divider" />

                <div className="ct-total-row">
                  <span className="label">Grand Total</span>
                  <span className="value">{formatPrice(finalTotal)}</span>
                </div>

                <button className="ct-checkout-btn" onClick={handleCheckout}>
                  Proceed to Checkout <FaArrowRight size={13} />
                </button>
                <button className="ct-save-btn">Save for Later</button>

                <div className="ct-secure-note">
                  <FaLock size={10} /> Secure checkout
                </div>
              </div>
            </div>

            <div className="ct-payments-card">
              <p className="text-muted small mb-2">We Accept</p>
              <div className="d-flex justify-content-center gap-2 flex-wrap">
                <img
                  src="https://img.icons8.com/color/48/visa.png"
                  alt="Visa"
                />
                <img
                  src="https://img.icons8.com/color/48/mastercard.png"
                  alt="Mastercard"
                />
                <img
                  src="https://img.icons8.com/color/48/paypal.png"
                  alt="PayPal"
                />
                <img
                  src="https://img.icons8.com/color/48/amex.png"
                  alt="Amex"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
