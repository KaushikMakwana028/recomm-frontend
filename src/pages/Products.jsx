import React, { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  FaShoppingCart,
  FaHeart,
  FaTh,
  FaList,
  FaTimes,
  FaSearch,
  FaFilter,
  FaCheck,
  FaChevronRight,
} from "react-icons/fa";
import ProductService from "../services/productService";
import CategoryService from "../services/categoryService";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { formatPrice } from "../utils/helpers";

const NAVY = "#00204E";
const GREEN = "#34A129";
const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400";

const PRICE_RANGES = [
  { id: 1, label: "Under ₹100", min: 0, max: 100 },
  { id: 2, label: "₹100 - ₹250", min: 100, max: 250 },
  { id: 3, label: "₹250 - ₹500", min: 250, max: 500 },
  { id: 4, label: "₹500 - ₹1000", min: 500, max: 1000 },
  { id: 5, label: "Over ₹1000", min: 1000, max: Infinity },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "name_asc", label: "Name: A to Z" },
];

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [categories, setCategories] = useState([]);
  const [rawProducts, setRawProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedCategoryId, setSelectedCategoryId] = useState(
    searchParams.get("category_id") || null,
  );
  const [selectedPriceRange, setSelectedPriceRange] = useState(null);

  const [searchInput, setSearchInput] = useState(
    searchParams.get("search") || "",
  );
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || "",
  );

  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState("grid");

  // Filter drawer state
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterTab, setFilterTab] = useState("categories"); // "categories" | "price"

  const searchDebounceRef = useRef(null);

  useEffect(() => {
    CategoryService.getCategoryList().then((result) => { 
      if (result.success) setCategories(result.data || []);
    });
  }, []);

  // Lock body scroll while the filter drawer is open
  useEffect(() => {
    if (filterOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [filterOpen]);

  // Close drawer on Escape
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") setFilterOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  // Debounce the search box
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 400);
    return () => clearTimeout(searchDebounceRef.current);
  }, [searchInput]);

  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategoryId, searchQuery]);

  const loadProducts = async () => {
    setLoading(true);
    setError("");

    const result = selectedCategoryId
      ? await CategoryService.getProductsByCategory(selectedCategoryId)
      : await ProductService.getProductList({ search: searchQuery });

    if (result.success) {
      let data = result.data || [];
      if (selectedCategoryId && searchQuery) {
        const q = searchQuery.toLowerCase();
        data = data.filter((p) => p.name?.toLowerCase().includes(q));
      }
      setRawProducts(data);
    } else {
      setError(result.error || "Failed to load products");
      setRawProducts([]);
    }
    setLoading(false);
  };

  const handleCategoryChange = (categoryId) => {
    setSelectedCategoryId(categoryId);
    const params = {};
    if (categoryId) params.category_id = categoryId;
    if (searchQuery) params.search = searchQuery;
    setSearchParams(params);
  };

  const handlePriceChange = (range) => {
    setSelectedPriceRange((prev) => (prev?.id === range.id ? null : range));
  };

  const handleClearFilters = () => {
    setSelectedCategoryId(null);
    setSelectedPriceRange(null);
    setSearchInput("");
    setSearchQuery("");
    setSearchParams({});
  };

  const filteredProducts = rawProducts
    .filter((p) => {
      if (!selectedPriceRange) return true;
      const price = parseFloat(p.price);
      return price >= selectedPriceRange.min && price < selectedPriceRange.max;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "price_asc":
          return parseFloat(a.price) - parseFloat(b.price);
        case "price_desc":
          return parseFloat(b.price) - parseFloat(a.price);
        case "name_asc":
          return (a.name || "").localeCompare(b.name || "");
        default:
          return b.id - a.id;
      }
    });

  const activeCategoryName = categories.find(
    (c) => String(c.id) === String(selectedCategoryId),
  )?.name;
  const activeFilterCount =
    (selectedCategoryId ? 1 : 0) + (selectedPriceRange ? 1 : 0);
  const hasActiveFilters = activeFilterCount > 0 || searchQuery;

  const activeFilterChips = [
    activeCategoryName && {
      key: "category",
      label: activeCategoryName,
      onClear: () => handleCategoryChange(null),
    },
    selectedPriceRange && {
      key: "price",
      label: selectedPriceRange.label,
      onClear: () => setSelectedPriceRange(null),
    },
    searchQuery && {
      key: "search",
      label: `"${searchQuery}"`,
      onClear: () => {
        setSearchInput("");
        setSearchQuery("");
      },
    },
  ].filter(Boolean);

  const openFilters = (tab) => {
    setFilterTab(tab);
    setFilterOpen(true);
  };

  return (
    <div className="products-page bg-light">
      <style>{`
        .pr-wrap { padding-top: 1.75rem; padding-bottom: 3rem; }
        .pr-title { color: ${NAVY}; font-weight: 800; }
        .pr-breadcrumb a { color: #6c7a90; text-decoration: none; }
        .pr-breadcrumb a:hover { color: ${NAVY}; }
        .pr-breadcrumb .active { color: ${GREEN}; font-weight: 600; }

        /* ---------- Search bar ---------- */
        .pr-search-wrap { position: relative; }
        .pr-search-wrap input {
          border-radius: 12px; border: 1.5px solid #e2e7f0; padding: 0.65rem 1rem 0.65rem 2.6rem;
          font-size: 0.95rem; background: #fff; transition: border-color .15s ease, box-shadow .15s ease;
        }
        .pr-search-wrap input:focus {
          border-color: ${GREEN}; box-shadow: 0 0 0 3px rgba(52,161,41,0.12); outline: none;
        }
        .pr-search-icon { position: absolute; left: 0.9rem; top: 50%; transform: translateY(-50%); color: #98a2b8; }
        .pr-search-clear {
          position: absolute; right: 0.6rem; top: 50%; transform: translateY(-50%);
          border: none; background: none; color: #98a2b8; padding: 4px;
        }
        .pr-search-clear:hover { color: ${NAVY}; }

        /* ---------- Toolbar ---------- */
        .pr-toolbar {
          background: #fff; border-radius: 14px; box-shadow: 0 2px 10px rgba(0,32,78,0.07);
          display: flex; align-items: center; gap: 0.6rem; padding: 0.6rem 0.7rem;
        }
        .pr-filter-btn {
          border: 1.5px solid #e2e7f0; background: #fff; color: ${NAVY}; font-weight: 700;
          font-size: 0.88rem; padding: 0.55rem 0.9rem; border-radius: 10px;
          display: flex; align-items: center; gap: 0.5rem; white-space: nowrap; position: relative;
        }
        .pr-filter-btn:hover { border-color: ${GREEN}; color: ${GREEN}; }
        .pr-filter-badge {
          background: ${GREEN}; color: #fff; font-size: 0.68rem; font-weight: 800;
          border-radius: 999px; min-width: 18px; height: 18px; padding: 0 4px;
          display: flex; align-items: center; justify-content: center; line-height: 1;
        }
        .pr-toolbar-divider { width: 1px; align-self: stretch; background: #eef1f6; }

        .pr-sort-select {
          border: 1.5px solid #e2e7f0 !important; border-radius: 10px !important; font-weight: 600;
          color: ${NAVY}; font-size: 0.85rem !important;
        }
        .pr-sort-select:focus { border-color: ${GREEN} !important; box-shadow: 0 0 0 3px rgba(52,161,41,0.12) !important; }

        .pr-view-toggle { border: 1.5px solid #e2e7f0; border-radius: 10px; overflow: hidden; display: flex; }
        .pr-view-toggle button {
          border: none; background: #fff; color: #98a2b8; padding: 0.55rem 0.7rem;
          display: flex; align-items: center; justify-content: center;
        }
        .pr-view-toggle button.active { background: ${GREEN}; color: #fff; }
        .pr-view-toggle button + button { border-left: 1.5px solid #e2e7f0; }

        /* ---------- Active filter chips ---------- */
        .pr-chip {
          border: 1px solid #dde3ec; border-radius: 999px; padding: 0.35rem 0.5rem 0.35rem 0.9rem;
          background: #fff; color: ${NAVY}; font-size: 0.8rem; font-weight: 600;
          display: inline-flex; align-items: center; gap: 0.5rem; box-shadow: 0 1px 4px rgba(0,32,78,0.06);
        }
        .pr-chip button {
          border: none; background: #eef1f6; color: #6c7a90; width: 18px; height: 18px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center; font-size: 0.6rem; flex-shrink: 0;
        }
        .pr-chip button:hover { background: #dde3ec; color: ${NAVY}; }
        .pr-clear-link { border: none; background: none; color: #98a2b8; font-size: 0.8rem; font-weight: 700; text-decoration: underline; }
        .pr-clear-link:hover { color: ${NAVY}; }

        /* ---------- Filter drawer ---------- */
        .pr-drawer-overlay {
          position: fixed; inset: 0; background: rgba(0,32,78,0.45); z-index: 1040;
          animation: pr-fade-in .18s ease;
        }
        @keyframes pr-fade-in { from { opacity: 0; } to { opacity: 1; } }

        .pr-drawer {
          position: fixed; top: 0; right: 0; bottom: 0; width: 420px; max-width: 100vw;
          background: #fff; z-index: 1050; display: flex; flex-direction: column;
          box-shadow: -8px 0 32px rgba(0,32,78,0.2); animation: pr-slide-in .22s ease;
        }
        @keyframes pr-slide-in { from { transform: translateX(100%); } to { transform: translateX(0); } }

        .pr-drawer-head {
          display: flex; align-items: center; justify-content: space-between;
          padding: 1rem 1.1rem; border-bottom: 1px solid #eef1f6; flex-shrink: 0;
        }
        .pr-drawer-head h5 { color: ${NAVY}; font-weight: 800; margin: 0; }
        .pr-drawer-close {
          border: none; background: #f4f7fb; color: #6c7a90; width: 34px; height: 34px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .pr-drawer-close:hover { background: #eef1f6; color: ${NAVY}; }

        .pr-drawer-body { flex: 1; display: flex; overflow: hidden; min-height: 0; }

        .pr-drawer-tabs {
          width: 42%; background: #f8f9fc; border-right: 1px solid #eef1f6;
          overflow-y: auto; flex-shrink: 0;
        }
        .pr-drawer-tab {
          width: 100%; border: none; background: transparent; text-align: left;
          padding: 0.9rem 1rem; font-size: 0.85rem; font-weight: 700; color: #45526b;
          display: flex; align-items: center; justify-content: space-between; gap: 0.4rem;
          border-left: 3px solid transparent;
        }
        .pr-drawer-tab .pr-tab-count {
          background: rgba(52,161,41,0.12); color: ${GREEN}; font-size: 0.68rem; font-weight: 800;
          border-radius: 999px; padding: 0.1rem 0.4rem;
        }
        .pr-drawer-tab.active {
          background: #fff; color: ${GREEN}; border-left-color: ${GREEN};
        }

        .pr-drawer-panel { flex: 1; overflow-y: auto; padding: 0.5rem 0; }
        .pr-drawer-opt {
          width: 100%; border: none; background: transparent; text-align: left;
          padding: 0.75rem 1.1rem; font-size: 0.88rem; font-weight: 600; color: #45526b;
          display: flex; align-items: center; justify-content: space-between; gap: 0.5rem;
        }
        .pr-drawer-opt:hover { background: #f8f9fc; }
        .pr-drawer-opt.active { color: ${GREEN}; }
        .pr-drawer-opt .pr-check-circle {
          width: 20px; height: 20px; border-radius: 50%; border: 1.5px solid #d7dee9; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center; color: #fff; font-size: 0.6rem;
        }
        .pr-drawer-opt.active .pr-check-circle { background: ${GREEN}; border-color: ${GREEN}; }

        .pr-drawer-foot {
          display: flex; gap: 0.7rem; padding: 0.9rem 1.1rem; border-top: 1px solid #eef1f6; flex-shrink: 0;
        }
        .pr-drawer-foot button { flex: 1; border-radius: 10px; font-weight: 700; padding: 0.65rem; }

        @media (max-width: 575.98px) {
          .pr-drawer { width: 100vw; }
        }

        .pr-card { border: none; border-radius: 14px; overflow: hidden; height: 100%;
          box-shadow: 0 3px 12px rgba(0,32,78,0.08); transition: transform .18s ease, box-shadow .18s ease; }
        .pr-card:hover { transform: translateY(-3px); box-shadow: 0 10px 22px rgba(0,32,78,0.14); }

        .pr-img-wrap {
          position: relative; aspect-ratio: 1 / 1; background: #f4f6f9;
          display: flex; align-items: center; justify-content: center; overflow: hidden;
        }
        .pr-img-wrap img { width: 100%; height: 100%; object-fit: contain; padding: 0.75rem; }

        .pr-wish-btn {
          position: absolute; top: 8px; right: 8px; width: 34px; height: 34px;
          border-radius: 50%; background: rgba(255,255,255,0.92); border: none;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 2px 6px rgba(0,0,0,0.15); z-index: 2;
        }

        .pr-name {
          color: ${NAVY}; font-weight: 600; font-size: 0.92rem;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
          min-height: 2.4em;
        }
        .pr-name:hover { color: ${GREEN}; }
        .pr-price { color: ${GREEN}; font-weight: 700; }

        .pr-btn-cta { background: ${GREEN}; border-color: ${GREEN}; font-weight: 600; }
        .pr-btn-cta:hover { background: #2c8c22; border-color: #2c8c22; }
        .pr-btn-outline { border-color: ${NAVY}; color: ${NAVY}; font-weight: 600; }
        .pr-btn-outline:hover { background: ${NAVY}; color: #fff; }

        .pr-list-img { aspect-ratio: 1/1; background: #f4f6f9; display: flex; align-items: center; justify-content: center; overflow: hidden; border-radius: 12px; }
        .pr-list-img img { width: 100%; height: 100%; object-fit: contain; padding: 0.6rem; }

        @media (max-width: 575.98px) {
          .pr-title { font-size: 1.4rem; }
          .pr-wrap { padding-top: 1.1rem; padding-bottom: 2rem; }
          .pr-toolbar { flex-wrap: wrap; }
          .pr-sort-select { font-size: 0.8rem !important; padding: 0.5rem !important; }
        }
      `}</style>

      <div className="container pr-wrap">
        {/* Page Header */}
        <div className="row mb-3">
          <div className="col-12">
            <h2 className="pr-title mb-2">Our Products</h2>
            <nav aria-label="breadcrumb" className="pr-breadcrumb mb-3">
              <ol className="breadcrumb mb-0">
                <li className="breadcrumb-item">
                  <Link to="/">Home</Link>
                </li>
                <li className="breadcrumb-item active" aria-current="page">
                  Products
                </li>
              </ol>
            </nav>

            <div className="pr-search-wrap" style={{ maxWidth: "460px" }}>
              <FaSearch className="pr-search-icon" size={14} />
              <input
                type="text"
                className="form-control"
                placeholder="Search products..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              {searchInput && (
                <button
                  className="pr-search-clear"
                  onClick={() => setSearchInput("")}
                  aria-label="Clear search"
                >
                  <FaTimes size={13} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Toolbar: filter trigger + sort + view toggle */}
        <div className="row mb-3">
          <div className="col-12">
            <div className="pr-toolbar">
              <button
                className="pr-filter-btn"
                onClick={() => openFilters("categories")}
              >
                <FaFilter size={12} /> Filters
                {activeFilterCount > 0 && (
                  <span className="pr-filter-badge">{activeFilterCount}</span>
                )}
              </button>

              <div className="pr-toolbar-divider d-none d-sm-block" />

              <select
                className="form-select form-select-sm pr-sort-select"
                style={{ maxWidth: "180px" }}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <div className="pr-view-toggle ms-auto d-none d-sm-flex">
                <button
                  className={viewMode === "grid" ? "active" : ""}
                  onClick={() => setViewMode("grid")}
                  aria-label="Grid view"
                >
                  <FaTh size={13} />
                </button>
                <button
                  className={viewMode === "list" ? "active" : ""}
                  onClick={() => setViewMode("list")}
                  aria-label="List view"
                >
                  <FaList size={13} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Active filter chips + result count */}
        <div className="row mb-3">
          <div className="col-12 d-flex flex-wrap align-items-center gap-2">
            <p className="mb-0 text-muted small me-2">
              Showing{" "}
              <strong style={{ color: NAVY }}>{filteredProducts.length}</strong>{" "}
              products
            </p>
            {activeFilterChips.map((chip) => (
              <span className="pr-chip" key={chip.key}>
                {chip.label}
                <button
                  onClick={chip.onClear}
                  aria-label={`Remove ${chip.label} filter`}
                >
                  <FaTimes />
                </button>
              </span>
            ))}
            {hasActiveFilters && (
              <button className="pr-clear-link" onClick={handleClearFilters}>
                Clear all
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-5">
            <div
              className="spinner-border"
              style={{ color: GREEN }}
              role="status"
            >
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-5">
            <h4 className="text-muted">No products found</h4>
            <p className="text-muted">Try adjusting your filters</p>
            {hasActiveFilters && (
              <button
                className="btn pr-btn-outline mt-2"
                onClick={handleClearFilters}
              >
                <FaTimes className="me-2" /> Clear Filters
              </button>
            )}
          </div>
        ) : viewMode === "grid" ? (
          <div className="row g-3 g-md-4">
            {filteredProducts.map((product) => (
              <div key={product.id} className="col-6 col-md-4 col-lg-3">
                <div className="pr-card card">
                  <div className="pr-img-wrap">
                    <Link to={`/product/${product.id}`}>
                      <img
                        src={product.image_url || FALLBACK_IMG}
                        alt={product.name}
                        loading="lazy"
                      />
                    </Link>
                    <button
                      className="pr-wish-btn"
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
                      className="text-decoration-none pr-name d-block mb-1"
                    >
                      {product.name}
                    </Link>
                    {product.category_name && (
                      <p className="text-muted small mb-1">
                        {product.category_name}
                      </p>
                    )}
                    <span className="pr-price fs-6">
                      {formatPrice(product.price)}
                    </span>
                  </div>

                  <div className="card-footer bg-white border-0 pt-0">
                    <button
                      className="btn pr-btn-cta text-white w-100 btn-sm"
                      onClick={() => addToCart(product)}
                    >
                      <FaShoppingCart className="me-2" size={13} /> Add to Cart
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="d-flex flex-column gap-3">
            {filteredProducts.map((product) => (
              <div className="pr-card card" key={product.id}>
                <div className="row g-0 align-items-center">
                  <div className="col-4 col-md-2 p-2">
                    <Link
                      to={`/product/${product.id}`}
                      className="pr-list-img d-block"
                    >
                      <img
                        src={product.image_url || FALLBACK_IMG}
                        alt={product.name}
                        loading="lazy"
                      />
                    </Link>
                  </div>
                  <div className="col-8 col-md-10">
                    <div className="card-body py-2">
                      <div className="d-flex justify-content-between align-items-start gap-2">
                        <div className="flex-grow-1">
                          <Link
                            to={`/product/${product.id}`}
                            className="text-decoration-none pr-name d-block"
                            style={{ WebkitLineClamp: 1, minHeight: "auto" }}
                          >
                            {product.name}
                          </Link>
                          {product.category_name && (
                            <p className="text-muted small mb-1">
                              {product.category_name}
                            </p>
                          )}
                          <span className="pr-price fs-6">
                            {formatPrice(product.price)}
                          </span>
                        </div>
                        <button
                          className="btn btn-link p-0"
                          onClick={() => toggleWishlist(product)}
                          aria-label="Add to wishlist"
                        >
                          <FaHeart
                            size={18}
                            className={
                              isInWishlist(product.id)
                                ? "text-danger"
                                : "text-muted"
                            }
                          />
                        </button>
                      </div>
                      <button
                        className="btn pr-btn-cta text-white btn-sm mt-2"
                        onClick={() => addToCart(product)}
                      >
                        <FaShoppingCart className="me-2" size={13} /> Add to
                        Cart
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filter Drawer (slides in from right; full-screen on mobile) */}
      {filterOpen && (
        <>
          <div
            className="pr-drawer-overlay"
            onClick={() => setFilterOpen(false)}
          />
          <div className="pr-drawer" role="dialog" aria-label="Filters">
            <div className="pr-drawer-head">
              <h5>Filters</h5>
              <button
                className="pr-drawer-close"
                onClick={() => setFilterOpen(false)}
                aria-label="Close filters"
              >
                <FaTimes size={14} />
              </button>
            </div>

            <div className="pr-drawer-body">
              <div className="pr-drawer-tabs">
                <button
                  className={`pr-drawer-tab ${filterTab === "categories" ? "active" : ""}`}
                  onClick={() => setFilterTab("categories")}
                >
                  Categories
                  <FaChevronRight size={10} />
                </button>
                <button
                  className={`pr-drawer-tab ${filterTab === "price" ? "active" : ""}`}
                  onClick={() => setFilterTab("price")}
                >
                  Price
                  {selectedPriceRange && (
                    <span className="pr-tab-count">1</span>
                  )}
                  <FaChevronRight size={10} style={{ marginLeft: "auto" }} />
                </button>
              </div>

              <div className="pr-drawer-panel">
                {filterTab === "categories" ? (
                  <>
                    <button
                      className={`pr-drawer-opt ${!selectedCategoryId ? "active" : ""}`}
                      onClick={() => handleCategoryChange(null)}
                    >
                      All Products
                      <span className="pr-check-circle">
                        {!selectedCategoryId && <FaCheck />}
                      </span>
                    </button>
                    {categories.map((category) => {
                      const active =
                        String(selectedCategoryId) === String(category.id);
                      return (
                        <button
                          key={category.id}
                          className={`pr-drawer-opt ${active ? "active" : ""}`}
                          onClick={() => handleCategoryChange(category.id)}
                        >
                          {category.name}
                          <span className="pr-check-circle">
                            {active && <FaCheck />}
                          </span>
                        </button>
                      );
                    })}
                  </>
                ) : (
                  PRICE_RANGES.map((range) => {
                    const active = selectedPriceRange?.id === range.id;
                    return (
                      <button
                        key={range.id}
                        className={`pr-drawer-opt ${active ? "active" : ""}`}
                        onClick={() => handlePriceChange(range)}
                      >
                        {range.label}
                        <span className="pr-check-circle">
                          {active && <FaCheck />}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div className="pr-drawer-foot">
              <button
                className="btn pr-btn-outline"
                onClick={handleClearFilters}
              >
                Clear All
              </button>
              <button
                className="btn pr-btn-cta text-white"
                onClick={() => setFilterOpen(false)}
              >
                Show {filteredProducts.length} Results
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Products;
