import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  FaShoppingCart,
  FaHeart,
  FaMinus,
  FaPlus,
  FaUser,
  FaMapMarkerAlt,
  FaPhone,
  FaClock,
  FaChevronRight,
  FaStore,
  FaShieldAlt,
  FaTruck,
} from "react-icons/fa";
import ProductService from "../services/productService";
import CategoryService from "../services/categoryService";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { formatPrice } from "../utils/helpers";

const NAVY = "#00204E";
const NAVY_DEEP = "#00152F";
const GREEN = "#34A129";
const GREEN_DEEP = "#278A1E";
const GREEN_SOFT = "#EAF7E8";
const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600";

const DEFAULT_DESCRIPTION =
  "No description available for this product yet. Check back soon, or contact us if you'd like more details before you buy.";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [relatedLoading, setRelatedLoading] = useState(false);

  useEffect(() => {
    loadProduct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadProduct = async () => {
    setLoading(true);
    const result = await ProductService.getProductDetail(id);
    if (result.success) {
      setProduct(result.data);
      setSelectedImage(0);
      setQuantity(1);
      loadRelatedProducts(result.data);
    } else {
      navigate("/products");
    }
    setLoading(false);
  };

  const loadRelatedProducts = async (currentProduct) => {
    if (!currentProduct?.category_id) {
      setRelatedProducts([]);
      return;
    }
    setRelatedLoading(true);
    const result = await CategoryService.getProductsByCategory(
      currentProduct.category_id,
    );
    if (result.success) {
      const filtered = (result.data || []).filter(
        (p) => String(p.id) !== String(currentProduct.id),
      );
      setRelatedProducts(filtered);
    } else {
      setRelatedProducts([]);
    }
    setRelatedLoading(false);
  };

  const handleAddToCart = () => {
    addToCart(product, quantity);
  };

  const handleQuantityChange = (change) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1 && newQuantity <= 99) {
      setQuantity(newQuantity);
    }
  };

  if (loading) {
    return (
      <div className="pd-loading-screen">
        <div className="pd-loading-spinner" />
      </div>
    );
  }

  if (!product) return null;

  const images = [
    product.image_url || FALLBACK_IMG,
    ...(product.gallery_urls || []),
  ];
  const inWishlist = isInWishlist(product.id);

  return (
    <div className="product-detail-page">
      <style>{`
        * { box-sizing: border-box; }
        .product-detail-page { background: #f3f6fa; font-family: 'Poppins', sans-serif; min-height: 100vh; }

        .pd-loading-screen { min-height: 70vh; display: flex; align-items: center; justify-content: center; }
        .pd-loading-spinner {
          width: 42px; height: 42px; border-radius: 50%;
          border: 4px solid ${GREEN_SOFT}; border-top-color: ${GREEN};
          animation: pdSpin 0.8s linear infinite;
        }
        @keyframes pdSpin { to { transform: rotate(360deg); } }

        .pd-wrap { max-width: 1180px; margin: 0 auto; padding: 1.5rem 1rem 3rem; }

        /* ---------- Breadcrumb ---------- */
        .pd-breadcrumb {
          display: flex; align-items: center; flex-wrap: wrap; gap: 0.35rem;
          font-size: 0.82rem; margin-bottom: 1.25rem; color: #94a3b8;
        }
        .pd-breadcrumb a { color: #64748b; text-decoration: none; font-weight: 500; }
        .pd-breadcrumb a:hover { color: ${GREEN_DEEP}; }
        .pd-breadcrumb .pd-crumb-active { color: ${GREEN_DEEP}; font-weight: 700; }
        .pd-breadcrumb svg { opacity: 0.5; }

        /* ---------- Top grid ---------- */
        .pd-top-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.25rem;
          margin-bottom: 2.5rem;
        }
        @media (min-width: 992px) {
          .pd-top-grid { grid-template-columns: 1fr 1fr; align-items: start; }
        }

        /* ---------- Gallery ---------- */
        .pd-gallery-card {
          background: #fff; border-radius: 18px;
          box-shadow: 0 4px 20px rgba(0,32,78,0.06);
          padding: 1.1rem;
        }
        @media (min-width: 992px) { .pd-gallery-card { position: sticky; top: 1rem; } }

        .pd-main-img-wrap {
          aspect-ratio: 1 / 1; background: #f6f8fb; border-radius: 14px;
          display: flex; align-items: center; justify-content: center; overflow: hidden;
          margin-bottom: 0.85rem; position: relative;
        }
        .pd-main-img-wrap img { width: 100%; height: 100%; object-fit: contain; padding: 1.5rem; }

        .pd-thumb-row { display: flex; gap: 0.6rem; overflow-x: auto; padding-bottom: 2px; scrollbar-width: none; }
        .pd-thumb-row::-webkit-scrollbar { display: none; }
        .pd-thumb {
          flex: 0 0 64px; width: 64px; height: 64px; background: #f6f8fb; border-radius: 10px; overflow: hidden;
          display: flex; align-items: center; justify-content: center; cursor: pointer;
          border: 2px solid transparent; transition: border-color .15s ease, opacity .15s ease;
          opacity: 0.65;
        }
        .pd-thumb img { width: 100%; height: 100%; object-fit: contain; padding: 0.35rem; }
        .pd-thumb.active { border-color: ${GREEN}; opacity: 1; }

        /* ---------- Info panel ---------- */
        .pd-info-card { background: #fff; border-radius: 18px; box-shadow: 0 4px 20px rgba(0,32,78,0.06); padding: 1.5rem; }

        .pd-category-badge {
          background: ${GREEN_SOFT}; color: ${GREEN_DEEP};
          font-weight: 700; font-size: 0.72rem; letter-spacing: 0.02em;
          padding: 0.38rem 0.85rem; border-radius: 999px;
          display: inline-block; text-decoration: none; text-transform: uppercase;
          margin-bottom: 0.85rem; transition: background 0.15s ease;
        }
        .pd-category-badge:hover { background: ${GREEN}; color: #fff; }

        .pd-name { color: ${NAVY}; font-weight: 800; font-size: 1.5rem; line-height: 1.3; margin: 0 0 0.65rem; }

        .pd-price-row { display: flex; align-items: baseline; gap: 0.6rem; margin-bottom: 0.35rem; }
        .pd-price { color: ${GREEN_DEEP}; font-weight: 800; font-size: 1.85rem; margin: 0; }
        .pd-sku { color: #94a3b8; font-size: 0.78rem; margin-bottom: 1.1rem; }

        .pd-description {
          color: #64748b; font-size: 0.9rem; line-height: 1.65;
          padding: 0.9rem 1rem; background: #f8fafc; border-radius: 12px;
          border-left: 3px solid ${GREEN}; margin-bottom: 1.35rem;
        }

        .pd-trust-row { display: flex; gap: 0.6rem; flex-wrap: wrap; margin-bottom: 1.35rem; }
        .pd-trust-chip {
          display: flex; align-items: center; gap: 0.4rem;
          background: #f8fafc; color: ${NAVY}; font-size: 0.72rem; font-weight: 600;
          padding: 0.4rem 0.7rem; border-radius: 8px;
        }
        .pd-trust-chip svg { color: ${GREEN}; }

        /* ---------- Seller card ---------- */
        .pd-vendor-card {
          border-radius: 14px; padding: 1.1rem;
          background: linear-gradient(135deg, #fbfcfe 0%, #f2f6fb 100%);
          border: 1px solid #e7ecf3;
          margin-bottom: 1.5rem;
        }
        .pd-vendor-title {
          display: flex; align-items: center; gap: 0.4rem;
          font-weight: 700; color: ${NAVY}; font-size: 0.72rem;
          margin-bottom: 0.9rem; text-transform: uppercase; letter-spacing: 0.06em;
        }
        .pd-vendor-body { display: flex; align-items: flex-start; gap: 0.9rem; }
        .pd-vendor-photo-wrap {
          width: 56px; height: 56px; border-radius: 12px; overflow: hidden;
          background: #f4f6f9; border: 1px solid #e7ecf3;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .pd-vendor-photo-wrap img { width: 100%; height: 100%; object-fit: cover; }
        .pd-vendor-name { font-weight: 700; color: ${NAVY}; font-size: 1rem; margin-bottom: 0.5rem; }
        .pd-vendor-detail {
          font-size: 0.8rem; color: #64748b; margin-bottom: 0.3rem;
          display: flex; align-items: center; gap: 0.45rem;
        }
        .pd-vendor-detail svg { color: #9aa5b5; flex-shrink: 0; }
        .pd-vendor-detail strong { color: ${NAVY}; font-weight: 600; }

        /* ---------- Quantity stepper ---------- */
        .pd-qty-label { font-weight: 700; color: ${NAVY}; font-size: 0.85rem; margin-bottom: 0.55rem; display: block; }
        .pd-qty-stepper {
          display: inline-flex; align-items: center; border: 1.5px solid #e2e8f0;
          border-radius: 10px; overflow: hidden; margin-bottom: 1.4rem;
        }
        .pd-qty-btn {
          width: 42px; height: 42px; border: none; background: #fff; color: ${NAVY};
          display: flex; align-items: center; justify-content: center; cursor: pointer;
          transition: background 0.15s ease;
        }
        .pd-qty-btn:hover:not(:disabled) { background: ${GREEN_SOFT}; color: ${GREEN_DEEP}; }
        .pd-qty-btn:disabled { opacity: 0.35; cursor: not-allowed; }
        .pd-qty-value {
          width: 46px; text-align: center; font-weight: 700; color: ${NAVY};
          font-size: 0.95rem; border-left: 1.5px solid #e2e8f0; border-right: 1.5px solid #e2e8f0;
          height: 42px; display: flex; align-items: center; justify-content: center;
        }

        /* ---------- CTAs ---------- */
        .pd-desktop-actions { display: flex; flex-direction: column; gap: 0.65rem; }
        .pd-btn-cta {
          background: ${GREEN}; color: #fff; border: none; font-weight: 700;
          border-radius: 12px; padding: 0.85rem 1.25rem; font-size: 0.95rem;
          display: flex; align-items: center; justify-content: center; gap: 0.55rem;
          cursor: pointer; transition: background 0.18s ease;
        }
        .pd-btn-cta:hover { background: ${GREEN_DEEP}; }
        .pd-btn-wish {
          background: #fff; border: 1.5px solid #f1c3ca; color: #dc3545; font-weight: 700;
          border-radius: 12px; padding: 0.8rem 1.25rem; font-size: 0.9rem;
          display: flex; align-items: center; justify-content: center; gap: 0.55rem;
          cursor: pointer; transition: all 0.18s ease;
        }
        .pd-btn-wish:hover { background: #fff5f5; }
        .pd-btn-wish.active { background: #dc3545; border-color: #dc3545; color: #fff; }

        /* ---------- Mobile sticky bar ---------- */
        .pd-mobile-bar {
          position: fixed; left: 0; right: 0; bottom: 0; z-index: 1030;
          background: #fff; border-top: 1px solid #e7eaf0;
          box-shadow: 0 -6px 20px rgba(0,32,78,0.1);
          padding: 0.65rem 0.9rem; padding-bottom: max(0.65rem, env(safe-area-inset-bottom));
          display: flex; align-items: center; gap: 0.65rem;
        }
        .pd-mobile-price { color: ${GREEN_DEEP}; font-weight: 800; font-size: 1.05rem; white-space: nowrap; }
        .pd-mobile-wish {
          width: 46px; height: 46px; border-radius: 12px; flex-shrink: 0;
          border: 1.5px solid #e2e8f0; background: #fff;
          display: flex; align-items: center; justify-content: center; cursor: pointer;
        }
        .pd-mobile-wish.active { border-color: #dc3545; background: #fff5f5; }
        .pd-mobile-cta {
          flex: 1; background: ${GREEN}; color: #fff; border: none; font-weight: 700;
          border-radius: 12px; padding: 0.85rem; font-size: 0.9rem;
          display: flex; align-items: center; justify-content: center; gap: 0.5rem; cursor: pointer;
        }

        /* ---------- Related products ---------- */
        .pd-related-section { margin-top: 1rem; }
        .pd-related-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 1.15rem; flex-wrap: wrap; gap: 0.6rem;
        }
        .pd-related-heading { color: ${NAVY}; font-weight: 800; font-size: 1.15rem; margin: 0; display: flex; align-items: center; gap: 0.5rem; }
        .pd-related-heading .dot { width: 7px; height: 7px; border-radius: 50%; background: ${GREEN}; }
        .pd-viewall-link {
          display: flex; align-items: center; gap: 0.35rem;
          color: ${GREEN_DEEP}; font-weight: 700; font-size: 0.82rem;
          text-decoration: none; border: 1.5px solid ${GREEN}; border-radius: 999px;
          padding: 0.4rem 0.9rem; transition: background 0.15s ease;
        }
        .pd-viewall-link:hover { background: ${GREEN_SOFT}; }

        .pd-related-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.85rem;
          justify-content: start;
        }
        @media (min-width: 640px) { .pd-related-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
        @media (min-width: 992px) { .pd-related-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); } }

        .pd-related-card {
          background: #fff; border-radius: 14px; overflow: hidden;
          box-shadow: 0 3px 12px rgba(0,32,78,0.06);
          transition: transform .18s ease, box-shadow .18s ease;
          display: flex; flex-direction: column;
        }
        .pd-related-card:hover { transform: translateY(-3px); box-shadow: 0 10px 22px rgba(0,32,78,0.14); }
        .pd-related-img-wrap {
          aspect-ratio: 1 / 1; background: #f6f8fb;
          display: flex; align-items: center; justify-content: center; overflow: hidden;
        }
        .pd-related-img-wrap img { width: 100%; height: 100%; object-fit: contain; padding: 0.9rem; }
        .pd-related-body { padding: 0.75rem 0.85rem 0.9rem; display: flex; flex-direction: column; flex: 1; }
        .pd-related-title {
          color: ${NAVY}; font-weight: 600; font-size: 0.85rem; text-decoration: none;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
          min-height: 2.3em; margin-bottom: 0.5rem;
        }
        .pd-related-title:hover { color: ${GREEN_DEEP}; }
        .pd-related-price { color: ${GREEN_DEEP}; font-weight: 800; font-size: 0.95rem; margin-bottom: 0.65rem; }
        .pd-related-btn {
          background: ${GREEN}; color: #fff; border: none; font-weight: 700;
          border-radius: 9px; padding: 0.5rem; font-size: 0.78rem; margin-top: auto;
          display: flex; align-items: center; justify-content: center; gap: 0.4rem; cursor: pointer;
          transition: background 0.15s ease;
        }
        .pd-related-btn:hover { background: ${GREEN_DEEP}; }

        .pd-related-empty {
          background: #fff; border-radius: 14px; padding: 2rem; text-align: center;
          color: #94a3b8; font-size: 0.88rem; box-shadow: 0 3px 12px rgba(0,32,78,0.05);
        }
        .pd-related-loading { display: flex; justify-content: center; padding: 2rem; }

        .pd-mobile-bar { display: flex; }
        @media (min-width: 768px) {
          .pd-mobile-bar { display: none; }
        }
        @media (max-width: 767.98px) {
          .pd-desktop-actions { display: none; }
          .pd-page-bottom-pad { padding-bottom: 84px; }
        }
      `}</style>

      <div className="pd-wrap pd-page-bottom-pad">
        {/* Breadcrumb */}
        <nav aria-label="breadcrumb" className="pd-breadcrumb">
          <Link to="/">Home</Link>
          <FaChevronRight size={9} />
          <Link to="/products">Products</Link>
          <FaChevronRight size={9} />
          <span className="pd-crumb-active">{product.name}</span>
        </nav>

        <div className="pd-top-grid">
          {/* Gallery */}
          <div className="pd-gallery-card">
            <div className="pd-main-img-wrap">
              <img src={images[selectedImage]} alt={product.name} />
            </div>

            {images.length > 1 && (
              <div className="pd-thumb-row">
                {images.map((img, index) => (
                  <div
                    key={index}
                    className={`pd-thumb ${selectedImage === index ? "active" : ""}`}
                    onClick={() => setSelectedImage(index)}
                  >
                    <img src={img} alt={`${product.name} ${index + 1}`} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="pd-info-card">
            {product.category_name && (
              <Link
                to={`/categories/${product.category_id}`}
                className="pd-category-badge"
              >
                {product.category_name}
              </Link>
            )}

            <h1 className="pd-name">{product.name}</h1>

            <div className="pd-price-row">
              <p className="pd-price">{formatPrice(product.price)}</p>
            </div>
            {product.sku && <p className="pd-sku">SKU: {product.sku}</p>}

            <p className="pd-description">
              {product.description || DEFAULT_DESCRIPTION}
            </p>

            <div className="pd-trust-row">
              <div className="pd-trust-chip">
                <FaTruck size={12} /> Fast delivery
              </div>
              <div className="pd-trust-chip">
                <FaShieldAlt size={12} /> Quality checked
              </div>
            </div>

            {product.store_name && (
              <div className="pd-vendor-card">
                <div className="pd-vendor-title">
                  <FaStore size={12} /> Seller information
                </div>
                <div className="pd-vendor-body">
                  <div className="pd-vendor-photo-wrap">
                    <img
                      src={product.store_photo_url || FALLBACK_IMG}
                      alt={product.store_name}
                    />
                  </div>
                  <div className="flex-grow-1">
                    <div className="pd-vendor-name">{product.store_name}</div>
                    {product.vendor_name && (
                      <div className="pd-vendor-detail">
                        <FaUser size={11} />
                        <span>
                          <strong>Merchant:</strong> {product.vendor_name}
                        </span>
                      </div>
                    )}
                    {product.store_contact && (
                      <div className="pd-vendor-detail">
                        <FaPhone size={11} />
                        <span>
                          <strong>Contact:</strong> {product.store_contact}
                        </span>
                      </div>
                    )}
                    {product.store_address && (
                      <div className="pd-vendor-detail">
                        <FaMapMarkerAlt size={11} />
                        <span>
                          <strong>Location:</strong> {product.store_address}
                        </span>
                      </div>
                    )}
                    {product.store_opening_time &&
                      product.store_closing_time && (
                        <div className="pd-vendor-detail">
                          <FaClock size={11} />
                          <span>
                            <strong>Hours:</strong>{" "}
                            {product.store_opening_time.substring(0, 5)} -{" "}
                            {product.store_closing_time.substring(0, 5)}
                          </span>
                        </div>
                      )}
                  </div>
                </div>
              </div>
            )}

            <label className="pd-qty-label">Quantity</label>
            <div className="pd-qty-stepper">
              <button
                className="pd-qty-btn"
                onClick={() => handleQuantityChange(-1)}
                disabled={quantity <= 1}
                aria-label="Decrease quantity"
              >
                <FaMinus size={11} />
              </button>
              <div className="pd-qty-value">{quantity}</div>
              <button
                className="pd-qty-btn"
                onClick={() => handleQuantityChange(1)}
                disabled={quantity >= 99}
                aria-label="Increase quantity"
              >
                <FaPlus size={11} />
              </button>
            </div>

            {/* Desktop / tablet actions */}
            <div className="pd-desktop-actions">
              <button className="pd-btn-cta" onClick={handleAddToCart}>
                <FaShoppingCart size={14} />
                Add to Cart
              </button>
              <button
                className={`pd-btn-wish ${inWishlist ? "active" : ""}`}
                onClick={() => toggleWishlist(product)}
              >
                <FaHeart size={14} />
                {inWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
              </button>
            </div>
          </div>
        </div>

        {/* More Products from this Category */}
        {product.category_id && (
          <div className="pd-related-section">
            <div className="pd-related-header">
              <h4 className="pd-related-heading">
                <span className="dot" />
                {product.category_name
                  ? `More from ${product.category_name}`
                  : "More Products"}
              </h4>
              <Link
                to={`/categories/${product.category_id}`}
                className="pd-viewall-link"
              >
                View all <FaChevronRight size={10} />
              </Link>
            </div>

            {relatedLoading ? (
              <div className="pd-related-loading">
                <div className="pd-loading-spinner" />
              </div>
            ) : relatedProducts.length === 0 ? (
              <div className="pd-related-empty">
                No other products found in this category yet.
              </div>
            ) : (
              <div className="pd-related-grid">
                {relatedProducts.map((relatedProduct) => (
                  <div key={relatedProduct.id} className="pd-related-card">
                    <div className="pd-related-img-wrap">
                      <Link to={`/product/${relatedProduct.id}`}>
                        <img
                          src={relatedProduct.image_url || FALLBACK_IMG}
                          alt={relatedProduct.name}
                          loading="lazy"
                        />
                      </Link>
                    </div>
                    <div className="pd-related-body">
                      <Link
                        to={`/product/${relatedProduct.id}`}
                        className="pd-related-title"
                      >
                        {relatedProduct.name}
                      </Link>
                      <span className="pd-related-price">
                        {formatPrice(relatedProduct.price)}
                      </span>
                      <button
                        className="pd-related-btn"
                        onClick={() => addToCart(relatedProduct)}
                      >
                        <FaShoppingCart size={12} /> Add to Cart
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile sticky action bar */}
      <div className="pd-mobile-bar">
        <button
          className={`pd-mobile-wish ${inWishlist ? "active" : ""}`}
          onClick={() => toggleWishlist(product)}
          aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
        >
          <FaHeart size={17} color={inWishlist ? "#dc3545" : "#94a3b8"} />
        </button>
        <span className="pd-mobile-price">{formatPrice(product.price)}</span>
        <button className="pd-mobile-cta" onClick={handleAddToCart}>
          <FaShoppingCart size={14} />
          Add to Cart
        </button>
      </div>
    </div>
  );
};

export default ProductDetail;
