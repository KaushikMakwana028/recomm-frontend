import React, { useState } from "react";
import { Link } from "react-router-dom";
import logoDark from "../assets/recomm-logo-sidebar.png";
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
} from "react-icons/fa";

const NAVY = "#00204E";
const GREEN = "#34A129";

const COMPANY_LINKS = [
  { label: "About Us", path: "/" },
  { label: "Careers", path: "/" },
  { label: "Press", path: "/" },
  { label: "Blog", path: "/" },
  { label: "Partners", path: "/" },
];

const SUPPORT_LINKS = [
  { label: "Help Center", path: "/" },
  { label: "Contact Us", path: "/" },
  { label: "Shipping Info", path: "/" },
  { label: "Returns", path: "/" },
  { label: "Track Order", path: "/profile?tab=orders" },
];

const SOCIAL_LINKS = [
  { Icon: FaFacebookF, href: "https://facebook.com", label: "Facebook" },
  { Icon: FaTwitter, href: "https://twitter.com", label: "Twitter" },
  { Icon: FaInstagram, href: "https://instagram.com", label: "Instagram" },
  { Icon: FaLinkedinIn, href: "https://linkedin.com", label: "LinkedIn" },
  { Icon: FaYoutube, href: "https://youtube.com", label: "YouTube" },
];

const BOTTOM_LINKS = [
  { label: "Privacy Policy", path: "/" },
  { label: "Terms of Service", path: "/" },
  { label: "Cookie Policy", path: "/" },
];

const FEATURES = [
  { Icon: FaTruck, title: "Free Shipping", sub: "On orders over $50" },
  { Icon: FaShieldAlt, title: "Secure Payment", sub: "100% protected" },
  { Icon: FaLeaf, title: "Fresh & Organic", sub: "Quality guaranteed" },
  { Icon: FaStar, title: "Top Rated", sub: "4.8★ average rating" },
];

