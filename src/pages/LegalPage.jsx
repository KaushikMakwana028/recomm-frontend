import React, { useState, useEffect, useCallback } from "react";

import { Link, useParams, useLocation, useNavigate } from "react-router-dom";
import {
  FaShieldAlt,
  FaFileContract,
  FaUndoAlt,
  FaCalendarAlt,
  FaCheckCircle,
  FaChevronRight,
  FaExclamationTriangle,
  FaSyncAlt,
  FaPrint,
  FaEnvelope,
  FaPhoneAlt,
} from "react-icons/fa";
import { LegalService } from "../services";

const NAVY = "#00204E";
const GREEN = "#34A129";

// Configuration for policy tabs and fallback titles
const POLICIES = [
  {
    slug: "terms_conditions",
    path: "/terms-conditions",
    label: "Terms & Conditions",
    badge: "User Agreement",
    icon: FaFileContract,
  },
  {
    slug: "privacy_policy",
    path: "/privacy-policy",
    label: "Privacy Policy",
    badge: "Data Protection",
    icon: FaShieldAlt,
  },
  {
    slug: "refund_policy",
    path: "/refund-policy",
    label: "Refund Policy",
    badge: "Returns & Cancellation",
    icon: FaUndoAlt,
  },
];

const resolveSlug = (rawSlug, pathname) => {
  if (rawSlug) {
    const s = String(rawSlug).toLowerCase().replace(/-/g, "_");
    if (s.includes("term")) return "terms_conditions";
    if (s.includes("privacy")) return "privacy_policy";
    if (s.includes("refund") || s.includes("return")) return "refund_policy";
    return s;
  }
  const path = (pathname || "").toLowerCase();
  if (path.includes("term")) return "terms_conditions";
  if (path.includes("privacy")) return "privacy_policy";
  if (path.includes("refund") || path.includes("return")) return "refund_policy";
  return "terms_conditions";
};

