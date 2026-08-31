import React, { useState, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  FaSearch,
  FaShoppingCart,
  FaHeart,
  FaExclamationCircle,
  FaChevronRight,
  FaTimes,
  FaPlus,
  FaChevronLeft,
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
  "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400";

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

        {product.category_name && (
          <span className="prod-cat-pill">{product.category_name}</span>
        )}

        <button
          type="button"
          className="prod-add-fab"
          onClick={() =>
            addToCart({
              id: product.id,
              name: product.product_name,
              price: product.selling_price,
              image_url: product.image_url,
              category_name: product.category_name,
            })
          }
          aria-label="Add to cart"
        >
          <FaPlus size={12} />
        </button>
      </div>

      <div className="prod-body">
        <Link to={`/product/${product.id}`} className="prod-title">
          {product.product_name}
        </Link>
        <div className="prod-price-row">
          <span className="prod-price">
            {formatPrice(product.selling_price)}
          </span>
          {hasDiscount && (
            <span className="prod-mrp">{formatPrice(product.mrp)}</span>
          )}
        </div>
      </div>
    </div>
  );
};

// ---- Skeleton placeholder ----
const SkeletonCard = () => (
  <div className="prod-card">
    <div className="skeleton-img shimmer" />
    <div className="prod-body">
      <div
        className="skeleton-line shimmer"
        style={{ width: "85%", height: "12px" }}
      />
      <div
        className="skeleton-line shimmer"
        style={{ width: "50%", height: "14px" }}
      />
    </div>
  </div>
);

