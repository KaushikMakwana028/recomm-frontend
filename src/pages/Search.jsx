import React, { useState, useEffect, useRef } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import {
  FaSearch,
  FaHeart,
  FaExclamationCircle,
  FaChevronRight,
  FaTimes,
  FaPlus,
  FaChevronLeft,
  FaStore,
  FaTags,
  FaFilter,
  FaSortAmountDown,
  FaHistory,
  FaBoxOpen,
  FaTag,
  FaTrashAlt,
  FaArrowRight,
  FaClock,
} from "react-icons/fa";
import ProductService from "../services/productService";
import CategoryService from "../services/categoryService";
import AlternativeSellers from "../components/AlternativeSellers";
import NoVendorsEmptyState from "../components/NoVendorsEmptyState";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { formatPrice, debounce, getImageUrl } from "../utils/helpers";
import { getStockInfo } from "../utils/stockUtils";

const NAVY = "#00204E";
const NAVY_DEEP = "#00152F";
const GREEN = "#34A129";
const GREEN_DEEP = "#278A1E";
const GREEN_SOFT = "#EAF7E8";
const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400";
const FALLBACK_STORE_IMG =
  "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=400";

// Complementary products mapping (Flipkart / Blinkit / Amazon style)
const COMPLEMENTARY_MAP = {
  milk: ["bread", "butter", "cheese", "egg", "biscuit", "rusk"],
  bread: ["butter", "jam", "cheese", "egg", "milk"],
  tea: ["biscuit", "sugar", "milk", "toast", "rusk"],
  coffee: ["milk", "sugar", "cookies", "biscuit"],
  rice: ["oil", "dal", "salt", "spices", "flour"],
  oil: ["rice", "dal", "flour", "salt"],
  biscuit: ["tea", "coffee", "milk", "juice"],
  egg: ["bread", "butter", "cheese", "milk"],
  sprite: ["chips", "cola", "snacks", "peanuts"],
  coke: ["chips", "sprite", "snacks", "peanuts"],
  lays: ["sprite", "coke", "chips", "cold drink"],
};

// ---- Product card ----
const ProductCard = ({
  product,
  isInWishlist,
  toggleWishlist,
  addToCart,
  compact,
}) => {
  const stockInfo = getStockInfo(product);
  const isStoreClosed = product.store_status === 'closed' || Number(product.is_holiday) === 1;
  const canAdd = stockInfo.canAddToCart && !isStoreClosed;

  const hasDiscount =
    product.mrp && parseFloat(product.mrp) > parseFloat(product.selling_price);
  const discountPct = hasDiscount
    ? Math.round(
        ((parseFloat(product.mrp) - parseFloat(product.selling_price)) /
          parseFloat(product.mrp)) *
          100,
      )
    : 0;

  return (
    <div className={`prod-card ${compact ? "prod-card--compact" : ""}`}>
      <div className="prod-img-wrap">
        <Link
          to={`/product/${product.id}`}
          className="prod-img-link"
          aria-label={product.product_name}
        >
          <img
            src={product.image_url || FALLBACK_IMG}
            alt={product.product_name}
            loading="lazy"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = FALLBACK_IMG;
            }}
          />
        </Link>
        <div className="prod-img-scrim" />

        {hasDiscount && (
          <span className="prod-discount-badge">{discountPct}% OFF</span>
        )}

        <button
          type="button"
          className="prod-wish-btn"
          onClick={() =>
            toggleWishlist({
              id: product.id,
              name: product.product_name,
              price: product.selling_price,
              image_url: product.image_url,
              category_name: product.category_name,
            })
          }
          aria-label="Toggle wishlist"
        >
          <FaHeart
            size={12}
            className={isInWishlist(product.id) ? "is-active" : ""}
          />
        </button>
      </div>

      <div className="prod-info">
        {product.category_name && (
          <span className="prod-category">{product.category_name}</span>
        )}

        <Link to={`/product/${product.id}`} className="prod-title">
          {product.product_name}
        </Link>

        {product.unit && (
          <span className="prod-unit-badge">{product.unit}</span>
        )}

        {product.store_name && (
          <Link
            to={product.vendor_id ? `/store/${product.vendor_id}` : "#"}
            className="prod-seller-badge text-decoration-none"
            title={`Sold by ${product.store_name} - Click to visit store`}
          >
            <FaStore size={9} />
            <span className="prod-seller-name">{product.store_name}</span>
            {product.distance_km !== undefined &&
            product.distance_km !== null ? (
              <span className="prod-seller-dist">{product.distance_km} km</span>
            ) : null}
          </Link>
        )}

        <AlternativeSellers product={product} />

        <div className="prod-footer">
          <div className="prod-pricing">
            <span className="prod-price">
              {formatPrice(product.selling_price)}
            </span>
            {hasDiscount && (
              <span className="prod-mrp">{formatPrice(product.mrp)}</span>
            )}
            <span
              className="badge ms-1"
              style={{
                backgroundColor: stockInfo.badgeBg,
                color: stockInfo.badgeColor,
                border: `1px solid ${stockInfo.badgeBorder}`,
                fontSize: "0.68rem",
                fontWeight: 700,
                padding: "2px 5px",
                borderRadius: "5px",
              }}
            >
              {stockInfo.badgeLabel}
            </span>
          </div>

          <button
            type="button"
            className="prod-add-btn"
            disabled={!canAdd}
            title={!canAdd ? (isStoreClosed ? "Store Closed" : stockInfo.cartDisabledReason) : ""}
            style={{
              opacity: !canAdd ? 0.6 : 1,
              cursor: !canAdd ? "not-allowed" : "pointer",
            }}
            onClick={() =>
              addToCart({
                id: product.id,
                name: product.product_name,
                price: product.selling_price,
                image_url: product.image_url,
                category_name: product.category_name,
                store_name: product.store_name,
                vendor_id: product.vendor_id,
              })
            }
          >
            <FaPlus size={10} />
            <span>{isStoreClosed ? "Closed" : (canAdd ? "Add" : stockInfo.buttonLabel)}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// ---- Store card ----
const StoreCard = ({ store }) => (
  <div className="search-store-card">
    <div className="search-store-img-wrap">
      <Link to={`/store/${store.id}`}>
        <img
          src={store.store_photo_url || FALLBACK_STORE_IMG}
          alt={store.store_name}
          loading="lazy"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = FALLBACK_STORE_IMG;
          }}
        />
      </Link>
      <span
        className={`search-store-status ${store.is_open ? "is-open" : "is-closed"}`}
      >
        {store.is_open ? "🟢 Open" : "🔴 Closed"}
      </span>
      {store.distance_text && (
        <span className="search-store-dist">{store.distance_text} away</span>
      )}
    </div>

    <div className="search-store-body">
      <Link to={`/store/${store.id}`} className="search-store-title">
        {store.store_name}
      </Link>

      <div className="search-store-category">
        <FaTags size={11} className="me-1" />
        <span>{store.category_summary || "Grocery & Daily Essentials"}</span>
      </div>

      <p className="search-store-address">
        {store.address || "Local Merchant Store"}
      </p>

      {store.operating_hours && (
        <div className="search-store-hours">
          <FaClock size={10} className="me-1" />
          <span>{store.operating_hours}</span>
        </div>
      )}

      <div className="search-store-footer">
        <span className="search-store-count">
          {store.product_count || 0} product
          {store.product_count !== 1 ? "s" : ""}
        </span>
        <Link to={`/store/${store.id}`} className="search-store-action">
          <span>View Store</span>
          <FaArrowRight size={10} />
        </Link>
      </div>
    </div>
  </div>
);

