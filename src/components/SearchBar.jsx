import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaSearch, FaTimes, FaArrowRight } from "react-icons/fa";
import { useProducts } from "../context/ProductContext";
import { debounce, formatPrice, getImageUrl } from "../utils/helpers";

const NAVY = "#00204E";
const GREEN = "#34A129";
const GREEN_DEEP = "#278A1E";
const GREEN_SOFT = "#EAF7E8";

const SearchBar = ({ onClose }) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const { products } = useProducts();
  const navigate = useNavigate();
  const wrapRef = useRef(null);

  useEffect(() => {
    const debouncedSearch = debounce(() => {
      if (query.trim().length >= 2) {
        const filtered = products
          .filter(
            (product) =>
              (product.name || product.product_name || "")
                .toLowerCase()
                .includes(query.toLowerCase()) ||
              (product.category || product.category_name || "")
                .toLowerCase()
                .includes(query.toLowerCase()) ||
              (product.tags &&
                product.tags.some((tag) =>
                  tag.toLowerCase().includes(query.toLowerCase()),
                )),
          )
          .slice(0, 6);
        setSuggestions(filtered);
        setActiveIndex(-1);
      } else {
        setSuggestions([]);
        setActiveIndex(-1);
      }
    }, 300);

    debouncedSearch();
  }, [query, products]);

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

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setQuery("");
      setSuggestions([]);
      setIsFocused(false);
      if (onClose) onClose();
    }
  };

  const handleSuggestionClick = (productId) => {
    navigate(`/product/${productId}`);
    setQuery("");
    setSuggestions([]);
    setIsFocused(false);
    if (onClose) onClose();
  };

  const handleClear = () => {
    setQuery("");
    setSuggestions([]);
    setActiveIndex(-1);
  };

  const showDropdown = isFocused && query.trim().length >= 2;

  const handleKeyDown = (e) => {
    if (!showDropdown || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % (suggestions.length + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? suggestions.length : prev - 1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      if (activeIndex === suggestions.length) {
        handleSearch();
      } else {
        handleSuggestionClick(suggestions[activeIndex].id);
      }
    } else if (e.key === "Escape") {
      setIsFocused(false);
    }
  };

  // Bold the matched portion of a label for quick scanning
  const highlightMatch = (text) => {
    if (!text) return text;
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
                    padding: 0.15rem 0.15rem 0.15rem 0.9rem;
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
                /* hide native search input decorations */
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

                /* ---------- Dropdown ---------- */
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
                }
                @keyframes sbDrop {
                    from { opacity: 0; transform: translateY(-6px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .sb-eyebrow {
                    padding: 0.65rem 1rem 0.4rem;
                    font-size: 0.66rem;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    color: #9aa5b5;
                }

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

                .sb-item-img {
                    width: 44px;
                    height: 44px;
                    border-radius: 10px;
                    object-fit: cover;
                    flex-shrink: 0;
                    background: #f1f5f9;
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
                .sb-item-cat {
                    margin: 0;
                    font-size: 0.72rem;
                    color: #94a3b8;
                    text-transform: capitalize;
                }
                .sb-item-price {
                    font-weight: 800;
                    font-size: 0.85rem;
                    color: ${GREEN_DEEP};
                    flex-shrink: 0;
                    margin-left: 0.5rem;
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
            placeholder="Search for products, categories..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onKeyDown={handleKeyDown}
            autoFocus
            aria-label="Search products"
            autoComplete="off"
          />
          {query && (
            <button
              type="button"
              className="sb-clear-btn"
              onClick={handleClear}
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

      {/* Autocomplete Suggestions Dropdown */}
      {showDropdown && (
        <div
          className="sb-dropdown"
          role="listbox"
          aria-label="Search suggestions"
        >
          {suggestions.length > 0 ? (
            <>
              <div className="sb-eyebrow">Suggestions</div>
              {suggestions.map((product, i) => (
                <button
                  key={product.id}
                  type="button"
                  className={`sb-item ${activeIndex === i ? "is-active" : ""}`}
                  onClick={() => handleSuggestionClick(product.id)}
                  onMouseEnter={() => setActiveIndex(i)}
                  role="option"
                  aria-selected={activeIndex === i}
                >
                  <img
                    src={product.image_url || getImageUrl(product.image)}
                    alt={product.name || product.product_name}
                    className="sb-item-img"
                  />
                  <div className="sb-item-info">
                    <p className="sb-item-name">
                      {highlightMatch(product.name || product.product_name)}
                    </p>
                    <p className="sb-item-cat">
                      {product.category || product.category_name}
                    </p>
                  </div>
                  <span className="sb-item-price">
                    {formatPrice(product.sale_price ?? product.price)}
                  </span>
                </button>
              ))}

              <button
                type="button"
                className={`sb-viewall ${activeIndex === suggestions.length ? "is-active" : ""}`}
                onClick={handleSearch}
                onMouseEnter={() => setActiveIndex(suggestions.length)}
              >
                View all results for "{query}"
                <FaArrowRight size={11} />
              </button>
            </>
          ) : (
            <div className="sb-empty">
              No matches for "{query}" yet — try a different keyword.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
