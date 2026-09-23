import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaSearch,
  FaTimes,
  FaArrowRight,
  FaHistory,
  FaStore,
  FaTag,
  FaBoxOpen,
  FaTrashAlt,
} from "react-icons/fa";
import ProductService from "../services/productService";
import { debounce, formatPrice, getImageUrl } from "../utils/helpers";

const NAVY = "#00204E";
const GREEN = "#34A129";
const GREEN_DEEP = "#278A1E";
const GREEN_SOFT = "#EAF7E8";
const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400";
const FALLBACK_STORE_IMG =
  "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=400";

const SearchBar = ({ onClose }) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState({
    products: [],
    brands: [],
    stores: [],
  });
  const [recentSearches, setRecentSearches] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const navigate = useNavigate();
  const wrapRef = useRef(null);

  // Load customer coordinates from localStorage
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

  // Load recent searches from API with localStorage fallback
  const fetchRecentSearches = async () => {
    try {
      const local = JSON.parse(localStorage.getItem("recent_searches") || "[]");
      setRecentSearches(local);

      const res = await ProductService.getRecentSearches();
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        // Merge unique searches
        const merged = Array.from(new Set([...res.data, ...local])).slice(0, 8);
        setRecentSearches(merged);
        localStorage.setItem("recent_searches", JSON.stringify(merged));
      }
    } catch (err) {
      console.warn("Failed to load recent searches:", err);
    }
  };

  useEffect(() => {
    fetchRecentSearches();
  }, []);

  // Debounced search suggestions
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSuggestions({ products: [], brands: [], stores: [] });
      setLoadingSuggestions(false);
      return;
    }

    setLoadingSuggestions(true);
    const debouncedFetch = debounce(async () => {
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
        } else {
          setSuggestions({ products: [], brands: [], stores: [] });
        }
      } catch (e) {
        console.error("Suggestions fetch error:", e);
      } finally {
        setLoadingSuggestions(false);
        setActiveIndex(-1);
      }
    }, 280);

    debouncedFetch();
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const saveQueryLocally = (q) => {
    if (!q || !q.trim()) return;
    const clean = q.trim();
    try {
      const current = JSON.parse(
        localStorage.getItem("recent_searches") || "[]",
      );
      const updated = [clean, ...current.filter((item) => item.toLowerCase() !== clean.toLowerCase())].slice(0, 8);
      localStorage.setItem("recent_searches", JSON.stringify(updated));
      setRecentSearches(updated);
      ProductService.saveRecentSearch(clean);
    } catch (e) {}
  };

  const handleSearch = (e, explicitQuery) => {
    if (e) e.preventDefault();
    const finalQ = (explicitQuery !== undefined ? explicitQuery : query).trim();
    if (finalQ) {
      saveQueryLocally(finalQ);
      navigate(`/search?q=${encodeURIComponent(finalQ)}`);
      setQuery("");
      setSuggestions({ products: [], brands: [], stores: [] });
      setIsFocused(false);
      if (onClose) onClose();
    }
  };

  const handleProductClick = (product) => {
    saveQueryLocally(product.name || query);
    navigate(`/product/${product.id}`);
    setQuery("");
    setSuggestions({ products: [], brands: [], stores: [] });
    setIsFocused(false);
    if (onClose) onClose();
  };

  const handleStoreClick = (store) => {
    saveQueryLocally(store.name || query);
    navigate(`/store/${store.id}`);
    setQuery("");
    setSuggestions({ products: [], brands: [], stores: [] });
    setIsFocused(false);
    if (onClose) onClose();
  };

  const handleBrandClick = (brandName) => {
    saveQueryLocally(brandName);
    navigate(`/search?q=${encodeURIComponent(brandName)}&brand=${encodeURIComponent(brandName)}`);
    setQuery("");
    setSuggestions({ products: [], brands: [], stores: [] });
    setIsFocused(false);
    if (onClose) onClose();
  };

  const handleRecentClick = (recentQ) => {
    handleSearch(null, recentQ);
  };

  const handleClearRecent = async (e) => {
    e.stopPropagation();
    try {
      localStorage.removeItem("recent_searches");
      setRecentSearches([]);
      await ProductService.clearRecentSearches();
    } catch (err) {}
  };

  const handleClearInput = () => {
    setQuery("");
    setSuggestions({ products: [], brands: [], stores: [] });
    setActiveIndex(-1);
  };

  // Flatten suggestions for keyboard navigation
  const flatItems = [
    ...(suggestions.stores || []).map((s) => ({ type: "store", data: s })),
    ...(suggestions.brands || []).map((b) => ({ type: "brand", data: b })),
    ...(suggestions.products || []).map((p) => ({ type: "product", data: p })),
  ];

  const handleKeyDown = (e) => {
    if (!isFocused) return;
    if (flatItems.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % (flatItems.length + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? flatItems.length : prev - 1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      if (activeIndex === flatItems.length) {
        handleSearch();
      } else {
        const item = flatItems[activeIndex];
        if (item.type === "product") handleProductClick(item.data);
        else if (item.type === "store") handleStoreClick(item.data);
        else if (item.type === "brand") handleBrandClick(item.data.name);
      }
    } else if (e.key === "Escape") {
      setIsFocused(false);
    }
  };

  // Bold matched substring
  const highlightMatch = (text) => {
    if (!text || !query) return text;
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <mark className="sb-highlight">
          {text.slice(idx, idx + query.length)}
        </mark>
        {text.slice(idx + query.length)}
      </>
    );
  };

  const hasSuggestions =
    suggestions.products.length > 0 ||
    suggestions.brands.length > 0 ||
    suggestions.stores.length > 0;

  const showRecentDropdown = isFocused && query.trim().length === 0 && recentSearches.length > 0;
  const showSuggestionsDropdown = isFocused && query.trim().length >= 2;

  return (
    <div className="sb-wrap" ref={wrapRef}>
      <style>{`
        .sb-wrap { position: relative; font-family: 'Poppins', sans-serif; }

        .sb-shell {
          display: flex;
          align-items: center;
          background: #fff;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          padding: 0.2rem 0.25rem 0.2rem 0.9rem;
          gap: 0.5rem;
          transition: border-color 0.18s ease, box-shadow 0.18s ease;
        }
        .sb-shell.is-focused {
          border-color: ${GREEN};
          box-shadow: 0 0 0 4px ${GREEN_SOFT};
        }
        .sb-icon-static { color: #94a3b8; flex-shrink: 0; }
        .sb-shell.is-focused .sb-icon-static { color: ${GREEN}; }

        .sb-input {
          flex: 1;
          border: none;
          outline: none;
          background: transparent;
          padding: 0.65rem 0.2rem;
          font-size: 0.92rem;
          color: ${NAVY};
          font-family: 'Poppins', sans-serif;
          min-width: 0;
        }
        .sb-input::placeholder { color: #9aa5b5; }
        .sb-input::-webkit-search-decoration,
        .sb-input::-webkit-search-cancel-button,
        .sb-input::-webkit-search-results-button,
        .sb-input::-webkit-search-results-decoration { display: none; }

        .sb-clear-btn {
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
          transition: background 0.15s ease;
        }
        .sb-clear-btn:hover { background: #e2e8f0; }

        .sb-submit-btn {
          background: ${GREEN};
          color: #fff;
          border: none;
          font-weight: 700;
          font-size: 0.85rem;
          border-radius: 9px;
          padding: 0.65rem 1.2rem;
          flex-shrink: 0;
          cursor: pointer;
          transition: background 0.18s ease;
          white-space: nowrap;
        }
        .sb-submit-btn:hover { background: ${GREEN_DEEP}; }

        /* ---------- Dropdown Container ---------- */
        .sb-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          right: 0;
          background: #fff;
          border-radius: 14px;
          box-shadow: 0 16px 40px rgba(0,32,78,0.16);
          border: 1px solid #eef1f6;
          overflow: hidden;
          z-index: 1050;
          animation: sbDrop 0.16s ease;
          max-height: 480px;
          overflow-y: auto;
        }
        @keyframes sbDrop {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* ---------- Recent Searches Panel ---------- */
        .sb-recent-panel {
          padding: 0.9rem 1rem;
        }
        .sb-recent-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.65rem;
        }
        .sb-recent-title {
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #64748b;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }
        .sb-recent-clear {
          background: none;
          border: none;
          color: #ef4444;
          font-size: 0.72rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.3rem;
          padding: 0.2rem 0.4rem;
          border-radius: 6px;
          transition: background 0.15s;
        }
        .sb-recent-clear:hover { background: #fee2e2; }

        .sb-recent-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 0.45rem;
        }
        .sb-recent-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 999px;
          padding: 0.35rem 0.8rem;
          font-size: 0.8rem;
          color: ${NAVY};
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .sb-recent-chip:hover {
          background: ${GREEN_SOFT};
          border-color: ${GREEN};
          color: ${GREEN_DEEP};
        }

        /* ---------- Section Headings ---------- */
        .sb-sec-header {
          padding: 0.65rem 1rem 0.35rem;
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
        .sb-sec-header:first-of-type { border-top: none; }

        /* ---------- Result Items ---------- */
        .sb-item {
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
        .sb-item:hover, .sb-item.is-active { background: ${GREEN_SOFT}; }

        .sb-item-thumb {
          width: 42px;
          height: 42px;
          border-radius: 10px;
          object-fit: cover;
          flex-shrink: 0;
          background: #f1f5f9;
        }
        .sb-item-badge-icon {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: #eef4ff;
          color: #3b82f6;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .sb-item-badge-icon.is-brand {
          background: #fdf4ff;
          color: #a855f7;
        }

        .sb-item-info { flex: 1; min-width: 0; }
        .sb-item-name {
          margin: 0;
          font-size: 0.86rem;
          font-weight: 600;
          color: ${NAVY};
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .sb-highlight {
          background: none;
          color: ${GREEN_DEEP};
          font-weight: 800;
          padding: 0;
        }
        .sb-item-sub {
          margin: 0;
          font-size: 0.72rem;
          color: #94a3b8;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .sb-item-price {
          font-weight: 800;
          font-size: 0.85rem;
          color: ${GREEN_DEEP};
          flex-shrink: 0;
          margin-left: 0.5rem;
        }
        .sb-dist-chip {
          font-size: 0.7rem;
          font-weight: 700;
          color: #475569;
          background: #f1f5f9;
          padding: 0.15rem 0.45rem;
          border-radius: 6px;
          flex-shrink: 0;
        }
        .sb-count-chip {
          font-size: 0.7rem;
          font-weight: 600;
          color: #64748b;
          background: #f1f5f9;
          padding: 0.15rem 0.45rem;
          border-radius: 6px;
          flex-shrink: 0;
        }

        .sb-viewall {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          width: 100%;
          border: none;
          border-top: 1px solid #eef1f6;
          background: #fafcfe;
          color: ${GREEN_DEEP};
          font-weight: 700;
          font-size: 0.82rem;
          padding: 0.75rem 1rem;
          cursor: pointer;
          transition: background 0.12s ease;
        }
        .sb-viewall:hover, .sb-viewall.is-active { background: ${GREEN_SOFT}; }

        .sb-empty {
          padding: 1.5rem 1rem;
          text-align: center;
          color: #9aa5b5;
          font-size: 0.85rem;
        }
      `}</style>

      <form onSubmit={handleSearch} role="search">
        <div className={`sb-shell ${isFocused ? "is-focused" : ""}`}>
          <FaSearch className="sb-icon-static" size={14} aria-hidden="true" />
          <input
            type="search"
            className="sb-input"
            placeholder="Search products, brands, or nearby stores..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              setIsFocused(true);
              fetchRecentSearches();
            }}
            onKeyDown={handleKeyDown}
            aria-label="Search products and stores"
            autoComplete="off"
          />
          {query && (
            <button
              type="button"
              className="sb-clear-btn"
              onClick={handleClearInput}
              aria-label="Clear search"
            >
              <FaTimes size={10} />
            </button>
          )}
          <button
            type="submit"
            className="sb-submit-btn"
            aria-label="Submit search"
          >
            Search
          </button>
        </div>
      </form>

      {/* 1. Recent Searches Dropdown (when input focused with no text) */}
      {showRecentDropdown && (
        <div className="sb-dropdown" role="region" aria-label="Recent searches">
          <div className="sb-recent-panel">
            <div className="sb-recent-header">
              <span className="sb-recent-title">
                <FaHistory size={11} /> Recent Searches
              </span>
              <button
                type="button"
                className="sb-recent-clear"
                onClick={handleClearRecent}
              >
                <FaTrashAlt size={10} /> Clear
              </button>
            </div>
            <div className="sb-recent-chips">
              {recentSearches.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="sb-recent-chip"
                  onClick={() => handleRecentClick(item)}
                >
                  <FaHistory size={9} style={{ opacity: 0.5 }} />
                  <span>{item}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. Categorized Live Suggestions Dropdown (when query >= 2 chars) */}
      {showSuggestionsDropdown && (
        <div
          className="sb-dropdown"
          role="listbox"
          aria-label="Search suggestions"
        >
          {loadingSuggestions ? (
            <div className="sb-empty">Searching suggestions...</div>
          ) : hasSuggestions ? (
            <>
              {/* Stores section */}
              {suggestions.stores.length > 0 && (
                <div>
                  <div className="sb-sec-header">
                    <FaStore size={11} /> Stores
                  </div>
                  {suggestions.stores.map((store) => (
                    <button
                      key={`st-${store.id}`}
                      type="button"
                      className="sb-item"
                      onClick={() => handleStoreClick(store)}
                      role="option"
                      aria-selected={false}
                    >
                      <img
                        src={store.store_photo_url || FALLBACK_STORE_IMG}
                        alt={store.name}
                        className="sb-item-thumb"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = FALLBACK_STORE_IMG;
                        }}
                      />
                      <div className="sb-item-info">
                        <p className="sb-item-name">
                          {highlightMatch(store.name)}
                        </p>
                        <p className="sb-item-sub">
                          {store.address || "Local Merchant Store"}
                        </p>
                      </div>
                      {store.distance_km !== null && store.distance_km !== undefined && (
                        <span className="sb-dist-chip">
                          {store.distance_km} km
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Brands section */}
              {suggestions.brands.length > 0 && (
                <div>
                  <div className="sb-sec-header">
                    <FaTag size={11} /> Brands
                  </div>
                  {suggestions.brands.map((b, idx) => (
                    <button
                      key={`br-${idx}`}
                      type="button"
                      className="sb-item"
                      onClick={() => handleBrandClick(b.name)}
                      role="option"
                      aria-selected={false}
                    >
                      <div className="sb-item-badge-icon is-brand">
                        <FaTag size={14} />
                      </div>
                      <div className="sb-item-info">
                        <p className="sb-item-name">{highlightMatch(b.name)}</p>
                        <p className="sb-item-sub">Brand</p>
                      </div>
                      <span className="sb-count-chip">{b.count} item{b.count !== 1 ? "s" : ""}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Products section */}
              {suggestions.products.length > 0 && (
                <div>
                  <div className="sb-sec-header">
                    <FaBoxOpen size={11} /> Products
                  </div>
                  {suggestions.products.map((product) => (
                    <button
                      key={`pr-${product.id}`}
                      type="button"
                      className="sb-item"
                      onClick={() => handleProductClick(product)}
                      role="option"
                      aria-selected={false}
                    >
                      <img
                        src={product.image_url || getImageUrl(product.image) || FALLBACK_IMG}
                        alt={product.name}
                        className="sb-item-thumb"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = FALLBACK_IMG;
                        }}
                      />
                      <div className="sb-item-info">
                        <p className="sb-item-name">
                          {highlightMatch(product.name)}
                        </p>
                        <p className="sb-item-sub">
                          {product.category_name || product.brand || product.store_name}
                          {product.unit ? ` · ${product.unit}` : ""}
                        </p>
                      </div>
                      <span className="sb-item-price">
                        {formatPrice(product.sale_price ?? product.price)}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              <button
                type="button"
                className="sb-viewall"
                onClick={(e) => handleSearch(e)}
              >
                View all results for "{query}"
                <FaArrowRight size={11} />
              </button>
            </>
          ) : (
            <div className="sb-empty">
              No matches found for "{query}". Try a different keyword or store name.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
