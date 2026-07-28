import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSearch, FaTimes } from 'react-icons/fa';
import { useProducts } from '../context/ProductContext';
import { debounce, formatPrice, getImageUrl } from '../utils/helpers';

const SearchBar = ({ onClose }) => {
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const { products } = useProducts();
    const navigate = useNavigate();

    useEffect(() => {
        const debouncedSearch = debounce(() => {
            if (query.trim().length >= 2) {
                const filtered = products
                    .filter(
                        (product) =>
                            (product.name || product.product_name || "").toLowerCase().includes(query.toLowerCase()) ||
                            (product.category || product.category_name || "").toLowerCase().includes(query.toLowerCase()) ||
                            (product.tags &&
                                product.tags.some((tag) =>
                                    tag.toLowerCase().includes(query.toLowerCase())
                                ))
                    )
                    .slice(0, 6);
                setSuggestions(filtered);
            } else {
                setSuggestions([]);
            }
        }, 300);

        debouncedSearch();
    }, [query, products]);

    const handleSearch = (e) => {
        e.preventDefault();
        if (query.trim()) {
            navigate(`/search?q=${encodeURIComponent(query.trim())}`);
            setQuery('');
            setSuggestions([]);
            if (onClose) onClose();
        }
    };

    const handleSuggestionClick = (productId) => {
        navigate(`/product/${productId}`);
        setQuery('');
        setSuggestions([]);
        if (onClose) onClose();
    };

    const handleClear = () => {
        setQuery('');
        setSuggestions([]);
    };

    return (
        <div className="position-relative">
            <form onSubmit={handleSearch} role="search">
                <div className="input-group">
                    <span className="input-group-text bg-white border-end-0">
                        <FaSearch className="text-brand-blue" aria-hidden="true" />
                    </span>
                    <input
                        type="search"
                        className="form-control border-start-0 border-end-0"
                        placeholder="Search for products, categories..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        autoFocus
                        aria-label="Search products"
                        autoComplete="off"
                    />
                    {query && (
                        <button
                            type="button"
                            className="input-group-text bg-white border-start-0 border-end-0"
                            onClick={handleClear}
                            aria-label="Clear search"
                        >
                            <FaTimes className="text-muted" />
                        </button>
                    )}
                    <button
                        type="submit"
                        className="btn btn-success"
                        aria-label="Submit search"
                    >
                        Search
                    </button>
                </div>
            </form>

            {/* Autocomplete Suggestions Dropdown */}
            {suggestions.length > 0 && (
                <div
                    className="position-absolute w-100 mt-1 bg-white border rounded shadow-lg"
                    style={{ zIndex: 1050, top: '100%' }}
                    role="listbox"
                    aria-label="Search suggestions"
                >
                    <div className="list-group list-group-flush rounded">
                        {suggestions.map((product) => (
                            <button
                                key={product.id}
                                type="button"
                                className="list-group-item list-group-item-action d-flex align-items-center py-2 px-3"
                                onClick={() => handleSuggestionClick(product.id)}
                                role="option"
                            >
                                <img
                                    src={product.image_url || getImageUrl(product.image)}
                                    alt={product.name || product.product_name}
                                    className="rounded me-3 flex-shrink-0"
                                    style={{
                                        width: '48px',
                                        height: '48px',
                                        objectFit: 'cover',
                                    }}
                                />
                                <div className="flex-grow-1 text-start overflow-hidden">
                                    <h6 className="mb-0 text-brand-blue text-truncate">
                                        {product.name || product.product_name}
                                    </h6>
                                    <small className="text-muted text-capitalize">
                                        {product.category || product.category_name}
                                    </small>
                                </div>
                                <span className="text-brand-green fw-bold ms-3 flex-shrink-0">
                                    {formatPrice(product.sale_price ?? product.price)}
                                </span>
                            </button>
                        ))}

                        {/* View all results */}
                        <button
                            type="button"
                            className="list-group-item list-group-item-action text-center py-2 text-brand-green fw-bold"
                            onClick={handleSearch}
                        >
                            <FaSearch className="me-2" size={12} />
                            View all results for "{query}"
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchBar;