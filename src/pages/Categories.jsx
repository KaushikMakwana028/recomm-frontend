import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import {
  FaShoppingCart,
  FaHeart,
  FaArrowLeft,
  FaThLarge,
} from "react-icons/fa";
import CategoryService from "../services/categoryService";
import NoVendorsEmptyState from "../components/NoVendorsEmptyState";
import {
  ProductGridSkeleton,
  CategoryGridSkeleton,
} from "../components/SkeletonLoaders";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { formatPrice } from "../utils/helpers";

const NAVY = "#00204E";
const GREEN = "#34A129";

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400";

const Categories = () => {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [noNearbyVendors, setNoNearbyVendors] = useState(false);

  // Always load the category list (used for sidebar / grid)
  useEffect(() => {
    loadCategories();
  }, []);

  // When :id changes, load that category's detail + products
  useEffect(() => {
    if (id) {
      loadCategoryProducts(id);
    } else {
      setActiveCategory(null);
      setProducts([]);
    }
  }, [id]);

  const loadCategories = async () => {
    const result = await CategoryService.getCategoryList();
    if (result.success) {
      setCategories(result.data || []);
    }
    if (!id) setLoading(false);
  };

  const loadCategoryProducts = async (categoryId) => {
    setLoading(true);
    setError("");

    let lat = undefined;
    let lng = undefined;
    try {
      const saved = localStorage.getItem("customer_live_location");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.latitude && parsed.longitude) {
          lat = parsed.latitude;
          lng = parsed.longitude;
        }
      }
    } catch (e) {}

    const [detailResult, productsResult] = await Promise.all([
      CategoryService.getCategoryDetail(categoryId),
      CategoryService.getProductsByCategory(categoryId, { latitude: lat, longitude: lng }),
    ]);

    if (detailResult.success) {
      setActiveCategory(detailResult.data);
    } else {
      setError(detailResult.error || "Category not found");
    }

    if (productsResult.success) {
      setProducts(productsResult.data || []);
      setNoNearbyVendors(Boolean(productsResult.no_nearby_vendors));
    } else {
      setNoNearbyVendors(false);
    }

    setLoading(false);
  };

  const handleAddToCart = (product) => {
    addToCart(product);
  };

  return (
    <div className="categories-page">
      <style>{`
        .cp-wrap { padding-top: 2rem; padding-bottom: 3.5rem; }

        .cp-breadcrumb { font-size: 0.85rem; }
        .cp-breadcrumb a { color: #6c7a90; text-decoration: none; }
        .cp-breadcrumb a:hover { color: ${NAVY}; }
        .cp-breadcrumb .active { color: ${GREEN}; font-weight: 600; }

        .cp-hero { text-align: center; margin-bottom: 2.25rem; }
        .cp-hero h2 { color: ${NAVY}; font-weight: 800; margin-bottom: 0.35rem; }
        .cp-hero p { color: #6c7a90; }

        .cp-tile {
          position: relative;
          display: block;
          border-radius: 14px;
          overflow: hidden;
          aspect-ratio: 4 / 3;
          box-shadow: 0 4px 14px rgba(0,32,78,0.1);
          transition: transform .2s ease, box-shadow .2s ease;
        }
        .cp-tile:hover { transform: translateY(-4px); box-shadow: 0 10px 24px rgba(0,32,78,0.18); }

        .cp-tile img {
          width: 100%; height: 100%; object-fit: cover;
          transition: transform .4s ease;
        }
        .cp-tile:hover img { transform: scale(1.08); }

        .cp-tile-overlay {
          position: absolute; inset: 0;
          background: linear-gradient(180deg, rgba(0,32,78,0) 35%, rgba(0,32,78,0.82) 100%);
        }

        .cp-tile-label {
          position: absolute; left: 0; right: 0; bottom: 0;
          padding: 0.9rem 0.85rem;
          color: #fff;
          font-weight: 700;
          font-size: clamp(0.85rem, 1.6vw, 1.05rem);
          line-height: 1.25;
          text-shadow: 0 1px 3px rgba(0,0,0,0.35);
        }

        .cp-tile-count {
          display: inline-block;
          margin-top: 0.2rem;
          font-size: 0.7rem;
          font-weight: 500;
          color: rgba(255,255,255,0.75);
        }

        .cp-product-card {
          border: none;
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 3px 12px rgba(0,32,78,0.08);
          transition: transform .18s ease, box-shadow .18s ease;
          height: 100%;
        }
        .cp-product-card:hover { transform: translateY(-3px); box-shadow: 0 10px 22px rgba(0,32,78,0.14); }

        .cp-product-img-wrap { position: relative; aspect-ratio: 1 / 1; overflow: hidden; background: #f4f6f9; }
        .cp-product-img-wrap img { width: 100%; height: 100%; object-fit: cover; }

        .cp-wish-btn {
          position: absolute; top: 8px; right: 8px;
          width: 34px; height: 34px; border-radius: 50%;
          background: rgba(255,255,255,0.9);
          display: flex; align-items: center; justify-content: center;
          border: none; box-shadow: 0 2px 6px rgba(0,0,0,0.15);
        }

        .cp-product-title {
          color: ${NAVY};
          font-weight: 600;
          font-size: 0.92rem;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          min-height: 2.4em;
        }
        .cp-product-title:hover { color: ${GREEN}; }

        .cp-price { color: ${GREEN}; font-weight: 700; }

        .cp-btn-cta { background: ${GREEN}; border-color: ${GREEN}; font-weight: 600; }
        .cp-btn-cta:hover { background: #2c8c22; border-color: #2c8c22; }

        .cp-btn-outline { border-color: ${NAVY}; color: ${NAVY}; font-weight: 600; }
        .cp-btn-outline:hover { background: ${NAVY}; color: #fff; }

        @media (max-width: 575.98px) {
          .cp-hero h2 { font-size: 1.5rem; }
          .cp-wrap { padding-top: 1.25rem; padding-bottom: 2.5rem; }
        }
      `}</style>

      <div className="container cp-wrap">
        {/* Breadcrumb */}
        <nav aria-label="breadcrumb" className="cp-breadcrumb mb-4">
          <ol className="breadcrumb mb-0">
            <li className="breadcrumb-item">
              <Link to="/">Home</Link>
            </li>
            {!id ? (
              <li className="breadcrumb-item active" aria-current="page">
                Categories
              </li>
            ) : (
              <>
                <li className="breadcrumb-item">
                  <Link to="/categories">Categories</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  {activeCategory?.name || "..."}
                </li>
              </>
            )}
          </ol>
        </nav>

        {/* ===================== VIEW 1: ALL CATEGORIES ===================== */}
        {!id && (
          <>
            <div className="cp-hero">
              <h2>Shop by Category</h2>
              <p className="mb-0">Browse our full range of categories</p>
            </div>

            {loading ? (
              <CategoryGridSkeleton count={8} />
            ) : categories.length === 0 ? (
              <div className="text-center py-5">
                <FaThLarge size={44} className="text-muted mb-3" />
                <h5 className="text-muted">No categories found</h5>
              </div>
            ) : (
              <div className="row g-3 g-md-4">
                {categories.map((category) => (
                  <div key={category.id} className="col-6 col-md-4 col-lg-3">
                    <Link to={`/categories/${category.id}`} className="cp-tile">
                      <img
                        src={category.image_url || FALLBACK_IMG}
                        alt={category.name}
                        loading="lazy"
                      />
                      <div className="cp-tile-overlay" />
                      <div className="cp-tile-label">
                        {category.name}
                        {typeof category.product_count === "number" && (
                          <span className="cp-tile-count d-block">
                            {category.product_count} items
                          </span>
                        )}
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ===================== VIEW 2: SINGLE CATEGORY + PRODUCTS ===================== */}
        {id && (
          <>
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
              <div>
                <h2 className="fw-bold mb-1" style={{ color: NAVY }}>
                  {activeCategory?.name || "Loading..."}
                </h2>
                <p className="text-muted mb-0">
                  {loading
                    ? "Loading products..."
                    : `Showing ${products.length} products`}
                </p>
              </div>
              <Link to="/categories" className="btn cp-btn-outline btn-sm px-3">
                <FaArrowLeft className="me-2" /> All Categories
              </Link>
            </div>

            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}

            {loading ? (
              <ProductGridSkeleton count={8} />
            ) : products.length === 0 && !error ? (
              noNearbyVendors ? (
                <NoVendorsEmptyState />
              ) : (
                <div className="text-center py-5">
                  <h5 className="text-muted">
                    No products found in this category
                  </h5>
                  <Link to="/products" className="btn cp-btn-cta text-white mt-3">
                    Browse All Products
                  </Link>
                </div>
              )
            ) : (
              <div className="row g-3 g-md-4">
                {products.map((product) => (
                  <div key={product.id} className="col-6 col-md-4 col-lg-3">
                    <div className="cp-product-card card">
                      <div className="cp-product-img-wrap">
                        <Link to={`/product/${product.id}`} className="d-block w-100 h-100">
                          <img
                            src={product.image_url || FALLBACK_IMG}
                            alt={product.name}
                            loading="lazy"
                          />
                        </Link>
                        <button
                          className="cp-wish-btn"
                          onClick={() => toggleWishlist(product)}
                          aria-label="Add to wishlist"
                        >
                          <FaHeart
                            size={15}
                            className={
                              isInWishlist(product.id)
                                ? "text-danger"
                                : "text-muted"
                            }
                          />
                        </button>
                      </div>

                      <div className="card-body pb-2">
                        <Link
                          to={`/product/${product.id}`}
                          className="text-decoration-none cp-product-title d-block mb-1"
                        >
                          {product.name}
                        </Link>
                        {product.category_name && (
                          <p className="text-muted small mb-1">
                            {product.category_name}
                          </p>
                        )}
                        <span className="cp-price fs-6">
                          {formatPrice(product.price)}
                        </span>
                      </div>

                      <div className="card-footer bg-white border-0 pt-0">
                        <button
                          className="btn cp-btn-cta text-white w-100 btn-sm"
                          onClick={() => handleAddToCart(product)}
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
          </>
        )}
      </div>
    </div>
  );
};

export default Categories;