// Horizontal scroll container with chevron buttons
const ScrollCarousel = ({ children }) => {
  const trackRef = useRef(null);

  const scroll = (dir) => {
    if (!trackRef.current) return;
    const scrollAmount = 300;
    trackRef.current.scrollBy({
      left: dir === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <div className="carousel-shell">
      <button
        type="button"
        className="carousel-nav carousel-nav--left"
        onClick={() => scroll("left")}
        aria-label="Scroll left"
      >
        <FaChevronLeft size={12} />
      </button>
      <div className="carousel-track" ref={trackRef}>
        {children}
      </div>
      <button
        type="button"
        className="carousel-nav carousel-nav--right"
        onClick={() => scroll("right")}
        aria-label="Scroll right"
      >
        <FaChevronRight size={12} />
      </button>
    </div>
  );
};

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Query parameters
  const query = searchParams.get("q") || "";
  const initialMode = searchParams.get("mode") || "products";
  const initialCat = searchParams.get("category_id") || "";
  const initialBrand = searchParams.get("brand") || "";
  const initialUnit = searchParams.get("unit") || "";
  const initialStore = searchParams.get("vendor_id") || "";
  const initialAvailability = searchParams.get("availability") || "";
  const initialFulfilment = searchParams.get("fulfilment") || "";
  const initialSort = searchParams.get("sort_by") || "relevance";

  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  // UI States
  const [searchInput, setSearchInput] = useState(query);
  const [mode, setMode] = useState(initialMode);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [stores, setStores] = useState([]);
  const [categories, setCategories] = useState([]);
  const [blendedProducts, setBlendedProducts] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [noNearbyVendors, setNoNearbyVendors] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);

  // Facet Filters from API
  const [facetFilters, setFacetFilters] = useState({
    categories: [],
    brands: [],
    units: [],
    stores: [],
    price_range: { min: 0, max: 0 },
  });

  // Active filter selections
  const [selectedCategory, setSelectedCategory] = useState(initialCat);
  const [selectedBrand, setSelectedBrand] = useState(initialBrand);
  const [selectedUnit, setSelectedUnit] = useState(initialUnit);
  const [selectedStore, setSelectedStore] = useState(initialStore);
  const [selectedAvailability, setSelectedAvailability] =
    useState(initialAvailability);
  const [selectedFulfilment, setSelectedFulfilment] =
    useState(initialFulfilment);
  const [selectedSort, setSelectedSort] = useState(initialSort);
  const [minPrice, setMinPrice] = useState(searchParams.get("min_price") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("max_price") || "");

  // Mobile Filter Drawer Toggle
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // Live Suggestions & Recent Searches for input
  const [suggestions, setSuggestions] = useState({
    products: [],
    brands: [],
    stores: [],
  });
  const [recentSearches, setRecentSearches] = useState([]);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const searchWrapRef = useRef(null);

  // Load customer coordinates
  const getCoords = () => {
    try {
      const saved =
        localStorage.getItem("customer_live_location") ||
        localStorage.getItem("user_location");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.latitude && parsed.longitude) {
          return { latitude: parsed.latitude, longitude: parsed.longitude };
        }
      }
    } catch (e) {}
    return {};
  };

  // Fetch recent searches
  const loadRecentSearches = async () => {
    try {
      const local = JSON.parse(localStorage.getItem("recent_searches") || "[]");
      setRecentSearches(local);
      const res = await ProductService.getRecentSearches();
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        const merged = Array.from(new Set([...res.data, ...local])).slice(0, 8);
        setRecentSearches(merged);
        localStorage.setItem("recent_searches", JSON.stringify(merged));
      }
    } catch (e) {}
  };

  useEffect(() => {
    loadRecentSearches();
  }, []);

  // Sync state when URL params change
  useEffect(() => {
    setSearchInput(query);
    setMode(searchParams.get("mode") || "products");
    setSelectedCategory(searchParams.get("category_id") || "");
    setSelectedBrand(searchParams.get("brand") || "");
    setSelectedUnit(searchParams.get("unit") || "");
    setSelectedStore(searchParams.get("vendor_id") || "");
    setSelectedAvailability(searchParams.get("availability") || "");
    setSelectedFulfilment(searchParams.get("fulfilment") || "");
    setSelectedSort(
      searchParams.get("sort_by") ||
        (searchParams.get("mode") === "stores" ? "distance_asc" : "relevance"),
    );
    setMinPrice(searchParams.get("min_price") || "");
    setMaxPrice(searchParams.get("max_price") || "");

    performSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Live suggestions debounce
  useEffect(() => {
    const trimmed = searchInput.trim();
    if (trimmed.length < 2) {
      setSuggestions({ products: [], brands: [], stores: [] });
      return;
    }

    const debouncedSuggestions = debounce(async () => {
      try {
        const coords = getCoords();
        const res = await ProductService.getSearchSuggestions({
          q: trimmed,
          latitude: coords.latitude,
          longitude: coords.longitude,
        });
        if (res.success && res.data) {
          setSuggestions({
            products: res.data.products || [],
            brands: res.data.brands || [],
            stores: res.data.stores || [],
          });
        }
      } catch (err) {}
    }, 280);

    debouncedSuggestions();
  }, [searchInput]);

  // Outside click to close live suggestions
  useEffect(() => {
    const handleOutside = (e) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target)) {
        setIsInputFocused(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const saveQueryLocally = (q) => {
    if (!q || !q.trim()) return;
    const clean = q.trim();
    try {
      const current = JSON.parse(
        localStorage.getItem("recent_searches") || "[]",
      );
      const updated = [
        clean,
        ...current.filter((item) => item.toLowerCase() !== clean.toLowerCase()),
      ].slice(0, 8);
      localStorage.setItem("recent_searches", JSON.stringify(updated));
      setRecentSearches(updated);
      ProductService.saveRecentSearch(clean);
    } catch (e) {}
  };

  const updateURLParams = (updates = {}) => {
    const currentParams = Object.fromEntries(searchParams.entries());
    const merged = { ...currentParams, ...updates };

    // Clean up empty params
    Object.keys(merged).forEach((key) => {
      if (
        merged[key] === "" ||
        merged[key] === null ||
        merged[key] === undefined
      ) {
        delete merged[key];
      }
    });

    setSearchParams(merged);
  };

  const handleModeChange = (newMode) => {
    setMode(newMode);
    const newSort = newMode === "stores" ? "distance_asc" : "relevance";
    setSelectedSort(newSort);
    updateURLParams({ mode: newMode, sort_by: newSort });
  };

  const performSearch = async () => {
    setLoading(true);
    try {
      const coords = getCoords();
      const currentMode = searchParams.get("mode") || "products";
      const qVal = searchParams.get("q") || "";
      const catVal = searchParams.get("category_id") || undefined;
      const brandVal = searchParams.get("brand") || undefined;
      const unitVal = searchParams.get("unit") || undefined;
      const storeVal = searchParams.get("vendor_id") || undefined;
      const availVal = searchParams.get("availability") || undefined;
      const fulfVal = searchParams.get("fulfilment") || undefined;
      const sortVal =
        searchParams.get("sort_by") ||
        (currentMode === "stores" ? "distance_asc" : "relevance");
      const minP = searchParams.get("min_price") || undefined;
      const maxP = searchParams.get("max_price") || undefined;

      const [searchRes, catRes, allProdRes] = await Promise.all([
        ProductService.searchProducts({
          search: qVal,
          mode: currentMode,
          categoryId: catVal,
          brand: brandVal,
          unit: unitVal,
          vendorId: storeVal,
          availability: availVal,
          fulfilment: fulfVal,
          minPrice: minP,
          maxPrice: maxP,
          sortBy: sortVal,
          limit: currentMode === "stores" ? 24 : 20,
          latitude: coords.latitude,
          longitude: coords.longitude,
        }),
        CategoryService.searchCategories({ search: qVal, limit: 8 }),
        ProductService.getProductList({
          latitude: coords.latitude,
          longitude: coords.longitude,
        }),
      ]);

      setNoNearbyVendors(
        Boolean(searchRes.no_nearby_vendors || allProdRes.no_nearby_vendors),
      );

      if (searchRes.success && searchRes.data) {
        if (currentMode === "stores") {
          const storeList = searchRes.data.stores || [];
          setStores(storeList);
          setProducts([]);
          setTotalRecords(
            searchRes.data.pagination?.total_records ?? storeList.length,
          );
        } else {
          const prodList = (searchRes.data.products || []).map((p) => ({
            ...p,
            product_name: p.name || p.product_name,
            selling_price: p.sale_price ?? p.price,
            mrp: p.price,
          }));
          setProducts(prodList);
          setStores([]);
          setTotalRecords(
            searchRes.data.pagination?.total_records ?? prodList.length,
          );

          if (searchRes.data.filters) {
            setFacetFilters(searchRes.data.filters);
          }
        }
      } else {
        setProducts([]);
        setStores([]);
        setTotalRecords(0);
      }

      setCategories(catRes.success ? catRes.data?.categories || [] : []);

      // Blended Complementary Recommendations
      let allProducts = [];
      if (allProdRes.success) {
        allProducts = (allProdRes.data || []).map((p) => ({
          ...p,
          product_name: p.name || p.product_name,
          selling_price: p.sale_price ?? p.price,
          mrp: p.price,
        }));
      }

      if (qVal.trim()) {
        const queryLower = qVal.toLowerCase();
        const words = queryLower.split(/\s+/);
        let complementaryKeywords = [];

        words.forEach((word) => {
          Object.keys(COMPLEMENTARY_MAP).forEach((key) => {
            if (key.includes(word) || word.includes(key)) {
              complementaryKeywords = [
                ...complementaryKeywords,
                ...COMPLEMENTARY_MAP[key],
              ];
            }
          });
        });
        complementaryKeywords = [...new Set(complementaryKeywords)];

        if (complementaryKeywords.length > 0 && currentMode === "products") {
          const matchedIds = new Set(
            (searchRes.data?.products || []).map((p) => p.id),
          );
          const blended = allProducts
            .filter(
              (p) =>
                !matchedIds.has(p.id) &&
                complementaryKeywords.some(
                  (keyword) =>
                    p.product_name?.toLowerCase().includes(keyword) ||
                    p.brand?.toLowerCase().includes(keyword),
                ),
            )
            .slice(0, 8);
          setBlendedProducts(blended);
        } else {
          setBlendedProducts([]);
        }

        if (
          currentMode === "products" &&
          (!searchRes.data?.products || searchRes.data.products.length === 0)
        ) {
          const fallback = allProducts
            .filter((p) => p.is_active)
            .sort(() => 0.5 - Math.random())
            .slice(0, 8);
          setRelatedProducts(fallback);
        } else {
          setRelatedProducts([]);
        }
      } else {
        setBlendedProducts([]);
        setRelatedProducts([]);
      }
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e, explicitQuery) => {
    if (e) e.preventDefault();
    const finalQ = (
      explicitQuery !== undefined ? explicitQuery : searchInput
    ).trim();
    saveQueryLocally(finalQ);
    setIsInputFocused(false);
    updateURLParams({ q: finalQ });
  };

  const handleClearHistory = async () => {
    try {
      localStorage.removeItem("recent_searches");
      setRecentSearches([]);
      await ProductService.clearRecentSearches();
    } catch (e) {}
  };

  const handleFilterApply = () => {
    updateURLParams({
      category_id: selectedCategory,
      brand: selectedBrand,
      unit: selectedUnit,
      vendor_id: selectedStore,
      availability: selectedAvailability,
      fulfilment: selectedFulfilment,
      sort_by: selectedSort,
      min_price: minPrice,
      max_price: maxPrice,
    });
    setIsFilterDrawerOpen(false);
  };

  const handleClearAllFilters = () => {
    setSelectedCategory("");
    setSelectedBrand("");
    setSelectedUnit("");
    setSelectedStore("");
    setSelectedAvailability("");
    setSelectedFulfilment("");
    setMinPrice("");
    setMaxPrice("");
    updateURLParams({
      category_id: "",
      brand: "",
      unit: "",
      vendor_id: "",
      availability: "",
      fulfilment: "",
      min_price: "",
      max_price: "",
    });
  };

  const activeFiltersCount = [
    selectedCategory,
    selectedBrand,
    selectedUnit,
    selectedStore,
    selectedAvailability,
    selectedFulfilment,
    minPrice,
    maxPrice,
  ].filter(Boolean).length;

  return (
    <div className="search-page">
      <style>{`
        * { box-sizing: border-box; }
        .search-page {
          background: #f4f6fa;
          min-height: 100vh;
          padding-bottom: 3.5rem;
          font-family: 'Poppins', sans-serif;
        }

        /* ---------- Hero ---------- */
        .search-hero {
          background: linear-gradient(135deg, ${NAVY} 0%, ${NAVY_DEEP} 100%);
          padding: 2.5rem 1.1rem 4.5rem;
          color: #fff;
          position: relative;
        }
        /* Decorative glow blobs live in their own clipped layer so the
           suggestions dropdown (which extends below the hero) never gets cut off */
        .search-hero-decor {
          position: absolute;
          inset: 0;
          overflow: hidden;
          z-index: 0;
          pointer-events: none;
        }
        .search-hero-decor::before,
        .search-hero-decor::after {
          content: "";
          position: absolute;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(52,161,41,0.25) 0%, rgba(52,161,41,0) 70%);
        }
        .search-hero-decor::before { width: 340px; height: 340px; top: -160px; right: -80px; }
        .search-hero-decor::after { width: 220px; height: 220px; bottom: -110px; left: -60px; }

        .search-hero-inner {
          max-width: 760px;
          margin: 0 auto;
          text-align: center;
          position: relative;
          z-index: 10;
        }
        .search-eyebrow {
          text-transform: uppercase;
          letter-spacing: 0.14em;
          font-size: 0.7rem;
          font-weight: 700;
          color: #8FD986;
          margin-bottom: 0.45rem;
        }
        .search-title {
          font-weight: 800;
          letter-spacing: -0.02em;
          font-size: clamp(1.4rem, 4.4vw, 2.3rem);
          margin-bottom: 1.4rem;
          line-height: 1.25;
        }

        /* Search input container in hero */
        .hero-search-wrap {
          position: relative;
          width: 100%;
          text-align: left;
        }
        .search-input-shell {
          display: flex;
          align-items: center;
          background: #fff;
          border-radius: 14px;
          box-shadow: 0 12px 28px rgba(0,0,0,0.28);
          padding: 0.25rem 0.25rem 0.25rem 0.9rem;
          gap: 0.45rem;
          position: relative;
          z-index: 12;
        }
        .search-input-shell input {
          flex: 1;
          border: none;
          outline: none;
          padding: 0.75rem 0.2rem;
          font-size: 0.94rem;
          color: ${NAVY};
          font-family: 'Poppins', sans-serif;
          min-width: 0;
        }
        .search-input-shell input::placeholder { color: #9aa5b5; }
        .search-icon-static { color: #9aa5b5; flex-shrink: 0; }
        .clear-btn {
          border: none;
          background: #f1f5f9;
          color: #64748b;
          width: 26px;
          height: 26px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          cursor: pointer;
        }
        .search-submit-btn {
          background: ${GREEN};
          color: #fff;
          border: none;
          font-weight: 700;
          font-size: 0.88rem;
          border-radius: 10px;
          padding: 0.75rem 1.4rem;
          flex-shrink: 0;
          cursor: pointer;
          transition: background 0.2s ease;
          white-space: nowrap;
        }
        .search-submit-btn:hover { background: ${GREEN_DEEP}; }

        /* Hero Suggestions Dropdown */
        .hero-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          right: 0;
          background: #fff;
          border-radius: 14px;
          box-shadow: 0 18px 45px rgba(0,32,78,0.25);
          border: 1px solid #eef1f6;
          overflow: hidden;
          z-index: 1050;
          max-height: 420px;
          overflow-y: auto;
        }
        .hero-recent-panel { padding: 0.85rem 1rem; }
        .hero-recent-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.6rem;
        }
        .hero-recent-title {
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          color: #64748b;
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }
        .hero-recent-clear {
          background: none;
          border: none;
          color: #ef4444;
          font-size: 0.72rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.3rem;
        }
        .hero-recent-chips { display: flex; flex-wrap: wrap; gap: 0.45rem; }
        .hero-recent-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 999px;
          padding: 0.35rem 0.8rem;
          font-size: 0.8rem;
          color: ${NAVY};
          cursor: pointer;
          transition: all 0.15s;
        }
        .hero-recent-chip:hover {
          background: ${GREEN_SOFT};
          border-color: ${GREEN};
          color: ${GREEN_DEEP};
        }

        .hero-sec-header {
          padding: 0.55rem 1rem 0.3rem;
          font-size: 0.68rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #94a3b8;
          display: flex;
          align-items: center;
          gap: 0.35rem;
          background: #fafcfe;
          border-top: 1px solid #f1f5f9;
        }
        .hero-sec-header:first-of-type { border-top: none; }
        .hero-sugg-item {
          display: flex;
          align-items: center;
          width: 100%;
          border: none;
          background: transparent;
          padding: 0.55rem 1rem;
          gap: 0.75rem;
          text-align: left;
          cursor: pointer;
          transition: background 0.12s ease;
        }
        .hero-sugg-item:hover { background: ${GREEN_SOFT}; }
        .hero-sugg-thumb {
          width: 38px;
          height: 38px;
          border-radius: 8px;
          object-fit: cover;
          background: #f1f5f9;
          flex-shrink: 0;
        }
        .hero-sugg-icon {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: #fdf4ff;
          color: #a855f7;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .hero-sugg-info { flex: 1; min-width: 0; }
        .hero-sugg-name {
          margin: 0;
          font-size: 0.85rem;
          font-weight: 600;
          color: ${NAVY};
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .hero-sugg-sub {
          margin: 0;
          font-size: 0.72rem;
          color: #94a3b8;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .hero-sugg-price {
          font-weight: 800;
          font-size: 0.85rem;
          color: ${GREEN_DEEP};
          flex-shrink: 0;
        }

        /* ---------- Main Container ---------- */
        .search-container {
          max-width: 1240px;
          margin: -2.2rem auto 0;
          padding: 0 1rem;
          position: relative;
          z-index: 2;
        }

        /* ---------- Controls Bar (Mode Toggle, Sort, Filter trigger) ---------- */
        .search-controls-card {
          background: #fff;
          border-radius: 16px;
          box-shadow: 0 8px 24px rgba(0,32,78,0.07);
          padding: 0.85rem 1.15rem;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 0.85rem;
        }

        /* Mode Toggle Tabs */
        .search-mode-tabs {
          display: flex;
          background: #f1f5f9;
          border-radius: 12px;
          padding: 4px;
          gap: 4px;
        }
        .mode-tab {
          border: none;
          background: transparent;
          color: #64748b;
          font-size: 0.85rem;
          font-weight: 700;
          padding: 0.5rem 1.1rem;
          border-radius: 9px;
          display: flex;
          align-items: center;
          gap: 0.45rem;
          cursor: pointer;
          transition: all 0.18s ease;
        }
        .mode-tab.is-active {
          background: #fff;
          color: ${NAVY};
          box-shadow: 0 3px 10px rgba(0,32,78,0.08);
        }
        .mode-tab .mode-badge {
          background: ${GREEN_SOFT};
          color: ${GREEN_DEEP};
          font-size: 0.72rem;
          padding: 0.15rem 0.5rem;
          border-radius: 999px;
        }

        /* Right controls (Sort & Filter button) */
        .search-actions-wrap {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          flex-wrap: wrap;
        }
        .sort-select-wrap {
          display: flex;
          align-items: center;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 0.45rem 0.75rem;
          gap: 0.45rem;
          color: #64748b;
          font-size: 0.82rem;
        }
        .sort-select-wrap select {
          border: none;
          background: transparent;
          outline: none;
          color: ${NAVY};
          font-weight: 600;
          font-size: 0.82rem;
          cursor: pointer;
          font-family: inherit;
        }
        .filter-btn-trigger {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          background: #fff;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          padding: 0.48rem 0.95rem;
          color: ${NAVY};
          font-size: 0.82rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.18s;
        }
        .filter-btn-trigger:hover, .filter-btn-trigger.has-active {
          border-color: ${GREEN};
          color: ${GREEN_DEEP};
          background: ${GREEN_SOFT};
        }
        .filter-count-badge {
          background: ${GREEN};
          color: #fff;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          font-size: 0.7rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Active Filter Chips */
        .active-filters-row {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 1.25rem;
        }
        .active-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 999px;
          padding: 0.35rem 0.75rem;
          font-size: 0.78rem;
          font-weight: 600;
          color: ${NAVY};
        }
        .active-chip button {
          border: none;
          background: none;
          color: #94a3b8;
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 0;
        }
        .active-chip button:hover { color: #ef4444; }
        .clear-all-btn {
          border: none;
          background: none;
          color: #ef4444;
          font-size: 0.78rem;
          font-weight: 700;
          cursor: pointer;
          padding: 0.35rem 0.6rem;
        }

        /* ---------- Main Results Layout ---------- */
        .search-main-layout {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
        }
        @media (min-width: 992px) {
          .search-main-layout {
            grid-template-columns: 260px 1fr;
          }
        }

        /* Desktop Sidebar Filters */
        .desktop-filter-sidebar {
          display: none;
        }
        @media (min-width: 992px) {
          .desktop-filter-sidebar {
            display: block;
            background: #fff;
            border-radius: 16px;
            padding: 1.25rem;
            box-shadow: 0 4px 18px rgba(0,32,78,0.05);
            border: 1px solid #edf2f7;
            height: fit-content;
          }
        }

        /* Mobile Drawer */
        .mobile-drawer-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,20,47,0.5);
          z-index: 1100;
          display: flex;
          justify-content: flex-end;
          animation: fadeIn 0.2s ease;
        }
        .mobile-drawer-content {
          background: #fff;
          width: 85%;
          max-width: 360px;
          height: 100%;
          padding: 1.25rem;
          overflow-y: auto;
          box-shadow: -6px 0 24px rgba(0,0,0,0.2);
          animation: slideInRight 0.25s ease;
          display: flex;
          flex-direction: column;
        }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }

        /* Filter Sections */
        .filter-sec {
          margin-bottom: 1.25rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #f1f5f9;
        }
        .filter-sec:last-child { border-bottom: none; }
        .filter-sec-title {
          font-size: 0.84rem;
          font-weight: 700;
          color: ${NAVY};
          margin-bottom: 0.65rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .filter-chips-list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
          max-height: 180px;
          overflow-y: auto;
        }
        .filter-pill {
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          color: #475569;
          font-size: 0.76rem;
          font-weight: 600;
          padding: 0.32rem 0.65rem;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s;
        }
        .filter-pill:hover, .filter-pill.is-active {
          border-color: ${GREEN};
          background: ${GREEN_SOFT};
          color: ${GREEN_DEEP};
        }
        .filter-check-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.82rem;
          color: #334155;
          cursor: pointer;
          user-select: none;
        }
        .filter-check-label input {
          accent-color: ${GREEN};
          width: 16px;
          height: 16px;
          cursor: pointer;
        }

        .price-inputs-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .price-input {
          width: 100%;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 0.4rem 0.6rem;
          font-size: 0.82rem;
          outline: none;
        }
        .price-input:focus { border-color: ${GREEN}; }

        /* ---------- Grids ---------- */
        .prod-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.75rem;
          margin-bottom: 2.25rem;
        }
        @media (min-width: 640px) { .prod-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; } }
        @media (min-width: 1200px) { .prod-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); } }

        .stores-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
          margin-bottom: 2.25rem;
        }
        @media (min-width: 640px) { .stores-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (min-width: 1200px) { .stores-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }

        /* ---------- Product Card ---------- */
        .prod-card {
          background: #fff;
          border-radius: 14px;
          overflow: hidden;
          box-shadow: 0 4px 14px rgba(0,32,78,0.06);
          border: 1px solid #edf2f7;
          display: flex;
          flex-direction: column;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .prod-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 24px rgba(0,32,78,0.12);
        }
        .prod-img-wrap {
          position: relative;
          width: 100%;
          padding-top: 85%;
          background: #f8fafc;
          overflow: hidden;
        }
        .prod-img-wrap img {
          position: absolute;
          top: 0; left: 0; width: 100%; height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }
        .prod-card:hover .prod-img-wrap img { transform: scale(1.04); }
        .prod-discount-badge {
          position: absolute;
          top: 8px; left: 8px;
          background: #ef4444;
          color: #fff;
          font-weight: 800;
          font-size: 0.65rem;
          padding: 0.2rem 0.5rem;
          border-radius: 6px;
          z-index: 2;
        }
        .prod-wish-btn {
          position: absolute;
          top: 8px; right: 8px;
          width: 28px; height: 28px;
          background: rgba(255,255,255,0.9);
          border: none;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          color: #94a3b8;
          z-index: 2;
          transition: color 0.15s;
        }
        .prod-wish-btn .is-active { color: #ef4444; }

        .prod-info {
          padding: 0.85rem;
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        .prod-category {
          font-size: 0.68rem;
          color: #94a3b8;
          font-weight: 600;
          text-transform: uppercase;
          margin-bottom: 0.2rem;
        }
        .prod-title {
          font-size: 0.88rem;
          font-weight: 700;
          color: ${NAVY};
          text-decoration: none;
          margin-bottom: 0.35rem;
          line-height: 1.35;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .prod-unit-badge {
          display: inline-block;
          font-size: 0.7rem;
          font-weight: 600;
          color: #64748b;
          background: #f1f5f9;
          padding: 0.15rem 0.45rem;
          border-radius: 4px;
          width: fit-content;
          margin-bottom: 0.4rem;
        }
        .prod-seller-badge {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.72rem;
          color: #475569;
          background: #f8fafc;
          padding: 0.25rem 0.5rem;
          border-radius: 6px;
          margin-bottom: 0.65rem;
        }
        .prod-seller-name { font-weight: 600; }
        .prod-seller-dist { margin-left: auto; color: #94a3b8; font-weight: 500; }

        .prod-footer {
          margin-top: auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 0.65rem;
          border-top: 1px solid #f1f5f9;
        }
        .prod-price { font-weight: 800; font-size: 1rem; color: ${NAVY}; }
        .prod-mrp { font-size: 0.76rem; color: #94a3b8; text-decoration: line-through; margin-left: 0.4rem; }
        .prod-add-btn {
          background: ${GREEN};
          color: #fff;
          border: none;
          font-weight: 700;
          font-size: 0.78rem;
          padding: 0.42rem 0.85rem;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 0.35rem;
          cursor: pointer;
          transition: background 0.15s;
        }
        .prod-add-btn:hover { background: ${GREEN_DEEP}; }

        /* ---------- Store Card ---------- */
        .search-store-card {
          background: #fff;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 16px rgba(0,32,78,0.06);
          border: 1px solid #edf2f7;
          display: flex;
          flex-direction: column;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .search-store-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 24px rgba(0,32,78,0.12);
        }
        .search-store-img-wrap {
          position: relative;
          width: 100%;
          height: 150px;
          background: #f1f5f9;
          overflow: hidden;
        }
        .search-store-img-wrap img {
          width: 100%; height: 100%;
          object-fit: cover;
          transition: transform 0.3s;
        }
        .search-store-card:hover .search-store-img-wrap img { transform: scale(1.04); }
        .search-store-status {
          position: absolute;
          top: 10px; left: 10px;
          font-weight: 700;
          font-size: 0.72rem;
          padding: 0.25rem 0.6rem;
          border-radius: 999px;
          color: #fff;
        }
        .search-store-status.is-open { background: #16a34a; }
        .search-store-status.is-closed { background: #dc2626; }
        .search-store-dist {
          position: absolute;
          bottom: 10px; right: 10px;
          background: rgba(0,20,47,0.85);
          color: #fff;
          font-size: 0.72rem;
          font-weight: 600;
          padding: 0.25rem 0.55rem;
          border-radius: 6px;
        }

        .search-store-body {
          padding: 1.1rem;
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        .search-store-title {
          font-size: 1.05rem;
          font-weight: 800;
          color: ${NAVY};
          text-decoration: none;
          margin-bottom: 0.35rem;
          transition: color 0.15s;
        }
        .search-store-title:hover { color: ${GREEN_DEEP}; }
        .search-store-category {
          display: flex;
          align-items: center;
          font-size: 0.78rem;
          font-weight: 600;
          color: ${GREEN_DEEP};
          margin-bottom: 0.45rem;
        }
        .search-store-address {
          font-size: 0.8rem;
          color: #64748b;
          margin-bottom: 0.5rem;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .search-store-hours {
          display: flex;
          align-items: center;
          font-size: 0.75rem;
          color: #94a3b8;
          margin-bottom: 0.9rem;
        }
        .search-store-footer {
          margin-top: auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 0.85rem;
          border-top: 1px solid #f1f5f9;
        }
        .search-store-count {
          font-size: 0.8rem;
          font-weight: 700;
          color: #475569;
        }
        .search-store-action {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background: ${GREEN};
          color: #fff;
          font-size: 0.82rem;
          font-weight: 700;
          padding: 0.45rem 0.95rem;
          border-radius: 8px;
          text-decoration: none;
          transition: background 0.15s;
        }
        .search-store-action:hover { background: ${GREEN_DEEP}; color: #fff; }

        /* Empty state */
        .empty-warning-card {
          background: #fff;
          border-radius: 16px;
          padding: 3rem 1.5rem;
          text-align: center;
          box-shadow: 0 4px 18px rgba(0,32,78,0.05);
          margin-bottom: 2rem;
        }
        .empty-icon { color: #94a3b8; margin-bottom: 0.85rem; }
        .empty-title { font-size: 1.25rem; font-weight: 800; color: ${NAVY}; margin-bottom: 0.45rem; }
        .empty-text { font-size: 0.88rem; color: #64748b; max-width: 480px; margin: 0 auto 1.25rem; }
        .empty-cta {
          display: inline-block;
          background: ${GREEN};
          color: #fff;
          font-weight: 700;
          font-size: 0.85rem;
          padding: 0.65rem 1.4rem;
          border-radius: 9px;
          text-decoration: none;
        }

        /* Complementary carousel */
        .blend-section {
          background: #fff;
          border-radius: 16px;
          padding: 1.5rem;
          margin-top: 2.5rem;
          box-shadow: 0 4px 18px rgba(0,32,78,0.05);
        }
        .blend-header { display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.25rem; }
        .blend-title { font-size: 1.1rem; font-weight: 800; color: ${NAVY}; margin: 0; }
        .blend-subtitle { font-size: 0.82rem; color: #64748b; margin-bottom: 1.25rem; }
        .carousel-shell { position: relative; }
        .carousel-track {
          display: flex;
          gap: 0.9rem;
          overflow-x: auto;
          scroll-behavior: smooth;
          padding-bottom: 0.5rem;
          scrollbar-width: none;
        }
        .carousel-track::-webkit-scrollbar { display: none; }
        .carousel-track .prod-card { flex: 0 0 200px; }
        /* Compact carousel cards are always narrow, at any screen size,
           so the price + Add button never fit on one line - stack them */
        .prod-card--compact .prod-footer {
          flex-direction: column;
          align-items: stretch;
          gap: 0.5rem;
        }
        .prod-card--compact .prod-add-btn {
          width: 100%;
          justify-content: center;
        }
        .carousel-nav {
          position: absolute;
          top: 40%;
          transform: translateY(-50%);
          width: 32px; height: 32px;
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 5;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .carousel-nav--left { left: -14px; }
        .carousel-nav--right { right: -14px; }

        /* ============ Mobile refinements ============ */
        @media (max-width: 575.98px) {
          .search-hero {
            padding: 1.6rem 1rem 3.25rem;
          }
          .search-eyebrow { font-size: 0.64rem; }
          .search-title { margin-bottom: 1.1rem; }
          .search-input-shell input { font-size: 0.88rem; padding: 0.65rem 0.2rem; }
          .search-submit-btn { padding: 0.65rem 1rem; font-size: 0.82rem; }

          .search-container { padding: 0 0.75rem; }

          /* Controls bar: stack mode tabs above a non-wrapping sort+filter row */
          .search-controls-card {
            flex-direction: column;
            align-items: stretch;
            padding: 0.7rem 0.75rem;
            gap: 0.6rem;
            border-radius: 14px;
          }
          .search-mode-tabs { width: 100%; }
          .mode-tab {
            flex: 1;
            justify-content: center;
            padding: 0.5rem 0.4rem;
            font-size: 0.8rem;
          }
          .search-actions-wrap {
            width: 100%;
            flex-wrap: nowrap;
            gap: 0.5rem;
          }
          .sort-select-wrap {
            flex: 1 1 auto;
            min-width: 0;
            padding: 0.42rem 0.6rem;
          }
          .sort-select-wrap select {
            min-width: 0;
            width: 100%;
          }
          .filter-btn-trigger {
            flex-shrink: 0;
            padding: 0.42rem 0.75rem;
            font-size: 0.8rem;
          }

          .active-filters-row { margin-bottom: 1rem; }
          .active-chip { font-size: 0.72rem; padding: 0.3rem 0.6rem; }

          /* Product cards: stack price above a full-width Add button so nothing overflows */
          .prod-grid { gap: 0.6rem; margin-bottom: 1.75rem; }
          .prod-info { padding: 0.65rem; gap: 0.3rem; }
          .prod-title { font-size: 0.82rem; min-height: 2.2em; margin-bottom: 0.25rem; }
          .prod-category { font-size: 0.62rem; }
          .prod-unit-badge { font-size: 0.64rem; margin-bottom: 0.3rem; }
          .prod-seller-badge { font-size: 0.66rem; padding: 0.2rem 0.4rem; margin-bottom: 0.45rem; }
          .prod-footer {
            flex-direction: column;
            align-items: stretch;
            gap: 0.45rem;
            padding-top: 0.5rem;
          }
          .prod-price { font-size: 0.92rem; }
          .prod-mrp { font-size: 0.7rem; }
          .prod-add-btn {
            width: 100%;
            justify-content: center;
            padding: 0.45rem 0.6rem;
          }

          /* Store cards */
          .search-store-img-wrap { height: 130px; }
          .search-store-body { padding: 0.9rem; }
          .search-store-title { font-size: 0.95rem; }
          .search-store-action { padding: 0.4rem 0.75rem; font-size: 0.76rem; }

          .empty-warning-card { padding: 2.25rem 1.1rem; }
          .blend-section { padding: 1.1rem; }
          .carousel-track .prod-card { flex: 0 0 165px; }
        }
      `}</style>

      {/* ---------- HERO SECTION WITH LIVE SUGGESTIONS ---------- */}
      <div className="search-hero">
        <div className="search-hero-decor" aria-hidden="true" />
        <div className="search-hero-inner">
          <div className="search-eyebrow">Instant Hyperlocal Search</div>
          <h1 className="search-title">
            {query ? `Search: "${query}"` : "Discover Products & Nearby Stores"}
          </h1>

          <div className="hero-search-wrap" ref={searchWrapRef}>
            <form onSubmit={(e) => handleSearchSubmit(e)} role="search">
              <div className="search-input-shell">
                <FaSearch className="search-icon-static" size={16} />
                <input
                  type="search"
                  placeholder="Search products, brands, or nearby merchant stores..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onFocus={() => setIsInputFocused(true)}
                  aria-label="Search"
                  autoComplete="off"
                />
                {searchInput && (
                  <button
                    type="button"
                    className="clear-btn"
                    onClick={() => setSearchInput("")}
                    aria-label="Clear input"
                  >
                    <FaTimes size={11} />
                  </button>
                )}
                <button type="submit" className="search-submit-btn">
                  Search
                </button>
              </div>
            </form>

            {/* Recent Searches (when focused with no query) */}
            {isInputFocused &&
              searchInput.trim().length === 0 &&
              recentSearches.length > 0 && (
                <div className="hero-dropdown">
                  <div className="hero-recent-panel">
                    <div className="hero-recent-header">
                      <span className="hero-recent-title">
                        <FaHistory size={11} /> Recent Searches
                      </span>
                      <button
                        type="button"
                        className="hero-recent-clear"
                        onClick={handleClearHistory}
                      >
                        <FaTrashAlt size={10} /> Clear
                      </button>
                    </div>
                    <div className="hero-recent-chips">
                      {recentSearches.map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className="hero-recent-chip"
                          onClick={() => handleSearchSubmit(null, item)}
                        >
                          <FaHistory size={9} style={{ opacity: 0.5 }} />
                          <span>{item}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            {/* Categorized Suggestions (when query >= 2 chars) */}
            {isInputFocused && searchInput.trim().length >= 2 && (
              <div className="hero-dropdown">
                {suggestions.stores.length > 0 && (
                  <div>
                    <div className="hero-sec-header">
                      <FaStore size={11} /> Stores
                    </div>
                    {suggestions.stores.map((s) => (
                      <button
                        key={`hs-${s.id}`}
                        type="button"
                        className="hero-sugg-item"
                        onClick={() => {
                          saveQueryLocally(s.name);
                          setIsInputFocused(false);
                          navigate(`/store/${s.id}`);
                        }}
                      >
                        <img
                          src={s.store_photo_url || FALLBACK_STORE_IMG}
                          alt={s.name}
                          className="hero-sugg-thumb"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = FALLBACK_STORE_IMG;
                          }}
                        />
                        <div className="hero-sugg-info">
                          <p className="hero-sugg-name">{s.name}</p>
                          <p className="hero-sugg-sub">
                            {s.address || "Local Merchant Store"}
                          </p>
                        </div>
                        {s.distance_km !== null && (
                          <span className="badge bg-light text-dark">
                            {s.distance_km} km
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {suggestions.brands.length > 0 && (
                  <div>
                    <div className="hero-sec-header">
                      <FaTag size={11} /> Brands
                    </div>
                    {suggestions.brands.map((b, idx) => (
                      <button
                        key={`hb-${idx}`}
                        type="button"
                        className="hero-sugg-item"
                        onClick={() => {
                          saveQueryLocally(b.name);
                          setIsInputFocused(false);
                          updateURLParams({ q: b.name, brand: b.name });
                        }}
                      >
                        <div className="hero-sugg-icon">
                          <FaTag size={12} />
                        </div>
                        <div className="hero-sugg-info">
                          <p className="hero-sugg-name">{b.name}</p>
                          <p className="hero-sugg-sub">Brand</p>
                        </div>
                        <span className="badge bg-light text-muted">
                          {b.count} items
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {suggestions.products.length > 0 && (
                  <div>
                    <div className="hero-sec-header">
                      <FaBoxOpen size={11} /> Products
                    </div>
                    {suggestions.products.map((p) => (
                      <button
                        key={`hp-${p.id}`}
                        type="button"
                        className="hero-sugg-item"
                        onClick={() => {
                          saveQueryLocally(p.name);
                          setIsInputFocused(false);
                          navigate(`/product/${p.id}`);
                        }}
                      >
                        <img
                          src={
                            p.image_url || getImageUrl(p.image) || FALLBACK_IMG
                          }
                          alt={p.name}
                          className="hero-sugg-thumb"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = FALLBACK_IMG;
                          }}
                        />
                        <div className="hero-sugg-info">
                          <p className="hero-sugg-name">{p.name}</p>
                          <p className="hero-sugg-sub">
                            {p.category_name || p.store_name}
                            {p.unit ? ` · ${p.unit}` : ""}
                          </p>
                        </div>
                        <span className="hero-sugg-price">
                          {formatPrice(p.sale_price ?? p.price)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  className="hero-sugg-item text-primary fw-bold justify-content-center py-2 bg-light border-top"
                  onClick={(e) => handleSearchSubmit(e)}
                >
                  View all results for "{searchInput}"{" "}
                  <FaArrowRight size={10} className="ms-1" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ---------- MAIN BODY ---------- */}
      <div className="search-container">
        {/* Controls Card: Mode Toggle + Sort + Filter Toggle */}
        <div className="search-controls-card">
          {/* Products vs Stores Toggle */}
          <div className="search-mode-tabs" role="tablist">
            <button
              type="button"
              className={`mode-tab ${mode === "products" ? "is-active" : ""}`}
              onClick={() => handleModeChange("products")}
              role="tab"
              aria-selected={mode === "products"}
            >
              <FaBoxOpen size={14} />
              <span>Products</span>
              {mode === "products" && (
                <span className="mode-badge">{totalRecords}</span>
              )}
            </button>
            <button
              type="button"
              className={`mode-tab ${mode === "stores" ? "is-active" : ""}`}
              onClick={() => handleModeChange("stores")}
              role="tab"
              aria-selected={mode === "stores"}
            >
              <FaStore size={14} />
              <span>Stores</span>
              {mode === "stores" && (
                <span className="mode-badge">{totalRecords}</span>
              )}
            </button>
          </div>

          {/* Sort & Filter Controls */}
          <div className="search-actions-wrap">
            <div className="sort-select-wrap">
              <FaSortAmountDown size={12} />
              <span>Sort:</span>
              <select
                value={selectedSort}
                onChange={(e) => {
                  setSelectedSort(e.target.value);
                  updateURLParams({ sort_by: e.target.value });
                }}
              >
                {mode === "products" ? (
                  <>
                    <option value="relevance">Relevance</option>
                    <option value="price_low_to_high">
                      Price: Low to High
                    </option>
                    <option value="price_high_to_low">
                      Price: High to Low
                    </option>
                    <option value="availability">In Stock & Open First</option>
                    <option value="distance_asc">Nearest Store First</option>
                  </>
                ) : (
                  <>
                    <option value="distance_asc">Nearest First</option>
                    <option value="availability">Open Stores First</option>
                    <option value="name_asc">Name: A to Z</option>
                    <option value="name_desc">Name: Z to A</option>
                  </>
                )}
              </select>
            </div>

            <button
              type="button"
              className={`filter-btn-trigger ${activeFiltersCount > 0 ? "has-active" : ""}`}
              onClick={() => setIsFilterDrawerOpen(true)}
            >
              <FaFilter size={12} />
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="filter-count-badge">{activeFiltersCount}</span>
              )}
            </button>
          </div>
        </div>

        {/* Active Filter Badges */}
        {activeFiltersCount > 0 && (
          <div className="active-filters-row">
            {selectedCategory && (
              <span className="active-chip">
                Category:{" "}
                {facetFilters.categories.find(
                  (c) => String(c.id) === String(selectedCategory),
                )?.name || selectedCategory}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory("");
                    updateURLParams({ category_id: "" });
                  }}
                >
                  <FaTimes size={10} />
                </button>
              </span>
            )}
            {selectedBrand && (
              <span className="active-chip">
                Brand: {selectedBrand}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBrand("");
                    updateURLParams({ brand: "" });
                  }}
                >
                  <FaTimes size={10} />
                </button>
              </span>
            )}
            {selectedUnit && (
              <span className="active-chip">
                Unit: {selectedUnit}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedUnit("");
                    updateURLParams({ unit: "" });
                  }}
                >
                  <FaTimes size={10} />
                </button>
              </span>
            )}
            {selectedStore && (
              <span className="active-chip">
                Store:{" "}
                {facetFilters.stores.find(
                  (s) => String(s.id) === String(selectedStore),
                )?.name || selectedStore}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStore("");
                    updateURLParams({ vendor_id: "" });
                  }}
                >
                  <FaTimes size={10} />
                </button>
              </span>
            )}
            {selectedAvailability && (
              <span className="active-chip">
                In Stock & Open Only
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAvailability("");
                    updateURLParams({ availability: "" });
                  }}
                >
                  <FaTimes size={10} />
                </button>
              </span>
            )}
            {selectedFulfilment && (
              <span className="active-chip">
                Fulfilment: {selectedFulfilment}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFulfilment("");
                    updateURLParams({ fulfilment: "" });
                  }}
                >
                  <FaTimes size={10} />
                </button>
              </span>
            )}
            {(minPrice || maxPrice) && (
              <span className="active-chip">
                Price: ₹{minPrice || 0} - ₹{maxPrice || "max"}
                <button
                  type="button"
                  onClick={() => {
                    setMinPrice("");
                    setMaxPrice("");
                    updateURLParams({ min_price: "", max_price: "" });
                  }}
                >
                  <FaTimes size={10} />
                </button>
              </span>
            )}
            <button
              type="button"
              className="clear-all-btn"
              onClick={handleClearAllFilters}
            >
              Clear All
            </button>
          </div>
        )}

        {/* Results Layout (Desktop Sidebar + Main Grid) */}
        <div className="search-main-layout">
          {/* Desktop Filter Sidebar */}
          <aside className="desktop-filter-sidebar">
            <div className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
              <span className="fw-bold text-dark d-flex align-items-center gap-2">
                <FaFilter size={13} className="text-success" /> Filter Results
              </span>
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  className="btn btn-link btn-sm text-danger p-0 text-decoration-none fw-semibold"
                  onClick={handleClearAllFilters}
                >
                  Reset
                </button>
              )}
            </div>

            {/* Availability filter */}
            <div className="filter-sec">
              <div className="filter-sec-title">Availability</div>
              <label className="filter-check-label">
                <input
                  type="checkbox"
                  checked={selectedAvailability === "in_stock"}
                  onChange={(e) => {
                    const val = e.target.checked ? "in_stock" : "";
                    setSelectedAvailability(val);
                    updateURLParams({ availability: val });
                  }}
                />
                <span>In-Stock & Open Stores Only</span>
              </label>
            </div>

            {/* Fulfilment Filter (mode === 'products') */}
            {mode === "products" && (
              <div className="filter-sec">
                <div className="filter-sec-title">Fulfilment Method</div>
                <div className="d-flex flex-column gap-2">
                  {[
                    { key: "", label: "All Methods" },
                    { key: "immediate", label: "⚡ Immediate Delivery" },
                    { key: "slots", label: "📅 Scheduled Slots" },
                  ].map((f) => (
                    <label key={f.key} className="filter-check-label">
                      <input
                        type="radio"
                        name="desktop_fulfilment"
                        checked={selectedFulfilment === f.key}
                        onChange={() => {
                          setSelectedFulfilment(f.key);
                          updateURLParams({ fulfilment: f.key });
                        }}
                      />
                      <span>{f.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Categories */}
            {facetFilters.categories.length > 0 && (
              <div className="filter-sec">
                <div className="filter-sec-title">Categories</div>
                <div className="filter-chips-list">
                  {facetFilters.categories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className={`filter-pill ${String(selectedCategory) === String(c.id) ? "is-active" : ""}`}
                      onClick={() => {
                        const val =
                          String(selectedCategory) === String(c.id)
                            ? ""
                            : String(c.id);
                        setSelectedCategory(val);
                        updateURLParams({ category_id: val });
                      }}
                    >
                      {c.name} ({c.count})
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Brands (mode === 'products') */}
            {mode === "products" && facetFilters.brands.length > 0 && (
              <div className="filter-sec">
                <div className="filter-sec-title">Brands</div>
                <div className="filter-chips-list">
                  {facetFilters.brands.map((b) => (
                    <button
                      key={b.name}
                      type="button"
                      className={`filter-pill ${selectedBrand === b.name ? "is-active" : ""}`}
                      onClick={() => {
                        const val = selectedBrand === b.name ? "" : b.name;
                        setSelectedBrand(val);
                        updateURLParams({ brand: val });
                      }}
                    >
                      {b.name} ({b.count})
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Units / Pack Sizes (mode === 'products') */}
            {mode === "products" && facetFilters.units.length > 0 && (
              <div className="filter-sec">
                <div className="filter-sec-title">Pack Size / Unit</div>
                <div className="filter-chips-list">
                  {facetFilters.units.map((u) => (
                    <button
                      key={u.name}
                      type="button"
                      className={`filter-pill ${selectedUnit === u.name ? "is-active" : ""}`}
                      onClick={() => {
                        const val = selectedUnit === u.name ? "" : u.name;
                        setSelectedUnit(val);
                        updateURLParams({ unit: val });
                      }}
                    >
                      {u.name} ({u.count})
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Stores filter (mode === 'products') */}
            {mode === "products" && facetFilters.stores.length > 0 && (
              <div className="filter-sec">
                <div className="filter-sec-title">Carried By Store</div>
                <div className="filter-chips-list">
                  {facetFilters.stores.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className={`filter-pill ${String(selectedStore) === String(s.id) ? "is-active" : ""}`}
                      onClick={() => {
                        const val =
                          String(selectedStore) === String(s.id)
                            ? ""
                            : String(s.id);
                        setSelectedStore(val);
                        updateURLParams({ vendor_id: val });
                      }}
                    >
                      {s.name} ({s.count})
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Price Range */}
            {mode === "products" && (
              <div className="filter-sec">
                <div className="filter-sec-title">Price Range (₹)</div>
                <div className="price-inputs-row mb-2">
                  <input
                    type="number"
                    className="price-input"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                  />
                  <span>-</span>
                  <input
                    type="number"
                    className="price-input"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-success w-100 fw-bold py-1"
                  onClick={handleFilterApply}
                >
                  Apply Price
                </button>
              </div>
            )}
          </aside>

          {/* Results Area */}
          <main className="search-results-area">
            {loading ? (
              <div className="text-center py-5">
                <div
                  className="spinner-border text-success mb-2"
                  role="status"
                />
                <p className="text-muted fw-semibold">
                  Searching nearby results...
                </p>
              </div>
            ) : mode === "stores" ? (
              /* Stores View */
              stores.length > 0 ? (
                <div>
                  <div className="stores-grid">
                    {stores.map((st) => (
                      <StoreCard key={st.id} store={st} />
                    ))}
                  </div>
                </div>
              ) : noNearbyVendors ? (
                <div className="bg-white rounded-4 p-4 shadow-sm my-3">
                  <NoVendorsEmptyState />
                </div>
              ) : (
                <div className="empty-warning-card">
                  <div className="empty-icon">
                    <FaStore size={38} />
                  </div>
                  <h3 className="empty-title">No matching stores found</h3>
                  <p className="empty-text">
                    We couldn't find any merchant stores matching{" "}
                    <strong>"{query}"</strong> within your delivery radius.
                  </p>
                  <button
                    type="button"
                    className="empty-cta"
                    onClick={() => handleModeChange("products")}
                  >
                    Switch to Products Search
                  </button>
                </div>
              )
            ) : (
              /* Products View */
              <>
                {categories.length > 0 && (
                  <div className="mb-3">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <span className="badge bg-success-subtle text-success fw-bold">
                        Matching Categories
                      </span>
                    </div>
                    <div className="d-flex flex-wrap gap-2">
                      {categories.map((cat) => (
                        <Link
                          key={cat.id}
                          to={`/categories/${cat.id}`}
                          className="btn btn-sm btn-outline-secondary rounded-pill d-flex align-items-center gap-1 bg-white text-dark py-1 px-3"
                          style={{ fontSize: "0.78rem" }}
                        >
                          {cat.name}
                          <FaChevronRight size={8} className="text-muted" />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {products.length > 0 ? (
                  <div>
                    <div className="prod-grid">
                      {products.map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          isInWishlist={isInWishlist}
                          toggleWishlist={toggleWishlist}
                          addToCart={addToCart}
                        />
                      ))}
                    </div>
                  </div>
                ) : noNearbyVendors ? (
                  <div className="bg-white rounded-4 p-4 shadow-sm my-3">
                    <NoVendorsEmptyState />
                  </div>
                ) : (
                  <div className="empty-warning-card">
                    <div className="empty-icon">
                      <FaExclamationCircle size={36} />
                    </div>
                    <h3 className="empty-title">No products found</h3>
                    <p className="empty-text">
                      We couldn't find anything matching{" "}
                      <strong>"{query}"</strong>. Try adjusting your filters or
                      browse related items below.
                    </p>
                    <Link to="/products" className="empty-cta">
                      Browse Full Catalogue
                    </Link>
                  </div>
                )}

                {/* Fallback Recommendations if no products */}
                {products.length === 0 && relatedProducts.length > 0 && (
                  <div className="mt-4">
                    <h5 className="fw-bold text-dark mb-3">
                      Recommended for You
                    </h5>
                    <div className="prod-grid">
                      {relatedProducts.map((prod) => (
                        <ProductCard
                          key={prod.id}
                          product={prod}
                          isInWishlist={isInWishlist}
                          toggleWishlist={toggleWishlist}
                          addToCart={addToCart}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Complementary Essentials Carousel */}
                {blendedProducts.length > 0 && (
                  <div className="blend-section">
                    <div className="blend-header">
                      <span>🥛</span>
                      <h4 className="blend-title">
                        Frequently bought with <span>"{query}"</span>
                      </h4>
                    </div>
                    <p className="blend-subtitle">
                      Complementary essentials to complete your order
                    </p>
                    <ScrollCarousel>
                      {blendedProducts.map((p) => (
                        <ProductCard
                          key={p.id}
                          product={p}
                          isInWishlist={isInWishlist}
                          toggleWishlist={toggleWishlist}
                          addToCart={addToCart}
                          compact
                        />
                      ))}
                    </ScrollCarousel>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* ---------- MOBILE FILTER DRAWER ---------- */}
      {isFilterDrawerOpen && (
        <div
          className="mobile-drawer-overlay"
          onClick={() => setIsFilterDrawerOpen(false)}
        >
          <div
            className="mobile-drawer-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d-flex align-items-center justify-content-between pb-3 mb-3 border-bottom">
              <h5 className="fw-bold text-dark m-0 d-flex align-items-center gap-2">
                <FaFilter size={14} className="text-success" /> Filter Search
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setIsFilterDrawerOpen(false)}
                aria-label="Close filters"
              />
            </div>

            <div className="flex-grow-1 overflow-y-auto">
              {/* Availability */}
              <div className="filter-sec">
                <div className="filter-sec-title">Availability</div>
                <label className="filter-check-label">
                  <input
                    type="checkbox"
                    checked={selectedAvailability === "in_stock"}
                    onChange={(e) =>
                      setSelectedAvailability(
                        e.target.checked ? "in_stock" : "",
                      )
                    }
                  />
                  <span>In-Stock & Open Stores Only</span>
                </label>
              </div>

              {/* Fulfilment (mode === 'products') */}
              {mode === "products" && (
                <div className="filter-sec">
                  <div className="filter-sec-title">Fulfilment Method</div>
                  <div className="d-flex flex-column gap-2">
                    {[
                      { key: "", label: "All Methods" },
                      { key: "immediate", label: "⚡ Immediate Delivery" },
                      { key: "slots", label: "📅 Scheduled Slots" },
                    ].map((f) => (
                      <label key={f.key} className="filter-check-label">
                        <input
                          type="radio"
                          name="mobile_fulfilment"
                          checked={selectedFulfilment === f.key}
                          onChange={() => setSelectedFulfilment(f.key)}
                        />
                        <span>{f.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Categories */}
              {facetFilters.categories.length > 0 && (
                <div className="filter-sec">
                  <div className="filter-sec-title">Categories</div>
                  <div className="filter-chips-list">
                    {facetFilters.categories.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        className={`filter-pill ${String(selectedCategory) === String(c.id) ? "is-active" : ""}`}
                        onClick={() =>
                          setSelectedCategory(
                            String(selectedCategory) === String(c.id)
                              ? ""
                              : String(c.id),
                          )
                        }
                      >
                        {c.name} ({c.count})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Brands */}
              {mode === "products" && facetFilters.brands.length > 0 && (
                <div className="filter-sec">
                  <div className="filter-sec-title">Brands</div>
                  <div className="filter-chips-list">
                    {facetFilters.brands.map((b) => (
                      <button
                        key={b.name}
                        type="button"
                        className={`filter-pill ${selectedBrand === b.name ? "is-active" : ""}`}
                        onClick={() =>
                          setSelectedBrand(
                            selectedBrand === b.name ? "" : b.name,
                          )
                        }
                      >
                        {b.name} ({b.count})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Units */}
              {mode === "products" && facetFilters.units.length > 0 && (
                <div className="filter-sec">
                  <div className="filter-sec-title">Pack Size / Unit</div>
                  <div className="filter-chips-list">
                    {facetFilters.units.map((u) => (
                      <button
                        key={u.name}
                        type="button"
                        className={`filter-pill ${selectedUnit === u.name ? "is-active" : ""}`}
                        onClick={() =>
                          setSelectedUnit(selectedUnit === u.name ? "" : u.name)
                        }
                      >
                        {u.name} ({u.count})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Stores */}
              {mode === "products" && facetFilters.stores.length > 0 && (
                <div className="filter-sec">
                  <div className="filter-sec-title">Carried By Store</div>
                  <div className="filter-chips-list">
                    {facetFilters.stores.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        className={`filter-pill ${String(selectedStore) === String(s.id) ? "is-active" : ""}`}
                        onClick={() =>
                          setSelectedStore(
                            String(selectedStore) === String(s.id)
                              ? ""
                              : String(s.id),
                          )
                        }
                      >
                        {s.name} ({s.count})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Price Range */}
              {mode === "products" && (
                <div className="filter-sec">
                  <div className="filter-sec-title">Price Range (₹)</div>
                  <div className="price-inputs-row">
                    <input
                      type="number"
                      className="price-input"
                      placeholder="Min"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                    />
                    <span>-</span>
                    <input
                      type="number"
                      className="price-input"
                      placeholder="Max"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-top mt-auto d-flex gap-2">
              <button
                type="button"
                className="btn btn-light flex-grow-1 fw-bold text-muted py-2"
                onClick={handleClearAllFilters}
              >
                Reset All
              </button>
              <button
                type="button"
                className="btn btn-success flex-grow-1 fw-bold py-2"
                onClick={handleFilterApply}
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Search;