const FooterLinkList = ({ title, links, open, onToggle }) => (
  <div className="ft-col">
    {/* Mobile: tap-to-expand header */}
    <button
      type="button"
      className="ft-accordion-toggle"
      onClick={onToggle}
      aria-expanded={open}
    >
      <span className="ft-heading">{title}</span>
      <FaChevronDown
        size={12}
        className={`ft-chevron ${open ? "is-open" : ""}`}
      />
    </button>

    {/* Desktop: static heading */}
    <h6 className="ft-heading ft-heading-desktop">{title}</h6>

    <ul className={`ft-link-list ${open ? "is-open" : ""}`}>
      {links.map((link) => (
        <li key={link.label}>
          <Link to={link.path} className="ft-link">
            {link.label}
          </Link>
        </li>
      ))}
    </ul>
  </div>
);

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const [companyOpen, setCompanyOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);

  return (
    <footer className="ft">
      <style>{`
        * { box-sizing: border-box; }
        .ft { background-color: ${NAVY}; color: #fff; font-family: 'Poppins', sans-serif; margin-top: 3rem; }
        .ft-inner { max-width: 1180px; margin: 0 auto; padding: 0 1.25rem; }

        /* ---------- Features bar ---------- */
        .ft-features { border-bottom: 1px solid rgba(255,255,255,0.1); padding: 1.5rem 0; }
        .ft-features-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
          text-align: center;
        }
        .ft-feature-icon { color: ${GREEN}; margin-bottom: 0.5rem; }
        .ft-feature-title { font-size: 0.82rem; font-weight: 700; margin: 0 0 0.15rem; }
        .ft-feature-sub { font-size: 0.72rem; color: rgba(255,255,255,0.55); display: block; }

        /* ---------- Main content ---------- */
        .ft-main { padding: 2.5rem 0; }
        .ft-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 0;
        }
        @media (min-width: 992px) {
          .ft-grid { grid-template-columns: 2fr 1fr 1fr 2fr; gap: 2rem; }
        }

        .ft-brand-block { padding-bottom: 1.5rem; }
        .ft-brand-name { font-weight: 800; font-size: 1.35rem; margin: 0 0 0.85rem; }
        .ft-brand-name a { text-decoration: none; }
        .ft-tagline { color: rgba(255,255,255,0.55); line-height: 1.7; font-size: 0.9rem; margin: 0 0 1.1rem; }

        .ft-social-row { display: flex; gap: 0.6rem; }
        .ft-social {
          width: 38px; height: 38px; border-radius: 50%;
          background: rgba(255,255,255,0.1); display: flex; align-items: center;
          justify-content: center; color: #fff; transition: background-color .2s ease;
          flex-shrink: 0;
        }
        .ft-social:hover { background: ${GREEN}; }

        .ft-heading {
          color: ${GREEN}; text-transform: uppercase; letter-spacing: 0.06em;
          font-size: 0.76rem; font-weight: 700; margin: 0;
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
        .ft-link-list li { margin-bottom: 0.6rem; }
        .ft-link {
          color: rgba(255,255,255,0.55); text-decoration: none; font-size: 0.88rem;
          transition: color .2s ease;
        }
        .ft-link:hover { color: ${GREEN}; }

        .ft-contact-item { display: flex; align-items: flex-start; gap: 0.65rem; margin-bottom: 0.7rem; font-size: 0.86rem; }
        .ft-contact-item svg { color: ${GREEN}; flex-shrink: 0; margin-top: 3px; }
        .ft-contact-item a, .ft-contact-item span { color: rgba(255,255,255,0.6); text-decoration: none; }
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
        .ft-bottom { border-top: 1px solid rgba(255,255,255,0.1); padding: 1.1rem 0; }
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
        @media (max-width: 991.98px) {
          .ft-features { padding: 1.25rem 0; }
          .ft-features-grid { grid-template-columns: repeat(2, 1fr); gap: 1.1rem 0.75rem; text-align: left; }
          .ft-feature-item { display: flex; align-items: center; gap: 0.65rem; }
          .ft-feature-icon-badge {
            width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0;
            background: rgba(52,161,41,0.15); display: flex; align-items: center; justify-content: center;
          }
          .ft-feature-title { font-size: 0.76rem; }
          .ft-feature-sub { font-size: 0.68rem; }

          .ft-main { padding: 1.75rem 0 0.5rem; }
          .ft-brand-block { text-align: left; margin-bottom: 0.25rem; }
          .ft-tagline { font-size: 0.85rem; }

          .ft-heading-desktop { display: none; }

          .ft-col { border-top: 1px solid rgba(255,255,255,0.08); padding: 1.05rem 0; }
          .ft-contact-col { border-top: 1px solid rgba(255,255,255,0.08); padding: 1.05rem 0 1.5rem; }

          .ft-link-list { max-height: 0; overflow: hidden; margin: 0; transition: max-height .25s ease; }
          .ft-link-list.is-open { max-height: 320px; margin-top: 0.9rem; }
        }

        @media (min-width: 992px) {
          .ft-accordion-toggle { display: none; }
          .ft-heading-desktop { display: block; }
          .ft-link-list { max-height: none !important; overflow: visible; }
        }

        @media (max-width: 400px) {
          .ft-features-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* Features Bar */}
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

      {/* Main Footer Content */}
      <div className="ft-main">
        <div className="ft-inner">
          <div className="ft-grid">
            {/* Brand Column */}
            <div className="ft-brand-block">
              <Link
                to="/"
                className="ft-brand-name"
                style={{ display: "inline-block", height: "75px" }}
              >
                <img src={logoDark} alt="Recomm Logo" style={{ height: "100%", width: "auto", objectFit: "contain" }} />
              </Link>
              <p className="ft-tagline">
                Delicious food &amp; beverages delivered to your door. We bring
                quality, freshness, and convenience to your table every single
                day.
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

            {/* Quick Links */}
            <FooterLinkList
              title="Company"
              links={COMPANY_LINKS}
              open={companyOpen}
              onToggle={() => setCompanyOpen((v) => !v)}
            />

            {/* Customer Service */}
            <FooterLinkList
              title="Support"
              links={SUPPORT_LINKS}
              open={supportOpen}
              onToggle={() => setSupportOpen((v) => !v)}
            />

            {/* Contact Info */}
            <div className="ft-contact-col">
              <h6 className="ft-heading" style={{ marginBottom: "0.9rem" }}>
                Contact Us
              </h6>
              <div className="ft-contact-item">
                <FaMapMarkerAlt size={13} />
                <span>123 Food Street, Flavor Town, FT 12345, USA</span>
              </div>
              <div className="ft-contact-item">
                <FaPhone size={13} />
                <a href="tel:1-800-RECOMM">1-800-RECOMM (732-6663)</a>
              </div>
              <div
                className="ft-contact-item"
                style={{ marginBottom: "1.1rem" }}
              >
                <FaEnvelope size={13} />
                <a href="mailto:info@recomm.com">info@recomm.com</a>
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

      {/* Bottom Bar */}
      <div className="ft-bottom">
        <div className="ft-inner">
          <div className="ft-bottom-row">
            <p className="ft-copyright">
              © {currentYear} Recomm. All rights reserved. Made with ❤️
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
