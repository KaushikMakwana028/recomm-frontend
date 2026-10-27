import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaStar,
  FaShoppingCart,
  FaHeart,
  FaTruck,
  FaLock,
  FaHeadset,
  FaArrowRight,
  FaStore,
  FaClock,
  FaMapMarkerAlt,
  FaRoute,
  FaTags,
} from "react-icons/fa";
import AuthService from "../services/authService";
import HeroSlider from "../components/HeroSlider";
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
const FALLBACK_STORE_IMG =
  "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800&auto=format&fit=crop&q=60";

const Home = () => {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [nearbyStores, setNearbyStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [noNearbyVendors, setNoNearbyVendors] = useState(false);
  const [heroContent, setHeroContent] = useState({
    title: "Delicious Food & Beverages",
    subtitle: "Delivered to Your Door",
    description:
      "Discover premium quality food and beverages. Fresh, organic, and delivered with care.",
    btn_text: "Shop Now",
    btn_link: "/products",
    btn2_text: "Explore Products",
    btn2_link: "#featured",
  });
  const [heroSliders, setHeroSliders] = useState([]);

  useEffect(() => {
    loadHeroData();
    loadHomeData();

    // Request customer's current live location on every visit
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const liveLocation = {
            latitude: parseFloat(position.coords.latitude.toFixed(8)),
            longitude: parseFloat(position.coords.longitude.toFixed(8)),
            accuracy: position.coords.accuracy,
            timestamp: Date.now(),
          };
          localStorage.setItem("customer_live_location", JSON.stringify(liveLocation));
        },
        (err) => {
          // Graceful fallback if permission is denied or location is unavailable
          console.debug("Live location notice:", err.message);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
      );
    }
  }, []);

  const loadHeroData = async () => {
    try {
      const res = await AuthService.getHeroSection();
      if (res.success && res.data) {
        if (res.data.content) {
          setHeroContent(res.data.content);
        }
        if (res.data.sliders && res.data.sliders.length > 0) {
          setHeroSliders(res.data.sliders);
        }
      }
    } catch (err) {
      console.error("Failed to load hero data:", err);
    }
  };

  const loadHomeData = async () => {
    setLoading(true);
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

    const result = await AuthService.getHomeData({ latitude: lat, longitude: lng });
    if (result.success) {
      if (result.data.hero) {
        if (result.data.hero.content) setHeroContent(result.data.hero.content);
        if (result.data.hero.sliders && result.data.hero.sliders.length > 0) {
          setHeroSliders(result.data.hero.sliders);
        }
      }
      // Home page must strictly show only in-stock products (no Unavailable, no Only X left)
      const inStockProducts = (result.data.products || []).filter(
        (p) => getStockInfo(p).state === "available"
      );
      setFeaturedProducts(inStockProducts);
      setCategories(result.data.categories || []);
      setNearbyStores(result.data.stores || []);
      setNoNearbyVendors(Boolean(result.no_nearby_vendors || result.data?.no_nearby_vendors));
    } else {
      setNoNearbyVendors(false);
    }
    setLoading(false);
  };

  const handleAddToCart = (product) => {
    addToCart(product);
  };

  return (
    <div className="home-page">
      <style>{`
        /* ---------- Hero ---------- */
        .hm-hero {
          background: linear-gradient(135deg, ${NAVY} 0%, #001a3d 100%);
          padding: 3rem 0 2.5rem;
          overflow: hidden;
          position: relative;
        }
        .hm-hero::after {
          content: '';
          position: absolute; top: -80px; right: -80px;
          width: 320px; height: 320px; border-radius: 50%;
          background: radial-gradient(circle, rgba(52,161,41,0.18), transparent 70%);
        }
        .hm-hero-title {
          font-weight: 800;
          font-size: clamp(1.9rem, 4.4vw, 3.2rem);
          line-height: 1.15;
        }
        .hm-hero-accent { color: ${GREEN}; display: block; }
        .hm-hero-lead { color: rgba(255,255,255,0.85); font-size: clamp(0.95rem, 1.6vw, 1.1rem); }

        .hm-stats { border-top: 1px solid rgba(255,255,255,0.15); margin-top: 1.75rem; padding-top: 1.5rem; }
        .hm-stat-num { color: ${GREEN}; font-weight: 800; font-size: clamp(1.1rem, 2.4vw, 1.6rem); }
        .hm-stat-label { color: rgba(255,255,255,0.7); font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.04em; }

        .hm-hero-img { border-radius: 18px; box-shadow: 0 20px 44px rgba(0,0,0,0.35); aspect-ratio: 4/3; object-fit: cover; }

        .hm-btn-cta { background: ${GREEN}; border-color: ${GREEN}; font-weight: 700; }
        .hm-btn-cta:hover { background: #2c8c22; border-color: #2c8c22; }
        .hm-btn-ghost { border: 2px solid rgba(255,255,255,0.55); color: #fff; font-weight: 600; }
        .hm-btn-ghost:hover { background: rgba(255,255,255,0.1); color: #fff; border-color: #fff; }

        /* ---------- Section heading ---------- */
        .hm-section-head { text-align: center; margin-bottom: 2.25rem; }
        .hm-section-head h2 { color: ${NAVY}; font-weight: 800; font-size: clamp(1.5rem, 3vw, 2rem); margin-bottom: 0.35rem; }
        .hm-section-head p { color: #6c7a90; margin: 0; }

        /* ---------- Features ---------- */
        .hm-feature-icon {
          width: 64px; height: 64px; border-radius: 16px;
          background: rgba(52,161,41,0.1); color: ${GREEN};
          display: inline-flex; align-items: center; justify-content: center;
          margin-bottom: 0.9rem;
        }
        .hm-feature h5 { color: ${NAVY}; font-weight: 700; }

        /* ---------- Category tiles ---------- */
        .hm-cat-tile {
          position: relative; display: block; border-radius: 14px; overflow: hidden;
          aspect-ratio: 4/3; box-shadow: 0 4px 14px rgba(0,32,78,0.1);
          transition: transform .2s ease, box-shadow .2s ease;
        }
        .hm-cat-tile:hover { transform: translateY(-4px); box-shadow: 0 10px 24px rgba(0,32,78,0.18); }
        .hm-cat-tile img { width: 100%; height: 100%; object-fit: cover; transition: transform .4s ease; }
        .hm-cat-tile:hover img { transform: scale(1.08); }
        .hm-cat-overlay { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,32,78,0) 35%, rgba(0,32,78,0.82) 100%); }
        .hm-cat-label {
          position: absolute; left: 0; right: 0; bottom: 0; padding: 0.85rem;
          color: #fff; font-weight: 700; font-size: clamp(0.82rem, 1.6vw, 1.05rem);
          line-height: 1.25; text-shadow: 0 1px 3px rgba(0,0,0,0.35);
        }

        /* ---------- Product cards ---------- */
        .hm-prod-card { border: none; border-radius: 14px; overflow: hidden; height: 100%;
          box-shadow: 0 3px 12px rgba(0,32,78,0.08); transition: transform .18s ease, box-shadow .18s ease; }
        .hm-prod-card:hover { transform: translateY(-3px); box-shadow: 0 10px 22px rgba(0,32,78,0.14); }
        .hm-prod-img-wrap {
          position: relative; aspect-ratio: 1/1; background: #f4f6f9;
          display: flex; align-items: center; justify-content: center; overflow: hidden;
        }
        .hm-prod-img-wrap img { width: 100%; height: 100%; object-fit: contain; padding: 0.75rem; }
        .hm-wish-btn {
          position: absolute; top: 8px; right: 8px; width: 34px; height: 34px; border-radius: 50%;
          background: rgba(255,255,255,0.92); border: none; display: flex; align-items: center; justify-content: center;
          box-shadow: 0 2px 6px rgba(0,0,0,0.15); z-index: 2;
        }
        .hm-prod-title { color: ${NAVY}; font-weight: 600; font-size: 0.92rem;
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; min-height: 2.4em; }
        .hm-prod-title:hover { color: ${GREEN}; }
        .hm-prod-price { color: ${GREEN}; font-weight: 700; }

        /* ---------- Offer banner ---------- */
        .hm-offer { background: linear-gradient(90deg, ${GREEN} 0%, #189031 100%); }

        /* ---------- Newsletter ---------- */
        .hm-newsletter { background: linear-gradient(135deg, ${NAVY} 0%, #001a3d 100%); }
        .hm-newsletter input:focus { box-shadow: 0 0 0 3px rgba(52,161,41,0.35); border-color: ${GREEN}; }

        /* ---------- Testimonials ---------- */
        .hm-testi-card { border: none; border-radius: 14px; box-shadow: 0 3px 12px rgba(0,32,78,0.08); height: 100%; }
        .hm-testi-name { color: ${NAVY}; font-weight: 700; }

        .hm-outline-btn { border: 2px solid ${NAVY}; color: ${NAVY}; font-weight: 700; }
        .hm-outline-btn:hover { background: ${NAVY}; color: #fff; }

        /* ---------- Store cards ---------- */
        .hm-store-card {
          border: none;
          border-radius: 16px;
          overflow: hidden;
          height: 100%;
          background: #fff;
          box-shadow: 0 4px 14px rgba(0,32,78,0.08);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          display: flex;
          flex-direction: column;
        }
        .hm-store-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 28px rgba(0,32,78,0.14);
        }
        .hm-store-img-wrap {
          position: relative;
          height: 160px;
          overflow: hidden;
          background: #f1f5f9;
        }
        .hm-store-img-wrap img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.35s ease;
        }
        .hm-store-card:hover .hm-store-img-wrap img {
          transform: scale(1.06);
        }
        .hm-store-status-badge {
          position: absolute;
          top: 10px;
          left: 10px;
          font-size: 0.76rem;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.18);
        }
        .hm-store-dist-badge {
          position: absolute;
          bottom: 10px;
          right: 10px;
          background: rgba(0, 32, 78, 0.85);
          backdrop-filter: blur(4px);
          color: #fff;
          font-size: 0.74rem;
          font-weight: 600;
          padding: 3px 9px;
          border-radius: 12px;
        }
        .hm-store-body {
          padding: 1.15rem;
          display: flex;
          flex-direction: column;
          flex-grow: 1;
          justify-content: space-between;
        }
        .hm-store-name {
          color: ${NAVY};
          font-weight: 700;
          font-size: 1.05rem;
          margin-bottom: 0.25rem;
          text-decoration: none;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .hm-store-name:hover {
          color: ${GREEN};
        }
        .hm-store-category {
          color: #64748b;
          font-size: 0.82rem;
          margin-bottom: 0.6rem;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .hm-store-meta {
          font-size: 0.8rem;
          color: #64748b;
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-bottom: 0.9rem;
        }
        .hm-store-btn {
          background: ${GREEN};
          border: 1px solid ${GREEN};
          color: #fff;
          font-weight: 700;
          border-radius: 10px;
          padding: 7px 14px;
          font-size: 0.88rem;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: background 0.2s;
        }
        .hm-store-btn:hover {
          background: #2a8720;
          border-color: #2a8720;
          color: #fff;
        }

        @media (max-width: 767.98px) {
          .hm-hero { padding: 2.25rem 0 2rem; text-align: center; }
          .hm-hero .d-flex.gap-3 { justify-content: center; }
          .hm-stats { text-align: center; }
        }
      `}</style>

      {/* Hero Section */}
      <section className="hm-hero text-white">
        <div className="container">
          <div className="row align-items-center g-4">
            <div className="col-lg-6 order-2 order-lg-1">
              <h1 className="hm-hero-title mb-3">
                {heroContent.title || "Delicious Food & Beverages"}{" "}
                {heroContent.subtitle && (
                  <span className="hm-hero-accent">{heroContent.subtitle}</span>
                )}
              </h1>
              <p className="hm-hero-lead mb-4">
                {heroContent.description ||
                  "Discover premium quality food and beverages. Fresh, organic, and delivered with care."}
              </p>
              <div className="d-flex gap-3 flex-wrap">
                {heroContent.btn_link?.startsWith("#") ? (
                  <a
                    href={heroContent.btn_link}
                    className="btn hm-btn-cta btn-lg px-4 text-white"
                  >
                    {heroContent.btn_text || "Shop Now"} <FaArrowRight className="ms-2" />
                  </a>
                ) : (
                  <Link
                    to={heroContent.btn_link || "/products"}
                    className="btn hm-btn-cta btn-lg px-4 text-white"
                  >
                    {heroContent.btn_text || "Shop Now"} <FaArrowRight className="ms-2" />
                  </Link>
                )}

                {heroContent.btn2_link?.startsWith("#") ? (
                  <a
                    href={heroContent.btn2_link}
                    className="btn hm-btn-ghost btn-lg px-4"
                  >
                    {heroContent.btn2_text || "Explore Products"}
                  </a>
                ) : (
                  <Link
                    to={heroContent.btn2_link || "/products"}
                    className="btn hm-btn-ghost btn-lg px-4"
                  >
                    {heroContent.btn2_text || "Explore Products"}
                  </Link>
                )}
              </div>

              <div className="row hm-stats g-3">
                <div className="col-4">
                  <div className="hm-stat-num">500+</div>
                  <div className="hm-stat-label">Products</div>
                </div>
                <div className="col-4">
                  <div className="hm-stat-num">50K+</div>
                  <div className="hm-stat-label">Happy Customers</div>
                </div>
                <div className="col-4">
                  <div className="hm-stat-num">4.8★</div>
                  <div className="hm-stat-label">Avg. Rating</div>
                </div>
              </div>
            </div>

            <div className="col-lg-6 order-1 order-lg-2">
              <HeroSlider
                slides={heroSliders}
                fallbackImg={FALLBACK_IMG}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-5 bg-white">
        <div className="container">
          <div className="row g-4 text-center">
            <div className="col-6 col-md-4 hm-feature">
              <div className="hm-feature-icon">
                <FaTruck size={26} />
              </div>
              <h5 className="mb-2">Free Shipping</h5>
              <p className="text-muted mb-0 small">On orders over $50</p>
            </div>

            <div className="col-6 col-md-4 hm-feature">
              <div className="hm-feature-icon">
                <FaLock size={26} />
              </div>
              <h5 className="mb-2">Secure Payment</h5>
              <p className="text-muted mb-0 small">100% secure transactions</p>
            </div>

            <div className="col-12 col-md-4 hm-feature">
              <div className="hm-feature-icon">
                <FaHeadset size={26} />
              </div>
              <h5 className="mb-2">24/7 Support</h5>
              <p className="text-muted mb-0 small">
                Dedicated customer service
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-5 bg-light">
        <div className="container">
          <div className="hm-section-head">
            <h2>Shop by Category</h2>
            <p>Explore our wide range of products</p>
          </div>

          {loading ? (
            <CategoryGridSkeleton count={8} />
          ) : (
            <div className="row g-3 g-md-4">
              {categories.slice(0, 8).map((category) => (
                <div key={category.id} className="col-6 col-md-4 col-lg-3">
                  <Link
                    to={`/products?category_id=${category.id}`}
                    className="hm-cat-tile"
                  >
                    <img
                      src={category.image_url || FALLBACK_IMG}
                      alt={category.name}
                      loading="lazy"
                    />
                    <div className="hm-cat-overlay" />
                    <div className="hm-cat-label">{category.name}</div>
                  </Link>
                </div>
              ))}
            </div>
          )}

          {categories.length > 8 && (
            <div className="text-center mt-5">
              <Link to="/categories" className="btn hm-outline-btn btn-lg px-5">
                View All Categories
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Stores Near You / Explore Stores Section */}
      <section className="py-5 bg-white">
        <div className="container">
          <div className="hm-section-head">
            <h2>Stores Near You</h2>
            <p>Explore nearby merchant stores and browse their full catalogues</p>
          </div>

          {loading ? (
            <div className="row g-3 g-md-4">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="col-12 col-sm-6 col-lg-3">
                  <div className="card border-0 shadow-sm rounded-4 overflow-hidden p-3" style={{ height: "280px" }}>
                    <div className="bg-light rounded-3 w-100 mb-3" style={{ height: "140px" }} />
                    <div className="bg-light rounded w-75 mb-2" style={{ height: "18px" }} />
                    <div className="bg-light rounded w-50 mb-3" style={{ height: "14px" }} />
                    <div className="bg-light rounded w-100 mt-auto" style={{ height: "36px" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : nearbyStores.length === 0 ? (
            noNearbyVendors ? (
              <NoVendorsEmptyState />
            ) : (
              <div className="text-center py-5 bg-light rounded-4 my-2">
                <FaStore size={42} className="text-muted mb-2 opacity-50" />
                <h5 className="text-muted fw-bold">No stores available near your location</h5>
                <p className="text-muted small mb-0">Check back later or update your delivery address</p>
              </div>
            )
          ) : (
            <div className="row g-3 g-md-4">
              {nearbyStores.map((store) => (
                <div key={store.id} className="col-12 col-sm-6 col-lg-3">
                  <div className="hm-store-card">
                    <div className="hm-store-img-wrap">
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

                      {/* Store Status: Factual Open/Closed */}
                      {store.is_open ? (
                        <span className="hm-store-status-badge bg-success text-white">
                          🟢 Open
                        </span>
                      ) : (
                        <span className="hm-store-status-badge bg-danger text-white">
                          🔴 Closed
                        </span>
                      )}

                      {/* Distance */}
                      {store.distance_text && (
                        <span className="hm-store-dist-badge">
                          <FaRoute className="me-1" size={10} />
                          {store.distance_text}
                        </span>
                      )}
                    </div>

                    <div className="hm-store-body">
                      <div>
                        <Link to={`/store/${store.id}`} className="hm-store-name">
                          {store.store_name}
                        </Link>
                        <div className="hm-store-category">
                          <FaTags className="me-1" size={11} />
                          {store.category_summary || "Grocery & Essentials"}
                        </div>

                        <div className="hm-store-meta">
                          {store.address && (
                            <span className="text-truncate">
                              <FaMapMarkerAlt className="me-1 text-secondary" size={11} />
                              {store.address}
                            </span>
                          )}
                          {store.operating_hours && store.operating_hours !== "Hours not specified" && (
                            <span>
                              <FaClock className="me-1 text-secondary" size={11} />
                              {store.operating_hours}
                            </span>
                          )}
                        </div>
                      </div>

                      <Link to={`/store/${store.id}`} className="hm-store-btn w-100">
                        View Store <FaArrowRight size={11} />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Featured Products Section */}
      <section id="featured" className="py-5">
        <div className="container">
          <div className="hm-section-head">
            <h2>Featured Products</h2>
            <p>Handpicked favorites just for you</p>
          </div>

          {loading ? (
            <ProductGridSkeleton count={8} colClass="col-6 col-md-6 col-lg-3" />
          ) : featuredProducts.length === 0 ? (
            noNearbyVendors ? (
              <NoVendorsEmptyState />
            ) : (
              <div className="text-center py-5">
                <h5 className="text-muted">No featured products right now</h5>
              </div>
            )
          ) : (
            <div className="row g-3 g-md-4">
              {featuredProducts.slice(0, 8).map((product) => {
                const stockInfo = getStockInfo(product);
                const storeName = product.store_name || product.vendor_name;
                return (
                  <div key={product.id} className="col-6 col-md-6 col-lg-3">
                    <div className="hm-prod-card card h-100 d-flex flex-column">
                      <div className="hm-prod-img-wrap position-relative">
                        <Link to={`/product/${product.id}`}>
                          <img
                            src={product.image_url || FALLBACK_IMG}
                            alt={product.name}
                            loading="lazy"
                          />
                        </Link>
                        <button
                          className="hm-wish-btn"
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

                      <div className="card-body pb-2 d-flex flex-column">
                        <Link
                          to={`/product/${product.id}`}
                          className="text-decoration-none hm-prod-title d-block mb-1"
                        >
                          {product.name}
                        </Link>
                        {product.category_name && (
                          <p className="text-muted small mb-1">
                            {product.category_name}
                          </p>
                        )}

                        {storeName && (
                          <div className="mb-2">
                            <Link
                              to={product.vendor_id ? `/store/${product.vendor_id}` : "#"}
                              className="d-inline-flex align-items-center gap-1 text-decoration-none"
                              style={{
                                fontSize: "0.76rem",
                                color: "#475569",
                                fontWeight: 600,
                                background: "#f1f5f9",
                                padding: "2px 7px",
                                borderRadius: "6px",
                                maxWidth: "100%",
                              }}
                              title={`Sold by ${storeName}`}
                            >
                              <FaStore style={{ color: GREEN, fontSize: "0.72rem", flexShrink: 0 }} />
                              <span className="text-truncate">
                                {storeName}
                              </span>
                            </Link>
                          </div>
                        )}

                        <div className="mt-auto d-flex align-items-center justify-content-between flex-wrap gap-1 pt-1">
                          <span className="hm-prod-price fs-6">
                            {formatPrice(product.price)}
                          </span>
                          <span
                            className="badge"
                            style={{
                              backgroundColor: stockInfo.badgeBg,
                              color: stockInfo.badgeColor,
                              border: `1px solid ${stockInfo.badgeBorder}`,
                              fontSize: "0.7rem",
                              fontWeight: 700,
                              padding: "3px 6px",
                              borderRadius: "6px",
                            }}
                          >
                            {stockInfo.badgeLabel}
                          </span>
                        </div>
                      </div>

                      <div className="card-footer bg-white border-0 pt-0">
                        <button
                          className="btn hm-btn-cta text-white w-100 btn-sm"
                          onClick={() => handleAddToCart(product)}
                          disabled={!stockInfo.canAddToCart}
                          title={!stockInfo.canAddToCart ? stockInfo.cartDisabledReason : ""}
                          style={{
                            opacity: !stockInfo.canAddToCart ? 0.6 : 1,
                            cursor: !stockInfo.canAddToCart ? "not-allowed" : "pointer",
                          }}
                        >
                          <FaShoppingCart className="me-2" size={13} />
                          {stockInfo.canAddToCart ? "Add to Cart" : stockInfo.buttonLabel}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="text-center mt-5">
            <Link to="/products" className="btn hm-outline-btn btn-lg px-5">
              View All Products
            </Link>
          </div>
        </div>
      </section>

      {/* Offer Banner Section */}
      <section className="hm-offer py-4">
        <div className="container">
          <div className="row align-items-center text-center text-md-start g-3">
            <div className="col-md-8 text-white">
              <h4 className="fw-bold mb-1">
                🎉 Flat 20% OFF on your first order!
              </h4>
              <p className="mb-0 opacity-75">
                Use code <strong>WELCOME</strong> at checkout. Limited time
                offer.
              </p>
            </div>
            <div className="col-md-4 text-center text-md-end">
              <Link
                to="/products"
                className="btn btn-light btn-lg fw-bold px-4"
              >
                Shop Now <FaArrowRight className="ms-2" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="hm-newsletter py-5 text-white">
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-lg-8 text-center">
              <h2 className="fw-bold mb-3">Subscribe to Our Newsletter</h2>
              <p className="mb-4">
                Get the latest updates on new products and exclusive offers!
              </p>

              <form
                className="row g-2 justify-content-center"
                onSubmit={(e) => e.preventDefault()}
              >
                <div className="col-12 col-md-6">
                  <input
                    type="email"
                    className="form-control form-control-lg"
                    placeholder="Enter your email"
                    required
                  />
                </div>
                <div className="col-12 col-md-auto">
                  <button
                    type="submit"
                    className="btn hm-btn-cta btn-lg px-4 text-white w-100"
                  >
                    Subscribe
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-5 bg-light">
        <div className="container">
          <div className="hm-section-head">
            <h2>What Our Customers Say</h2>
            <p>Real reviews from real customers</p>
          </div>

          <div className="row g-4">
            {[
              {
                name: "Sarah Johnson",
                rating: 5,
                text: "Amazing quality and fast delivery! The organic products are fresh and delicious.",
              },
              {
                name: "Michael Chen",
                rating: 5,
                text: "Best online food store! Great variety and excellent customer service.",
              },
              {
                name: "Emily Davis",
                rating: 5,
                text: "Love the convenience and quality. My go-to place for healthy snacks!",
              },
            ].map((testimonial, index) => (
              <div key={index} className="col-md-4">
                <div className="hm-testi-card card">
                  <div className="card-body p-4">
                    <div className="text-warning mb-3">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <FaStar key={i} />
                      ))}
                    </div>
                    <p className="mb-3">"{testimonial.text}"</p>
                    <h6 className="hm-testi-name mb-0">- {testimonial.name}</h6>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