// ---- Horizontal scroll carousel (used for "Frequently bought with") ----
const ScrollCarousel = ({ children }) => {
  const trackRef = useRef(null);

  const scrollBy = (dir) => {
    if (!trackRef.current) return;
    trackRef.current.scrollBy({ left: dir * 176, behavior: "smooth" });
  };

  return (
    <div className="carousel-shell">
      <button
        type="button"
        className="carousel-nav carousel-nav--left"
        onClick={() => scrollBy(-1)}
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
        onClick={() => scrollBy(1)}
        aria-label="Scroll right"
      >
        <FaChevronRight size={12} />
      </button>
    </div>
  );
};

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [searchInput, setSearchInput] = useState(query);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [blendedProducts, setBlendedProducts] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);

  useEffect(() => {
    setSearchInput(query);
    if (query.trim()) {
      performSearch(query.trim());
    } else {
      setProducts([]);
      setCategories([]);
      setBlendedProducts([]);
      setRelatedProducts([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const performSearch = async (searchQuery) => {
    setLoading(true);
    try {
      const [prodRes, catRes, allProdRes] = await Promise.all([
        ProductService.searchProducts({ search: searchQuery, limit: 20 }),
        CategoryService.searchCategories({ search: searchQuery, limit: 10 }),
        ProductService.getProductList(),
      ]);

      let matchedProducts = [];
      if (prodRes.success) {
        matchedProducts = (prodRes.data?.products || []).map((p) => ({
          ...p,
          product_name: p.name || p.product_name,
          selling_price: p.sale_price ?? p.price,
          mrp: p.price,
        }));
        setProducts(matchedProducts);
      } else {
        setProducts([]);
      }

      setCategories(catRes.success ? catRes.data?.categories || [] : []);

      let allProducts = [];
      if (allProdRes.success) {
        allProducts = (allProdRes.data || []).map((p) => ({
          ...p,
          product_name: p.name || p.product_name,
          selling_price: p.sale_price ?? p.price,
          mrp: p.price,
        }));
      }

      const queryLower = searchQuery.toLowerCase();
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

      if (complementaryKeywords.length > 0) {
        const matchedIds = new Set(matchedProducts.map((p) => p.id));
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

      if (matchedProducts.length === 0) {
        const fallback = allProducts
          .filter((p) => p.is_active)
          .sort(() => 0.5 - Math.random())
          .slice(0, 8);
        setRelatedProducts(fallback);
      } else {
        setRelatedProducts([]);
      }
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setSearchParams({ q: searchInput.trim() });
    }
  };

  const clearInput = () => setSearchInput("");

  return (
    <div className="search-page">
      <style>{`
        * { box-sizing: border-box; }
        .search-page {
          background: #f3f6fa;
          min-height: 100vh;
          padding-bottom: 3rem;
          font-family: 'Poppins', sans-serif;
        }

        /* ---------- Hero ---------- */
        .search-hero {
          background: linear-gradient(135deg, ${NAVY} 0%, ${NAVY_DEEP} 100%);
          padding: 2.5rem 1.1rem 4.25rem;
          color: #fff;
          position: relative;
          overflow: hidden;
        }
        .search-hero::before,
        .search-hero::after {
          content: "";
          position: absolute;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(52,161,41,0.28) 0%, rgba(52,161,41,0) 70%);
          pointer-events: none;
        }
        .search-hero::before { width: 300px; height: 300px; top: -150px; right: -90px; }
        .search-hero::after { width: 200px; height: 200px; bottom: -110px; left: -60px; }

        .search-hero-inner {
          max-width: 720px;
          margin: 0 auto;
          text-align: center;
          position: relative;
          z-index: 1;
        }
        .search-eyebrow {
          text-transform: uppercase;
          letter-spacing: 0.14em;
          font-size: 0.68rem;
          font-weight: 700;
          color: #8FD986;
          margin-bottom: 0.45rem;
        }
        .search-title {
          font-weight: 800;
          letter-spacing: -0.02em;
          font-size: clamp(1.4rem, 4.4vw, 2.3rem);
          margin-bottom: 1.35rem;
          line-height: 1.25;
        }

        .search-input-shell {
          display: flex;
          align-items: center;
          background: #fff;
          border-radius: 14px;
          box-shadow: 0 12px 28px rgba(0,0,0,0.28);
          padding: 0.3rem 0.3rem 0.3rem 0.9rem;
          gap: 0.45rem;
        }
        .search-input-shell input {
          flex: 1;
          border: none;
          outline: none;
          padding: 0.7rem 0.2rem;
          font-size: 0.92rem;
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
          font-size: 0.85rem;
          border-radius: 10px;
          padding: 0.7rem 1.25rem;
          flex-shrink: 0;
          cursor: pointer;
          transition: background 0.2s ease;
          white-space: nowrap;
        }
        .search-submit-btn:hover { background: ${GREEN_DEEP}; }

        /* ---------- Container ---------- */
        .search-container {
          max-width: 1200px;
          margin: -2.5rem auto 0;
          padding: 0 0.9rem;
          position: relative;
          z-index: 2;
        }

        /* ---------- Stats card ---------- */
        .search-stats-card {
          background: #fff;
          border-radius: 14px;
          box-shadow: 0 8px 22px rgba(0,32,78,0.08);
          padding: 0.85rem 1.1rem;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        .search-stats-query { color: #64748b; font-size: 0.85rem; }
        .search-stats-query strong { color: ${NAVY}; font-weight: 700; }
        .search-stats-count {
          background: ${GREEN_SOFT};
          color: ${GREEN_DEEP};
          font-weight: 700;
          font-size: 0.72rem;
          padding: 0.38rem 0.7rem;
          border-radius: 999px;
          white-space: nowrap;
        }

        /* ---------- Section headings ---------- */
        .section-heading {
          color: ${NAVY};
          font-weight: 800;
          font-size: 1rem;
          margin-bottom: 0.85rem;
          display: flex;
          align-items: center;
          gap: 0.45rem;
        }
        .section-heading .dot { width: 7px; height: 7px; border-radius: 50%; background: ${GREEN}; flex-shrink: 0; }

        /* ---------- Category chips ---------- */
        .cat-badge-container {
          display: flex;
          gap: 9px;
          overflow-x: auto;
          padding: 2px 2px 12px;
          margin-bottom: 1.5rem;
          scrollbar-width: none;
        }
        .cat-badge-container::-webkit-scrollbar { display: none; }
        .cat-badge {
          flex: 0 0 auto;
          display: flex;
          align-items: center;
          gap: 7px;
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 999px;
          padding: 5px 12px 5px 5px;
          color: ${NAVY};
          text-decoration: none;
          font-weight: 600;
          font-size: 0.8rem;
          box-shadow: 0 2px 8px rgba(0,32,78,0.04);
          transition: all 0.2s ease;
        }
        .cat-badge:hover {
          border-color: ${GREEN};
          transform: translateY(-2px);
          box-shadow: 0 6px 14px rgba(52,161,41,0.18);
          color: ${GREEN_DEEP};
        }
        .cat-badge img { width: 26px; height: 26px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }

        /* ---------- Product grid ---------- */
        .prod-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.7rem;
          margin-bottom: 2.25rem;
        }
        @media (min-width: 480px) { .prod-grid { gap: 0.9rem; } }
        @media (min-width: 640px) { .prod-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
        @media (min-width: 992px) { .prod-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
        @media (min-width: 1200px) { .prod-grid { grid-template-columns: repeat(5, minmax(0, 1fr)); } }

        .prod-card {
          border-radius: 14px;
          overflow: hidden;
          background: #fff;
          border: 1px solid #eef1f6;
          box-shadow: 0 2px 10px rgba(0,32,78,0.05);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          display: flex;
          flex-direction: column;
          height: 100%;
          min-width: 0;
        }
        .prod-card:hover { transform: translateY(-3px); box-shadow: 0 12px 24px rgba(0,32,78,0.12); }

        .prod-img-wrap { position: relative; aspect-ratio: 1 / 1; background: #f1f5f9; overflow: hidden; }
        .prod-img-link { display: block; width: 100%; height: 100%; }
        .prod-img-wrap img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s ease; display: block; }
        .prod-card:hover .prod-img-wrap img { transform: scale(1.07); }
        .prod-img-scrim {
          position: absolute;
          inset: auto 0 0 0;
          height: 46%;
          background: linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.32) 100%);
          pointer-events: none;
        }

        .prod-discount-badge {
          position: absolute; top: 8px; left: 8px;
          background: ${GREEN}; color: #fff;
          font-size: 0.62rem; font-weight: 800;
          padding: 3px 6px; border-radius: 6px;
          z-index: 4; letter-spacing: 0.02em;
        }

        .prod-cat-pill {
          position: absolute; bottom: 8px; left: 8px;
          color: #fff; font-size: 0.62rem; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.04em;
          text-shadow: 0 1px 3px rgba(0,0,0,0.4);
          z-index: 4; max-width: 78%;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }

        .prod-wish-btn {
          position: absolute; top: 7px; right: 7px;
          width: 26px; height: 26px; border-radius: 50%;
          background: rgba(255,255,255,0.95); border: none;
          box-shadow: 0 2px 6px rgba(0,0,0,0.15);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; z-index: 5; color: #b0b8c4;
          transition: transform 0.15s ease;
        }
        .prod-wish-btn:active { transform: scale(0.88); }
        .prod-wish-btn .is-active { color: #ef4444; }

        .prod-add-fab {
          position: absolute; bottom: -14px; right: 10px;
          width: 30px; height: 30px; border-radius: 50%;
          background: ${GREEN}; color: #fff; border: 3px solid #fff;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; z-index: 6;
          box-shadow: 0 4px 10px rgba(52,161,41,0.4);
          transition: background 0.2s ease, transform 0.15s ease;
        }
        .prod-add-fab:hover { background: ${GREEN_DEEP}; }
        .prod-add-fab:active { transform: scale(0.9); }

        .prod-body {
          padding: 1.05rem 0.65rem 0.65rem;
          display: flex; flex-direction: column; flex: 1; gap: 0.4rem;
        }
        .prod-title {
          color: ${NAVY}; font-weight: 700; font-size: 0.8rem; line-height: 1.35;
          text-decoration: none;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
          overflow: hidden; min-height: 2.16em;
        }
        .prod-title:hover { color: ${GREEN_DEEP}; }

        .prod-price-row { display: flex; align-items: baseline; gap: 0.4rem; flex-wrap: wrap; margin-top: auto; }
        .prod-price { color: ${GREEN_DEEP}; font-weight: 800; font-size: 0.92rem; }
        .prod-mrp { color: #b0b8c4; text-decoration: line-through; font-size: 0.7rem; }

        .prod-card--compact { width: 148px; flex: 0 0 148px; scroll-snap-align: start; }

        /* ---------- Skeleton ---------- */
        .skeleton-img { width: 100%; aspect-ratio: 1; }
        .skeleton-line { height: 10px; border-radius: 4px; margin-bottom: 8px; }
        .shimmer {
          background: linear-gradient(90deg, #eef1f5 25%, #e2e8f0 37%, #eef1f5 63%);
          background-size: 400% 100%;
          animation: shimmer 1.4s ease infinite;
        }
        @keyframes shimmer { 0% { background-position: 100% 50%; } 100% { background-position: 0 50%; } }

        /* ---------- Empty state ---------- */
        .empty-warning-card {
          background: #fff; border-radius: 18px;
          box-shadow: 0 8px 26px rgba(0,32,78,0.07);
          padding: 2.75rem 1.4rem; text-align: center; margin-bottom: 2.25rem;
        }
        .empty-icon {
          width: 66px; height: 66px; border-radius: 50%;
          background: rgba(220,53,69,0.08); color: #dc3545;
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 1.1rem;
        }
        .empty-title { color: ${NAVY}; font-weight: 800; font-size: 1.25rem; margin-bottom: 0.45rem; }
        .empty-text { color: #64748b; max-width: 400px; margin: 0 auto 1.35rem; font-size: 0.88rem; line-height: 1.5; }
        .empty-cta {
          display: inline-block; background: ${GREEN}; color: #fff; font-weight: 700;
          text-decoration: none; border-radius: 10px; padding: 0.65rem 1.9rem;
          transition: background 0.2s ease;
        }
        .empty-cta:hover { background: ${GREEN_DEEP}; color: #fff; }

        /* ---------- Blend section (Frequently bought with) ---------- */
        .blend-section {
          background: linear-gradient(135deg, ${NAVY} 0%, ${NAVY_DEEP} 100%);
          border-radius: 18px;
          padding: 1.35rem 0 1.5rem;
          margin-top: 1.75rem;
          box-shadow: 0 10px 26px rgba(0,32,78,0.18);
          overflow: hidden;
          position: relative;
        }
        .blend-section::before {
          content: "";
          position: absolute;
          width: 220px; height: 220px;
          background: radial-gradient(circle, rgba(52,161,41,0.3) 0%, rgba(52,161,41,0) 70%);
          top: -100px; right: -60px;
          pointer-events: none;
        }
        .blend-header { padding: 0 1.1rem; position: relative; z-index: 1; display: flex; align-items: center; gap: 0.65rem; margin-bottom: 0.2rem; }
        .blend-icon {
          width: 38px; height: 38px; border-radius: 10px;
          background: rgba(52,161,41,0.18); color: ${GREEN};
          display: flex; align-items: center; justify-content: center;
          font-size: 1.15rem; flex-shrink: 0;
        }
        .blend-title { font-weight: 800; color: #fff; font-size: 1rem; margin: 0; line-height: 1.3; }
        .blend-title span { color: #8FD986; }
        .blend-subtitle { color: rgba(255,255,255,0.6); font-size: 0.78rem; margin: 0.15rem 0 1.1rem; padding: 0 1.1rem; position: relative; z-index: 1; }

        /* ---------- Carousel ---------- */
        .carousel-shell { position: relative; }
        .carousel-track {
          display: flex; gap: 0.7rem; overflow-x: auto;
          scroll-snap-type: x proximity;
          padding: 0.15rem 1.1rem 0.35rem;
          scrollbar-width: none;
        }
        .carousel-track::-webkit-scrollbar { display: none; }
        .carousel-track .prod-card { background: #fff; }
        .carousel-nav { display: none; }
        @media (min-width: 768px) {
          .carousel-nav {
            display: flex; position: absolute; top: 50%; transform: translateY(-50%);
            width: 32px; height: 32px; border-radius: 50%; background: #fff;
            border: none; box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            align-items: center; justify-content: center; cursor: pointer;
            z-index: 3; color: ${NAVY};
          }
          .carousel-nav--left { left: 8px; }
          .carousel-nav--right { right: 8px; }
        }

        /* ---------- Idle state ---------- */
        .idle-state { text-align: center; padding: 3.25rem 1.5rem; color: #9aa5b5; }
        .idle-state svg { margin-bottom: 1rem; opacity: 0.5; }
        .idle-state h4 { color: ${NAVY}; font-weight: 700; margin-bottom: 0.4rem; }
      `}</style>

      {/* Hero */}
      <div className="search-hero">
        <div className="search-hero-inner">
          <div className="search-eyebrow">Search the catalogue</div>
          <h1 className="search-title">Find exactly what you're craving</h1>
          <form onSubmit={handleSearchSubmit} className="search-form">
            <div className="search-input-shell">
              <FaSearch className="search-icon-static" size={14} />
              <input
                type="text"
                placeholder="Search fresh fruits, groceries, dairy..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                autoComplete="off"
              />
              {searchInput && (
                <button
                  type="button"
                  className="clear-btn"
                  onClick={clearInput}
                  aria-label="Clear search"
                >
                  <FaTimes size={10} />
                </button>
              )}
              <button type="submit" className="search-submit-btn">
                Search
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="search-container">
        {!query ? (
          <div className="idle-state">
            <FaSearch size={40} />
            <h4>Start typing to search</h4>
            <p>Try "milk", "bread" or any product name above.</p>
          </div>
        ) : loading ? (
          <>
            <div className="search-stats-card">
              <div
                className="skeleton-line shimmer"
                style={{ width: "160px", height: "14px", marginBottom: 0 }}
              />
            </div>
            <div className="prod-grid">
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="search-stats-card">
              <div className="search-stats-query">
                Results for <strong>"{query}"</strong>
              </div>
              <div className="search-stats-count">
                {products.length} product{products.length !== 1 ? "s" : ""}{" "}
                &middot; {categories.length} categor
                {categories.length !== 1 ? "ies" : "y"}
              </div>
            </div>

            {categories.length > 0 && (
              <div>
                <h5 className="section-heading">
                  <span className="dot" />
                  Matching categories
                </h5>
                <div className="cat-badge-container">
                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      to={`/categories/${cat.id}`}
                      className="cat-badge"
                    >
                      <img src={cat.image_url || FALLBACK_IMG} alt={cat.name} />
                      <span>{cat.name}</span>
                      <FaChevronRight size={9} style={{ opacity: 0.5 }} />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {products.length > 0 ? (
              <div>
                <h5 className="section-heading">
                  <span className="dot" />
                  Products found
                </h5>
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
            ) : (
              <div className="empty-warning-card">
                <div className="empty-icon">
                  <FaExclamationCircle size={30} />
                </div>
                <h3 className="empty-title">No products found</h3>
                <p className="empty-text">
                  We couldn't find anything matching <strong>"{query}"</strong>.
                  Try a different keyword, or browse the full catalogue below.
                </p>
                <Link to="/products" className="empty-cta">
                  Browse all products
                </Link>
              </div>
            )}

            {products.length === 0 && relatedProducts.length > 0 && (
              <div>
                <h5 className="section-heading">
                  <span className="dot" />
                  Recommended for you
                </h5>
                <div className="prod-grid">
                  {relatedProducts.map((product) => (
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
            )}

            {blendedProducts.length > 0 && (
              <div className="blend-section">
                <div className="blend-header">
                  <div className="blend-icon">🥛</div>
                  <h4 className="blend-title">
                    Frequently bought with <span>"{query}"</span>
                  </h4>
                </div>
                <p className="blend-subtitle">
                  Complementary essentials to complete your order
                </p>
                <ScrollCarousel>
                  {blendedProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
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
      </div>
    </div>
  );
};

export default Search;
