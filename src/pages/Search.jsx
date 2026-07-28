import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { FaSearch, FaShoppingCart, FaHeart, FaExclamationCircle, FaChevronRight } from "react-icons/fa";
import ProductService from "../services/productService";
import CategoryService from "../services/categoryService";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { formatPrice } from "../utils/helpers";

const NAVY = "#00204E";
const GREEN = "#34A129";
const FALLBACK_IMG = "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400";

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
  lays: ["sprite", "coke", "chips", "cold drink"]
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

  // Load search results when query parameter changes
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
  }, [query]);

  const performSearch = async (searchQuery) => {
    setLoading(true);
    try {
      // 1. Fetch matching products and categories
      const [prodRes, catRes, allProdRes] = await Promise.all([
        ProductService.searchProducts({ search: searchQuery, limit: 20 }),
        CategoryService.searchCategories({ search: searchQuery, limit: 10 }),
        ProductService.getProductList()
      ]);

      let matchedProducts = [];
      if (prodRes.success) {
        matchedProducts = (prodRes.data?.products || []).map(p => ({
          ...p,
          product_name: p.name || p.product_name,
          selling_price: p.sale_price ?? p.price,
          mrp: p.price
        }));
        setProducts(matchedProducts);
      } else {
        setProducts([]);
      }

      if (catRes.success) {
        setCategories(catRes.data?.categories || []);
      } else {
        setCategories([]);
      }

      // 2. Load all products for blending and fallback recommendations
      let allProducts = [];
      if (allProdRes.success) {
        allProducts = (allProdRes.data || []).map(p => ({
          ...p,
          product_name: p.name || p.product_name,
          selling_price: p.sale_price ?? p.price,
          mrp: p.price
        }));
      }

      // 3. Compute Smart Blending (Flipkart/Blinkit style)
      const queryLower = searchQuery.toLowerCase();
      const words = queryLower.split(/\s+/);
      let complementaryKeywords = [];

      words.forEach(word => {
        // Direct matching or substring matching of keywords
        Object.keys(COMPLEMENTARY_MAP).forEach(key => {
          if (key.includes(word) || word.includes(key)) {
            complementaryKeywords = [...complementaryKeywords, ...COMPLEMENTARY_MAP[key]];
          }
        });
      });

      // Remove duplicates
      complementaryKeywords = [...new Set(complementaryKeywords)];

      if (complementaryKeywords.length > 0) {
        // Filter out items already matched in the main query list to avoid duplicates
        const matchedIds = new Set(matchedProducts.map(p => p.id));
        const blended = allProducts
          .filter(p => 
            !matchedIds.has(p.id) &&
            complementaryKeywords.some(keyword => p.product_name?.toLowerCase().includes(keyword) || p.brand?.toLowerCase().includes(keyword))
          )
          .slice(0, 8);
        setBlendedProducts(blended);
      } else {
        setBlendedProducts([]);
      }

      // 4. Compute related/fallback products if query returns 0 matches
      if (matchedProducts.length === 0) {
        // Show some default suggestions (e.g. featured products)
        const fallback = allProducts
          .filter(p => p.is_active)
          .sort(() => 0.5 - Math.random()) // Randomize for fresh discovery
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

  return (
    <div className="search-page bg-light min-vh-100 pb-5">
      <style>{`
        .search-hero {
          background: linear-gradient(135deg, ${NAVY} 0%, #0A2E5C 100%);
          padding: 3rem 1.5rem;
          color: #fff;
          margin-bottom: 2rem;
        }
        .search-box-wrap {
          max-width: 600px;
          margin: 0 auto;
        }
        .search-title {
          font-weight: 800;
          letter-spacing: -0.02em;
        }
        .search-stats-card {
          background: #fff;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0,32,78,0.06);
          padding: 1.25rem;
          margin-bottom: 1.5rem;
        }
        .cat-badge-container {
          display: flex;
          gap: 12px;
          overflow-x: auto;
          padding-bottom: 10px;
          margin-bottom: 1.5rem;
          scrollbar-width: none;
        }
        .cat-badge-container::-webkit-scrollbar {
          display: none;
        }
        .cat-badge {
          flex: 0 0 auto;
          display: flex;
          align-items: center;
          gap: 8px;
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 999px;
          padding: 6px 14px 6px 6px;
          color: ${NAVY};
          text-decoration: none;
          font-weight: 600;
          font-size: 0.85rem;
          box-shadow: 0 2px 8px rgba(0,32,78,0.03);
          transition: all 0.2s ease;
        }
        .cat-badge:hover {
          border-color: ${GREEN};
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(52,161,41,0.15);
          color: ${GREEN};
        }
        .cat-badge img {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          object-fit: cover;
        }
        .prod-card {
          border: none;
          border-radius: 16px;
          overflow: hidden;
          background: #fff;
          box-shadow: 0 4px 18px rgba(0,32,78,0.05);
          transition: all 0.3s ease;
          height: 100%;
        }
        .prod-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 25px rgba(0,32,78,0.12);
        }
        .prod-img-wrap {
          position: relative;
          aspect-ratio: 1;
          background: #f8fafc;
          overflow: hidden;
        }
        .prod-img-wrap img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }
        .prod-card:hover .prod-img-wrap img {
          transform: scale(1.06);
        }
        .prod-wish-btn {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: #fff;
          border: none;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 5;
          transition: transform 0.2s ease;
        }
        .prod-wish-btn:hover {
          transform: scale(1.1);
        }
        .prod-title {
          color: ${NAVY};
          font-weight: 700;
          font-size: 0.95rem;
          line-height: 1.3;
          margin-bottom: 0.25rem;
          text-decoration: none;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          height: 2.6rem;
        }
        .prod-title:hover {
          color: ${GREEN};
        }
        .prod-price {
          color: ${GREEN};
          font-weight: 800;
          font-size: 1.1rem;
        }
        .btn-add {
          background: ${GREEN};
          color: #fff;
          border: none;
          font-weight: 700;
          font-size: 0.85rem;
          border-radius: 10px;
          padding: 0.5rem 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          width: 100%;
          transition: background 0.2s ease;
        }
        .btn-add:hover {
          background: #2c8c22;
        }
        .empty-warning-card {
          background: #fff;
          border-radius: 20px;
          box-shadow: 0 10px 30px rgba(0,32,78,0.06);
          padding: 4rem 2rem;
          text-align: center;
          margin-bottom: 3rem;
        }
        .empty-icon {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: rgba(220,53,69,0.08);
          color: #dc3545;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
        }
        .blend-section {
          background: linear-gradient(180deg, #fff 0%, #f1f5f9 100%);
          border-radius: 20px;
          padding: 2rem;
          margin-top: 3rem;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 20px rgba(0,32,78,0.04);
        }
        .blend-title {
          font-weight: 800;
          color: ${NAVY};
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          gap: 10px;
        }
      `}</style>

      {/* Hero Header Banner */}
      <div className="search-hero text-center">
        <div className="container">
          <h1 className="search-title mb-3">Find What You Need</h1>
          <form onSubmit={handleSearchSubmit} className="search-box-wrap">
            <div className="input-group input-group-lg shadow-lg" style={{ borderRadius: "14px", overflow: "hidden" }}>
              <span className="input-group-text bg-white border-0">
                <FaSearch className="text-muted" />
              </span>
              <input
                type="text"
                className="form-control border-0 py-3"
                placeholder="Search for fresh fruits, groceries, dairy..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                autoComplete="off"
              />
              <button type="submit" className="btn btn-success px-4 fw-bold">Search</button>
            </div>
          </form>
        </div>
      </div>

      <div className="container">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-success" role="status" style={{ width: "3rem", height: "3rem" }}>
              <span className="visually-hidden">Loading search results...</span>
            </div>
            <p className="text-muted mt-3 fw-bold">Searching catalogue...</p>
          </div>
        ) : (
          <>
            {/* Search Results Summary */}
            {query && (
              <div className="search-stats-card d-flex align-items-center justify-content-between flex-wrap gap-2">
                <div>
                  <span className="text-muted">Search results for: </span>
                  <strong className="text-brand-blue" style={{ fontSize: "1.1rem" }}>"{query}"</strong>
                </div>
                <div className="badge bg-success py-2 px-3 fw-bold" style={{ fontSize: "0.85rem" }}>
                  {products.length} Products &amp; {categories.length} Categories Found
                </div>
              </div>
            )}

            {/* Categories matching search */}
            {categories.length > 0 && (
              <div>
                <h5 className="text-brand-blue fw-extrabold mb-3">Matching Categories</h5>
                <div className="cat-badge-container">
                  {categories.map((cat) => (
                    <Link key={cat.id} to={`/categories/${cat.id}`} className="cat-badge">
                      <img src={cat.image_url || FALLBACK_IMG} alt={cat.name} />
                      <span>{cat.name}</span>
                      <FaChevronRight size={10} className="text-muted ms-1" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Products matches grid */}
            {products.length > 0 ? (
              <div>
                <h5 className="text-brand-blue fw-extrabold mb-4">Products Found</h5>
                <div className="row g-3 g-md-4">
                  {products.map((product) => (
                    <div key={product.id} className="col-6 col-md-4 col-lg-3">
                      <div className="prod-card card">
                        <div className="prod-img-wrap">
                          <Link to={`/product/${product.id}`} className="d-block w-100 h-100">
                            <img src={product.image_url || FALLBACK_IMG} alt={product.product_name} />
                          </Link>
                          <button
                            className="prod-wish-btn"
                            onClick={() => toggleWishlist({ id: product.id, name: product.product_name, price: product.selling_price, image_url: product.image_url, category_name: product.category_name })}
                            aria-label="Toggle wishlist"
                          >
                            <FaHeart
                              size={15}
                              className={isInWishlist(product.id) ? "text-danger" : "text-muted"}
                            />
                          </button>
                        </div>
                        <div className="card-body d-flex flex-column justify-content-between p-3">
                          <div>
                            <Link to={`/product/${product.id}`} className="prod-title">
                              {product.product_name}
                            </Link>
                            {product.category_name && (
                              <p className="text-muted small mb-2">{product.category_name}</p>
                            )}
                          </div>
                          <div>
                            <div className="d-flex align-items-center justify-content-between mb-2">
                              <span className="prod-price">{formatPrice(product.selling_price)}</span>
                              {product.mrp && parseFloat(product.mrp) > parseFloat(product.selling_price) && (
                                <span className="text-muted text-decoration-line-through small">{formatPrice(product.mrp)}</span>
                              )}
                            </div>
                            <button
                              className="btn btn-add"
                              onClick={() => addToCart({ id: product.id, name: product.product_name, price: product.selling_price, image_url: product.image_url, category_name: product.category_name })}
                            >
                              <FaShoppingCart size={13} /> Add to Cart
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* If product is not there, show warning + related products */
              query && (
                <div className="empty-warning-card">
                  <div className="empty-icon">
                    <FaExclamationCircle size={40} />
                  </div>
                  <h3 className="text-brand-blue fw-extrabold mb-2" style={{ fontSize: "1.75rem" }}>
                    Product Not Available
                  </h3>
                  <p className="text-muted mb-4 max-width-500 mx-auto">
                    We couldn't find any products matching <strong>"{query}"</strong>. Let's find something similar for you!
                  </p>
                  <Link to="/products" className="btn btn-success px-5 py-2.5 fw-bold" style={{ borderRadius: "10px" }}>
                    Browse All Products
                  </Link>
                </div>
              )
            )}

            {/* Fallback Recommendations (Related Products) */}
            {products.length === 0 && relatedProducts.length > 0 && (
              <div className="mt-5">
                <h4 className="text-brand-blue fw-extrabold mb-4">Recommended for You</h4>
                <div className="row g-3 g-md-4">
                  {relatedProducts.map((product) => (
                    <div key={product.id} className="col-6 col-md-4 col-lg-3">
                      <div className="prod-card card">
                        <div className="prod-img-wrap">
                          <Link to={`/product/${product.id}`} className="d-block w-100 h-100">
                            <img src={product.image_url || FALLBACK_IMG} alt={product.product_name} />
                          </Link>
                          <button
                            className="prod-wish-btn"
                            onClick={() => toggleWishlist({ id: product.id, name: product.product_name, price: product.selling_price, image_url: product.image_url, category_name: product.category_name })}
                            aria-label="Toggle wishlist"
                          >
                            <FaHeart
                              size={15}
                              className={isInWishlist(product.id) ? "text-danger" : "text-muted"}
                            />
                          </button>
                        </div>
                        <div className="card-body d-flex flex-column justify-content-between p-3">
                          <div>
                            <Link to={`/product/${product.id}`} className="prod-title">
                              {product.product_name}
                            </Link>
                            {product.category_name && (
                              <p className="text-muted small mb-2">{product.category_name}</p>
                            )}
                          </div>
                          <div>
                            <div className="d-flex align-items-center justify-content-between mb-2">
                              <span className="prod-price">{formatPrice(product.selling_price)}</span>
                              {product.mrp && parseFloat(product.mrp) > parseFloat(product.selling_price) && (
                                <span className="text-muted text-decoration-line-through small">{formatPrice(product.mrp)}</span>
                              )}
                            </div>
                            <button
                              className="btn btn-add"
                              onClick={() => addToCart({ id: product.id, name: product.product_name, price: product.selling_price, image_url: product.image_url, category_name: product.category_name })}
                            >
                              <FaShoppingCart size={13} /> Add to Cart
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Smart Blended Products (Amazon/Blinkit/Flipkart style) */}
            {blendedProducts.length > 0 && (
              <div className="blend-section">
                <h4 className="blend-title">
                  🥛 Perfect Blends &amp; Frequently Bought With "{query}"
                </h4>
                <p className="text-muted mb-4 small mt-[-10px]">
                  Complementary essentials matching your search
                </p>
                <div className="row g-3 g-md-4">
                  {blendedProducts.map((product) => (
                    <div key={product.id} className="col-6 col-md-4 col-lg-3">
                      <div className="prod-card card">
                        <div className="prod-img-wrap">
                          <Link to={`/product/${product.id}`} className="d-block w-100 h-100">
                            <img src={product.image_url || FALLBACK_IMG} alt={product.product_name} />
                          </Link>
                          <button
                            className="prod-wish-btn"
                            onClick={() => toggleWishlist({ id: product.id, name: product.product_name, price: product.selling_price, image_url: product.image_url, category_name: product.category_name })}
                            aria-label="Toggle wishlist"
                          >
                            <FaHeart
                              size={15}
                              className={isInWishlist(product.id) ? "text-danger" : "text-muted"}
                            />
                          </button>
                        </div>
                        <div className="card-body d-flex flex-column justify-content-between p-3">
                          <div>
                            <Link to={`/product/${product.id}`} className="prod-title">
                              {product.product_name}
                            </Link>
                            {product.category_name && (
                              <p className="text-muted small mb-2">{product.category_name}</p>
                            )}
                          </div>
                          <div>
                            <div className="d-flex align-items-center justify-content-between mb-2">
                              <span className="prod-price">{formatPrice(product.selling_price)}</span>
                              {product.mrp && parseFloat(product.mrp) > parseFloat(product.selling_price) && (
                                <span className="text-muted text-decoration-line-through small">{formatPrice(product.mrp)}</span>
                              )}
                            </div>
                            <button
                              className="btn btn-add"
                              onClick={() => addToCart({ id: product.id, name: product.product_name, price: product.selling_price, image_url: product.image_url, category_name: product.category_name })}
                            >
                              <FaShoppingCart size={13} /> Add to Cart
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Search;
