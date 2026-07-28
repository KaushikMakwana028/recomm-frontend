import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  FaShoppingCart,
  FaHeart,
  FaUser,
  FaSearch,
  FaBars,
  FaTimes,
  FaHome,
  FaBoxOpen,
  FaThLarge,
  FaTags,
  FaChevronRight,
  FaSignOutAlt,
} from "react-icons/fa";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useWishlist } from "../context/WishlistContext";
import SearchBar from "../components/SearchBar";

const NAVY = "#00204E";
const NAVY_LIGHT = "#0A2E5C";
const GREEN = "#34A129";
const GREEN_DARK = "#2C8A22";

const NAV_LINKS = [
  { label: "Home", to: "/", icon: FaHome },
  { label: "Products", to: "/products", icon: FaBoxOpen },
  { label: "Categories", to: "/categories", icon: FaThLarge },
  { label: "Deals", to: "/products?deals=true", icon: FaTags },
];

const Header = () => {
  const { cartItemCount, toggleCart } = useCart();
  const { isAuthenticated, user, logout } = useAuth();
  const { wishlistCount } = useWishlist();
  const navigate = useNavigate();
  const location = useLocation();

  const [showSearch, setShowSearch] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile drawer and search bar whenever the route changes.
  useEffect(() => {
    setMenuOpen(false);
    setShowSearch(false);
  }, [location.pathname, location.search]);

  // Lock body scroll while the mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  const handleLogout = async () => {
    closeMenu();
    await logout();
    navigate("/");
  };

  // helper so the badge shows "99+" consistently everywhere it's used
  const fmtCount = (n) => (n > 99 ? "99+" : n);

  return (
    <>
      <style>{`
                .rc-topbar {
                    background: ${NAVY};
                    font-size: 0.8rem;
                    letter-spacing: 0.01em;
                }
                .rc-topbar a { color: rgba(255,255,255,0.85); text-decoration: none; transition: color .15s ease; }
                .rc-topbar a:hover { color: #ffffff; }

                .rc-navbar {
                    background: ${NAVY};
                    transition: box-shadow .2s ease;
                    position: relative;
                    z-index: 1030;
                }
                .rc-navbar.is-scrolled { box-shadow: 0 4px 16px rgba(0,0,0,0.18); }

                /* ---- FIX: keep brand + actions on a single row at every width ----
                   Bootstrap's .navbar sets flex-wrap: wrap by default, which is what
                   was forcing the logo and icon row onto two separate lines on mobile. */
                .rc-navbar .container {
                    flex-wrap: nowrap;
                    gap: 0.5rem;
                    padding-left: max(1rem, env(safe-area-inset-left));
                    padding-right: max(0.75rem, env(safe-area-inset-right));
                }

                .rc-brand {
                    letter-spacing: -0.02em;
                    font-size: clamp(1.15rem, 5vw, 1.5rem);
                    white-space: nowrap;
                    flex-shrink: 1;
                    min-width: 0;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .rc-nav-link {
                    position: relative;
                    color: rgba(255,255,255,0.85) !important;
                    font-weight: 500;
                    padding: 0.5rem 0.85rem;
                    text-decoration: none;
                    transition: color .15s ease;
                }
                .rc-nav-link::after {
                    content: '';
                    position: absolute;
                    left: 0.85rem;
                    right: 0.85rem;
                    bottom: 0.15rem;
                    height: 2px;
                    background: ${GREEN};
                    transform: scaleX(0);
                    transform-origin: center;
                    transition: transform .18s ease;
                }
                .rc-nav-link:hover { color: #ffffff !important; }
                .rc-nav-link:hover::after { transform: scaleX(1); }
                .rc-nav-link.active { color: #ffffff !important; }
                .rc-nav-link.active::after { transform: scaleX(1); }

                /* ---- Icon buttons + badges (cart / wishlist) ---- */
                .rc-icon-btn-wrap {
                    position: relative;
                    display: inline-flex;
                    flex-shrink: 0;
                }
                .rc-icon-btn {
                    position: relative;
                    color: rgba(255,255,255,0.9);
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    text-decoration: none;
                    transition: background-color .15s ease, color .15s ease, transform .1s ease;
                }
                .rc-icon-btn:hover { background: rgba(255,255,255,0.12); color: #ffffff; }
                .rc-icon-btn:active { transform: scale(0.94); }
                .rc-icon-btn:focus-visible { outline: 2px solid ${GREEN}; outline-offset: 2px; }

                .rc-badge {
                    position: absolute;
                    top: -2px;
                    right: -2px;
                    min-width: 19px;
                    height: 19px;
                    padding: 0 5px;
                    border-radius: 999px;
                    background: linear-gradient(135deg, ${GREEN}, ${GREEN_DARK});
                    color: #fff;
                    font-size: 0.68rem;
                    font-weight: 700;
                    line-height: 19px;
                    text-align: center;
                    box-shadow: 0 0 0 2.5px ${NAVY}, 0 2px 4px rgba(0,0,0,0.35);
                    z-index: 3;
                    pointer-events: none;
                    animation: rc-badge-pop .2s ease;
                }
                /* On the white search bar / any light surface the icon buttons sit on,
                   swap the badge ring so it never blends into the background. */
                .rc-icon-btn-wrap.on-light .rc-badge {
                    box-shadow: 0 0 0 2.5px #ffffff, 0 2px 4px rgba(0,0,0,0.2);
                }
                @keyframes rc-badge-pop {
                    from { transform: scale(0.5); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }

                .rc-avatar {
                    width: 34px;
                    height: 34px;
                    border-radius: 50%;
                    overflow: hidden;
                    background: ${GREEN};
                    color: #fff;
                    font-size: 0.85rem;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                }

                .rc-user-toggle {
                    background: rgba(255,255,255,0.06);
                    border-radius: 999px;
                    padding: 3px 10px 3px 3px;
                    transition: background-color .15s ease;
                }
                .rc-user-toggle:hover { background: rgba(255,255,255,0.12); }

                .rc-dropdown-menu {
                    border-radius: 12px;
                    padding: 0.4rem;
                    min-width: 220px;
                }
                .rc-dropdown-menu .dropdown-item {
                    border-radius: 8px;
                    padding: 0.55rem 0.75rem;
                    font-size: 0.9rem;
                    display: flex;
                    align-items: center;
                }
                .rc-dropdown-menu .dropdown-item:active,
                .rc-dropdown-menu .dropdown-item:hover {
                    background: rgba(52, 161, 41, 0.1);
                    color: ${NAVY};
                }

                .rc-btn-cta {
                    background: ${GREEN};
                    border-color: ${GREEN};
                    font-weight: 600;
                    transition: filter .15s ease;
                }
                .rc-btn-cta:hover { filter: brightness(1.08); background: ${GREEN}; border-color: ${GREEN}; }

                .rc-btn-ghost {
                    border-color: rgba(255,255,255,0.5);
                    color: #fff;
                    font-weight: 500;
                }
                .rc-btn-ghost:hover { background: rgba(255,255,255,0.1); color: #fff; border-color: #fff; }

                /* ---- Mobile drawer (rendered via portal into document.body) ---- */
                .rc-drawer-backdrop {
                    position: fixed;
                    inset: 0;
                    background: rgba(0,0,0,0.5);
                    backdrop-filter: blur(1px);
                    z-index: 2049;
                    opacity: 0;
                    pointer-events: none;
                    transition: opacity .25s ease;
                }
                .rc-drawer-backdrop.open {
                    opacity: 1;
                    pointer-events: auto;
                }

                .rc-drawer {
                    position: fixed;
                    top: 0;
                    right: 0;
                    height: 100%;
                    height: 100dvh;
                    width: 84%;
                    max-width: 340px;
                    background: ${NAVY};
                    z-index: 2050;
                    display: flex;
                    flex-direction: column;
                    transform: translateX(100%);
                    transition: transform .28s cubic-bezier(.22,.85,.35,1);
                    box-shadow: -16px 0 40px rgba(0,0,0,0.35);
                    overflow: hidden;
                }
                .rc-drawer.open { transform: translateX(0); }

                .rc-drawer-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 1.1rem 1.1rem;
                    background: ${NAVY_LIGHT};
                    border-bottom: 1px solid rgba(255,255,255,0.08);
                    flex-shrink: 0;
                }
                .rc-drawer-close {
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(255,255,255,0.08);
                    color: #fff;
                    border: none;
                    transition: background-color .15s ease;
                }
                .rc-drawer-close:hover { background: rgba(255,255,255,0.18); }

                /* Quick actions row: Wishlist / Cart, always visible up top */
                .rc-drawer-quick {
                    display: flex;
                    gap: 0.6rem;
                    padding: 0.9rem 1.1rem;
                    flex-shrink: 0;
                }
                .rc-drawer-quick-item {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    position: relative;
                    background: rgba(255,255,255,0.06);
                    border: 1px solid rgba(255,255,255,0.09);
                    border-radius: 12px;
                    padding: 0.65rem 0.5rem;
                    color: #fff;
                    text-decoration: none;
                    font-size: 0.85rem;
                    font-weight: 600;
                    transition: background-color .15s ease, border-color .15s ease;
                }
                .rc-drawer-quick-item:hover {
                    background: rgba(255,255,255,0.11);
                    color: #fff;
                    border-color: rgba(255,255,255,0.18);
                }
                .rc-drawer-quick-item .rc-badge {
                    top: -6px;
                    right: -6px;
                    box-shadow: 0 0 0 2.5px ${NAVY};
                }

                .rc-drawer-scroll {
                    flex: 1 1 auto;
                    overflow-y: auto;
                    -webkit-overflow-scrolling: touch;
                }

                .rc-drawer-links {
                    list-style: none;
                    margin: 0;
                    padding: 0.25rem 0.7rem 0.5rem;
                }
                .rc-drawer-links .rc-nav-link {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.85rem 0.75rem;
                    font-size: 1rem;
                    border-radius: 10px;
                    margin-bottom: 0.15rem;
                    border-left: 3px solid transparent;
                }
                .rc-drawer-links .rc-nav-link svg:first-child { opacity: 0.85; flex-shrink: 0; }
                .rc-drawer-links .rc-nav-link .rc-chevron {
                    margin-left: auto;
                    opacity: 0.35;
                    font-size: 0.75rem;
                }
                .rc-drawer-links .rc-nav-link::after { display: none; }
                .rc-drawer-links .rc-nav-link.active {
                    color: ${GREEN} !important;
                    background: rgba(52, 161, 41, 0.12);
                    border-left-color: ${GREEN};
                }
                .rc-drawer-links .rc-nav-link:hover {
                    background: rgba(255,255,255,0.06);
                }

                .rc-drawer-divider {
                    height: 1px;
                    background: rgba(255,255,255,0.08);
                    margin: 0.4rem 1.1rem 0.9rem;
                }

                .rc-drawer-section {
                    flex-shrink: 0;
                    border-top: 1px solid rgba(255,255,255,0.1);
                    background: ${NAVY_LIGHT};
                    padding: 0.9rem 1.1rem calc(1.1rem + env(safe-area-inset-bottom, 0px));
                }

                .rc-drawer-user-card {
                    display: flex;
                    align-items: center;
                    gap: 0.7rem;
                    background: rgba(255,255,255,0.07);
                    border-radius: 12px;
                    padding: 0.7rem 0.85rem;
                    margin-bottom: 0.6rem;
                }
                .rc-drawer-user-card .rc-avatar {
                    width: 42px;
                    height: 42px;
                    font-size: 1rem;
                    box-shadow: 0 0 0 2px rgba(255,255,255,0.15);
                }

                .rc-drawer-user-links {
                    display: flex;
                    flex-direction: column;
                    gap: 0.1rem;
                }
                .rc-drawer-user-links a,
                .rc-drawer-user-links button {
                    display: flex;
                    align-items: center;
                    gap: 0.6rem;
                    color: rgba(255,255,255,0.9);
                    text-decoration: none;
                    background: none;
                    border: none;
                    text-align: left;
                    padding: 0.65rem 0.6rem;
                    font-size: 0.92rem;
                    border-radius: 8px;
                    width: 100%;
                }
                .rc-drawer-user-links a:hover,
                .rc-drawer-user-links button:hover {
                    background: rgba(255,255,255,0.09);
                    color: #fff;
                }
                .rc-drawer-user-links button.text-danger { color: #ff8b8b !important; }
                .rc-drawer-user-links button.text-danger:hover { background: rgba(255,80,80,0.12); }

                .rc-drawer-auth-buttons {
                    display: flex;
                    gap: 0.6rem;
                }
                .rc-drawer-auth-buttons .btn { flex: 1; }

                @media (min-width: 992px) {
                    .rc-drawer, .rc-drawer-backdrop { display: none; }
                }

                /* ---- Mobile-specific tightening ---- */
                @media (max-width: 991.98px) {
                    /* Slightly smaller icon buttons so 4 icons + brand always fit
                       comfortably on one row, even on narrow phones. */
                    .rc-navbar .rc-icon-btn {
                        width: 36px;
                        height: 36px;
                    }
                    /* Tighter, even spacing between the mobile action icons
                       instead of the cramped/uneven gap from Bootstrap's gap-1. */
                    .rc-navbar .d-flex.d-lg-none.align-items-center {
                        gap: 0.15rem;
                    }
                    /* Pull the last icon in slightly from the edge for breathing room */
                    .rc-navbar .d-flex.d-lg-none.align-items-center {
                        margin-right: -0.25rem;
                    }
                }

                @media (max-width: 360px) {
                    .rc-brand { font-size: 1.05rem; }
                    .rc-navbar .rc-icon-btn { width: 34px; height: 34px; }
                }
            `}</style>

      {/* Announcement Bar */}
      <div className="rc-topbar text-white py-2 d-none d-md-block">
        <div className="container d-flex align-items-center justify-content-between">
          <span>
            🚚 Free shipping on orders over $50 — code{" "}
            <strong className="text-white">FREESHIP</strong>
          </span>
          <div className="d-flex gap-3">
            <a href="tel:1-800-RECOMM">📞 1-800-RECOMM</a>
            <a href="mailto:info@recomm.com">✉️ info@recomm.com</a>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <nav
        className={`rc-navbar navbar navbar-dark sticky-top py-2 ${scrolled ? "is-scrolled" : ""}`}
        aria-label="Main navigation"
      >
        <div className="container d-flex align-items-center justify-content-between">
          <Link
            className="rc-brand navbar-brand fw-bold me-3"
            to="/"
            aria-label="Recomm-Frontend Home"
          >
            <span className="text-white">Recomm</span>
            <span style={{ color: GREEN }}>Frontend</span>
          </Link>

          {/* Desktop nav links */}
          <ul className="d-none d-lg-flex align-items-center gap-1 mx-auto mb-0 list-unstyled">
            {NAV_LINKS.map((link) => (
              <li key={link.to}>
                <NavLink
                  className={({ isActive }) =>
                    `rc-nav-link${isActive ? " active" : ""}`
                  }
                  to={link.to}
                  end={link.to === "/"}
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>

          {/* Desktop right side actions */}
          <div className="d-none d-lg-flex align-items-center gap-1">
            <span className="rc-icon-btn-wrap">
              <button
                className="rc-icon-btn border-0 bg-transparent"
                onClick={() => setShowSearch((v) => !v)}
                aria-label="Toggle search"
              >
                {showSearch ? <FaTimes size={17} /> : <FaSearch size={17} />}
              </button>
            </span>

            <span className="rc-icon-btn-wrap">
              <Link
                to="/wishlist"
                className="rc-icon-btn"
                aria-label={`Wishlist, ${wishlistCount} items`}
              >
                <FaHeart size={17} />
              </Link>
              {wishlistCount > 0 && (
                <span className="rc-badge">{fmtCount(wishlistCount)}</span>
              )}
            </span>

            <span className="rc-icon-btn-wrap">
              <Link
                to="/cart"
                className="rc-icon-btn"
                aria-label={`Shopping cart, ${cartItemCount} items`}
              >
                <FaShoppingCart size={17} />
              </Link>
              {cartItemCount > 0 && (
                <span className="rc-badge">{fmtCount(cartItemCount)}</span>
              )}
            </span>

            {isAuthenticated ? (
              <div className="dropdown ms-1">
                <button
                  className="rc-user-toggle btn btn-link text-white p-0 dropdown-toggle d-flex align-items-center gap-2 text-decoration-none"
                  type="button"
                  id="userDropdown"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  aria-label="User menu"
                >
                  <span className="rc-avatar overflow-hidden">
                    {user?.profile_image_url ? (
                      <img
                        src={user.profile_image_url}
                        alt={user.name}
                        className="w-100 h-100 object-fit-cover"
                      />
                    ) : (
                      user?.name?.charAt(0)?.toUpperCase() || "U"
                    )}
                  </span>
                  <span className="small">{user?.name}</span>
                </button>
                <ul
                  className="rc-dropdown-menu dropdown-menu dropdown-menu-end shadow-lg border-0 mt-2"
                  aria-labelledby="userDropdown"
                >
                  <li>
                    <div className="px-2 py-2">
                      <strong className="d-block" style={{ color: NAVY }}>
                        {user?.name}
                      </strong>
                      <small className="text-muted text-truncate d-block">
                        {user?.email}
                      </small>
                    </div>
                  </li>
                  <li>
                    <hr className="dropdown-divider my-1" />
                  </li>
                  <li>
                    <Link className="dropdown-item" to="/profile">
                      <FaUser className="me-2" size={13} /> My Profile
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" to="/profile?tab=orders">
                      My Orders
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" to="/wishlist">
                      <FaHeart className="me-2" size={13} /> Wishlist
                      {wishlistCount > 0 && (
                        <span className="badge bg-success ms-auto rounded-pill">
                          {fmtCount(wishlistCount)}
                        </span>
                      )}
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" to="/cart">
                      <FaShoppingCart className="me-2" size={13} /> Cart (
                      {cartItemCount})
                    </Link>
                  </li>
                  <li>
                    <hr className="dropdown-divider my-1" />
                  </li>
                  <li>
                    <button
                      className="dropdown-item text-danger"
                      onClick={handleLogout}
                    >
                      <FaSignOutAlt className="me-2" size={13} /> Logout
                    </button>
                  </li>
                </ul>
              </div>
            ) : (
              <div className="d-flex gap-2 ms-1">
                <Link to="/login" className="rc-btn-ghost btn btn-sm px-3">
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="rc-btn-cta btn btn-sm text-white px-3"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile top bar actions */}
          <div className="d-flex d-lg-none align-items-center gap-1">
            <span className="rc-icon-btn-wrap">
              <button
                className="rc-icon-btn border-0 bg-transparent"
                onClick={() => setShowSearch((v) => !v)}
                aria-label="Toggle search"
              >
                {showSearch ? <FaTimes size={16} /> : <FaSearch size={16} />}
              </button>
            </span>

            <span className="rc-icon-btn-wrap">
              <Link
                to="/wishlist"
                className="rc-icon-btn"
                aria-label={`Wishlist, ${wishlistCount} items`}
              >
                <FaHeart size={16} />
              </Link>
              {wishlistCount > 0 && (
                <span className="rc-badge">{fmtCount(wishlistCount)}</span>
              )}
            </span>

            <span className="rc-icon-btn-wrap">
              <Link
                to="/cart"
                className="rc-icon-btn"
                aria-label={`Shopping cart, ${cartItemCount} items`}
                onClick={closeMenu}
              >
                <FaShoppingCart size={16} />
              </Link>
              {cartItemCount > 0 && (
                <span className="rc-badge">{fmtCount(cartItemCount)}</span>
              )}
            </span>

            <span className="rc-icon-btn-wrap">
              <button
                className="rc-icon-btn border-0 bg-transparent"
                type="button"
                onClick={() => setMenuOpen(true)}
                aria-expanded={menuOpen}
                aria-label="Open navigation menu"
              >
                <FaBars size={16} />
              </button>
            </span>
          </div>
        </div>
      </nav>

      {/* Collapsible Search Bar */}
      {showSearch && (
        <div className="bg-white border-bottom shadow-sm py-3">
          <div className="container">
            <SearchBar onClose={() => setShowSearch(false)} />
          </div>
        </div>
      )}

      {/* Mobile drawer + backdrop, portaled to document.body so it can
          never get trapped inside an ancestor's stacking context. */}
      {createPortal(
        <>
          <div
            className={`rc-drawer-backdrop d-lg-none ${menuOpen ? "open" : ""}`}
            onClick={closeMenu}
            aria-hidden="true"
          />
          <aside
            className={`rc-drawer d-lg-none ${menuOpen ? "open" : ""}`}
            aria-label="Mobile navigation"
            aria-hidden={!menuOpen}
          >
            <div className="rc-drawer-header">
              <span className="rc-brand fw-bold fs-5">
                <span className="text-white">Recomm</span>
                <span style={{ color: GREEN }}>Frontend</span>
              </span>
              <button
                className="rc-drawer-close"
                onClick={closeMenu}
                aria-label="Close navigation menu"
              >
                <FaTimes size={16} />
              </button>
            </div>

            {/* Quick actions: always-visible Wishlist / Cart shortcuts with counts */}
            <div className="rc-drawer-quick">
              <span className="rc-icon-btn-wrap" style={{ flex: 1 }}>
                <Link
                  to="/wishlist"
                  className="rc-drawer-quick-item"
                  onClick={closeMenu}
                >
                  <FaHeart size={15} />
                  Wishlist
                </Link>
                {wishlistCount > 0 && (
                  <span className="rc-badge">{fmtCount(wishlistCount)}</span>
                )}
              </span>

              <span className="rc-icon-btn-wrap" style={{ flex: 1 }}>
                <Link
                  to="/cart"
                  className="rc-drawer-quick-item"
                  onClick={closeMenu}
                >
                  <FaShoppingCart size={15} />
                  Cart
                </Link>
                {cartItemCount > 0 && (
                  <span className="rc-badge">{fmtCount(cartItemCount)}</span>
                )}
              </span>
            </div>

            <div className="rc-drawer-scroll">
              <ul className="rc-drawer-links">
                {NAV_LINKS.map((link) => {
                  const Icon = link.icon;
                  return (
                    <li key={link.to}>
                      <NavLink
                        className={({ isActive }) =>
                          `rc-nav-link${isActive ? " active" : ""}`
                        }
                        to={link.to}
                        end={link.to === "/"}
                        onClick={closeMenu}
                      >
                        <Icon size={15} />
                        <span>{link.label}</span>
                        <FaChevronRight className="rc-chevron" />
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
              <div className="rc-drawer-divider" />
            </div>

            <div className="rc-drawer-section">
              {isAuthenticated ? (
                <>
                  <div className="rc-drawer-user-card">
                    <span className="rc-avatar overflow-hidden">
                      {user?.profile_image_url ? (
                        <img
                          src={user.profile_image_url}
                          alt={user.name}
                          className="w-100 h-100 object-fit-cover"
                        />
                      ) : (
                        user?.name?.charAt(0)?.toUpperCase() || "U"
                      )}
                    </span>
                    <div className="overflow-hidden">
                      <strong className="d-block text-white text-truncate">
                        {user?.name}
                      </strong>
                      <small className="text-white-50 text-truncate d-block">
                        {user?.email}
                      </small>
                    </div>
                  </div>
                  <div className="rc-drawer-user-links">
                    <Link to="/profile" onClick={closeMenu}>
                      <FaUser size={13} /> My Profile
                    </Link>
                    <Link to="/profile?tab=orders" onClick={closeMenu}>
                      My Orders
                    </Link>
                    <button className="text-danger" onClick={handleLogout}>
                      <FaSignOutAlt size={13} /> Logout
                    </button>
                  </div>
                </>
              ) : (
                <div className="rc-drawer-auth-buttons">
                  <Link
                    to="/login"
                    className="rc-btn-ghost btn px-3"
                    onClick={closeMenu}
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="rc-btn-cta btn text-white px-3"
                    onClick={closeMenu}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </aside>
        </>,
        document.body,
      )}
    </>
  );
};

export default Header;
