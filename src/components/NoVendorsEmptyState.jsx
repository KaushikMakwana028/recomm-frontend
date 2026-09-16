import React from "react";
import { useNavigate } from "react-router-dom";
import { FaMapMarkerAlt, FaCompass, FaChevronRight } from "react-icons/fa";

const NAVY = "#00204E";
const GREEN = "#34A129";

const NoVendorsEmptyState = ({
  title = "No vendors deliver to your area yet",
  message = "We couldn't find any stores delivering to your current location. Try changing your delivery address or check back soon as we expand our reach.",
  actionText = "Change Delivery Address",
  onAction,
  className = "",
  compact = false,
}) => {
  const navigate = useNavigate();

  const handleAction = () => {
    if (onAction) {
      onAction();
    } else {
      navigate("/profile?tab=addresses");
    }
  };

  return (
    <div
      className={`text-center d-flex flex-column align-items-center justify-content-center ${compact ? "py-4 px-3" : "py-5 px-3"} ${className}`}
      style={{
        maxWidth: "520px",
        margin: "0 auto",
      }}
    >
      {/* Icon Badge */}
      <div
        className="d-flex align-items-center justify-content-center mb-3 position-relative"
        style={{
          width: compact ? "72px" : "92px",
          height: compact ? "72px" : "92px",
          borderRadius: "50%",
          backgroundColor: "#F3F9F1",
          border: "2px dashed #CBE7C7",
          boxShadow: "0 8px 24px rgba(52, 161, 41, 0.08)",
        }}
      >
        <div
          className="d-flex align-items-center justify-content-center"
          style={{
            width: compact ? "50px" : "64px",
            height: compact ? "50px" : "64px",
            borderRadius: "50%",
            backgroundColor: "#FFFFFF",
            boxShadow: "0 4px 12px rgba(0, 32, 78, 0.08)",
          }}
        >
          <FaMapMarkerAlt
            size={compact ? 24 : 32}
            style={{ color: "#E04F5F" }}
          />
        </div>
        <span
          className="position-absolute d-flex align-items-center justify-content-center"
          style={{
            top: compact ? "-2px" : "0px",
            right: compact ? "-2px" : "0px",
            width: "24px",
            height: "24px",
            borderRadius: "50%",
            backgroundColor: NAVY,
            color: "#FFFFFF",
            fontSize: "10px",
          }}
          title="Out of range"
        >
          ✕
        </span>
      </div>

      {/* Heading */}
      <h3
        className="fw-bold mb-2"
        style={{
          color: NAVY,
          fontSize: compact ? "1.15rem" : "1.35rem",
          letterSpacing: "-0.01em",
        }}
      >
        {title}
      </h3>

      {/* Subtitle */}
      <p
        className="text-muted mb-4"
        style={{
          fontSize: compact ? "0.85rem" : "0.95rem",
          lineHeight: "1.55",
          maxWidth: "420px",
        }}
      >
        {message}
      </p>

      {/* Action Buttons */}
      <div className="d-flex flex-wrap gap-2 justify-content-center align-items-center">
        <button
          onClick={handleAction}
          className="btn d-inline-flex align-items-center gap-2 fw-semibold px-4 py-2"
          style={{
            backgroundColor: GREEN,
            color: "#FFFFFF",
            borderRadius: "8px",
            fontSize: "0.9rem",
            boxShadow: "0 4px 14px rgba(52, 161, 41, 0.25)",
            border: "none",
            transition: "all 0.2s ease",
          }}
        >
          <FaMapMarkerAlt size={13} />
          <span>{actionText}</span>
          <FaChevronRight size={11} className="ms-1" />
        </button>

        <button
          onClick={() => {
            if (navigator.geolocation) {
              navigator.geolocation.getCurrentPosition(
                (pos) => {
                  const live = {
                    latitude: parseFloat(pos.coords.latitude.toFixed(8)),
                    longitude: parseFloat(pos.coords.longitude.toFixed(8)),
                    accuracy: pos.coords.accuracy,
                    timestamp: Date.now(),
                  };
                  localStorage.setItem("customer_live_location", JSON.stringify(live));
                  window.location.reload();
                },
                () => {
                  window.location.reload();
                }
              );
            } else {
              window.location.reload();
            }
          }}
          className="btn btn-light d-inline-flex align-items-center gap-2 px-3 py-2 text-secondary"
          style={{
            borderRadius: "8px",
            fontSize: "0.88rem",
            border: "1px solid #DEE2E6",
            backgroundColor: "#FFFFFF",
          }}
          title="Refresh current GPS location"
        >
          <FaCompass size={13} />
          <span>Detect GPS</span>
        </button>
      </div>
    </div>
  );
};

export default NoVendorsEmptyState;
