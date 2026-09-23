import React, { useState, useEffect } from "react";
import {
  FaHeadset,
  FaCheckCircle,
  FaExclamationCircle,
  FaCopy,
  FaCheck,
  FaCreditCard,
  FaBox,
  FaQuestionCircle,
  FaTruck,
  FaUndoAlt,
  FaExchangeAlt,
  FaEllipsisH,
  FaClock,
  FaComments,
  FaArrowLeft,
  FaPlus,
} from "react-icons/fa";
import OrderService from "../services/orderService";

const CATEGORIES = [
  {
    id: "Payment issue",
    label: "Payment issue",
    icon: FaCreditCard,
    desc: "Charged twice, payment failure, gateway error",
  },
  {
    id: "Order issue",
    label: "Order issue",
    icon: FaBox,
    desc: "Order details wrong, damaged goods",
  },
  {
    id: "Missing item",
    label: "Missing item",
    icon: FaQuestionCircle,
    desc: "One or more items missing from delivery",
  },
  {
    id: "Wrong item",
    label: "Wrong item",
    icon: FaExchangeAlt,
    desc: "Received different product or variation",
  },
  {
    id: "Delivery issue",
    label: "Delivery issue",
    icon: FaTruck,
    desc: "Delayed delivery, rider conduct, wrong address",
  },
  {
    id: "Return/Refund issue",
    label: "Return/Refund issue",
    icon: FaUndoAlt,
    desc: "Request return or refund status update",
  },
  {
    id: "Other",
    label: "Other",
    icon: FaEllipsisH,
    desc: "General order question or other inquiry",
  },
];

/* ==========================================================================
   OrderSupportModal — dedicated stylesheet (embedded)
   ========================================================================== */
