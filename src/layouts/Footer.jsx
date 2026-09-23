import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import logoDark from "../assets/recomm-logo-sidebar.png";
import CategoryService from "../services/categoryService";
import ProductService from "../services/productService";
import { formatPrice } from "../utils/helpers";
import {
  FaFacebookF,
  FaTwitter,
  FaInstagram,
  FaLinkedinIn,
  FaYoutube,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaLeaf,
  FaTruck,
  FaShieldAlt,
  FaStar,
  FaChevronDown,
  FaStore,
  FaArrowRight,
  FaExternalLinkAlt,
} from "react-icons/fa";

const NAVY = "#00204E";
const GREEN = "#34A129";
const VENDOR_REGISTER_URL =
  process.env.REACT_APP_VENDOR_REGISTER_URL || "http://localhost:3001/register";

const SOCIAL_LINKS = [
  { Icon: FaFacebookF, href: "https://facebook.com", label: "Facebook" },
  { Icon: FaTwitter, href: "https://twitter.com", label: "Twitter" },
  { Icon: FaInstagram, href: "https://instagram.com", label: "Instagram" },
  { Icon: FaLinkedinIn, href: "https://linkedin.com", label: "LinkedIn" },
  { Icon: FaYoutube, href: "https://youtube.com", label: "YouTube" },
];

const BOTTOM_LINKS = [
  { label: "Terms & Conditions", path: "/terms-conditions" },
  { label: "Privacy Policy", path: "/privacy-policy" },
  { label: "Refund Policy", path: "/refund-policy" },
];

const FEATURES = [
  { Icon: FaTruck, title: "Free Shipping", sub: "On orders over ₹500" },
  { Icon: FaShieldAlt, title: "Secure Payment", sub: "100% protected" },
  { Icon: FaLeaf, title: "Fresh & Organic", sub: "Quality guaranteed" },
  { Icon: FaStar, title: "Top Rated", sub: "4.8★ average rating" },
];

