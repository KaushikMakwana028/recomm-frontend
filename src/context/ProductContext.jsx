import React, { createContext, useContext, useState, useEffect } from 'react';
import ProductService from '../services/productService';
import { filterByCategory, filterByPriceRange, sortProducts, searchProducts } from '../utils/helpers';

const ProductContext = createContext();

export const useProducts = () => {
    const context = useContext(ProductContext);
    if (!context) {
        throw new Error('useProducts must be used within a ProductProvider');
    }
    return context;
};

export const ProductProvider = ({ children }) => {
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filter states
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedPriceRange, setSelectedPriceRange] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('popularity');

    // Load products on mount
    useEffect(() => {
        loadProducts();
    }, []);

    // Apply filters whenever they change
    useEffect(() => {
        applyFilters();
    }, [products, selectedCategory, selectedPriceRange, searchQuery, sortBy]);

    // Load all products
    const loadProducts = async () => {
        try {
            setLoading(true);
            const response = await ProductService.getProductList();

            if (response.success) {
                setProducts(response.data);
                setError(null);
            } else {
                setError(response.error);
            }
        } catch (err) {
            setError('Failed to load products');
        } finally {
            setLoading(false);
        }
    };

    // Apply all filters
    const applyFilters = () => {
        let result = [...products];

        // Apply search
        if (searchQuery) {
            result = searchProducts(result, searchQuery);
        }

        // Apply category filter
        if (selectedCategory && selectedCategory !== 'all') {
            result = filterByCategory(result, selectedCategory);
        }

        // Apply price range filter
        if (selectedPriceRange) {
            result = filterByPriceRange(result, selectedPriceRange.min, selectedPriceRange.max);
        }

        // Apply sorting
        result = sortProducts(result, sortBy);

        setFilteredProducts(result);
    };

    // Get product by ID
    const getProductById = async (id) => {
        try {
            const response = await ProductService.getProductById(id);
            return response.success ? response.data : null;
        } catch (error) {
            return null;
        }
    };

    // Get featured products
    const getFeaturedProducts = async (limit = 6) => {
        try {
            const response = await ProductService.getFeaturedProducts(limit);
            return response.success ? response.data : [];
        } catch (error) {
            return [];
        }
    };

    // Get related products
    const getRelatedProducts = async (productId, limit = 4) => {
        try {
            const response = await ProductService.getRelatedProducts(productId, limit);
            return response.success ? response.data : [];
        } catch (error) {
            return [];
        }
    };

    const value = {
        products,
        filteredProducts,
        loading,
        error,
        selectedCategory,
        selectedPriceRange,
        searchQuery,
        sortBy,
        setSelectedCategory,
        setSelectedPriceRange,
        setSearchQuery,
        setSortBy,
        loadProducts,
        getProductById,
        getFeaturedProducts,
        getRelatedProducts,
    };

    return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>;
};