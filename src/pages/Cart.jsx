import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaTrash,
  FaMinus,
  FaPlus,
  FaShoppingCart,
  FaArrowLeft,
  FaArrowRight,
  FaLock,
} from "react-icons/fa";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { formatPrice, getImageUrl } from "../utils/helpers";

const NAVY = "#00204E";
const GREEN = "#34A129";
const FREE_SHIPPING_THRESHOLD = 50;

const Cart = () => {
  const { cartItems, cartTotal, removeFromCart, updateQuantity, clearCart } =
    useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleCheckout = () => {
    if (isAuthenticated) {
      navigate("/checkout");
    } else {
      navigate("/login?redirect=/checkout");
    }
  };

  const shippingCost = cartTotal > FREE_SHIPPING_THRESHOLD ? 0 : 5.99;
  const tax = cartTotal * 0.08; // 8% tax
  const finalTotal = cartTotal + shippingCost + tax;
  const shippingProgress = Math.min(
    100,
    (cartTotal / FREE_SHIPPING_THRESHOLD) * 100,
  );

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

        .ct-secure-note {
          display: flex; align-items: center; justify-content: center; gap: 0.4rem;
          color: #98a2b8; font-size: 0.76rem; margin-top: 0.8rem;
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
            <div className="ct-items-card mb-3">
              <div className="ct-items-head">
                <h5>Cart Items ({cartItems.length})</h5>
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
                  <span className="label">Subtotal</span>
                  <span className="value">{formatPrice(cartTotal)}</span>
                </div>
                <div className="ct-row">
                  <span className="label">Shipping</span>
                  <span className="value">
                    {shippingCost === 0 ? (
                      <span style={{ color: GREEN }}>FREE</span>
                    ) : (
                      formatPrice(shippingCost)
                    )}
                  </span>
                </div>
                <div className="ct-row">
                  <span className="label">Tax (8%)</span>
                  <span className="value">{formatPrice(tax)}</span>
                </div>

                {shippingCost > 0 && (
                  <div className="mb-2">
                    <div className="ct-ship-progress">
                      <div
                        className="ct-ship-progress-bar"
                        style={{ width: `${shippingProgress}%` }}
                      />
                    </div>
                    <div className="small mt-2" style={{ color: "#6c7a90" }}>
                      Add{" "}
                      <strong style={{ color: GREEN }}>
                        {formatPrice(FREE_SHIPPING_THRESHOLD - cartTotal)}
                      </strong>{" "}
                      more for FREE shipping
                    </div>
                  </div>
                )}

                <div className="ct-divider" />

                <div className="ct-total-row">
                  <span className="label">Total</span>
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