const ORDER_SUPPORT_MODAL_STYLES = `
.spt-overlay {
    --spt-navy: #00204E;
    --spt-green: #34A129;
    --spt-green-dark: #278420;
    --spt-green-soft: #F0FDF4;
    --spt-border: #E2E8F0;
    --spt-muted: #64748B;
    --spt-radius: 18px;
    background-color: rgba(0, 32, 78, 0.55);
    backdrop-filter: blur(4px);
    z-index: 1060;
}

.spt-dialog {
    max-width: 620px;
    width: 100%;
    margin: 1.75rem auto;
}

.spt-content {
    border: none;
    border-radius: var(--spt-radius);
    overflow: hidden;
    box-shadow: 0 20px 50px rgba(0, 32, 78, 0.25);
    background: #fff;
}

/* ---------- header ---------- */
.spt-header {
    background: #fff;
    padding: 1.35rem 1.5rem 0.85rem;
    border-bottom: 1px solid #F1F5F9;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
}

.spt-header-icon {
    width: 42px;
    height: 42px;
    flex-shrink: 0;
    border-radius: 12px;
    background: linear-gradient(135deg, var(--spt-navy), #1e40af);
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.1rem;
}

.spt-header-text h5 {
    color: var(--spt-navy);
    font-weight: 700;
    margin-bottom: 2px;
    font-size: 1.05rem;
}

.spt-header-text span {
    font-size: 0.82rem;
    color: var(--spt-muted);
}

.spt-close {
    background: none;
    border: none;
    opacity: 0.5;
    transition: opacity .15s ease;
    cursor: pointer;
    font-size: 1.1rem;
    padding: 0.25rem;
}
.spt-close:hover {
    opacity: 1;
}

/* ---------- body ---------- */
.spt-body {
    padding: 1.35rem 1.5rem;
    max-height: calc(88vh - 120px);
    overflow-y: auto;
}

/* ---------- Good Message Banner ---------- */
.spt-good-msg {
    display: flex;
    align-items: flex-start;
    gap: 0.9rem;
    padding: 1rem 1.15rem;
    border-radius: 14px;
    margin-bottom: 1.15rem;
    border: 1px solid transparent;
}
.spt-good-msg-icon {
    flex-shrink: 0;
    width: 38px;
    height: 38px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
}
.spt-good-msg-title {
    font-size: 0.95rem;
    font-weight: 700;
    margin: 0 0 0.25rem;
}
.spt-good-msg-desc {
    font-size: 0.84rem;
    line-height: 1.48;
    margin: 0;
}

/* Resolved state colors */
.spt-good-msg-resolved {
    background: #F0FDF4;
    border-color: #BBF7D0;
    color: #166534;
}
.spt-good-msg-resolved .spt-good-msg-icon {
    background: #DCFCE7;
    color: #16A34A;
}
.spt-good-msg-resolved .spt-good-msg-title {
    color: #14532D;
}
.spt-good-msg-resolved .spt-good-msg-desc {
    color: #166534;
}

/* In Progress state colors */
.spt-good-msg-inprogress {
    background: #EFF6FF;
    border-color: #BFDBFE;
    color: #1E40AF;
}
.spt-good-msg-inprogress .spt-good-msg-icon {
    background: #DBEAFE;
    color: #2563EB;
}
.spt-good-msg-inprogress .spt-good-msg-title {
    color: #1E3A8A;
}
.spt-good-msg-inprogress .spt-good-msg-desc {
    color: #1E40AF;
}

/* Open state colors */
.spt-good-msg-open {
    background: #FFFBEB;
    border-color: #FDE68A;
    color: #92400E;
}
.spt-good-msg-open .spt-good-msg-icon {
    background: #FEF3C7;
    color: #D97706;
}
.spt-good-msg-open .spt-good-msg-title {
    color: #78350F;
}
.spt-good-msg-open .spt-good-msg-desc {
    color: #92400E;
}

/* Default state colors */
.spt-good-msg-default {
    background: #F8FAFC;
    border-color: #CBD5E1;
    color: #334155;
}
.spt-good-msg-default .spt-good-msg-icon {
    background: #E2E8F0;
    color: #475569;
}

/* ---------- Admin Note Card ---------- */
.spt-admin-note-card {
    background: #F8FAFC;
    border: 1px solid #CBD5E1;
    border-left: 4px solid #16A34A;
    border-radius: 12px;
    padding: 1rem 1.15rem;
    margin-bottom: 1.15rem;
}
.spt-admin-note-card.spt-admin-note-inprogress {
    border-left-color: #2563EB;
}
.spt-admin-note-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
    color: var(--spt-navy);
    margin-bottom: 0.5rem;
    flex-wrap: wrap;
}
.spt-note-time {
    font-size: 0.74rem;
    color: var(--spt-muted);
    margin-left: auto;
    font-weight: 500;
}
.spt-admin-note-body {
    font-size: 0.88rem;
    color: #1E293B;
    line-height: 1.55;
    background: #FFFFFF;
    padding: 0.75rem 0.95rem;
    border-radius: 8px;
    border: 1px solid #E2E8F0;
    white-space: pre-wrap;
}

/* ---------- Status Pill ---------- */
.spt-status-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.3rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.78rem;
    font-weight: 700;
}
.spt-status-pill.spt-status-resolved {
    background: #DCFCE7;
    color: #166534;
    border: 1px solid #BBF7D0;
}
.spt-status-pill.spt-status-inprogress {
    background: #DBEAFE;
    color: #1E40AF;
    border: 1px solid #BFDBFE;
}
.spt-status-pill.spt-status-open {
    background: #FEF3C7;
    color: #92400E;
    border: 1px solid #FDE68A;
}

/* ---------- Ticket Info Overview ---------- */
.spt-ticket-overview {
    background: #FFFFFF;
    border: 1px solid #E2E8F0;
    border-radius: 14px;
    padding: 1.15rem;
    margin-bottom: 1.15rem;
    box-shadow: 0 2px 8px rgba(0, 32, 78, 0.04);
}
.spt-overview-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
    flex-wrap: wrap;
}
.spt-ticket-id-tag {
    font-family: monospace;
    font-weight: 700;
    font-size: 0.95rem;
    color: var(--spt-navy);
}
.spt-cat-badge {
    background: #F1F5F9;
    color: #475569;
    border: 1px solid #E2E8F0;
    padding: 0.2rem 0.6rem;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 600;
}
.spt-problem-box {
    background: #F8FAFC;
    border: 1px solid #E2E8F0;
    border-radius: 10px;
    padding: 0.8rem 0.95rem;
    margin-top: 0.6rem;
}
.spt-problem-label {
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    color: var(--spt-muted);
    letter-spacing: 0.05em;
    margin-bottom: 0.25rem;
}
.spt-problem-text {
    font-size: 0.86rem;
    color: #334155;
    margin: 0;
    line-height: 1.5;
    white-space: pre-wrap;
}
.spt-meta-row {
    font-size: 0.75rem;
    color: var(--spt-muted);
    margin-top: 0.65rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
}

/* Multi-ticket tabs */
.spt-ticket-selector {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
    overflow-x: auto;
    padding-bottom: 0.25rem;
}
.spt-selector-btn {
    border: 1px solid #CBD5E1;
    background: #F8FAFC;
    color: #475569;
    font-size: 0.78rem;
    font-weight: 600;
    border-radius: 20px;
    padding: 0.35rem 0.85rem;
    cursor: pointer;
    white-space: nowrap;
    transition: all .15s ease;
}
.spt-selector-btn.active {
    background: var(--spt-navy);
    color: #fff;
    border-color: var(--spt-navy);
}

/* Switch view button */
.spt-back-to-status-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    background: none;
    border: none;
    color: var(--spt-green);
    font-weight: 600;
    font-size: 0.84rem;
    padding: 0;
    margin-bottom: 1rem;
    cursor: pointer;
}
.spt-back-to-status-btn:hover {
    text-decoration: underline;
    color: var(--spt-green-dark);
}

/* Copy button */
.spt-copy-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    background: none;
    border: 1px solid #CBD5E1;
    border-radius: 6px;
    padding: 0.2rem 0.55rem;
    font-size: 0.74rem;
    color: #475569;
    cursor: pointer;
    transition: all .15s ease;
}
.spt-copy-btn:hover {
    background: #F1F5F9;
    color: var(--spt-navy);
}

/* Category List */
.spt-category-list {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0.45rem;
    margin-top: 0.35rem;
    margin-bottom: 1rem;
}
.spt-category-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.65rem 0.85rem;
    border: 1.5px solid #E2E8F0;
    border-radius: 10px;
    cursor: pointer;
    transition: all .18s ease;
    background: #fff;
}
.spt-category-item:hover {
    border-color: #94A3B8;
    background: #F8FAFC;
}
.spt-category-item.selected {
    border-color: var(--spt-green);
    background: var(--spt-green-soft);
}
.spt-cat-main {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}
.spt-cat-icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: #F1F5F9;
    color: var(--spt-navy);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.88rem;
    flex-shrink: 0;
}
.spt-category-item.selected .spt-cat-icon {
    background: var(--spt-green);
    color: #fff;
}
.spt-cat-title {
    font-size: 0.86rem;
    font-weight: 700;
    color: var(--spt-navy);
    line-height: 1.2;
}
.spt-cat-desc {
    font-size: 0.74rem;
    color: var(--spt-muted);
    line-height: 1.25;
    margin-top: 1px;
}
.spt-cat-radio {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 2px solid #CBD5E1;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: all .15s ease;
}
.spt-category-item.selected .spt-cat-radio {
    border-color: var(--spt-green);
    background: var(--spt-green);
}

.spt-field-label {
    font-size: 0.84rem;
    font-weight: 700;
    color: var(--spt-navy);
    margin-bottom: 0.35rem;
}
.spt-field-label .required {
    color: #DC2626;
}
.spt-desc-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 0.35rem;
}
.spt-char-count {
    font-size: 0.74rem;
    color: var(--spt-muted);
}
.spt-textarea {
    width: 100%;
    border-radius: 10px;
    border: 1.5px solid #CBD5E1;
    padding: 0.7rem 0.85rem;
    font-size: 0.86rem;
    font-family: inherit;
    resize: vertical;
}
.spt-textarea:focus {
    border-color: var(--spt-green);
    outline: none;
    box-shadow: 0 0 0 3px rgba(52, 161, 41, 0.2);
}

/* Alert */
.spt-alert {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: #FEF2F2;
    border: 1px solid #FCA5A5;
    color: #991B1B;
    padding: 0.65rem 0.85rem;
    border-radius: 8px;
    font-size: 0.82rem;
    margin-bottom: 0.85rem;
}

/* Actions footer */
.spt-actions {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 0.65rem;
    margin-top: 1.25rem;
    padding-top: 1rem;
    border-top: 1px solid #F1F5F9;
}
.spt-btn {
    border-radius: 9px;
    font-size: 0.86rem;
    font-weight: 600;
    padding: 0.6rem 1.25rem;
    border: 1px solid transparent;
    cursor: pointer;
    transition: all .18s ease;
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
}
.spt-btn-cancel {
    background: #F1F5F9;
    color: #475569;
    border-color: #E2E8F0;
}
.spt-btn-cancel:hover {
    background: #E2E8F0;
    color: var(--spt-navy);
}
.spt-btn-submit {
    background: var(--spt-green);
    color: #fff;
}
.spt-btn-submit:hover:not(:disabled) {
    background: var(--spt-green-dark);
}
.spt-btn-submit:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}
.spt-btn-secondary {
    background: #fff;
    color: var(--spt-navy);
    border-color: #CBD5E1;
}
.spt-btn-secondary:hover {
    background: #F8FAFC;
    border-color: #94A3B8;
}
.spt-btn-primary {
    background: var(--spt-navy);
    color: #fff;
}
.spt-btn-primary:hover {
    background: #001738;
}

/* Success confirmation */
.spt-success {
    text-align: center;
    padding: 1rem 0.5rem;
}
.spt-success-icon {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: #DCFCE7;
    color: #16A34A;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.8rem;
    margin: 0 auto 1rem;
}
.spt-success-title {
    color: var(--spt-navy);
    font-weight: 800;
    font-size: 1.25rem;
    margin-bottom: 0.35rem;
}
.spt-success-sub {
    font-size: 0.88rem;
    color: var(--spt-muted);
    margin-bottom: 1.25rem;
}
.spt-ticket-card {
    background: #F8FAFC;
    border: 1px solid #E2E8F0;
    border-radius: 12px;
    padding: 1.15rem;
    text-align: left;
    margin-bottom: 1.25rem;
}
.spt-ticket-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.35rem;
    font-size: 0.78rem;
    color: var(--spt-muted);
}
.spt-ticket-number {
    font-size: 1.25rem;
    font-weight: 800;
    color: var(--spt-navy);
    font-family: monospace;
    letter-spacing: 0.04em;
    margin-bottom: 0.5rem;
}

@media (max-width: 576px) {
    .spt-actions {
        flex-direction: column-reverse;
    }
    .spt-btn {
        width: 100%;
        justify-content: center;
    }
}
`;