const LegalPage = ({ defaultSlug }) => {
  const { slug: paramSlug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const activeSlug = resolveSlug(defaultSlug || paramSlug, location.pathname);
  const activeMeta = POLICIES.find((p) => p.slug === activeSlug) || POLICIES[0];
  const IconComponent = activeMeta.icon;

  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPage = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await LegalService.getLegalPage(activeSlug);
      if (res && res.success && res.data) {
        setPageData(res.data);
      } else {
        setError(res?.error || "Unable to load policy content. Please try again.");
      }
    } catch (err) {
      setError("Failed to connect to the server. Please check your network.");
    } finally {
      setLoading(false);
    }
  }, [activeSlug]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    fetchPage();
  }, [fetchPage]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="legal-page-wrapper">
      <style>{`
        .legal-page-wrapper {
          background-color: #F8F9FA;
          min-height: 80vh;
          padding-bottom: 4rem;
        }

        /* ── Hero Banner ── */
        .legal-hero {
          background: linear-gradient(135deg, ${NAVY} 0%, #03337a 100%);
          color: #fff;
          padding: 3rem 1.25rem 2.5rem;
          position: relative;
          overflow: hidden;
        }
        .legal-hero::after {
          content: '';
          position: absolute;
          top: -30%;
          right: -10%;
          width: 380px;
          height: 380px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(52, 161, 41, 0.25) 0%, rgba(52, 161, 41, 0) 70%);
          pointer-events: none;
        }
        .legal-hero-inner {
          max-width: 900px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }

        /* Breadcrumb */
        .legal-breadcrumb {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.85rem;
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 1.25rem;
          flex-wrap: wrap;
        }
        .legal-breadcrumb a {
          color: rgba(255, 255, 255, 0.7);
          transition: color 0.2s ease;
        }
        .legal-breadcrumb a:hover {
          color: ${GREEN};
        }
        .legal-breadcrumb-current {
          color: #fff;
          font-weight: 500;
        }

        /* Hero Header */
        .legal-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background: rgba(52, 161, 41, 0.2);
          color: #6ee77a;
          border: 1px solid rgba(52, 161, 41, 0.4);
          padding: 0.35rem 0.85rem;
          border-radius: 9999px;
          font-size: 0.78rem;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          margin-bottom: 0.75rem;
        }
        .legal-title {
          font-size: 2.25rem;
          font-weight: 800;
          color: #ffffff;
          line-height: 1.2;
          margin: 0 0 1rem 0;
          letter-spacing: -0.02em;
        }
        @media (max-width: 768px) {
          .legal-title {
            font-size: 1.75rem;
          }
        }
        .legal-meta-row {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          flex-wrap: wrap;
          font-size: 0.86rem;
          color: rgba(255, 255, 255, 0.85);
        }
        .legal-meta-item {
          display: flex;
          align-items: center;
          gap: 0.45rem;
        }
        .legal-meta-icon {
          color: ${GREEN};
        }

        /* ── Policy Tab Switcher ── */
        .legal-switcher-wrap {
          max-width: 900px;
          margin: -1.4rem auto 2rem;
          padding: 0 1.25rem;
          position: relative;
          z-index: 2;
        }
        .legal-switcher-bar {
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 32, 78, 0.08);
          border: 1px solid rgba(0, 32, 78, 0.06);
          display: flex;
          overflow-x: auto;
          scrollbar-width: none;
          padding: 0.35rem;
          gap: 0.35rem;
        }
        .legal-switcher-bar::-webkit-scrollbar {
          display: none;
        }
        .legal-switch-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          border-radius: 9px;
          font-size: 0.88rem;
          font-weight: 600;
          color: ${NAVY};
          border: none;
          background: transparent;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s ease;
          text-decoration: none;
        }
        .legal-switch-btn:hover {
          background: rgba(0, 32, 78, 0.04);
          color: ${GREEN};
        }
        .legal-switch-btn.active {
          background: ${NAVY};
          color: #ffffff;
          box-shadow: 0 2px 10px rgba(0, 32, 78, 0.15);
        }
        .legal-switch-btn.active .btn-icon {
          color: ${GREEN};
        }

        /* ── Main Reading Card ── */
        .legal-container {
          max-width: 900px;
          margin: 0 auto;
          padding: 0 1.25rem;
        }
        .legal-card {
          background: #ffffff;
          border-radius: 16px;
          box-shadow: 0 4px 24px rgba(0, 32, 78, 0.05);
          border: 1px solid rgba(0, 32, 78, 0.06);
          padding: 2.75rem 3rem;
          position: relative;
        }
        @media (max-width: 768px) {
          .legal-card {
            padding: 1.75rem 1.25rem;
          }
        }

        .legal-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #E2E8F0;
          padding-bottom: 1.25rem;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .legal-verified-status {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.88rem;
          font-weight: 600;
          color: #2D3748;
        }
        .legal-verified-status svg {
          color: ${GREEN};
          font-size: 1.1rem;
        }
        .legal-print-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          background: #F1F5F9;
          border: 1px solid #CBD5E1;
          color: ${NAVY};
          padding: 0.4rem 0.85rem;
          border-radius: 8px;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .legal-print-btn:hover {
          background: #E2E8F0;
          color: #000;
        }

        /* ── Rich Text Typography & Content Styling ── */
        .legal-body-content {
          font-family: 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          font-size: 0.98rem;
          line-height: 1.85;
          color: #334155;
          word-break: break-word;
        }
        .legal-body-content h1,
        .legal-body-content h2,
        .legal-body-content h3,
        .legal-body-content h4,
        .legal-body-content h5,
        .legal-body-content h6 {
          color: ${NAVY};
          font-weight: 700;
          line-height: 1.35;
          letter-spacing: -0.01em;
        }
        .legal-body-content h1 {
          font-size: 1.75rem;
          margin-top: 2rem;
          margin-bottom: 1rem;
          border-bottom: 2px solid #E2E8F0;
          padding-bottom: 0.5rem;
        }
        .legal-body-content h2 {
          font-size: 1.4rem;
          margin-top: 2.2rem;
          margin-bottom: 0.85rem;
          border-bottom: 2px solid #F1F5F9;
          padding-bottom: 0.4rem;
        }
        .legal-body-content h3 {
          font-size: 1.18rem;
          margin-top: 1.8rem;
          margin-bottom: 0.65rem;
          color: ${NAVY};
        }
        .legal-body-content h4 {
          font-size: 1.05rem;
          margin-top: 1.4rem;
          margin-bottom: 0.5rem;
        }
        .legal-body-content p {
          margin-top: 0;
          margin-bottom: 1.15rem;
        }
        .legal-body-content ul,
        .legal-body-content ol {
          margin-top: 0.5rem;
          margin-bottom: 1.35rem;
          padding-left: 1.75rem;
        }
        .legal-body-content li {
          margin-bottom: 0.5rem;
          line-height: 1.75;
          color: #334155;
        }
        .legal-body-content li::marker {
          color: ${GREEN};
          font-weight: bold;
        }
        .legal-body-content strong,
        .legal-body-content b {
          color: ${NAVY};
          font-weight: 600;
        }
        .legal-body-content a {
          color: ${GREEN};
          text-decoration: underline;
          transition: color 0.2s ease;
        }
        .legal-body-content a:hover {
          color: #189031;
        }
        .legal-body-content blockquote {
          border-left: 4px solid ${GREEN};
          background-color: #F4FAF3;
          margin: 1.5rem 0;
          padding: 1rem 1.25rem;
          border-radius: 0 8px 8px 0;
          color: #1E293B;
          font-style: italic;
        }
        .legal-body-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 1.5rem 0;
          font-size: 0.92rem;
          border: 1px solid #E2E8F0;
          border-radius: 8px;
          overflow: hidden;
        }
        .legal-body-content table th,
        .legal-body-content table td {
          padding: 0.75rem 1rem;
          border: 1px solid #E2E8F0;
          vertical-align: top;
          text-align: left;
        }
        .legal-body-content table th {
          background-color: #F8FAFC;
          font-weight: 700;
          color: ${NAVY};
        }
        .legal-body-content hr {
          border: none;
          border-top: 1px solid #E2E8F0;
          margin: 2rem 0;
        }

        /* ── Support Help Box ── */
        .legal-support-card {
          margin-top: 2.5rem;
          background: #F8FAFC;
          border: 1px dashed #CBD5E1;
          border-radius: 12px;
          padding: 1.5rem 1.75rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1rem;
        }
        .legal-support-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: ${NAVY};
          margin: 0 0 0.25rem;
        }
        .legal-support-sub {
          font-size: 0.82rem;
          color: #64748B;
          margin: 0;
        }
        .legal-support-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
        }
        .legal-support-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          background: #ffffff;
          border: 1px solid #CBD5E1;
          color: ${NAVY};
          padding: 0.5rem 0.9rem;
          border-radius: 8px;
          font-size: 0.82rem;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s ease;
        }
        .legal-support-btn:hover {
          border-color: ${GREEN};
          color: ${GREEN};
        }

        /* ── Skeleton Loader ── */
        .skeleton-block {
          background: linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%);
          background-size: 200% 100%;
          animation: skeletonWave 1.5s infinite;
          border-radius: 6px;
        }
        @keyframes skeletonWave {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        /* Print Media Style */
        @media print {
          .legal-hero,
          .legal-switcher-wrap,
          .legal-card-header,
          .legal-support-card,
          .ft,
          header,
          nav {
            display: none !important;
          }
          .legal-page-wrapper {
            background: #fff !important;
            padding: 0 !important;
          }
          .legal-card {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
          }
          .legal-body-content {
            color: #000 !important;
          }
        }
      `}</style>

      {/* Hero Banner with Title & Metadata */}
      <section className="legal-hero">
        <div className="legal-hero-inner">
          <nav className="legal-breadcrumb" aria-label="breadcrumb">
            <Link to="/">Home</Link>
            <FaChevronRight size={10} />
            <span>Legal</span>
            <FaChevronRight size={10} />
            <span className="legal-breadcrumb-current">
              {pageData?.title || activeMeta.label}
            </span>
          </nav>

          <div className="legal-badge">
            <IconComponent size={12} />
            <span>{activeMeta.badge}</span>
          </div>

          <h1 className="legal-title">
            {pageData?.title || activeMeta.label}
          </h1>

          <div className="legal-meta-row">
            <div className="legal-meta-item">
              <FaCalendarAlt className="legal-meta-icon" size={14} />
              <span>
                Last Updated:{" "}
                <strong>
                  {pageData?.last_updated ||
                    (pageData?.updated_at
                      ? new Date(pageData.updated_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "Current Version")}
                </strong>
              </span>
            </div>
            <div className="legal-meta-item">
              <FaCheckCircle className="legal-meta-icon" size={14} />
              <span>Published &amp; Binding on ReComm Platform</span>
            </div>
          </div>
        </div>
      </section>

      {/* Switcher Bar for Quick Policy Navigation */}
      <div className="legal-switcher-wrap">
        <div className="legal-switcher-bar" role="tablist">
          {POLICIES.map((item) => {
            const ItemIcon = item.icon;
            const isActive = item.slug === activeSlug;
            return (
              <button
                key={item.slug}
                type="button"
                className={`legal-switch-btn ${isActive ? "active" : ""}`}
                onClick={() => navigate(item.path)}
                role="tab"
                aria-selected={isActive}
              >
                <ItemIcon size={14} className="btn-icon" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Reading Container */}
      <main className="legal-container">
        <div className="legal-card">
          {/* Card Top Action Row */}
          <div className="legal-card-header">
            <div className="legal-verified-status">
              <FaCheckCircle />
              <span>Official ReComm Customer Policy</span>
            </div>
            <button
              type="button"
              className="legal-print-btn"
              onClick={handlePrint}
              title="Print or save as PDF"
            >
              <FaPrint size={13} />
              <span>Print Policy</span>
            </button>
          </div>

          {/* Loading Skeleton */}
          {loading && (
            <div className="py-2" aria-live="polite" aria-busy="true">
              <div
                className="skeleton-block mb-4"
                style={{ height: "32px", width: "55%" }}
              />
              <div
                className="skeleton-block mb-2"
                style={{ height: "18px", width: "100%" }}
              />
              <div
                className="skeleton-block mb-2"
                style={{ height: "18px", width: "95%" }}
              />
              <div
                className="skeleton-block mb-4"
                style={{ height: "18px", width: "88%" }}
              />

              <div
                className="skeleton-block mb-3"
                style={{ height: "26px", width: "40%" }}
              />
              <div
                className="skeleton-block mb-2"
                style={{ height: "18px", width: "100%" }}
              />
              <div
                className="skeleton-block mb-2"
                style={{ height: "18px", width: "92%" }}
              />
              <div
                className="skeleton-block mb-4"
                style={{ height: "18px", width: "85%" }}
              />

              <div
                className="skeleton-block mb-3"
                style={{ height: "26px", width: "45%" }}
              />
              <div
                className="skeleton-block mb-2"
                style={{ height: "18px", width: "98%" }}
              />
              <div
                className="skeleton-block mb-2"
                style={{ height: "18px", width: "94%" }}
              />
              <div
                className="skeleton-block"
                style={{ height: "18px", width: "70%" }}
              />
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div className="text-center py-5">
              <div
                className="mx-auto mb-3 d-flex align-items-center justify-content-center"
                style={{
                  width: "60px",
                  height: "60px",
                  borderRadius: "50%",
                  background: "#FEE2E2",
                  color: "#DC2626",
                }}
              >
                <FaExclamationTriangle size={26} />
              </div>
              <h4 style={{ color: NAVY, fontWeight: 700 }} className="mb-2">
                Could Not Load Policy
              </h4>
              <p className="text-muted mb-4 mx-auto" style={{ maxWidth: "440px" }}>
                {error}
              </p>
              <div className="d-flex justify-content-center gap-3">
                <button
                  type="button"
                  onClick={fetchPage}
                  className="btn text-white px-4 py-2"
                  style={{ background: GREEN, borderRadius: "8px", fontWeight: 600 }}
                >
                  <FaSyncAlt className="me-2" /> Try Again
                </button>
                <Link
                  to="/"
                  className="btn px-4 py-2"
                  style={{
                    border: `1px solid ${NAVY}`,
                    color: NAVY,
                    borderRadius: "8px",
                    fontWeight: 600,
                  }}
                >
                  Return to Home
                </Link>
              </div>
            </div>
          )}

          {/* Rendered HTML Content */}
          {!loading && !error && pageData?.content && (
            <article
              className="legal-body-content"
              dangerouslySetInnerHTML={{ __html: pageData.content }}
            />
          )}

          {/* Bottom Grievance / Contact Box */}
          <div className="legal-support-card">
            <div>
              <h6 className="legal-support-title">Questions regarding this policy?</h6>
              <p className="legal-support-sub">
                Our Grievance Redressal &amp; Support Team is available to assist you.
              </p>
            </div>
            <div className="legal-support-actions">
              <a href="mailto:grievance@recomm.in" className="legal-support-btn">
                <FaEnvelope size={12} style={{ color: GREEN }} />
                <span>grievance@recomm.in</span>
              </a>
              <a href="tel:1-800-RECOMM" className="legal-support-btn">
                <FaPhoneAlt size={12} style={{ color: GREEN }} />
                <span>1-800-RECOMM</span>
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LegalPage;
