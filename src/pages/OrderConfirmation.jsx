import React, { useEffect, useState, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaCheckCircle,
  FaTruck,
  FaBox,
  FaEnvelope,
  FaHome,
  FaShoppingBag,
  FaPrint,
  FaRegCopy,
  FaCheck,
} from "react-icons/fa";
import { formatPrice, formatDate, getImageUrl } from "../utils/helpers";
import { useOrder } from "../context/OrderContext";
import { useProducts } from "../context/ProductContext";
import "../styles/OrderConfirmation.css";

const STATUS_STEPS = [
  { key: "placed", label: "Order Placed", icon: FaCheckCircle },
  { key: "processing", label: "Processing", icon: FaBox },
  { key: "shipped", label: "Shipped", icon: FaTruck },
  { key: "delivered", label: "Delivered", icon: FaHome },
];

const OrderConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { fetchOrderDetails } = useOrder();
  const { products } = useProducts();

  const [orderData, setOrderData] = useState(location.state?.order || null);
  const [apiLoading, setApiLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadOrderDetails = useCallback(
    async (orderId) => {
      setApiLoading(true);
      try {
        const result = await fetchOrderDetails(orderId);
        if (result && result.success) {
          setOrderData(result.data);
        } else {
          console.error("Failed to load order details:", result?.error);
        }
      } catch (err) {
        console.error("Error loading order details:", err);
      } finally {
        setApiLoading(false);
      }
    },
    [fetchOrderDetails],
  );

  useEffect(() => {
    if (!orderData) {
      // Check session storage to survive page refreshes
      const savedOrderId = sessionStorage.getItem("last_order_id");
      if (savedOrderId) {
        loadOrderDetails(savedOrderId);
      } else {
        navigate("/");
      }
    } else {
      const orderId = orderData.order_id || orderData.id;
      if (orderId) {
        sessionStorage.setItem("last_order_id", orderId);
      }
      // Fetch complete details if it's a summary order (missing items list or address)
      if (
        !orderData.delivery_address ||
        !orderData.items ||
        orderData.items.length === 0 ||
        orderData.subtotal === undefined
      ) {
        loadOrderDetails(orderId);
      }
    }
    window.scrollTo(0, 0);
  }, [orderData, navigate, loadOrderDetails]);

  const isFullOrder =
    orderData &&
    orderData.items &&
    orderData.items.length > 0 &&
    orderData.delivery_address;

  if (apiLoading && !isFullOrder) {
    return (
      <div
        className="d-flex justify-content-center align-items-center flex-column"
        style={{ minHeight: "60vh" }}
      >
        <div
          className="spinner-border text-brand-green mb-3"
          role="status"
          style={{ width: "3rem", height: "3rem" }}
        >
          <span className="visually-hidden">Loading order details...</span>
        </div>
        <p className="text-muted">Loading order details...</p>
      </div>
    );
  }

  if (!orderData) return null;

  // Normalize order data to support both camelCase (mock state) and snake_case (backend API response)
  const order = {
    ...orderData,
    id: orderData.order_number || orderData.id || orderData.order_id,
    createdAt: orderData.created_at || orderData.createdAt,
    status: orderData.status,
    shipping:
      orderData.shipping ||
      (orderData.delivery_address
        ? {
            fullName: orderData.delivery_address.full_name,
            addressLine1: orderData.delivery_address.address_line1,
            addressLine2: orderData.delivery_address.address_line2,
            city: orderData.delivery_address.city,
            state: orderData.delivery_address.state,
            zipCode: orderData.delivery_address.pincode,
            country: orderData.delivery_address.country,
            phone: orderData.delivery_address.mobile,
            email: orderData.delivery_address.email || orderData.email || "",
          }
        : null),
    payment: orderData.payment || {
      last4: orderData.payment_method === "cod" ? "COD" : "Online",
    },
    delivery:
      orderData.delivery ||
      (orderData.delivery_charge > 0 ? "standard" : "free"),
    pricing: orderData.pricing || {
      subtotal: orderData.subtotal,
      shipping: orderData.delivery_charge,
      tax: orderData.gst_amount,
      total: orderData.total_amount,
    },
    items:
      orderData.items?.map((item) => {
        const productMatch = products?.find(
          (p) => String(p.id) === String(item.product_id),
        );
        const rawImagePath =
          item.image ||
          item.product_image ||
          productMatch?.image ||
          productMatch?.image_url;
        return {
          ...item,
          name: item.name || item.product_name,
          image: getImageUrl(rawImagePath),
          price: item.price,
          quantity: item.quantity,
          category: item.category || productMatch?.category_name || "",
        };
      }) || [],
  };

  // Only the first step ("Order Placed") is complete for a freshly placed order.
  // Swap this for real status-driven logic once the backend exposes a status timeline.
  const activeStepIndex = 0;

  const handleCopyOrderId = async () => {
    try {
      await navigator.clipboard.writeText(String(order.id));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (err) {
      console.error("Could not copy order id:", err);
    }
  };

  return (
    <div className="order-confirmation-page py-4 py-md-5">
      <div className="container oc-container">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            {/* Success Header Card */}
            <div className="oc-card mb-4 fade-in">
              <div className="oc-hero">
                <div className="oc-check-badge">
                  <FaCheckCircle size={40} className="text-white" />
                </div>

                <h1>Order Confirmed!</h1>
                <p className="oc-subtitle">
                  Thank you for your purchase. Your order has been received.
                </p>

                <div className="oc-order-chip">
                  <span className="oc-order-id">Order #{order.id}</span>
                  <button
                    type="button"
                    className="oc-copy-btn"
                    onClick={handleCopyOrderId}
                    aria-label="Copy order number"
                    title="Copy order number"
                  >
                    {copied ? <FaCheck size={13} /> : <FaRegCopy size={13} />}
                  </button>
                </div>

                {order.shipping?.email && (
                  <div className="oc-email-banner">
                    <FaEnvelope />
                    <span>
                      A confirmation email has been sent to{" "}
                      <strong>{order.shipping.email}</strong>
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Order Status Timeline */}
            <div className="oc-card mb-4">
              <div className="oc-card-header oc-card-header--blue">
                Order Status
              </div>
              <div className="oc-timeline">
                <div className="oc-timeline-track">
                  {STATUS_STEPS.map((step, index) => {
                    const Icon = step.icon;
                    const isDone = index <= activeStepIndex;
                    return (
                      <div
                        key={step.key}
                        className={`oc-timeline-step${isDone ? " is-done" : ""}`}
                      >
                        <span className="oc-timeline-line" />
                        <span className="oc-timeline-dot">
                          <Icon size={16} />
                        </span>
                        <span className="oc-timeline-label">{step.label}</span>
                        <span className="oc-timeline-sub">
                          {index === activeStepIndex
                            ? formatDate(order.createdAt)
                            : isDone
                              ? ""
                              : "Pending"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Order Details */}
            <div className="oc-card mb-4">
              <div className="oc-card-header oc-card-header--plain">
                Order Details
              </div>
              <div className="oc-details-grid">
                {/* Shipping Info */}
                <div className="oc-detail-block">
                  <h6>Shipping Address</h6>
                  <div className="oc-detail-box">
                    <p className="oc-name mb-1">{order.shipping?.fullName}</p>
                    <p className="mb-1">{order.shipping?.addressLine1}</p>
                    {order.shipping?.addressLine2 && (
                      <p className="mb-1">{order.shipping.addressLine2}</p>
                    )}
                    <p className="mb-1">
                      {order.shipping?.city}, {order.shipping?.state}{" "}
                      {order.shipping?.zipCode}
                    </p>
                    <p className="mb-1">{order.shipping?.country}</p>
                    <p className="mb-0 text-muted">
                      📞 {order.shipping?.phone}
                    </p>
                  </div>
                </div>

                {/* Payment & Delivery Info */}
                <div className="oc-detail-block">
                  <h6>Payment &amp; Delivery</h6>
                  <div className="oc-detail-box">
                    <div className="oc-detail-row">
                      <span className="oc-label">Payment</span>
                      <span className="oc-value">
                        {orderData.payment_method === "cod" ||
                        order.payment?.last4 === "COD"
                          ? "Cash on Delivery"
                          : `Card ••${order.payment?.last4 || "xxxx"}`}
                      </span>
                    </div>
                    <div className="oc-detail-row">
                      <span className="oc-label">Delivery</span>
                      <span className="oc-value">
                        {order.delivery === "standard"
                          ? "Standard (5-7 days)"
                          : order.delivery === "express"
                            ? "Express (2-3 days)"
                            : "Next Day"}
                      </span>
                    </div>
                    <div className="oc-detail-row">
                      <span className="oc-label">Status</span>
                      <span className="oc-value">
                        <span className="oc-status-pill">{order.status}</span>
                      </span>
                    </div>
                    <div className="oc-detail-row">
                      <span className="oc-label">Date</span>
                      <span className="oc-value">
                        {formatDate(order.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="oc-card mb-4">
              <div className="oc-card-header oc-card-header--plain">
                Items Ordered ({order.items?.length})
              </div>

              {/* Desktop / tablet table */}
              <div className="oc-items-table-wrap">
                <table className="oc-items-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th className="text-center">Qty</th>
                      <th className="text-end">Price</th>
                      <th className="text-end">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items?.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <div className="d-flex align-items-center">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="oc-item-thumb me-3"
                            />
                            <div>
                              <p className="oc-item-name mb-0">{item.name}</p>
                              <small className="oc-item-cat">
                                {item.category}
                              </small>
                            </div>
                          </div>
                        </td>
                        <td className="text-center">{item.quantity}</td>
                        <td className="text-end">{formatPrice(item.price)}</td>
                        <td
                          className="text-end fw-bold"
                          style={{ color: "var(--oc-green-dark)" }}
                        >
                          {formatPrice(item.price * item.quantity)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile stacked cards */}
              <div className="oc-items-cards">
                {order.items?.map((item) => (
                  <div className="oc-item-card" key={item.id}>
                    <img
                      src={item.image}
                      alt={item.name}
                      className="oc-item-thumb"
                    />
                    <div className="oc-item-card-meta">
                      <p className="oc-item-name mb-0">{item.name}</p>
                      <small className="oc-item-cat">{item.category}</small>
                      <div className="oc-item-card-footer">
                        <span className="oc-qty">
                          {formatPrice(item.price)} &times; {item.quantity}
                        </span>
                        <span className="oc-line-total">
                          {formatPrice(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Summary */}
              <div className="oc-summary">
                <div className="oc-summary-inner">
                  <div className="oc-summary-row">
                    <span className="oc-label">Subtotal</span>
                    <span>{formatPrice(order.pricing?.subtotal)}</span>
                  </div>
                  <div className="oc-summary-row">
                    <span className="oc-label">Shipping</span>
                    <span>
                      {order.pricing?.shipping === 0 ? (
                        <span style={{ color: "var(--oc-green)" }}>FREE</span>
                      ) : (
                        formatPrice(order.pricing?.shipping)
                      )}
                    </span>
                  </div>
                  <div className="oc-summary-row">
                    <span className="oc-label">Tax</span>
                    <span>{formatPrice(order.pricing?.tax)}</span>
                  </div>
                  <div className="oc-summary-total">
                    <span className="oc-total-label">Total</span>
                    <span className="oc-total-value">
                      {formatPrice(order.pricing?.total)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="oc-actions">
              <button
                type="button"
                className="oc-btn oc-btn--ghost"
                onClick={() => window.print()}
              >
                <FaPrint /> Print Receipt
              </button>

              <Link to="/profile?tab=orders" className="oc-btn oc-btn--outline">
                <FaShoppingBag /> Track Order
              </Link>

              <Link to="/" className="oc-btn oc-btn--solid">
                <FaHome /> Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