const OrderSupportModal = ({ order, isOpen, onClose, onSuccess }) => {
  const [category, setCategory] = useState("Order issue");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submittedTicket, setSubmittedTicket] = useState(null);
  const [copied, setCopied] = useState(false);

  // Existing tickets & view management
  const [existingTickets, setExistingTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [viewMode, setViewMode] = useState("form"); // "status" | "form"
  const [selectedTicketIndex, setSelectedTicketIndex] = useState(0);

  const orderId = order?.order_id || order?.id || order?.rawOrderId;
  const orderNum = order?.order_number || String(orderId || "");

  // Load existing tickets whenever modal opens for this order
  useEffect(() => {
    let isMounted = true;
    if (isOpen && orderId) {
      setLoadingTickets(true);
      setError("");
      setSubmittedTicket(null);
      OrderService.getOrderSupportRequests(orderId)
        .then((res) => {
          if (isMounted) {
            const requests = res?.data?.requests || [];
            setExistingTickets(requests);
            if (requests.length > 0) {
              setViewMode("status");
              setSelectedTicketIndex(0);
            } else {
              setViewMode("form");
            }
          }
        })
        .catch((err) => {
          console.error("Error loading order support requests:", err);
          if (isMounted) setViewMode("form");
        })
        .finally(() => {
          if (isMounted) setLoadingTickets(false);
        });
    } else {
      setExistingTickets([]);
      setViewMode("form");
      setSubmittedTicket(null);
    }

    return () => {
      isMounted = false;
    };
  }, [isOpen, orderId]);

  if (!isOpen || !order) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!category) {
      setError("Please select an issue category.");
      return;
    }

    if (!description.trim() || description.trim().length < 10) {
      setError(
        "Please describe your issue in more detail (at least 10 characters).",
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await OrderService.createSupportRequest({
        orderId,
        category,
        description: description.trim(),
      });

      if (res && res.success && res.data) {
        setSubmittedTicket(res.data);
        // Prepend new ticket to existing list
        setExistingTickets((prev) => [res.data, ...prev]);
        setSelectedTicketIndex(0);
        setDescription("");
        if (onSuccess) {
          onSuccess(res.data);
        }
      } else {
        setError(
          res?.message || "Failed to submit support request. Please try again.",
        );
      }
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "An unexpected error occurred. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyRef = (textToCopy) => {
    const text = textToCopy || submittedTicket?.ticket_number;
    if (text) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setDescription("");
    setError("");
    setSubmittedTicket(null);
    onClose();
  };

  const activeTicket =
    existingTickets[selectedTicketIndex] || existingTickets[0] || null;

  return (
    <>
      <style>{ORDER_SUPPORT_MODAL_STYLES}</style>
      <div
        className="modal show d-block spt-overlay"
        tabIndex="-1"
        onClick={handleClose}
      >
        <div
          className="modal-dialog modal-dialog-centered spt-dialog"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-content spt-content">
            {/* Header */}
            <div className="modal-header spt-header">
              <div className="d-flex align-items-center gap-3">
                <div className="spt-header-icon">
                  <FaHeadset />
                </div>
                <div className="spt-header-text">
                  <h5 className="modal-title mb-0">
                    {viewMode === "status"
                      ? "Support Ticket Status"
                      : "Need Help With This Order?"}
                  </h5>
                  <span>Order #{orderNum}</span>
                </div>
              </div>
              <button
                type="button"
                className="spt-close"
                onClick={handleClose}
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            {/* Modal Body */}
            <div className="modal-body spt-body">
              {loadingTickets ? (
                /* Loading State */
                <div className="text-center py-5 text-muted">
                  <div
                    className="spinner-border spinner-border-sm text-success mb-2"
                    role="status"
                    style={{ width: "2rem", height: "2rem" }}
                  />
                  <div style={{ fontSize: "0.88rem" }}>
                    Checking support status for this order...
                  </div>
                </div>
              ) : submittedTicket ? (
                /* 1. Success confirmation after immediate submission */
                <div className="spt-success">
                  <div className="spt-success-icon">
                    <FaCheckCircle />
                  </div>

                  <h4 className="spt-success-title">Request Received!</h4>
                  <p className="spt-success-sub">
                    Your complaint has been successfully registered. Our team
                    will look into it promptly.
                  </p>

                  {/* Reference Number Card */}
                  <div className="spt-ticket-card">
                    <div className="spt-ticket-row">
                      <span>Support Reference Number</span>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopyRef(submittedTicket.ticket_number)
                        }
                        className="spt-copy-btn"
                      >
                        {copied ? (
                          <>
                            <FaCheck size={11} /> Copied!
                          </>
                        ) : (
                          <>
                            <FaCopy size={11} /> Copy
                          </>
                        )}
                      </button>
                    </div>
                    <div className="spt-ticket-number">
                      #{submittedTicket.ticket_number}
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <span className="spt-cat-badge">
                        {submittedTicket.category}
                      </span>
                      <span className="spt-status-pill spt-status-open">
                        <FaExclamationCircle size={11} /> Status: Open
                      </span>
                    </div>
                  </div>

                  {/* Good Message on new submission */}
                  <div className="spt-good-msg spt-good-msg-open text-start">
                    <div className="spt-good-msg-icon">
                      <FaHeadset size={20} />
                    </div>
                    <div>
                      <h6 className="spt-good-msg-title">
                        Thank You for Your Patience! 📨
                      </h6>
                      <p className="spt-good-msg-desc">
                        Our support team is now reviewing your issue. We know
                        order issues can be stressful and we are on it to make
                        sure everything is resolved smoothly.
                      </p>
                    </div>
                  </div>

                  <div className="d-flex gap-2 justify-content-center mt-3">
                    <button
                      type="button"
                      className="spt-btn spt-btn-secondary"
                      onClick={() => setSubmittedTicket(null)}
                    >
                      View Complaint Details
                    </button>
                    <button
                      type="button"
                      className="spt-btn spt-btn-primary"
                      onClick={handleClose}
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : viewMode === "status" && activeTicket ? (
                /* 2. Existing Ticket Status View (Open, In Progress, Resolved) */
                <div>
                  {/* If order has multiple tickets, allow toggling */}
                  {existingTickets.length > 1 && (
                    <div className="spt-ticket-selector">
                      {existingTickets.map((t, index) => (
                        <button
                          key={t.id || index}
                          type="button"
                          className={`spt-selector-btn${selectedTicketIndex === index ? " active" : ""}`}
                          onClick={() => setSelectedTicketIndex(index)}
                        >
                          Ticket #{t.ticket_number} ({t.status})
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Overview Card */}
                  <div className="spt-ticket-overview">
                    <div className="spt-overview-top">
                      <div className="d-flex align-items-center gap-2">
                        <span className="spt-ticket-id-tag">
                          #{activeTicket.ticket_number}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopyRef(activeTicket.ticket_number)
                          }
                          className="spt-copy-btn"
                          title="Copy Ticket Reference"
                        >
                          {copied ? (
                            <>
                              <FaCheck size={11} /> Copied!
                            </>
                          ) : (
                            <>
                              <FaCopy size={11} /> Copy
                            </>
                          )}
                        </button>
                      </div>

                      {/* Status Badges */}
                      <div>
                        {activeTicket.status === "Resolved" && (
                          <span className="spt-status-pill spt-status-resolved">
                            <FaCheckCircle size={11} /> Resolved
                          </span>
                        )}
                        {activeTicket.status === "In Progress" && (
                          <span className="spt-status-pill spt-status-inprogress">
                            <FaClock size={11} /> In Progress
                          </span>
                        )}
                        {activeTicket.status === "Open" && (
                          <span className="spt-status-pill spt-status-open">
                            <FaExclamationCircle size={11} /> Open (Under Review)
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="spt-problem-box">
                      <div className="spt-problem-label">
                        Reported Issue ({activeTicket.category})
                      </div>
                      <p className="spt-problem-text">
                        {activeTicket.description}
                      </p>
                    </div>

                    <div className="spt-meta-row">
                      <span>
                        Submitted:{" "}
                        {new Date(activeTicket.created_at).toLocaleString()}
                      </span>
                      {activeTicket.resolved_at && (
                        <span>
                          • Resolved:{" "}
                          {new Date(activeTicket.resolved_at).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Good Message Banner tailored to status */}
                  {activeTicket.status === "Resolved" && (
                    <div className="spt-good-msg spt-good-msg-resolved">
                      <div className="spt-good-msg-icon">
                        <FaCheckCircle size={20} />
                      </div>
                      <div className="spt-good-msg-body">
                        <h6 className="spt-good-msg-title">
                          Your Issue Has Been Resolved! 🎉
                        </h6>
                        <p className="spt-good-msg-desc">
                          Thank you so much for your patience and cooperation
                          while our support team resolved your concern. We deeply
                          value your trust in Recomm and are glad we could make
                          things right! If you need anything else, we are always
                          here for you.
                        </p>
                      </div>
                    </div>
                  )}

                  {activeTicket.status === "In Progress" && (
                    <div className="spt-good-msg spt-good-msg-inprogress">
                      <div className="spt-good-msg-icon">
                        <FaClock size={20} />
                      </div>
                      <div className="spt-good-msg-body">
                        <h6 className="spt-good-msg-title">
                          We're Actively Working on It! ⏳
                        </h6>
                        <p className="spt-good-msg-desc">
                          Our support team and store partners are currently
                          investigating your request and taking action. Thank you
                          so much for your patience while we get this sorted out
                          for you! We will update you as soon as possible.
                        </p>
                      </div>
                    </div>
                  )}

                  {activeTicket.status === "Open" && (
                    <div className="spt-good-msg spt-good-msg-open">
                      <div className="spt-good-msg-icon">
                        <FaHeadset size={20} />
                      </div>
                      <div className="spt-good-msg-body">
                        <h6 className="spt-good-msg-title">
                          We've Received Your Complaint! 📨
                        </h6>
                        <p className="spt-good-msg-desc">
                          Thank you for reaching out to us. We understand this
                          may be inconvenient, and we sincerely appreciate your
                          patience. Our customer care team is reviewing your
                          order details and will begin working on your resolution
                          shortly.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Admin Added Note (Resolution / Update Note) */}
                  {activeTicket.admin_response ? (
                    <div
                      className={`spt-admin-note-card${activeTicket.status === "In Progress" ? " spt-admin-note-inprogress" : ""}`}
                    >
                      <div className="spt-admin-note-header">
                        <FaComments
                          className={
                            activeTicket.status === "Resolved"
                              ? "text-success"
                              : "text-primary"
                          }
                        />
                        <span className="fw-bold">
                          {activeTicket.status === "Resolved"
                            ? "Resolution Note from Support Team"
                            : "Support Team Update"}
                        </span>
                        {activeTicket.resolved_at && (
                          <span className="spt-note-time">
                            Resolved:{" "}
                            {new Date(
                              activeTicket.resolved_at,
                            ).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                      </div>
                      <div className="spt-admin-note-body">
                        {activeTicket.admin_response}
                      </div>
                    </div>
                  ) : activeTicket.status === "Resolved" ? (
                    <div className="spt-admin-note-card">
                      <div className="spt-admin-note-header">
                        <FaCheckCircle className="text-success" />
                        <span className="fw-bold">Resolution Complete</span>
                      </div>
                      <div className="spt-admin-note-body text-muted fst-italic">
                        This issue was marked as resolved by our customer care
                        team.
                      </div>
                    </div>
                  ) : null}

                  {/* Actions in status view */}
                  <div className="spt-actions">
                    <button
                      type="button"
                      className="spt-btn spt-btn-secondary"
                      onClick={() => setViewMode("form")}
                    >
                      <FaPlus size={11} />
                      <span>Report Another Issue</span>
                    </button>
                    <button
                      type="button"
                      className="spt-btn spt-btn-primary"
                      onClick={handleClose}
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                /* 3. New Support Request Form */
                <form onSubmit={handleSubmit}>
                  {existingTickets.length > 0 && (
                    <button
                      type="button"
                      className="spt-back-to-status-btn"
                      onClick={() => setViewMode("status")}
                    >
                      <FaArrowLeft size={11} />
                      <span>
                        Back to Complaint Status ({existingTickets.length}{" "}
                        {existingTickets.length === 1 ? "ticket" : "tickets"})
                      </span>
                    </button>
                  )}

                  {error && (
                    <div className="spt-alert" role="alert">
                      <FaExclamationCircle
                        size={14}
                        className="flex-shrink-0"
                      />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Category picker */}
                  <div className="mb-2">
                    <label className="spt-field-label">
                      What can we help you with?{" "}
                      <span className="required">*</span>
                    </label>
                    <div className="spt-category-list">
                      {CATEGORIES.map((cat) => {
                        const isSelected = category === cat.id;
                        const Icon = cat.icon;
                        return (
                          <div
                            key={cat.id}
                            onClick={() => setCategory(cat.id)}
                            className={`spt-category-item${isSelected ? " selected" : ""}`}
                          >
                            <div className="spt-cat-main">
                              <div className="spt-cat-icon">
                                <Icon />
                              </div>
                              <div className="spt-cat-text">
                                <div className="spt-cat-title">
                                  {cat.label}
                                </div>
                                <div className="spt-cat-desc">{cat.desc}</div>
                              </div>
                            </div>
                            <div className="spt-cat-radio" />
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Description textarea */}
                  <div className="mb-2">
                    <div className="spt-desc-row">
                      <label className="spt-field-label">
                        Describe the problem <span className="required">*</span>
                      </label>
                      <span className="spt-char-count">
                        {description.length} / 500
                      </span>
                    </div>
                    <textarea
                      rows={4}
                      maxLength={500}
                      className="form-control spt-textarea"
                      placeholder="Please provide details (e.g. which item was missing, damaged package, or incorrect charge)..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                    ></textarea>
                  </div>

                  {/* Actions */}
                  <div className="spt-actions">
                    <button
                      type="button"
                      className="spt-btn spt-btn-cancel"
                      onClick={handleClose}
                      disabled={submitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="spt-btn spt-btn-submit"
                      disabled={
                        submitting ||
                        !description.trim() ||
                        description.trim().length < 10
                      }
                    >
                      {submitting ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm"
                            role="status"
                            aria-hidden="true"
                          ></span>
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <>
                          <FaHeadset size={14} />
                          <span>Submit Support Request</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrderSupportModal;
