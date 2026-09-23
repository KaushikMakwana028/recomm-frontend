import React, { useEffect, useState, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FaCheckCircle,
  FaTruck,
  FaBox,
  FaEnvelope,
  FaHome,
  FaShoppingBag,
  FaRegCopy,
  FaCheck,
  FaFilePdf,
  FaDownload,
  FaLock,
  FaBolt,
  FaInfoCircle,
  FaHeadset,
} from "react-icons/fa";
import { formatPrice, formatDate, getImageUrl, formatStatus } from "../utils/helpers";
import { useOrder } from "../context/OrderContext";
import { useProducts } from "../context/ProductContext";
import OrderService from "../services/orderService";
import OrderSupportModal from "../components/OrderSupportModal";
import "../styles/OrderConfirmation.css";

const STATUS_STEPS = [
  { key: "pending", label: "Order Placed", icon: FaCheckCircle },
  { key: "confirmed", label: "Confirmed", icon: FaCheck },
  { key: "packed", label: "Packed", icon: FaBox },
  { key: "out_for_delivery", label: "Out for Delivery", icon: FaTruck },
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
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [supportRequests, setSupportRequests] = useState([]);
  const [loadingSupport, setLoadingSupport] = useState(false);

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

  const targetOrderId = orderData?.order_id || orderData?.id || orderData?.rawOrderId;

  const loadSupportRequests = useCallback(async () => {
    if (!targetOrderId) return;
    try {
      setLoadingSupport(true);
      const res = await OrderService.getOrderSupportRequests(targetOrderId);
      if (res && res.success && res.data?.requests) {
        setSupportRequests(res.data.requests);
      }
    } catch (e) {
      console.error("Failed to load support requests:", e);
    } finally {
      setLoadingSupport(false);
    }
  }, [targetOrderId]);

  useEffect(() => {
    loadSupportRequests();
  }, [loadSupportRequests]);

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
    rawOrderId: orderData.order_id || orderData.id,
    createdAt: orderData.created_at || orderData.createdAt,
    status: orderData.status,
    deliveryType: orderData.delivery_type || (orderData.delivery === "urgent" ? "urgent" : "normal"),
    deliveryOption: orderData.delivery_option,
    distance: orderData.distance,
    chosenTimeOption: orderData.chosen_time_option || orderData.chosenTimeOption,
    estimatedWindowFormatted: orderData.estimated_window_formatted || orderData.estimatedWindowFormatted,
    estimatedWindowStart: orderData.estimated_window_start || orderData.estimatedWindowStart,
    estimatedWindowEnd: orderData.estimated_window_end || orderData.estimatedWindowEnd,
    customDeliveryTime: orderData.custom_delivery_time || orderData.customDeliveryTime,
    paymentStatus: orderData.payment_status,
    invoiceUrl: orderData.invoice_url,
    canDownloadInvoice: orderData.can_download_invoice,
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
      orderData.delivery_type === "urgent"
        ? "urgent"
        : orderData.delivery_type === "normal"
          ? "normal"
          : orderData.delivery ||
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
          store_name: item.store_name || item.vendor_name || "",
          vendor_id: item.vendor_id || productMatch?.vendor_id || "",
        };
      }) || [],
  };

  // Determine delivery and invoice logic
  const isUrgent =
    order.deliveryType === "urgent" ||
    orderData.delivery_type === "urgent" ||
    order.delivery === "urgent";

  const isDelivered =
    String(order.status || orderData.status || "").toLowerCase().trim() === "delivered";

  const urgentCharge = isUrgent ? 50 : 0;
  const rawDeliveryCharge =
    parseFloat(order.pricing?.shipping ?? orderData.delivery_charge ?? 0) || 0;
  const baseDeliveryCharge =
    isUrgent && rawDeliveryCharge >= 50
      ? rawDeliveryCharge - 50
      : rawDeliveryCharge;

  const invoiceViewUrl =
    order.invoiceUrl ||
    OrderService.getInvoiceUrl(order.rawOrderId || order.id);

  const invoiceDownloadUrl = OrderService.getInvoiceDownloadUrl(
    order.rawOrderId || order.id,
    order.invoiceUrl,
  );

  const handlePrintBill = () => {
    if (!isDelivered) return;
    if (invoiceViewUrl) {
      window.open(invoiceViewUrl, "_blank");
    } else {
      window.print();
    }
  };

  // Calculate active step index based on backend order status
  const getActiveStepIndex = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
      case "new":
        return 0;
      case "confirmed":
      case "accepted":
        return 1;
      case "packed":
      case "processing":
        return 2;
      case "out_for_delivery":
      case "shipped":
        return 3;
      case "delivered":
        return 4;
      case "cancelled":
      default:
        return -1;
    }
  };

  const activeStepIndex = getActiveStepIndex(order.status);

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

                <div className="oc-order-chip d-flex align-items-center justify-content-center gap-2 flex-wrap">
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
                  <button
                    type="button"
                    onClick={() => setSupportModalOpen(true)}
                    className="btn btn-sm text-white d-inline-flex align-items-center gap-1.5 ms-2 px-2.5 py-1"
                    style={{
                      background: "linear-gradient(135deg, #16a34a, #15803d)",
                      borderRadius: "999px",
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      border: "none",
                      boxShadow: "0 2px 6px rgba(22, 163, 74, 0.3)",
                      cursor: "pointer",
                    }}
                    title="Report issue with this order"
                  >
                    <FaHeadset size={12} />
                    <span>Need Help?</span>
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
                          {index === 0
                            ? formatDate(order.createdAt)
                            : index === activeStepIndex
                              ? formatDate(orderData.updated_at || order.createdAt)
                              : isDone
                                ? "Completed"
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
                      <span className="oc-value d-flex align-items-center justify-content-end gap-2 flex-wrap">
                        <span>
                          {orderData.payment_method === "cod" ||
                          order.payment?.last4 === "COD"
                            ? "Cash on Delivery"
                            : `Card ••${order.payment?.last4 || "xxxx"}`}
                        </span>
                        {order.paymentStatus && (
                          <span
                            className={`oc-pay-status-pill oc-pay-status-pill--${String(order.paymentStatus).toLowerCase()}`}
                          >
                            {String(order.paymentStatus).toUpperCase()}
                          </span>
                        )}
                      </span>
                    </div>

                    {(order.chosenTimeOption || orderData.chosen_time_option) && (
                      <div className="oc-detail-row">
                        <span className="oc-label">Time Slot</span>
                        <span
                          className="oc-value text-capitalize fw-bold"
                          style={{ color: "#00204E" }}
                        >
                          {(order.chosenTimeOption || orderData.chosen_time_option) === "immediately" ? "⚡ Immediately" : (order.chosenTimeOption || orderData.chosen_time_option)}
                        </span>
                      </div>
                    )}

                    {order.distance ? (
                      <div className="oc-detail-row">
                        <span className="oc-label">Distance</span>
                        <span className="oc-value">
                          {order.distance} KM
                        </span>
                      </div>
                    ) : null}

                    {(order.estimatedWindowFormatted ||
                      orderData.estimated_window_formatted ||
                      order.estimatedWindowStart ||
                      orderData.estimated_window_start) && (
                      <div className="oc-detail-row">
                        <span className="oc-label">Estimated Delivery</span>
                        <span
                          className="oc-value fw-semibold"
                          style={{ color: "#34A129" }}
                        >
                          🕒{" "}
                          {order.estimatedWindowFormatted ||
                            orderData.estimated_window_formatted ||
                            `${order.estimatedWindowStart || orderData.estimated_window_start} – ${order.estimatedWindowEnd || orderData.estimated_window_end}`}
                        </span>
                      </div>
                    )}

                    <div className="oc-detail-row">
                      <span className="oc-label">Status</span>
                      <span className="oc-value">
                        <span
                          className={`oc-status-pill oc-status-pill--${String(order.status || "").toLowerCase().replace(/\s+/g, "_")}`}
                        >
                          {formatStatus(order.status)}
                        </span>
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
                              {item.store_name && (
                                <div className="mt-1">
                                  <Link
                                    to={item.vendor_id ? `/store/${item.vendor_id}` : "#"}
                                    className="badge px-2 py-0.5 rounded-pill text-decoration-none"
                                    style={{
                                      backgroundColor: "#f1f5f9",
                                      color: "#00204E",
                                      border: "1px solid #cbd5e1",
                                      fontSize: "0.74rem",
                                      fontWeight: 600,
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "4px",
                                    }}
                                    title={`Sold by ${item.store_name} - Click to visit store`}
                                  >
                                    🏪 {item.store_name}
                                  </Link>
                                </div>
                              )}
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
                      {item.store_name && (
                        <div className="my-1">
                          <Link
                            to={item.vendor_id ? `/store/${item.vendor_id}` : "#"}
                            className="badge px-2 py-0.5 rounded-pill text-decoration-none"
                            style={{
                              backgroundColor: "#f1f5f9",
                              color: "#00204E",
                              border: "1px solid #cbd5e1",
                              fontSize: "0.72rem",
                              fontWeight: 600,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                            }}
                            title={`Sold by ${item.store_name} - Click to visit store`}
                          >
                            🏪 {item.store_name}
                          </Link>
                        </div>
                      )}
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
                    <span className="oc-label">
                      Shipping {order.distance ? `(${order.distance} KM)` : ""}
                    </span>
                    <span>
                      {baseDeliveryCharge === 0 ? (
                        <span style={{ color: "var(--oc-green)" }}>FREE</span>
                      ) : (
                        formatPrice(baseDeliveryCharge)
                      )}
                    </span>
                  </div>
                  {isUrgent && (
                    <div className="oc-summary-row oc-urgent-surcharge-row">
                      <span className="oc-label text-danger fw-semibold">
                        <FaBolt size={11} className="me-1" /> Urgent Delivery Surcharge
                      </span>
                      <span className="text-danger fw-bold">
                        +{formatPrice(urgentCharge)}
                      </span>
                    </div>
                  )}
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

            {/* Support & Issue Resolution Section */}
            <div className="oc-card mb-4">
              <div className="oc-card-header d-flex align-items-center justify-content-between flex-wrap gap-2">
                <div className="d-flex align-items-center gap-2">
                  <FaHeadset className="text-success" />
                  <span className="fw-bold">Customer Support &amp; Issue Resolution</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSupportModalOpen(true)}
                  className="btn btn-sm btn-success text-white fw-bold d-inline-flex align-items-center gap-1.5 px-3 py-1"
                  style={{
                    backgroundColor: "#16a34a",
                    borderColor: "#16a34a",
                    borderRadius: "8px",
                    fontSize: "0.8rem",
                  }}
                >
                  <FaHeadset size={12} />
                  <span>Report an Issue</span>
                </button>
              </div>
              <div className="p-3 p-md-4">
                {loadingSupport ? (
                  <div className="text-center py-3 text-muted">
                    <div className="spinner-border spinner-border-sm me-2" role="status" />
                    Checking support requests...
                  </div>
                ) : supportRequests.length > 0 ? (
                  <div className="d-flex flex-column gap-3">
                    {supportRequests.map((req) => (
                      <div
                        key={req.id}
                        className="p-3 rounded-3 border"
                        style={{ backgroundColor: "#f8fafc", borderColor: "#e2e8f0" }}
                      >
                        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
                          <div className="d-flex align-items-center gap-2 flex-wrap">
                            <span className="fw-bold text-dark font-monospace" style={{ fontSize: "0.92rem" }}>
                              #{req.ticket_number}
                            </span>
                            <span
                              className="badge"
                              style={{
                                backgroundColor: "#e0f2fe",
                                color: "#0369a1",
                                border: "1px solid #bae6fd",
                                fontSize: "0.75rem",
                              }}
                            >
                              {req.category}
                            </span>
                          </div>
                          <div>
                            {req.status === "Open" && (
                              <span
                                className="badge fw-bold"
                                style={{
                                  backgroundColor: "#fef3c7",
                                  color: "#92400e",
                                  border: "1px solid #fde68a",
                                }}
                              >
                                Open
                              </span>
                            )}
                            {req.status === "In Progress" && (
                              <span
                                className="badge fw-bold"
                                style={{
                                  backgroundColor: "#e0e7ff",
                                  color: "#3730a3",
                                  border: "1px solid #c7d2fe",
                                }}
                              >
                                In Progress
                              </span>
                            )}
                            {req.status === "Resolved" && (
                              <span
                                className="badge fw-bold"
                                style={{
                                  backgroundColor: "#dcfce7",
                                  color: "#166534",
                                  border: "1px solid #bbf7d0",
                                }}
                              >
                                Resolved
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="mb-2 text-secondary" style={{ fontSize: "0.88rem", whiteSpace: "pre-wrap" }}>
                          {req.description}
                        </p>

                        {/* Good message reflecting status */}
                        {req.status === "Resolved" && (
                          <div
                            className="p-2.5 px-3 rounded-2 mb-2 d-flex align-items-center gap-2"
                            style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534", fontSize: "0.83rem" }}
                          >
                            <span>🎉 <strong>Issue Resolved:</strong> Thank you so much for your patience and cooperation while our team resolved your concern. We truly appreciate you!</span>
                          </div>
                        )}
                        {req.status === "In Progress" && (
                          <div
                            className="p-2.5 px-3 rounded-2 mb-2 d-flex align-items-center gap-2"
                            style={{ backgroundColor: "#eff6ff", border: "1px solid #bfdbfe", color: "#1e40af", fontSize: "0.83rem" }}
                          >
                            <span>⏳ <strong>In Progress:</strong> Our support team is actively working on resolving your request. Thank you so much for your patience!</span>
                          </div>
                        )}
                        {req.status === "Open" && (
                          <div
                            className="p-2.5 px-3 rounded-2 mb-2 d-flex align-items-center gap-2"
                            style={{ backgroundColor: "#fffbeb", border: "1px solid #fde68a", color: "#92400e", fontSize: "0.83rem" }}
                          >
                            <span>📨 <strong>Request Received:</strong> Our team is reviewing your order details. Thank you for your patience — we will update you shortly!</span>
                          </div>
                        )}

                        {req.admin_response && (
                          <div
                            className="mt-2 p-3 rounded-2"
                            style={{ backgroundColor: "#ecfdf5", borderLeft: "4px solid #10b981" }}
                          >
                            <div className="fw-bold text-success mb-1" style={{ fontSize: "0.82rem" }}>
                              Support Team Response:
                            </div>
                            <div className="text-dark" style={{ fontSize: "0.86rem" }}>
                              {req.admin_response}
                            </div>
                          </div>
                        )}

                        <div className="text-muted text-end mt-2" style={{ fontSize: "0.75rem" }}>
                          Submitted: {new Date(req.created_at).toLocaleString()}
                          {req.resolved_at && ` • Resolved: ${new Date(req.resolved_at).toLocaleString()}`}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-3 text-muted" style={{ fontSize: "0.88rem" }}>
                    <p className="mb-1">No support requests reported for this order.</p>
                    <p className="mb-0 text-secondary small">
                      Need help with payment, missing items, damaged delivery, or anything else? Click <strong>"Report an Issue"</strong> above.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="oc-actions-wrapper">
              <div className="oc-actions">
                <div className="oc-bill-btn-group">
                  <button
                    type="button"
                    className={`oc-btn oc-btn--bill ${isDelivered ? "oc-btn--bill-active" : "oc-btn--bill-disabled"}`}
                    onClick={handlePrintBill}
                    disabled={!isDelivered}
                    aria-disabled={!isDelivered}
                    title={
                      isDelivered
                        ? "View and Print Official PDF Bill"
                        : "Bill will be available once product is delivered"
                    }
                  >
                    {isDelivered ? (
                      <FaFilePdf size={15} className="oc-bill-icon" />
                    ) : (
                      <FaLock size={13} className="oc-bill-icon oc-lock-icon" />
                    )}
                    <span>Print Bill</span>
                  </button>

                  {isDelivered && (
                    <a
                      href={invoiceDownloadUrl}
                      download={`Invoice_${order.id}.pdf`}
                      className="oc-bill-download-btn"
                      title="Download PDF Invoice directly"
                    >
                      <FaDownload size={11} /> PDF
                    </a>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setSupportModalOpen(true)}
                  className="oc-btn oc-btn--outline"
                  title="Need Help with this order?"
                >
                  <FaHeadset /> Need Help?
                </button>

                <Link to="/profile?tab=orders" className="oc-btn oc-btn--outline">
                  <FaShoppingBag /> Track Order
                </Link>

                <Link to="/" className="oc-btn oc-btn--solid">
                  <FaHome /> Back to Home
                </Link>
              </div>

              {!isDelivered ? (
                <div className="oc-bill-status-alert">
                  <FaInfoCircle className="oc-bill-status-icon" />
                  <span>
                    Official Bill (PDF) will be enabled for download &amp; printing once this order is <strong>Delivered</strong>.
                  </span>
                </div>
              ) : (
                <div className="oc-bill-status-alert oc-bill-status-alert--ready">
                  <FaCheckCircle className="text-success me-2" />
                  <span>
                    Your tax invoice &amp; bill is ready! Click <strong>Print Bill</strong> to view/print or <strong>PDF</strong> to download.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Order Support Modal */}
      <OrderSupportModal
        order={order}
        isOpen={supportModalOpen}
        onClose={() => setSupportModalOpen(false)}
        onSuccess={() => loadSupportRequests()}
      />
    </div>
  );
};

export default OrderConfirmation;
