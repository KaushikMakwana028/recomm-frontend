import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import {
  FaStore,
  FaMapMarkerAlt,
  FaClock,
  FaPhone,
  FaRoute,
  FaSearch,
  FaTimes,
  FaShoppingCart,
  FaHeart,
  FaArrowLeft,
  FaTags,
  FaCheck,
  FaLayerGroup,
  FaBookmark,
  FaRegBookmark,
  FaList,
} from "react-icons/fa";
import StoreService from "../services/storeService";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useShoppingList } from "../context/ShoppingListContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { formatPrice } from "../utils/helpers";
import { getStockInfo } from "../utils/stockUtils";
import { ProductGridSkeleton } from "../components/SkeletonLoaders";

const NAVY = "#00204E";
const GREEN = "#34A129";
const FALLBACK_STORE_IMG =
  "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800&auto=format&fit=crop&q=60";
const FALLBACK_PROD_IMG =
  "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400";

const StoreDetail = () => {
  const { storeId } = useParams();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { openAddToListModal } = useShoppingList();
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [store, setStore] = useState(null);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loadingStore, setLoadingStore] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [storeError, setStoreError] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [savingStore, setSavingStore] = useState(false);

  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [addingId, setAddingId] = useState(null);

  const searchDebounceRef = useRef(null);

  // Extract numeric store ID if slug is passed (e.g., "3" or "3-store-name")
  const numericStoreId = parseInt(storeId, 10);

  // Load customer coordinates from localStorage
  const getCoords = useCallback(() => {
    try {
      const saved = localStorage.getItem("customer_live_location");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.latitude && parsed.longitude) {
          return { latitude: parsed.latitude, longitude: parsed.longitude };
        }
      }
    } catch (e) {}
    return {};
  }, []);

  // Fetch Store Details
  const loadStoreDetail = useCallback(async () => {
    if (!numericStoreId) {
      setStoreError("Invalid Store ID");
      setLoadingStore(false);
      return;
    }

    setLoadingStore(true);
    setStoreError("");

    const coords = getCoords();
    const result = await StoreService.getStoreDetail(numericStoreId, coords);

    if (result.success && result.data) {
      setStore(result.data);
      setCategories(result.data.categories || []);
      if (typeof result.data.is_saved !== "undefined") {
        setIsSaved(Boolean(result.data.is_saved));
      }
    } else {
      setStoreError(result.error || result.message || "Store not found");
    }
    setLoadingStore(false);
  }, [numericStoreId, getCoords]);

  const handleToggleSaveStore = async () => {
    if (!isAuthenticated) {
      showToast("Please log in to save stores.", "info");
      return;
    }
    setSavingStore(true);
    try {
      if (isSaved) {
        const res = await StoreService.unsaveStore(numericStoreId);
        if (res.success) {
          setIsSaved(false);
          showToast(`Removed ${store?.store_name || "store"} from saved stores`, "info");
        } else {
          showToast(res.error || "Failed to unsave store", "error");
        }
      } else {
        const res = await StoreService.saveStore(numericStoreId);
        if (res.success) {
          setIsSaved(true);
          showToast(`Saved ${store?.store_name || "store"} to your saved stores!`, "success");
        } else {
          showToast(res.error || "Failed to save store", "error");
        }
      }
    } catch (err) {
      showToast("Error updating saved store", "error");
    } finally {
      setSavingStore(false);
    }
  };

  // Fetch Store Products (scoped strictly to this vendor)
  const loadStoreProducts = useCallback(async () => {
    if (!numericStoreId) return;

    setLoadingProducts(true);
    const result = await StoreService.getStoreProducts(numericStoreId, {
      categoryId: selectedCategoryId || undefined,
      search: searchQuery || undefined,
      sortBy: sortBy,
      limit: 50,
    });

    if (result.success && result.data) {
      setProducts(result.data.products || []);
    } else {
      setProducts([]);
    }
    setLoadingProducts(false);
  }, [numericStoreId, selectedCategoryId, searchQuery, sortBy]);

  useEffect(() => {
    loadStoreDetail();
  }, [loadStoreDetail]);

  useEffect(() => {
    loadStoreProducts();
  }, [loadStoreProducts]);

  // Debounced search inside store
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchInput(val);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setSearchQuery(val.trim());
    }, 400);
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setSearchQuery("");
  };

  const handleAddToCart = async (product) => {
    setAddingId(product.id);
    await addToCart(product);
    setTimeout(() => setAddingId(null), 600);
  };

  if (loadingStore) {
    return (
      <div className="container py-5">
        <div className="d-flex justify-content-center align-items-center py-5">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading Store...</span>
          </div>
        </div>
      </div>
    );
  }

  if (storeError || !store) {
    return (
      <div className="container py-5 text-center" style={{ minHeight: "60vh" }}>
        <div className="py-5">
          <FaStore size={50} className="text-muted mb-3" />
          <h3 className="fw-bold" style={{ color: NAVY }}>
            Store Not Found
          </h3>
          <p className="text-muted mb-4">
            {storeError ||
              "The store you are looking for does not exist or is currently unavailable."}
          </p>
          <Link to="/" className="btn btn-success px-4 text-white">
            <FaArrowLeft className="me-2" /> Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="store-detail-page bg-light min-vh-100 pb-5">
      <style>{`
        /* Store Hero Banner */
        .store-hero {
          background: linear-gradient(135deg, ${NAVY} 0%, #001736 100%);
          color: white;
          padding: 1.75rem 0 1.5rem;
          position: relative;
          box-shadow: 0 4px 20px rgba(0,32,78,0.15);
        }
        .store-avatar-wrap {
          width: 110px;
          height: 110px;
          border-radius: 18px;
          background: #fff;
          overflow: hidden;
          padding: 4px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.25);
          flex-shrink: 0;
        }
        .store-avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 14px;
        }
        .store-title-text {
          font-size: clamp(1.15rem, 4vw, 1.5rem);
          word-break: break-word;
        }
        .store-meta-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255,255,255,0.12);
          backdrop-filter: blur(8px);
          padding: 5px 12px;
          border-radius: 20px;
          font-size: 0.82rem;
          color: rgba(255,255,255,0.92);
          max-width: 100%;
        }
        .store-meta-chip span {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .store-status-badge {
          font-weight: 700;
          font-size: 0.78rem;
          padding: 4px 10px;
          border-radius: 20px;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          white-space: nowrap;
        }
        .store-catalogue-box {
          background: rgba(255,255,255,0.1);
          padding: 0.85rem 1rem;
          border-radius: 12px;
          display: inline-block;
          text-align: left;
        }

        /* Category Nav */
        .store-cat-nav {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 8px;
          scrollbar-width: thin;
          -webkit-overflow-scrolling: touch;
        }
        .store-cat-nav::-webkit-scrollbar {
          height: 4px;
        }
        .store-cat-nav::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        .store-cat-btn {
          white-space: nowrap;
          flex-shrink: 0;
          padding: 7px 16px;
          border-radius: 30px;
          font-weight: 600;
          font-size: 0.85rem;
          border: 1px solid #dee2e6;
          background: #fff;
          color: #475569;
          transition: all 0.2s ease;
          cursor: pointer;
        }
        .store-cat-btn:hover {
          border-color: ${GREEN};
          color: ${GREEN};
          background: #f0fdf4;
        }
        .store-cat-btn.active {
          background: ${GREEN};
          border-color: ${GREEN};
          color: #fff;
          box-shadow: 0 4px 12px rgba(52,161,41,0.25);
        }

        /* In-store Search Bar */
        .store-search-box {
          position: relative;
        }
        .store-search-box input {
          padding-left: 2.6rem;
          padding-right: 2.6rem;
          border-radius: 12px;
          border: 1.5px solid #e2e8f0;
          height: 46px;
          font-size: 0.95rem;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .store-search-box input:focus {
          border-color: ${GREEN};
          box-shadow: 0 0 0 3px rgba(52,161,41,0.18);
        }
        .store-search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
        }
        .store-search-clear {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 4px 6px;
        }
        .store-search-clear:hover {
          color: #334155;
        }
        .store-sort-select {
          min-width: 150px;
        }

        /* Product Card */
        .store-prod-card {
          border: none;
          border-radius: 14px;
          overflow: hidden;
          background: #fff;
          box-shadow: 0 3px 12px rgba(0,32,78,0.06);
          transition: transform 0.18s ease, box-shadow 0.18s ease;
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        .store-prod-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 24px rgba(0,32,78,0.12);
        }
        .store-prod-img-wrap {
          position: relative;
          aspect-ratio: 1/1;
          background: #f8fafc;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .store-prod-img-wrap img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          padding: 0.75rem;
          transition: transform 0.3s ease;
        }
        .store-prod-card:hover .store-prod-img-wrap img {
          transform: scale(1.05);
        }
        .store-wish-btn {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(255,255,255,0.92);
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 6px rgba(0,0,0,0.12);
          z-index: 2;
          flex-shrink: 0;
        }
        .store-list-btn {
          position: absolute;
          top: 44px;
          right: 8px;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(255,255,255,0.92);
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 6px rgba(0,0,0,0.12);
          z-index: 2;
          flex-shrink: 0;
          transition: transform 0.15s ease, background 0.15s ease;
        }
        .store-list-btn:hover {
          transform: scale(1.1);
          background: #ffffff;
        }
        .store-prod-body {
          padding: 0.75rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          flex-grow: 1;
          gap: 0.5rem;
        }
        .store-prod-cat {
          color: #94a3b8;
          font-size: 0.72rem;
          margin-bottom: 2px;
        }
        .store-prod-title {
          color: ${NAVY};
          font-weight: 600;
          font-size: 0.9rem;
          line-height: 1.3;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          min-height: 2.34em;
          text-decoration: none;
        }
        .store-prod-title:hover {
          color: ${GREEN};
        }
        .store-prod-price-row {
          display: flex;
          align-items: baseline;
          flex-wrap: wrap;
          gap: 4px 8px;
        }
        .store-prod-price {
          color: ${GREEN};
          font-weight: 800;
          font-size: 1.02rem;
        }
        .store-prod-mrp {
          color: #94a3b8;
          text-decoration: line-through;
          font-size: 0.78rem;
        }
        .store-prod-unit-badge {
          font-size: 0.68rem;
        }
        .store-btn-add {
          background: ${GREEN};
          border: none;
          color: #fff;
          font-weight: 700;
          font-size: 0.85rem;
          padding: 8px 10px;
          border-radius: 10px;
          transition: background 0.2s;
          width: 100%;
        }
        .store-btn-add:hover {
          background: #2a8720;
          color: #fff;
        }
        .store-btn-add:disabled {
          background: #94a3b8;
          cursor: not-allowed;
        }

        /* Mobile tightening */
        @media (max-width: 575.98px) {
          .store-hero {
            padding: 1.25rem 0 1rem;
          }
          .store-avatar-wrap {
            width: 68px;
            height: 68px;
            border-radius: 14px;
          }
          .store-avatar-img {
            border-radius: 10px;
          }
          .store-meta-chip {
            font-size: 0.74rem;
            padding: 4px 10px;
            gap: 4px;
          }
          .store-meta-chip span {
            max-width: 46vw;
          }
          .store-catalogue-box {
            width: 100%;
            text-align: center;
          }
          .store-cat-btn {
            font-size: 0.8rem;
            padding: 6px 13px;
          }
          .store-search-box input {
            height: 44px;
            font-size: 0.9rem;
          }
          .store-prod-title {
            font-size: 0.82rem;
            min-height: 2.15em;
          }
          .store-prod-price {
            font-size: 0.92rem;
          }
          .store-prod-mrp {
            font-size: 0.72rem;
          }
          .store-btn-add {
            font-size: 0.78rem;
            padding: 7px 8px;
          }
          .store-btn-add svg {
            display: none;
          }
        }
      `}</style>

      {/* Top Header / Store Banner */}
      <section className="store-hero">
        <div className="container">
          <div className="mb-3">
            <Link
              to="/"
              className="text-white text-decoration-none d-inline-flex align-items-center opacity-75 small"
            >
              <FaArrowLeft className="me-2" /> Back to Home
            </Link>
          </div>

          <div className="row align-items-center g-3 g-md-4">
            <div className="col-12 col-lg-8">
              <div className="d-flex align-items-center gap-3 flex-wrap">
                <div className="store-avatar-wrap">
                  <img
                    src={store.store_photo_url || FALLBACK_STORE_IMG}
                    alt={store.store_name}
                    className="store-avatar-img"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = FALLBACK_STORE_IMG;
                    }}
                  />
                </div>
                <div className="flex-grow-1" style={{ minWidth: 0 }}>
                  <div className="d-flex align-items-center gap-2 flex-wrap mb-1">
                    <h1 className="store-title-text fw-bold mb-0 text-white">
                      {store.store_name}
                    </h1>
                    {store.is_open ? (
                      <span className="store-status-badge bg-success text-white">
                        🟢 Open
                      </span>
                    ) : (
                      <span className="store-status-badge bg-danger text-white">
                        🔴 Closed
                      </span>
                    )}
                  </div>

                  {store.category_summary && (
                    <p className="mb-2 text-white-50 small">
                      <FaTags className="me-1" /> {store.category_summary}
                    </p>
                  )}

                  <div className="d-flex flex-wrap gap-2 mt-2">
                    {store.address && (
                      <span className="store-meta-chip">
                        <FaMapMarkerAlt />
                        <span>
                          {store.address}
                          {store.pincode ? `, ${store.pincode}` : ""}
                        </span>
                      </span>
                    )}
                    {store.operating_hours && (
                      <span className="store-meta-chip">
                        <FaClock /> <span>{store.operating_hours}</span>
                      </span>
                    )}
                    {store.distance_text && (
                      <span className="store-meta-chip">
                        <FaRoute /> <span>{store.distance_text} away</span>
                      </span>
                    )}
                    {store.contact_number && (
                      <span className="store-meta-chip">
                        <FaPhone /> <span>{store.contact_number}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="col-12 col-lg-4 text-lg-end">
              <div className="store-catalogue-box">
                <div className="small text-white-50 text-uppercase fw-bold mb-1">
                  Catalogue Status
                </div>
                <div className="d-flex align-items-baseline gap-2 justify-content-center justify-content-lg-start">
                  <span className="fs-3 fw-bold text-white">
                    {store.total_products || 0}
                  </span>
                  <span className="text-white-50 small">Products In Stock</span>
                </div>
                {!store.is_open && store.status_reason && (
                  <div className="mt-1 small text-warning">
                    ⚠️ {store.status_reason}
                  </div>
                )}
              </div>

              <div className="mt-3 d-flex justify-content-center justify-content-lg-end">
                <button
                  type="button"
                  onClick={handleToggleSaveStore}
                  disabled={savingStore}
                  className="btn d-inline-flex align-items-center gap-2"
                  style={{
                    backgroundColor: isSaved ? "#fef08a" : "rgba(255, 255, 255, 0.15)",
                    color: isSaved ? "#854d0e" : "#ffffff",
                    border: isSaved ? "1px solid #facc15" : "1px solid rgba(255, 255, 255, 0.35)",
                    borderRadius: "12px",
                    padding: "0.55rem 1.25rem",
                    fontWeight: 600,
                    fontSize: "0.88rem",
                    backdropFilter: "blur(6px)",
                    transition: "all 0.2s ease",
                    boxShadow: isSaved ? "0 2px 10px rgba(250, 204, 21, 0.35)" : "none",
                  }}
                  title={isSaved ? "Remove from Saved Stores" : "Save this Store"}
                >
                  {isSaved ? <FaBookmark size={15} /> : <FaRegBookmark size={15} />}
                  <span>{isSaved ? "Saved Store" : "Save Store"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Store Content Area */}
      <div className="container py-4">
        {/* Controls Bar: Search within store & Sort */}
        <div className="bg-white p-3 p-md-4 rounded-3 shadow-sm mb-4">
          <div className="row g-3 align-items-center">
            {/* Scoped In-Store Search Bar */}
            <div className="col-12 col-md-7 col-lg-8">
              <div className="store-search-box">
                <FaSearch className="store-search-icon" size={16} />
                <input
                  type="text"
                  className="form-control"
                  placeholder={`Search within ${store.store_name}...`}
                  value={searchInput}
                  onChange={handleSearchChange}
                />
                {searchInput && (
                  <button
                    className="store-search-clear"
                    onClick={handleClearSearch}
                    aria-label="Clear search"
                  >
                    <FaTimes size={15} />
                  </button>
                )}
              </div>
            </div>

            {/* Sort Selector */}
            <div className="col-12 col-md-5 col-lg-4 d-flex justify-content-between justify-content-md-end align-items-center gap-2">
              <label className="text-muted small fw-bold mb-0 text-nowrap">
                Sort By:
              </label>
              <select
                className="store-sort-select form-select form-select-sm py-2 flex-grow-1 flex-md-grow-0"
                style={{ width: "auto" }}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Newest First</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="name_asc">Name: A to Z</option>
              </select>
            </div>
          </div>

          {/* Store Category Navigation Tabs */}
          {categories.length > 0 && (
            <div className="mt-3 pt-3 border-top">
              <div className="d-flex align-items-center gap-2 mb-2">
                <span className="text-muted small fw-bold text-uppercase">
                  <FaLayerGroup className="me-1" /> Store Categories:
                </span>
              </div>
              <div className="store-cat-nav">
                <button
                  className={`store-cat-btn ${selectedCategoryId === "" ? "active" : ""}`}
                  onClick={() => setSelectedCategoryId("")}
                >
                  All Products ({store.total_products || products.length})
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    className={`store-cat-btn ${String(selectedCategoryId) === String(cat.id) ? "active" : ""}`}
                    onClick={() =>
                      setSelectedCategoryId(
                        String(selectedCategoryId) === String(cat.id)
                          ? ""
                          : String(cat.id),
                      )
                    }
                  >
                    {cat.name} ({cat.product_count})
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Product Listing Header */}
        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <h5 className="fw-bold mb-0" style={{ color: NAVY }}>
            {selectedCategoryId
              ? categories.find(
                  (c) => String(c.id) === String(selectedCategoryId),
                )?.name || "Category Products"
              : "Store Products"}
            <span className="badge bg-light text-secondary ms-2 border">
              {products.length} {products.length === 1 ? "item" : "items"}
            </span>
          </h5>

          {searchQuery && (
            <span className="text-muted small">
              Results matching "<strong>{searchQuery}</strong>"
            </span>
          )}
        </div>

        {/* Product Grid */}
        {loadingProducts ? (
          <ProductGridSkeleton count={8} colClass="col-6 col-md-4 col-lg-3" />
        ) : products.length === 0 ? (
          <div className="bg-white p-5 text-center rounded-3 shadow-sm my-4">
            <FaSearch size={40} className="text-muted mb-3 opacity-50" />
            <h5 className="fw-bold mb-2" style={{ color: NAVY }}>
              No Products Found
            </h5>
            <p
              className="text-muted mb-4 small"
              style={{ maxWidth: "400px", margin: "0 auto" }}
            >
              {searchQuery
                ? `No products matching "${searchQuery}" were found in this store.`
                : selectedCategoryId
                  ? "No products available in this category for this store."
                  : "This store currently has no active products in stock."}
            </p>
            {(searchQuery || selectedCategoryId) && (
              <button
                className="btn btn-outline-success btn-sm px-4"
                onClick={() => {
                  setSearchInput("");
                  setSearchQuery("");
                  setSelectedCategoryId("");
                }}
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="row g-3 g-md-4">
            {products.map((product) => {
              const stockInfo = getStockInfo(product);
              const isStoreClosed = store && store.is_open === false;
              const canAddToCart = stockInfo.canAddToCart && !isStoreClosed;
              const hasDiscount =
                product.sale_price &&
                product.price &&
                Number(product.sale_price) < Number(product.price);

              return (
                <div key={product.id} className="col-6 col-md-4 col-lg-3">
                  <div className="store-prod-card card">
                    <div className="store-prod-img-wrap">
                      <Link
                        to={`/product/${product.id}`}
                        className="w-100 h-100 d-flex align-items-center justify-content-center"
                      >
                        <img
                          src={product.image_url || FALLBACK_PROD_IMG}
                          alt={product.name}
                          loading="lazy"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = FALLBACK_PROD_IMG;
                          }}
                        />
                      </Link>
                      <button
                        className="store-wish-btn"
                        onClick={() => toggleWishlist(product)}
                        aria-label="Add to wishlist"
                      >
                        <FaHeart
                          size={14}
                          className={
                            isInWishlist(product.id)
                              ? "text-danger"
                              : "text-muted"
                          }
                        />
                      </button>
                      <button
                        className="store-list-btn"
                        onClick={() =>
                          openAddToListModal({
                            id: product.id,
                            name: product.name,
                            price: product.sale_price || product.price,
                            sale_price: product.sale_price,
                            image_url: product.image_url,
                            store_name: store?.store_name,
                            vendor_id: store?.id,
                            category_name: product.category_name,
                          })
                        }
                        title="Add to Shopping List"
                        aria-label="Add to shopping list"
                      >
                        <FaList size={12} color="#0369a1" />
                      </button>
                    </div>

                    <div className="store-prod-body">
                      <div>
                        {product.category_name && (
                          <div className="store-prod-cat">
                            {product.category_name}
                          </div>
                        )}
                        <Link
                          to={`/product/${product.id}`}
                          className="store-prod-title d-block"
                        >
                          {product.name}
                        </Link>
                      </div>

                      <div>
                        <div className="store-prod-price-row mb-2 d-flex align-items-center flex-wrap gap-1">
                          <span className="store-prod-price">
                            {product.has_variants ? "From " : ""}{formatPrice(product.sale_price || product.price)}
                          </span>
                          {hasDiscount && (
                            <span className="store-prod-mrp">
                              {formatPrice(product.price)}
                            </span>
                          )}
                          {product.has_variants ? (
                            <span className="store-prod-unit-badge badge bg-success-subtle text-success border border-success-subtle">
                              {product.variant_count || product.variants?.length} Editions
                            </span>
                          ) : product.unit && product.unit !== "Standard" ? (
                            <span className="store-prod-unit-badge badge bg-light text-secondary border">
                              {product.unit}
                            </span>
                          ) : null}
                          <span
                            className="badge ms-auto"
                            style={{
                              backgroundColor: stockInfo.badgeBg,
                              color: stockInfo.badgeColor,
                              border: `1px solid ${stockInfo.badgeBorder}`,
                              fontSize: "0.68rem",
                              fontWeight: 700,
                              padding: "2px 6px",
                              borderRadius: "6px",
                            }}
                          >
                            {stockInfo.badgeLabel}
                          </span>
                        </div>

                        {product.has_variants ? (
                          <Link
                            to={`/product/${product.id}`}
                            className="btn btn-outline-success btn-sm w-100 fw-bold d-flex align-items-center justify-content-center gap-2"
                            style={{ borderRadius: "10px", padding: "8px 10px", fontSize: "0.85rem" }}
                          >
                            <FaTags size={12} /> Choose Edition
                          </Link>
                        ) : (
                          <button
                            className="store-btn-add d-flex align-items-center justify-content-center gap-2"
                            disabled={!canAddToCart || addingId === product.id}
                            title={!canAddToCart ? (isStoreClosed ? "This store is currently closed" : stockInfo.cartDisabledReason) : ""}
                            style={{
                              opacity: !canAddToCart ? 0.6 : 1,
                              cursor: !canAddToCart ? "not-allowed" : "pointer",
                            }}
                            onClick={() => handleAddToCart(product)}
                          >
                            {addingId === product.id ? (
                              <>
                                <FaCheck size={14} /> Added
                              </>
                            ) : canAddToCart ? (
                              <>
                                <FaShoppingCart size={13} /> Add to Cart
                              </>
                            ) : isStoreClosed ? (
                              "Store Closed"
                            ) : (
                              stockInfo.buttonLabel
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default StoreDetail;
