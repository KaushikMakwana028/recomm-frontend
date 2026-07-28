import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { FaShoppingCart, FaHeart, FaMinus, FaPlus, FaUser, FaMapMarkerAlt, FaPhone, FaClock } from "react-icons/fa";
import ProductService from "../services/productService";
import CategoryService from "../services/categoryService";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { formatPrice } from "../utils/helpers";

const NAVY = "#00204E";
const GREEN = "#34A129";
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
    const result = await CategoryService.getProductsByCategory(currentProduct.category_id);
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
      <div className="container py-5">
        <div className="text-center">
          <div
            className="spinner-border"
            style={{ color: GREEN }}
            role="status"
          >
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
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
    <div className="product-detail-page bg-light">
      <style>{`
        .pd-wrap { padding-top: 1.75rem; padding-bottom: 3rem; }
        .pd-breadcrumb a { color: #6c7a90; text-decoration: none; }
        .pd-breadcrumb a:hover { color: ${NAVY}; }
        .pd-breadcrumb .active { color: ${GREEN}; font-weight: 600; }

        .pd-gallery-card, .pd-info-card { border: none; border-radius: 16px; box-shadow: 0 4px 16px rgba(0,32,78,0.08); }

        .pd-main-img-wrap {
          aspect-ratio: 1 / 1; background: #f4f6f9; border-radius: 12px;
          display: flex; align-items: center; justify-content: center; overflow: hidden;
        }
        .pd-main-img-wrap img { width: 100%; height: 100%; object-fit: contain; padding: 1.25rem; }

        .pd-thumb {
          aspect-ratio: 1 / 1; background: #f4f6f9; border-radius: 10px; overflow: hidden;
          display: flex; align-items: center; justify-content: center; cursor: pointer;
          border: 2px solid transparent; transition: border-color .15s ease;
        }
        .pd-thumb img { width: 100%; height: 100%; object-fit: contain; padding: 0.4rem; }
        .pd-thumb.active { border-color: ${GREEN}; }

        .pd-category-badge {
          background: rgba(52,161,41,0.1); color: ${GREEN};
          font-weight: 700; font-size: 0.75rem; padding: 0.4rem 0.85rem;
          border-radius: 999px; display: inline-block; text-decoration: none;
        }
        .pd-category-badge:hover { background: ${GREEN}; color: #fff; }

        .pd-name { color: ${NAVY}; font-weight: 800; }
        .pd-price { color: ${GREEN}; font-weight: 800; }

        .pd-qty-btn { border: 1px solid #dde3ec; background: #fff; color: ${NAVY}; }
        .pd-qty-btn:disabled { opacity: 0.4; }
        .pd-qty-input { border-top: 1px solid #dde3ec; border-bottom: 1px solid #dde3ec; font-weight: 700; color: ${NAVY}; }

        .pd-btn-cta { background: ${GREEN}; border-color: ${GREEN}; font-weight: 700; }
        .pd-btn-cta:hover { background: #2c8c22; border-color: #2c8c22; }
        .pd-btn-wish { border-width: 2px; font-weight: 600; }
        .pd-btn-wish.active { background: #dc3545; border-color: #dc3545; }

        .pd-mobile-bar {
          position: fixed; left: 0; right: 0; bottom: 0; z-index: 1030;
          background: #fff; border-top: 1px solid #e7eaf0;
          box-shadow: 0 -4px 16px rgba(0,32,78,0.1);
          padding: 0.65rem 0.85rem; padding-bottom: max(0.65rem, env(safe-area-inset-bottom));
          display: flex; align-items: center; gap: 0.6rem;
        }
        .pd-mobile-price { color: ${GREEN}; font-weight: 800; font-size: 1.05rem; white-space: nowrap; }
        .pd-mobile-wish {
          width: 44px; height: 44px; border-radius: 10px; flex-shrink: 0;
          border: 1.5px solid #dde3ec; background: #fff;
          display: flex; align-items: center; justify-content: center;
        }
        .pd-mobile-wish.active { border-color: #dc3545; background: #fff5f5; }

        .pd-related-heading { color: ${NAVY}; font-weight: 800; }
        .pd-related-card {
          border: none; border-radius: 14px; overflow: hidden; height: 100%;
          box-shadow: 0 3px 12px rgba(0,32,78,0.08);
          transition: transform .18s ease, box-shadow .18s ease;
        }
        .pd-related-card:hover { transform: translateY(-3px); box-shadow: 0 10px 22px rgba(0,32,78,0.14); }
        .pd-related-img-wrap {
          aspect-ratio: 1 / 1; background: #f4f6f9;
          display: flex; align-items: center; justify-content: center; overflow: hidden;
        }
        .pd-related-img-wrap img { width: 100%; height: 100%; object-fit: contain; padding: 0.7rem; }
        .pd-related-title {
          color: ${NAVY}; font-weight: 600; font-size: 0.92rem;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
          min-height: 2.4em;
        }
        .pd-related-title:hover { color: ${GREEN}; }
        .pd-related-price { color: ${GREEN}; font-weight: 700; }
        .pd-related-btn { background: ${GREEN}; border-color: ${GREEN}; font-weight: 600; }
        .pd-related-btn:hover { background: #2c8c22; border-color: #2c8c22; }

        .pd-vendor-card {
          border: 1px solid #dde3ec;
          border-radius: 12px;
          padding: 1.25rem;
          background: #fdfdfd;
          box-shadow: 0 2px 8px rgba(0,32,78,0.03);
        }
        .pd-vendor-title {
          font-weight: 700;
          color: ${NAVY};
          font-size: 0.85rem;
          margin-bottom: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .pd-vendor-photo-wrap {
          width: 70px;
          height: 70px;
          border-radius: 10px;
          overflow: hidden;
          background: #f4f6f9;
          border: 1px solid #dde3ec;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .pd-vendor-photo-wrap img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .pd-vendor-name {
          font-weight: 700;
          color: ${NAVY};
          font-size: 1.1rem;
          margin-bottom: 0.4rem;
          text-transform: capitalize;
        }
        .pd-vendor-detail {
          font-size: 0.85rem;
          color: #6c7a90;
          margin-bottom: 0.2rem;
        }
        .pd-vendor-detail strong {
          color: ${NAVY};
        }

        @media (max-width: 767.98px) {
          .pd-desktop-actions { display: none; }
          .pd-page-bottom-pad { padding-bottom: 84px; }
        }
      `}</style>

      <div className="container pd-wrap pd-page-bottom-pad">
        {/* Breadcrumb */}
        <nav aria-label="breadcrumb" className="pd-breadcrumb mb-3 mb-md-4">
          <ol className="breadcrumb mb-0">
            <li className="breadcrumb-item">
              <Link to="/">Home</Link>
            </li>
            <li className="breadcrumb-item">
              <Link to="/products">Products</Link>
            </li>
            <li className="breadcrumb-item active" aria-current="page">
              {product.name}
            </li>
          </ol>
        </nav>

        <div className="row g-4 mb-5">
          {/* Product Images */}
          <div className="col-lg-6">
            <div className="pd-gallery-card card">
              <div className="card-body p-3">
                <div className="pd-main-img-wrap mb-3">
                  <img src={images[selectedImage]} alt={product.name} />
                </div>

                {images.length > 1 && (
                  <div className="row g-2">
                    {images.map((img, index) => (
                      <div key={index} className="col-3">
                        <div
                          className={`pd-thumb ${selectedImage === index ? "active" : ""}`}
                          onClick={() => setSelectedImage(index)}
                        >
                          <img src={img} alt={`${product.name} ${index + 1}`} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Product Info */}
          <div className="col-lg-6">
            <div className="pd-info-card card h-100">
              <div className="card-body p-4">
                <h1 className="pd-name fs-3 mb-3">{product.name}</h1>

                {product.category_name && (
                  <div className="mb-3">
                    <Link
                      to={`/categories/${product.category_id}`}
                      className="pd-category-badge"
                    >
                      {product.category_name}
                    </Link>
                  </div>
                )}

                <h2 className="pd-price fs-2 mb-3">
                  {formatPrice(product.price)}
                </h2>

                {product.sku && (
                  <p className="text-muted small mb-3">SKU: {product.sku}</p>
                )}

                <p className="text-muted mb-4">
                  {product.description || DEFAULT_DESCRIPTION}
                </p>

                {product.store_name && (
                  <div className="pd-vendor-card mb-4">
                    <div className="pd-vendor-title">Seller Information</div>
                    <div className="d-flex align-items-start gap-3">
                      {product.store_photo_url && (
                        <div className="pd-vendor-photo-wrap">
                          <img
                            src={product.store_photo_url}
                            alt={product.store_name}
                          />
                        </div>
                      )}
                      <div className="flex-grow-1">
                        <div className="pd-vendor-name">{product.store_name}</div>
                        {product.vendor_name && (
                          <div className="pd-vendor-detail d-flex align-items-center gap-2">
                            <FaUser size={12} className="text-muted" />
                            <span><strong>Merchant:</strong> {product.vendor_name}</span>
                          </div>
                        )}
                        {product.store_contact && (
                          <div className="pd-vendor-detail d-flex align-items-center gap-2">
                            <FaPhone size={12} className="text-muted" />
                            <span><strong>Contact:</strong> {product.store_contact}</span>
                          </div>
                        )}
                        {product.store_address && (
                          <div className="pd-vendor-detail d-flex align-items-center gap-2">
                            <FaMapMarkerAlt size={12} className="text-muted" />
                            <span><strong>Location:</strong> {product.store_address}</span>
                          </div>
                        )}
                        {product.store_opening_time && product.store_closing_time && (
                          <div className="pd-vendor-detail d-flex align-items-center gap-2">
                            <FaClock size={12} className="text-muted" />
                            <span>
                              <strong>Hours:</strong> {product.store_opening_time.substring(0, 5)} - {product.store_closing_time.substring(0, 5)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="mb-4">
                  <label className="form-label fw-bold" style={{ color: NAVY }}>
                    Quantity
                  </label>
                  <div
                    className="d-flex align-items-stretch"
                    style={{ maxWidth: "150px" }}
                  >
                    <button
                      className="pd-qty-btn rounded-start"
                      style={{ width: "40px" }}
                      onClick={() => handleQuantityChange(-1)}
                      disabled={quantity <= 1}
                      aria-label="Decrease quantity"
                    >
                      <FaMinus size={12} />
                    </button>
                    <input
                      type="text"
                      className="pd-qty-input form-control text-center px-1"
                      value={quantity}
                      readOnly
                    />
                    <button
                      className="pd-qty-btn rounded-end"
                      style={{ width: "40px" }}
                      onClick={() => handleQuantityChange(1)}
                      disabled={quantity >= 99}
                      aria-label="Increase quantity"
                    >
                      <FaPlus size={12} />
                    </button>
                  </div>
                </div>

                {/* Desktop / tablet actions */}
                <div className="pd-desktop-actions d-grid gap-2">
                  <button
                    className="btn pd-btn-cta btn-lg text-white"
                    onClick={handleAddToCart}
                  >
                    <FaShoppingCart className="me-2" />
                    Add to Cart
                  </button>
                  <button
                    className={`btn pd-btn-wish ${inWishlist ? "active text-white" : "btn-outline-danger"}`}
                    onClick={() => toggleWishlist(product)}
                  >
                    <FaHeart className="me-2" />
                    {inWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* More Products from this Category */}
        {product.category_id && (
          <div className="row">
            <div className="col-12">
              <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
                <h4 className="pd-related-heading mb-0">
                  {product.category_name
                    ? `More from ${product.category_name}`
                    : "More Products"}
                </h4>
                <Link
                  to={`/categories/${product.category_id}`}
                  className="btn btn-outline-primary btn-sm"
                >
                  View All
                </Link>
              </div>

              {relatedLoading ? (
                <div className="text-center py-4">
                  <div
                    className="spinner-border"
                    style={{ color: GREEN }}
                    role="status"
                  >
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : relatedProducts.length === 0 ? (
                <p className="text-muted">
                  No other products found in this category.
                </p>
              ) : (
                <div className="row g-3 g-md-4">
                  {relatedProducts.map((relatedProduct) => (
                    <div
                      key={relatedProduct.id}
                      className="col-6 col-md-4 col-lg-3"
                    >
                      <div className="pd-related-card card">
                        <div className="pd-related-img-wrap">
                          <Link to={`/product/${relatedProduct.id}`}>
                            <img
                              src={relatedProduct.image_url || FALLBACK_IMG}
                              alt={relatedProduct.name}
                              loading="lazy"
                            />
                          </Link>
                        </div>

                        <div className="card-body pb-2">
                          <Link
                            to={`/product/${relatedProduct.id}`}
                            className="text-decoration-none pd-related-title d-block mb-1"
                          >
                            {relatedProduct.name}
                          </Link>
                          <span className="pd-related-price fs-6">
                            {formatPrice(relatedProduct.price)}
                          </span>
                        </div>

                        <div className="card-footer bg-white border-0 pt-0">
                          <button
                            className="btn pd-related-btn text-white w-100 btn-sm"
                            onClick={() => addToCart(relatedProduct)}
                          >
                            <FaShoppingCart className="me-2" size={13} /> Add to
                            Cart
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Mobile sticky action bar */}
      <div className="pd-mobile-bar d-md-none">
        <button
          className={`pd-mobile-wish ${inWishlist ? "active" : ""}`}
          onClick={() => toggleWishlist(product)}
          aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
        >
          <FaHeart
            size={18}
            className={inWishlist ? "text-danger" : "text-muted"}
          />
        </button>
        <span className="pd-mobile-price">{formatPrice(product.price)}</span>
        <button
          className="btn pd-btn-cta text-white flex-grow-1"
          onClick={handleAddToCart}
        >
          <FaShoppingCart className="me-2" size={14} />
          Add to Cart
        </button>
      </div>
    </div>
  );
};

export default ProductDetail;
