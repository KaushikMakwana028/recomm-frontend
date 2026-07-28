import React, { useState } from "react";
import { Link } from "react-router-dom";
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
      className="ft-accordion-toggle d-flex d-lg-none justify-content-between align-items-center w-100 btn btn-link text-decoration-none p-0"
      onClick={onToggle}
      aria-expanded={open}
    >
      <span className="ft-heading mb-0">{title}</span>
      <FaChevronDown
        size={12}
        className={`ft-chevron ${open ? "is-open" : ""}`}
      />
    </button>

    {/* Desktop: static heading */}
    <h6 className="ft-heading d-none d-lg-block mb-3">{title}</h6>

    <ul className={`list-unstyled ft-link-list ${open ? "is-open" : ""}`}>
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
    <footer className="ft text-white mt-5">
      <style>{`
                .ft { background-color: ${NAVY}; }

                /* Features bar */
                .ft-features { border-bottom: 1px solid rgba(255,255,255,0.1); padding: 1.5rem 0; }
                .ft-feature-icon { color: ${GREEN}; }
                .ft-feature-title { font-size: 0.82rem; font-weight: 700; margin-bottom: 0.1rem; }
                .ft-feature-sub { font-size: 0.72rem; color: rgba(255,255,255,0.55); }

                /* Main content */
                .ft-main { padding: 2.5rem 0; }
                .ft-brand-name { font-weight: 800; }
                .ft-tagline { color: rgba(255,255,255,0.55); line-height: 1.7; font-size: 0.9rem; }

                .ft-social {
                    width: 36px; height: 36px; border-radius: 50%;
                    background: rgba(255,255,255,0.1); display: flex; align-items: center;
                    justify-content: center; color: #fff; transition: background-color .2s ease;
                }
                .ft-social:hover { background: ${GREEN}; color: #fff; }

                .ft-heading {
                    color: ${GREEN}; text-transform: uppercase; letter-spacing: 0.06em;
                    font-size: 0.78rem; font-weight: 700;
                }
                .ft-chevron { color: ${GREEN}; transition: transform .2s ease; }
                .ft-chevron.is-open { transform: rotate(180deg); }

                .ft-link-list li { margin-bottom: 0.55rem; }
                .ft-link {
                    color: rgba(255,255,255,0.55); text-decoration: none; font-size: 0.88rem;
                    transition: color .2s ease;
                }
                .ft-link:hover { color: ${GREEN}; }

                .ft-contact-item { display: flex; align-items: flex-start; gap: 0.65rem; margin-bottom: 0.65rem; font-size: 0.86rem; }
                .ft-contact-item svg { color: ${GREEN}; flex-shrink: 0; margin-top: 2px; }
                .ft-contact-item a, .ft-contact-item span { color: rgba(255,255,255,0.55); text-decoration: none; }
                .ft-contact-item a:hover { color: ${GREEN}; }

                .ft-newsletter-input:focus { box-shadow: 0 0 0 3px rgba(52,161,41,0.3); }
                .ft-subscribe-btn { background: ${GREEN}; }

                .ft-bottom { border-top: 1px solid rgba(255,255,255,0.1); padding: 1rem 0; }
                .ft-bottom small, .ft-bottom .ft-legal-link { color: rgba(255,255,255,0.5); }
                .ft-legal-link { text-decoration: none; font-size: 0.78rem; transition: color .2s ease; }
                .ft-legal-link:hover { color: ${GREEN}; }

                /* ---- Mobile compaction ---- */
                @media (max-width: 991.98px) {
                    .ft-features { padding: 1rem 0; }
                    .ft-feature-title { font-size: 0.72rem; }
                    .ft-feature-sub { display: none; }

                    .ft-main { padding: 1.75rem 0; }
                    .ft-brand-block { margin-bottom: 0.5rem; }
                    .ft-tagline { font-size: 0.85rem; margin-bottom: 1rem !important; }

                    .ft-col { border-bottom: 1px solid rgba(255,255,255,0.08); padding: 0.85rem 0; }
                    .ft-col:first-of-type { border-top: 1px solid rgba(255,255,255,0.08); }

                    .ft-accordion-toggle { color: #fff; }
                    .ft-link-list { max-height: 0; overflow: hidden; margin: 0; transition: max-height .25s ease; }
                    .ft-link-list.is-open { max-height: 300px; margin-top: 0.85rem; }

                    .ft-contact-col { padding-top: 0.85rem; }
                }
            `}</style>

      {/* Features Bar */}
      <div className="ft-features">
        <div className="container">
          <div className="row g-3 text-center">
            {FEATURES.map(({ Icon, title, sub }) => (
              <div key={title} className="col-3">
                <Icon size={24} className="ft-feature-icon mb-2" />
                <h6 className="ft-feature-title">{title}</h6>
                <small className="ft-feature-sub">{sub}</small>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="ft-main">
        <div className="container">
          <div className="row g-0 g-lg-4">
            {/* Brand Column */}
            <div className="col-lg-4 ft-brand-block">
              <Link to="/" className="text-decoration-none">
                <h4 className="ft-brand-name mb-3">
                  <span className="text-white">Recomm</span>
                  <span style={{ color: GREEN }}>Frontend</span>
                </h4>
              </Link>
              <p className="ft-tagline mb-4">
                Delicious food &amp; beverages delivered to your door. We bring
                quality, freshness, and convenience to your table every single
                day.
              </p>
              <div className="d-flex gap-2 mb-3 mb-lg-0">
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
            <div className="col-lg-2 col-6">
              <FooterLinkList
                title="Company"
                links={COMPANY_LINKS}
                open={companyOpen}
                onToggle={() => setCompanyOpen((v) => !v)}
              />
            </div>

            {/* Customer Service */}
            <div className="col-lg-2 col-6">
              <FooterLinkList
                title="Support"
                links={SUPPORT_LINKS}
                open={supportOpen}
                onToggle={() => setSupportOpen((v) => !v)}
              />
            </div>

            {/* Contact Info */}
            <div className="col-lg-4 ft-contact-col">
              <h6 className="ft-heading mb-3">Contact Us</h6>
              <div className="ft-contact-item">
                <FaMapMarkerAlt />
                <span>123 Food Street, Flavor Town, FT 12345, USA</span>
              </div>
              <div className="ft-contact-item">
                <FaPhone />
                <a href="tel:1-800-RECOMM">1-800-RECOMM (732-6663)</a>
              </div>
              <div className="ft-contact-item mb-3">
                <FaEnvelope />
                <a href="mailto:info@recomm.com">info@recomm.com</a>
              </div>

              <h6 className="ft-heading mb-2">Newsletter</h6>
              <div className="input-group">
                <input
                  type="email"
                  className="form-control form-control-sm ft-newsletter-input bg-white border-0"
                  placeholder="Your email address"
                  aria-label="Email for newsletter"
                />
                <button
                  className="btn btn-sm ft-subscribe-btn text-white"
                  type="button"
                >
                  Subscribe
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="ft-bottom">
        <div className="container">
          <div className="row align-items-center g-2">
            <div className="col-md-6 text-center text-md-start">
              <small>
                © {currentYear} Recomm-Frontend. All rights reserved. Made with
                ❤️
              </small>
            </div>
            <div className="col-md-6 text-center text-md-end">
              {BOTTOM_LINKS.map((link, index, arr) => (
                <span key={link.label}>
                  <Link to={link.path} className="ft-legal-link">
                    {link.label}
                  </Link>
                  {index < arr.length - 1 && (
                    <span
                      className="mx-2"
                      style={{ color: "rgba(255,255,255,0.3)" }}
                    >
                      |
                    </span>
                  )}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