const Footer = () => {
  const currentYear = new Date().getFullYear();

  // Accordion state for mobile view
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [quickLinksOpen, setQuickLinksOpen] = useState(false);

  // Real-time fetched data
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Handle vendor registration redirect
  const handleVendorRedirect = (e) => {
    if (e) e.preventDefault();
    window.location.href = VENDOR_REGISTER_URL;
  };

  // Fetch real-time categories and products
  useEffect(() => {
    let isMounted = true;

    const fetchCategories = async () => {
      try {
        const res = await CategoryService.getCategoryList();
        if (isMounted && res && res.success && Array.isArray(res.data)) {
          const active = res.data.filter((c) => String(c.is_active) !== "0");
          setCategories(active.slice(0, 6));
        }
      } catch (err) {
        console.warn("Failed to fetch footer categories", err);
      } finally {
        if (isMounted) setLoadingCategories(false);
      }
    };

    const fetchProducts = async () => {
      try {
        const res = await ProductService.getProductList({ limit: 6 });
        if (isMounted && res && res.success && Array.isArray(res.data)) {
          setProducts(res.data.slice(0, 6));
        }
      } catch (err) {
        console.warn("Failed to fetch footer products", err);
      } finally {
        if (isMounted) setLoadingProducts(false);
      }
    };

    fetchCategories();
    fetchProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <footer className="ft">
      <style>{`
        * { box-sizing: border-box; }
        .ft { background-color: ${NAVY}; color: #fff; font-family: 'Poppins', sans-serif; margin-top: 3rem; }
        .ft-inner { max-width: 1280px; margin: 0 auto; padding: 0 1.25rem; }

        /* ---------- Features bar ---------- */
        .ft-features { border-bottom: 1px solid rgba(255,255,255,0.08); padding: 1.4rem 0; }
        .ft-features-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
          text-align: center;
        }
        .ft-feature-icon { color: ${GREEN}; margin-bottom: 0.5rem; }
        .ft-feature-title { font-size: 0.82rem; font-weight: 700; margin: 0 0 0.15rem; }
        .ft-feature-sub { font-size: 0.72rem; color: rgba(255,255,255,0.55); display: block; }

        /* ---------- Vendor CTA Banner ---------- */
        .ft-vendor-banner {
          background: linear-gradient(135deg, rgba(52, 161, 41, 0.14) 0%, rgba(0, 32, 78, 0.4) 100%);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding: 1.5rem 0;
        }
        .ft-vendor-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(52, 161, 41, 0.35);
          border-radius: 12px;
          padding: 1.25rem 1.6rem;
          gap: 1.5rem;
          flex-wrap: wrap;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .ft-vendor-card:hover {
          border-color: rgba(52, 161, 41, 0.65);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
        }
        .ft-vendor-left {
          display: flex;
          align-items: center;
          gap: 1.15rem;
          flex: 1;
          min-width: 260px;
        }
        .ft-vendor-icon-wrap {
          width: 50px;
          height: 50px;
          border-radius: 12px;
          background: rgba(52, 161, 41, 0.2);
          color: ${GREEN};
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          font-size: 1.45rem;
        }
        .ft-vendor-title {
          font-size: 1.1rem;
          font-weight: 700;
          margin: 0 0 0.25rem;
          color: #ffffff;
        }
        .ft-vendor-sub {
          font-size: 0.83rem;
          color: rgba(255, 255, 255, 0.7);
          margin: 0;
          line-height: 1.4;
        }
        .ft-vendor-cta-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.55rem;
          background: ${GREEN};
          color: #ffffff;
          font-size: 0.92rem;
          font-weight: 700;
          padding: 0.78rem 1.5rem;
          border-radius: 9px;
          text-decoration: none;
          border: 1px solid transparent;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(52, 161, 41, 0.35);
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        .ft-vendor-cta-btn:hover {
          background: #278a1e;
          color: #ffffff;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(52, 161, 41, 0.45);
        }

        /* ---------- Main content ---------- */
        .ft-main { padding: 2.5rem 0 2rem; }
        .ft-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0;
        }
        @media (min-width: 1200px) {
          .ft-grid { grid-template-columns: 2.2fr 1.3fr 1.5fr 1.2fr 2fr; gap: 2rem; }
        }
        @media (min-width: 992px) and (max-width: 1199.98px) {
          .ft-grid { grid-template-columns: 1.8fr 1.2fr 1.4fr 1.1fr 1.8fr; gap: 1.3rem; }
        }
        @media (min-width: 768px) and (max-width: 991.98px) {
          .ft-grid { grid-template-columns: repeat(2, 1fr); gap: 1.8rem; }
        }

        .ft-brand-block { padding-bottom: 1.5rem; }
        .ft-brand-name { font-weight: 800; font-size: 1.35rem; margin: 0 0 0.85rem; }
        .ft-brand-name a { text-decoration: none; }
        .ft-tagline { color: rgba(255,255,255,0.6); line-height: 1.65; font-size: 0.88rem; margin: 0 0 1.1rem; }

        .ft-social-row { display: flex; gap: 0.6rem; }
        .ft-social {
          width: 36px; height: 36px; border-radius: 50%;
          background: rgba(255,255,255,0.08); display: flex; align-items: center;
          justify-content: center; color: #fff; transition: background-color .2s ease;
          flex-shrink: 0;
        }
        .ft-social:hover { background: ${GREEN}; color: #fff; }

        .ft-heading {
          color: ${GREEN}; text-transform: uppercase; letter-spacing: 0.06em;
          font-size: 0.78rem; font-weight: 700; margin: 0;
        }
        .ft-heading-desktop { display: none; margin-bottom: 1rem; }

        /* Mobile accordion toggle */
        .ft-accordion-toggle {
          display: flex; align-items: center; justify-content: space-between;
          width: 100%; background: none; border: none; padding: 0.15rem 0;
          cursor: pointer;
        }
        .ft-chevron { color: ${GREEN}; transition: transform .2s ease; flex-shrink: 0; }
        .ft-chevron.is-open { transform: rotate(180deg); }

        .ft-link-list { list-style: none; margin: 0; padding: 0; }
        .ft-link-list li { margin-bottom: 0.62rem; }
        .ft-link {
          color: rgba(255,255,255,0.65); text-decoration: none; font-size: 0.86rem;
          transition: color .2s ease;
          display: inline-block;
        }
        .ft-link:hover { color: ${GREEN}; }

        /* Product items in footer */
        .ft-product-link {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
          color: rgba(255,255,255,0.65);
          text-decoration: none;
          font-size: 0.86rem;
          transition: color .2s ease;
        }
        .ft-product-link:hover { color: ${GREEN}; }
        .ft-product-name {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 150px;
        }
        .ft-product-badge {
          font-size: 0.72rem;
          color: ${GREEN};
          background: rgba(52, 161, 41, 0.12);
          border: 1px solid rgba(52, 161, 41, 0.25);
          padding: 0.1rem 0.45rem;
          border-radius: 4px;
          font-weight: 600;
          white-space: nowrap;
        }

        .ft-view-all-link {
          display: inline-block;
          margin-top: 0.35rem;
          color: ${GREEN};
          font-size: 0.8rem;
          font-weight: 700;
          text-decoration: none;
          transition: transform .2s ease;
        }
        .ft-view-all-link:hover {
          color: #4cd13e;
          text-decoration: underline;
        }

        .ft-vendor-quicklink {
          color: ${GREEN} !important;
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
        }
        .ft-vendor-quicklink:hover {
          color: #4cd13e !important;
          text-decoration: underline;
        }

        .ft-loading-text {
          font-size: 0.8rem;
          color: rgba(255,255,255,0.4);
          font-style: italic;
        }

        .ft-contact-item { display: flex; align-items: flex-start; gap: 0.65rem; margin-bottom: 0.7rem; font-size: 0.86rem; }
        .ft-contact-item svg { color: ${GREEN}; flex-shrink: 0; margin-top: 3px; }
        .ft-contact-item a, .ft-contact-item span { color: rgba(255,255,255,0.65); text-decoration: none; }
        .ft-contact-item a:hover { color: ${GREEN}; }

        .ft-newsletter-row { display: flex; flex-direction: column; gap: 0.5rem; }
        .ft-newsletter-input {
          width: 100%; border: none; border-radius: 8px;
          padding: 0.65rem 0.85rem; font-size: 0.85rem; color: ${NAVY};
          font-family: 'Poppins', sans-serif;
        }
        .ft-newsletter-input:focus { outline: none; box-shadow: 0 0 0 3px rgba(52,161,41,0.35); }
        .ft-subscribe-btn {
          background: ${GREEN}; color: #fff; border: none; border-radius: 8px;
          padding: 0.65rem 1.1rem; font-weight: 700; font-size: 0.85rem;
          cursor: pointer; white-space: nowrap; flex-shrink: 0;
          transition: background 0.18s ease;
          width: 100%;
        }
        .ft-subscribe-btn:hover { background: #278a1e; }

        @media (min-width: 480px) {
          .ft-newsletter-row { flex-direction: row; }
          .ft-newsletter-input { width: auto; flex: 1; }
          .ft-subscribe-btn { width: auto; }
        }

        /* ---------- Bottom bar ---------- */
        .ft-bottom { border-top: 1px solid rgba(255,255,255,0.08); padding: 1.1rem 0; }
        .ft-bottom-row {
          display: flex; flex-direction: column; align-items: center; gap: 0.6rem; text-align: center;
        }
        @media (min-width: 768px) {
          .ft-bottom-row { flex-direction: row; justify-content: space-between; text-align: left; }
        }
        .ft-copyright { font-size: 0.8rem; color: rgba(255,255,255,0.5); margin: 0; }
        .ft-legal-row { display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap; justify-content: center; }
        .ft-legal-link { color: rgba(255,255,255,0.5); text-decoration: none; font-size: 0.78rem; transition: color .2s ease; }
        .ft-legal-link:hover { color: ${GREEN}; }
        .ft-legal-sep { color: rgba(255,255,255,0.25); font-size: 0.75rem; }

        /* ==================== MOBILE ==================== */
        @media (max-width: 767.98px) {
          .ft-features { padding: 1.15rem 0; }
          .ft-features-grid { grid-template-columns: repeat(2, 1fr); gap: 1rem 0.75rem; text-align: left; }
          .ft-feature-item { display: flex; align-items: center; gap: 0.65rem; }
          .ft-feature-icon-badge {
            width: 36px; height: 36px; border-radius: 9px; flex-shrink: 0;
            background: rgba(52,161,41,0.15); display: flex; align-items: center; justify-content: center;
          }
          .ft-feature-title { font-size: 0.76rem; }
          .ft-feature-sub { font-size: 0.68rem; }

          .ft-vendor-card {
            flex-direction: column;
            align-items: flex-start;
            padding: 1.15rem;
            gap: 1rem;
          }
          .ft-vendor-left {
            min-width: 100%;
          }
          .ft-vendor-cta-btn {
            width: 100%;
            padding: 0.75rem 1rem;
            font-size: 0.88rem;
          }

          .ft-main { padding: 1.5rem 0 0.5rem; }
          .ft-brand-block { text-align: left; margin-bottom: 0.25rem; }
          .ft-tagline { font-size: 0.85rem; }

          .ft-heading-desktop { display: none; }

          .ft-col { border-top: 1px solid rgba(255,255,255,0.08); padding: 1rem 0; }
          .ft-contact-col { border-top: 1px solid rgba(255,255,255,0.08); padding: 1rem 0 1.5rem; }

          .ft-link-list { max-height: 0; overflow: hidden; margin: 0; transition: max-height .25s ease; }
          .ft-link-list.is-open { max-height: 400px; margin-top: 0.85rem; }
        }

        @media (min-width: 768px) {
          .ft-accordion-toggle { display: none; }
          .ft-heading-desktop { display: block; }
          .ft-link-list { max-height: none !important; overflow: visible; }
        }

        @media (max-width: 400px) {
          .ft-features-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* 1. Features Bar */}
      <div className="ft-features">
        <div className="ft-inner">
          <div className="ft-features-grid">
            {FEATURES.map(({ Icon, title, sub }) => (
              <div key={title} className="ft-feature-item">
                <span className="ft-feature-icon-badge">
                  <Icon
                    size={16}
                    className="ft-feature-icon"
                    style={{ marginBottom: 0 }}
                  />
                </span>
                <div>
                  <h6 className="ft-feature-title">{title}</h6>
                  <span className="ft-feature-sub">{sub}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Vendor Registration CTA Banner */}
      <div className="ft-vendor-banner">
        <div className="ft-inner">
          <div className="ft-vendor-card">
            <div className="ft-vendor-left">
              <div className="ft-vendor-icon-wrap">
                <FaStore />
              </div>
              <div>
                <h5 className="ft-vendor-title">Grow Your Store with Recomm</h5>
                <p className="ft-vendor-sub">
                  Are you a local merchant or grocery store? Reach thousands of
                  nearby customers and expand your sales effortlessly.
                </p>
              </div>
            </div>
            <a
              href={VENDOR_REGISTER_URL}
              onClick={handleVendorRedirect}
              className="ft-vendor-cta-btn"
              role="button"
            >
              <FaStore size={15} />
              Have a Store? Become a Vendor
              <FaArrowRight size={13} />
            </a>
          </div>
        </div>
      </div>

      {/* 3. Main Footer Content */}
      <div className="ft-main">
        <div className="ft-inner">
          <div className="ft-grid">
            {/* Column 1: Brand Info */}
            <div className="ft-brand-block">
              <Link
                to="/"
                className="ft-brand-name"
                style={{ display: "inline-block", height: "75px" }}
              >
                <img
                  src={logoDark}
                  alt="Recomm Logo"
                  style={{
                    height: "100%",
                    width: "auto",
                    objectFit: "contain",
                  }}
                />
              </Link>
              <p className="ft-tagline">
                Delicious food, groceries &amp; beverages delivered right to
                your doorstep with unmatched quality and speed.
              </p>
              <div className="ft-social-row">
                {SOCIAL_LINKS.map(({ Icon, href, label }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ft-social"
                    aria-label={label}
                  >
                    <Icon size={15} />
                  </a>
                ))}
              </div>
            </div>

            {/* Column 2: Real-time Categories */}
            <div className="ft-col">
              <button
                type="button"
                className="ft-accordion-toggle"
                onClick={() => setCategoriesOpen((v) => !v)}
                aria-expanded={categoriesOpen}
              >
                <span className="ft-heading">Categories</span>
                <FaChevronDown
                  size={12}
                  className={`ft-chevron ${categoriesOpen ? "is-open" : ""}`}
                />
              </button>
              <h6 className="ft-heading ft-heading-desktop">Categories</h6>
              <ul className={`ft-link-list ${categoriesOpen ? "is-open" : ""}`}>
                {loadingCategories ? (
                  <li className="ft-loading-text">Loading categories...</li>
                ) : categories.length > 0 ? (
                  <>
                    {categories.map((cat) => (
                      <li key={cat.id}>
                        <Link to={`/categories/${cat.id}`} className="ft-link">
                          {cat.name}
                        </Link>
                      </li>
                    ))}
                    <li>
                      <Link to="/categories" className="ft-view-all-link">
                        View All Categories &rarr;
                      </Link>
                    </li>
                  </>
                ) : (
                  <li>
                    <Link to="/categories" className="ft-link">
                      Browse All Categories
                    </Link>
                  </li>
                )}
              </ul>
            </div>

            {/* Column 3: Real-time Products */}
            <div className="ft-col">
              <button
                type="button"
                className="ft-accordion-toggle"
                onClick={() => setProductsOpen((v) => !v)}
                aria-expanded={productsOpen}
              >
                <span className="ft-heading">Featured Products</span>
                <FaChevronDown
                  size={12}
                  className={`ft-chevron ${productsOpen ? "is-open" : ""}`}
                />
              </button>
              <h6 className="ft-heading ft-heading-desktop">
                Featured Products
              </h6>
              <ul className={`ft-link-list ${productsOpen ? "is-open" : ""}`}>
                {loadingProducts ? (
                  <li className="ft-loading-text">Loading products...</li>
                ) : products.length > 0 ? (
                  <>
                    {products.map((prod) => (
                      <li key={prod.id}>
                        <Link
                          to={`/product/${prod.id}`}
                          className="ft-product-link"
                        >
                          <span className="ft-product-name">{prod.name}</span>
                          {(prod.price || prod.sale_price) && (
                            <span className="ft-product-badge">
                              {formatPrice(prod.sale_price || prod.price)}
                            </span>
                          )}
                        </Link>
                      </li>
                    ))}
                    <li>
                      <Link to="/products" className="ft-view-all-link">
                        View All Products &rarr;
                      </Link>
                    </li>
                  </>
                ) : (
                  <li>
                    <Link to="/products" className="ft-link">
                      Explore All Products
                    </Link>
                  </li>
                )}
              </ul>
            </div>

            {/* Column 4: Quick Links & Vendor Access */}
            <div className="ft-col">
              <button
                type="button"
                className="ft-accordion-toggle"
                onClick={() => setQuickLinksOpen((v) => !v)}
                aria-expanded={quickLinksOpen}
              >
                <span className="ft-heading">Quick Links</span>
                <FaChevronDown
                  size={12}
                  className={`ft-chevron ${quickLinksOpen ? "is-open" : ""}`}
                />
              </button>
              <h6 className="ft-heading ft-heading-desktop">Quick Links</h6>
              <ul className={`ft-link-list ${quickLinksOpen ? "is-open" : ""}`}>
                <li>
                  <Link to="/" className="ft-link">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link to="/products" className="ft-link">
                    All Products
                  </Link>
                </li>
                <li>
                  <Link to="/categories" className="ft-link">
                    All Categories
                  </Link>
                </li>
                <li>
                  <Link to="/profile?tab=orders" className="ft-link">
                    Track Order
                  </Link>
                </li>
                <li>
                  <Link to="/refund-policy" className="ft-link">
                    Refund Policy
                  </Link>
                </li>
                <li>
                  <a
                    href={VENDOR_REGISTER_URL}
                    onClick={handleVendorRedirect}
                    className="ft-link ft-vendor-quicklink"
                  >
                    Have a Store? Become a Vendor
                    <FaExternalLinkAlt size={10} />
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 5: Contact Info & Newsletter */}
            <div className="ft-contact-col">
              <h6 className="ft-heading" style={{ marginBottom: "0.9rem" }}>
                Contact Us
              </h6>
              <div className="ft-contact-item">
                <FaMapMarkerAlt size={13} />
                <span>
                 402 Silicon Square, Ring Road, Surat, Gujarat - 395002
                </span>
              </div>
              <div className="ft-contact-item">
                <FaPhone size={13} />
                <a href="tel:+91 (0261) 234-5678">+91 (0261) 234-5678</a>
              </div>
              <div
                className="ft-contact-item"
                style={{ marginBottom: "1.1rem" }}
              >
                <FaEnvelope size={13} />
                <a href="mailto:grievance@recomm.in">grievance@recomm.in</a>
              </div>

              <h6 className="ft-heading" style={{ marginBottom: "0.6rem" }}>
                Newsletter
              </h6>
              <div className="ft-newsletter-row">
                <input
                  type="email"
                  className="ft-newsletter-input"
                  placeholder="Your email address"
                  aria-label="Email for newsletter"
                />
                <button className="ft-subscribe-btn" type="button">
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Bottom Bar */}
      <div className="ft-bottom">
        <div className="ft-inner">
          <div className="ft-bottom-row">
            <p className="ft-copyright">
              © {currentYear} ReComm Technologies Private Limited. All rights reserved. Made with ❤️
            </p>
            <div className="ft-legal-row">
              {BOTTOM_LINKS.map((link, index, arr) => (
                <React.Fragment key={link.label}>
                  <Link to={link.path} className="ft-legal-link">
                    {link.label}
                  </Link>
                  {index < arr.length - 1 && (
                    <span className="ft-legal-sep">|</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
