import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import {
  FaShoppingCart,
  FaHeart,
  FaArrowLeft,
  FaThLarge,
  FaSearch,
  FaTimes,
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
import { getStockInfo } from "../utils/stockUtils";

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
  const [searchQuery, setSearchQuery] = useState("");

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
      const raw = result.data || [];
      const sorted = [...raw].sort((a, b) => {
        const aHas = (Number(a.product_count) > 0 || a.has_products) ? 1 : 0;
        const bHas = (Number(b.product_count) > 0 || b.has_products) ? 1 : 0;
        if (aHas !== bHas) return bHas - aHas;
        if (Number(a.product_count) !== Number(b.product_count)) {
          return Number(b.product_count) - Number(a.product_count);
        }
        return Number(a.id) - Number(b.id);
      });
      setCategories(sorted);
    }
    if (!id) setLoading(false);
  };

  const filteredCategories = categories.filter((cat) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    return (
      (cat.name && cat.name.toLowerCase().includes(q)) ||
      (cat.slug && cat.slug.toLowerCase().includes(q)) ||
      (cat.description && cat.description.toLowerCase().includes(q))
    );
  });

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
      const raw = productsResult.data || [];
      const sorted = [...raw].sort((a, b) => {
        const aInfo = getStockInfo(a);
        const bInfo = getStockInfo(b);
        const aUnavail =
          !aInfo.canAddToCart ||
          aInfo.state === "out_of_stock" ||
          aInfo.state === "temporarily_unavailable";
        const bUnavail =
          !bInfo.canAddToCart ||
          bInfo.state === "out_of_stock" ||
          bInfo.state === "temporarily_unavailable";
        if (aUnavail !== bUnavail) return aUnavail ? 1 : -1;
        return (b.id || 0) - (a.id || 0);
      });
      setProducts(sorted);
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

        /* Category Search Bar */
        .cp-search-box-wrap {
          max-width: 540px;
          margin: 1.5rem auto 0;
        }
        .cp-search-form {
          position: relative;
          display: flex;
          align-items: center;
          background: #ffffff;
          border: 2px solid #E2E8F0;
          border-radius: 50px;
          padding: 4px 6px 4px 18px;
          box-shadow: 0 4px 18px rgba(0, 32, 78, 0.08);
          transition: border-color .2s ease, box-shadow .2s ease;
        }
        .cp-search-form:focus-within {
          border-color: ${GREEN};
          box-shadow: 0 6px 24px rgba(52, 161, 41, 0.18);
        }
        .cp-search-icon {
          color: #94A3B8;
          font-size: 1rem;
          margin-right: 10px;
          flex-shrink: 0;
        }
        .cp-search-input {
          flex: 1;
          border: none;
          outline: none;
          background: transparent;
          font-size: 0.94rem;
          color: ${NAVY};
          font-family: inherit;
          padding: 0.45rem 0;
        }
        .cp-search-input::placeholder {
          color: #94A3B8;
          font-size: 0.88rem;
        }
        .cp-clear-btn {
          background: none;
          border: none;
          color: #94A3B8;
          padding: 4px 8px;
          cursor: pointer;
          font-size: 0.85rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .cp-clear-btn:hover {
          color: ${NAVY};
        }
        .cp-search-btn {
          background: ${GREEN};
          color: #fff;
          border: none;
          border-radius: 50px;
          padding: 0.55rem 1.35rem;
          font-weight: 700;
          font-size: 0.88rem;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }
        .cp-search-btn:hover {
          background: #278420;
          color: #fff;
          transform: translateY(-1px);
        }
        .cp-search-info {
          margin-top: 0.55rem;
          font-size: 0.82rem;
          color: #64748B;
        }

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

              {/* Search Category Bar with Search Button */}
              <div className="cp-search-box-wrap">
                <form
                  onSubmit={(e) => e.preventDefault()}
                  className="cp-search-form"
                >
                  <FaSearch className="cp-search-icon" />
                  <input
                    type="text"
                    className="cp-search-input"
                    placeholder="Search categories (e.g. Beverages, Fruits, Staples)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    aria-label="Search categories"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className="cp-clear-btn"
                      onClick={() => setSearchQuery("")}
                      title="Clear search"
                    >
                      <FaTimes size={13} />
                    </button>
                  )}
                  <button
                    type="submit"
                    className="cp-search-btn"
                    onClick={(e) => e.preventDefault()}
                  >
                    <FaSearch size={12} />
                    <span>Search</span>
                  </button>
                </form>

                {searchQuery && (
                  <div className="cp-search-info">
                    Showing {filteredCategories.length} of {categories.length} categories matching "<strong>{searchQuery}</strong>"
                  </div>
                )}
              </div>
            </div>

            {loading ? (
              <CategoryGridSkeleton count={8} />
            ) : categories.length === 0 ? (
              <div className="text-center py-5">
                <FaThLarge size={44} className="text-muted mb-3" />
                <h5 className="text-muted">No categories found</h5>
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className="text-center py-5">
                <FaSearch size={36} className="text-muted mb-3 opacity-50" />
                <h5 className="text-dark fw-bold mb-1">No categories match "{searchQuery}"</h5>
                <p className="text-muted mb-3">Try checking for typos or searching a different keyword.</p>
                <button
                  type="button"
                  className="btn cp-btn-outline btn-sm px-3"
                  onClick={() => setSearchQuery("")}
                >
                  Clear Search
                </button>
              </div>
            ) : (
              <div className="row g-3 g-md-4">
                {filteredCategories.map((category) => {
                  const hasProds = Number(category.product_count) > 0;
                  return (
                    <div key={category.id} className="col-6 col-md-4 col-lg-3">
                      <Link to={`/categories/${category.id}`} className="cp-tile">
                        <img
                          src={category.image_url || FALLBACK_IMG}
                          alt={category.name}
                          loading="lazy"
                        />
                        <div className="cp-tile-overlay" />
                        <div className="cp-tile-label">
                          <div>{category.name}</div>
                          {typeof category.product_count === "number" && (
                            <span
                              className="cp-tile-count d-inline-block"
                              style={{
                                color: hasProds ? "#86efac" : "rgba(255,255,255,0.65)",
                                fontWeight: hasProds ? 600 : 400,
                                fontSize: "0.75rem",
                              }}
                            >
                              {hasProds
                                ? `${category.product_count} ${category.product_count === 1 ? "item" : "items"}`
                                : "No products"}
                            </span>
                          )}
                        </div>
                      </Link>
                    </div>
                  );
                })}
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
