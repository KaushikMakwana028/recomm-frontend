import React from "react";
import { Link } from "react-router-dom";
import {
  FaHeart,
  FaShoppingCart,
  FaTrash,
  FaStar,
  FaTimes,
} from "react-icons/fa";
import { useWishlist } from "../context/WishlistContext";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { formatPrice, getImageUrl } from "../utils/helpers";

const NAVY = "#00204E";
const GREEN = "#34A129";

const Wishlist = () => {
  const { wishlistItems, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { showToast } = useToast();

  const handleMoveToCart = (product) => {
    addToCart(product, 1);
    removeFromWishlist(product.id);
  };

  const handleAddAllToCart = async () => {
    if (wishlistItems.length === 0) return;
    for (const item of wishlistItems) {
      await addToCart(item, 1, true);
    }
    await clearWishlist();
    showToast("Added all wishlist items to cart!", "success");
  };

  if (wishlistItems.length === 0) {
    return (
      <div className="wl-page bg-light">
        <style>{`
          .wl-empty-card {
            background: #fff; border-radius: 18px; box-shadow: 0 6px 24px rgba(0,32,78,0.08);
            padding: 3rem 2rem;
          }
          .wl-empty-icon {
            width: 96px; height: 96px; border-radius: 50%; background: #fdeef0;
            display: flex; align-items: center; justify-content: center; margin: 0 auto 1.5rem;
            color: #e0455e;
          }
        `}</style>
        <div className="container py-5">
          <div className="row justify-content-center">
            <div className="col-11 col-sm-8 col-lg-5 text-center">
              <div className="wl-empty-card">
                <div className="wl-empty-icon">
                  <FaHeart size={40} />
                </div>
                <h3 style={{ color: NAVY, fontWeight: 800 }} className="mb-2">
                  Your Wishlist is Empty
                </h3>
                <p className="text-muted mb-4">
                  Save your favorite items here and shop when you're ready!
                </p>
                <Link
                  to="/products"
                  className="btn text-white fw-bold px-5 py-2"
                  style={{ background: GREEN, borderRadius: "10px" }}
                >
                  Discover Products
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="wl-page bg-light">
      <style>{`
        .wl-wrap { padding-top: 1.75rem; padding-bottom: 3rem; }
        .wl-title { color: ${NAVY}; font-weight: 800; display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; }
        .wl-count-badge {
          background: rgba(52,161,41,0.12); color: ${GREEN}; font-size: 0.72rem; font-weight: 800;
          border-radius: 999px; padding: 0.3rem 0.7rem;
        }
        .wl-breadcrumb a { color: ${GREEN}; text-decoration: none; }
        .wl-breadcrumb a:hover { color: ${NAVY}; }
        .wl-breadcrumb .active { color: #98a2b8; font-weight: 600; }

        .wl-actions { display: flex; gap: 0.6rem; flex-wrap: wrap; }
        .wl-btn-add {
          background: ${GREEN}; border: none; color: #fff; font-weight: 700; font-size: 0.85rem;
          padding: 0.55rem 1.1rem; border-radius: 10px; display: flex; align-items: center; gap: 0.5rem;
          white-space: nowrap;
        }
        .wl-btn-add:hover { background: #2c8c22; color: #fff; }
        .wl-btn-clear {
          background: #fff; border: 1.5px solid #f0c3cb; color: #d8465f; font-weight: 700; font-size: 0.85rem;
          padding: 0.55rem 1.1rem; border-radius: 10px; display: flex; align-items: center; gap: 0.5rem;
          white-space: nowrap;
        }
        .wl-btn-clear:hover { background: #fdf2f2; }

        /* ---------- Card ---------- */
        .wl-card {
          background: #fff; border-radius: 14px; overflow: hidden; height: 100%;
          box-shadow: 0 3px 12px rgba(0,32,78,0.08); transition: transform .18s ease, box-shadow .18s ease;
          display: flex; flex-direction: column;
        }
        .wl-card:hover { transform: translateY(-3px); box-shadow: 0 10px 22px rgba(0,32,78,0.14); }

        .wl-img-wrap {
          position: relative; aspect-ratio: 1 / 1; background: #f4f6f9;
          display: flex; align-items: center; justify-content: center; overflow: hidden;
        }
        .wl-img-wrap img {
          width: 100%; height: 100%; object-fit: contain; padding: 1rem; transition: transform .25s ease;
        }
        .wl-card:hover .wl-img-wrap img { transform: scale(1.04); }

        .wl-remove-btn {
          position: absolute; top: 8px; right: 8px; width: 32px; height: 32px; border-radius: 50%;
          background: rgba(255,255,255,0.95); border: none; color: #d8465f;
          display: flex; align-items: center; justify-content: center; z-index: 2;
          box-shadow: 0 2px 6px rgba(0,0,0,0.15);
        }
        .wl-remove-btn:hover { background: #d8465f; color: #fff; }

        .wl-cat-badge {
          background: rgba(52,161,41,0.1); color: ${GREEN}; font-size: 0.72rem; font-weight: 700;
          border-radius: 999px; padding: 0.25rem 0.65rem; align-self: flex-start; text-transform: capitalize;
        }

        .wl-name {
          color: ${NAVY}; font-weight: 700; font-size: 0.92rem; text-decoration: none;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
          min-height: 2.4em;
        }
        .wl-name:hover { color: ${GREEN}; }

        .wl-desc { color: #98a2b8; font-size: 0.8rem; }

        .wl-price { color: ${GREEN}; font-weight: 800; font-size: 1.05rem; }
        .wl-price-old { color: #98a2b8; text-decoration: line-through; font-size: 0.8rem; }

        .wl-move-btn {
          width: 100%; background: ${GREEN}; border: none; color: #fff; font-weight: 700;
          padding: 0.6rem; border-radius: 10px; display: flex; align-items: center; justify-content: center;
          gap: 0.5rem; font-size: 0.87rem; margin-top: auto;
        }
        .wl-move-btn:hover { background: #2c8c22; }

        .wl-continue-wrap { text-align: center; margin-top: 2.5rem; }
        .wl-continue-btn {
          display: inline-flex; align-items: center; gap: 0.5rem; border: 1.5px solid ${NAVY};
          color: ${NAVY}; font-weight: 700; padding: 0.65rem 1.6rem; border-radius: 10px; text-decoration: none;
        }
        .wl-continue-btn:hover { background: ${NAVY}; color: #fff; }

        @media (max-width: 575.98px) {
          .wl-title { font-size: 1.25rem; }
          .wl-wrap { padding-top: 1.1rem; padding-bottom: 2rem; }
          .wl-actions { width: 100%; }
          .wl-actions button { flex: 1; justify-content: center; }
        }
      `}</style>

      <div className="container wl-wrap">
        {/* Page Header */}
        <div className="row mb-3">
          <div className="col-12">
            <h2 className="wl-title mb-2">
              <FaHeart className="text-danger" />
              My Wishlist
              <span className="wl-count-badge">
                {wishlistItems.length} item
                {wishlistItems.length !== 1 ? "s" : ""}
              </span>
            </h2>
            <nav aria-label="breadcrumb" className="wl-breadcrumb mb-3">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link to="/">Home</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  Wishlist
                </li>
              </ol>
            </nav>
          </div>
        </div>

        <div className="row mb-4">
          <div className="col-12 wl-actions">
            <button className="wl-btn-add" onClick={handleAddAllToCart}>
              <FaShoppingCart size={13} /> Add All to Cart
            </button>
            <button className="wl-btn-clear" onClick={clearWishlist}>
              <FaTrash size={13} /> Clear All
            </button>
          </div>
        </div>

        {/* Wishlist Grid */}
        <div className="row g-3 g-md-4">
          {wishlistItems.map((product) => (
            <div key={product.id} className="col-6 col-md-4 col-lg-3">
              <div className="wl-card">
                <div className="wl-img-wrap">
                  <Link to={`/product/${product.id}`}>
                    <img
                      src={getImageUrl(product.image)}
                      alt={product.name}
                      loading="lazy"
                    />
                  </Link>
                  <button
                    className="wl-remove-btn"
                    onClick={() => removeFromWishlist(product.id)}
                    aria-label={`Remove ${product.name} from wishlist`}
                  >
                    <FaTimes size={12} />
                  </button>
                </div>

                <div className="card-body d-flex flex-column p-3">
                  {product.category && (
                    <span className="wl-cat-badge mb-2">
                      {product.category}
                    </span>
                  )}

                  <Link
                    to={`/product/${product.id}`}
                    className="wl-name d-block mb-1"
                  >
                    {product.name}
                  </Link>

                  {product.description && (
                    <p className="wl-desc mb-2">
                      {product.description.length > 60
                        ? product.description.substring(0, 60) + "..."
                        : product.description}
                    </p>
                  )}

                  {product.rating && (
                    <div className="d-flex align-items-center mb-2">
                      <div className="text-warning me-1 d-flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <FaStar
                            key={i}
                            size={11}
                            className={
                              i < Math.floor(product.rating)
                                ? "text-warning"
                                : "text-muted"
                            }
                          />
                        ))}
                      </div>
                      <small className="text-muted">
                        ({product.reviews || 0})
                      </small>
                    </div>
                  )}

                  <div className="mb-3 d-flex align-items-baseline gap-2">
                    <span className="wl-price">
                      {formatPrice(product.price)}
                    </span>
                    {product.originalPrice && (
                      <span className="wl-price-old">
                        {formatPrice(product.originalPrice)}
                      </span>
                    )}
                  </div>

                  <button
                    className="wl-move-btn"
                    onClick={() => handleMoveToCart(product)}
                  >
                    <FaShoppingCart size={13} /> Move to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Continue Shopping */}
        <div className="wl-continue-wrap">
          <Link to="/products" className="wl-continue-btn">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Wishlist;
