import React, { useState } from "react";
import { FaChevronDown, FaChevronUp, FaStore, FaMapMarkerAlt, FaShoppingCart } from "react-icons/fa";
import { formatPrice } from "../utils/helpers";
import { useCart } from "../context/CartContext";

const GREEN = "#34A129";
const NAVY = "#00204E";

export const AlternativeSellers = ({ product }) => {
  const [expanded, setExpanded] = useState(false);
  const { addToCart } = useCart();

  const alternatives = product?.alternatives || [];
  if (!alternatives || alternatives.length === 0) {
    return null;
  }

  const minPrice = Math.min(...alternatives.map((a) => Number(a.sale_price ?? a.price)));

  const handleAddAlt = (e, alt) => {
    e.stopPropagation();
    e.preventDefault();
    addToCart({
      id: alt.vendor_product_id,
      name: product.name || product.product_name,
      price: Number(alt.sale_price ?? alt.price),
      sale_price: Number(alt.sale_price ?? alt.price),
      image_url: product.image_url || product.image,
      image: product.image_url || product.image,
      category_name: product.category_name,
    });
  };

  return (
    <div className="alt-sellers-container mt-2 pt-2 border-top">
      <button
        type="button"
        className="btn btn-link p-0 text-decoration-none w-100 d-flex justify-content-between align-items-center text-start"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setExpanded(!expanded);
        }}
        style={{ color: GREEN, fontSize: "0.76rem", fontWeight: "600" }}
      >
        <span>
          Also available from {alternatives.length} other seller{alternatives.length > 1 ? "s" : ""} nearby (from {formatPrice(minPrice)})
        </span>
        {expanded ? <FaChevronUp size={10} className="ms-1" /> : <FaChevronDown size={10} className="ms-1" />}
      </button>

      {expanded && (
        <div className="alt-sellers-list mt-2 d-flex flex-column gap-2" style={{ background: "#f8fafc", padding: "8px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
          {alternatives.map((alt) => (
            <div
              key={alt.vendor_product_id}
              className="d-flex justify-content-between align-items-center p-2 rounded bg-white"
              style={{ border: "1px solid #edf2f7", fontSize: "0.75rem" }}
            >
              <div className="me-2" style={{ minWidth: 0 }}>
                <div className="fw-bold text-truncate" style={{ color: NAVY }}>
                  <FaStore size={10} className="me-1 text-muted" />
                  {alt.store_name || alt.vendor_name || "Nearby Store"}
                </div>
                <div className="text-muted d-flex align-items-center gap-1 mt-0.5">
                  <FaMapMarkerAlt size={9} style={{ color: GREEN }} />
                  <span>{alt.distance_km} km away</span>
                  <span>•</span>
                  <span className="text-success fw-medium">Stock: {alt.stock}</span>
                </div>
              </div>

              <div className="d-flex align-items-center gap-2 flex-shrink-0">
                <span className="fw-bold" style={{ color: GREEN, fontSize: "0.82rem" }}>
                  {formatPrice(alt.sale_price ?? alt.price)}
                </span>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-success py-0 px-2"
                  style={{ fontSize: "0.72rem", height: "26px" }}
                  onClick={(e) => handleAddAlt(e, alt)}
                  title="Add this seller's item to cart"
                >
                  <FaShoppingCart size={10} className="me-1" />
                  Add
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AlternativeSellers;
