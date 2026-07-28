// Constants for Recomm-Frontend

// Brand Colors
export const COLORS = {
    DARK_BLUE: '#00204E',
    LIGHT_GREEN: '#34A129',
    DARK_GREEN: '#189031',
    WHITE: '#FFFFFF',
    LIGHT_GRAY: '#F8F9FA',
};

// Product Categories
export const CATEGORIES = [
    { id: 1, name: 'All Products', slug: 'all' },
    { id: 2, name: 'Beverages', slug: 'beverages' },
    { id: 3, name: 'Snacks', slug: 'snacks' },
    { id: 4, name: 'Meals', slug: 'meals' },
    { id: 5, name: 'Desserts', slug: 'desserts' },
    { id: 6, name: 'Breakfast', slug: 'breakfast' },
    { id: 7, name: 'Organic', slug: 'organic' },
    { id: 8, name: 'Healthy Options', slug: 'healthy' },
];

// Sort Options
export const SORT_OPTIONS = [
    { value: 'popularity', label: 'Most Popular' },
    { value: 'price-low-high', label: 'Price: Low to High' },
    { value: 'price-high-low', label: 'Price: High to Low' },
    { value: 'rating', label: 'Highest Rated' },
    { value: 'newest', label: 'Newest First' },
];

// Price Range Options
export const PRICE_RANGES = [
    { id: 1, label: 'Under $10', min: 0, max: 10 },
    { id: 2, label: '$10 - $25', min: 10, max: 25 },
    { id: 3, label: '$25 - $50', min: 25, max: 50 },
    { id: 4, label: '$50 - $100', min: 50, max: 100 },
    { id: 5, label: 'Over $100', min: 100, max: Infinity },
];

// Navigation Menu Items
export const MENU_ITEMS = [
    { id: 1, label: 'Home', path: '/' },
    { id: 2, label: 'Products', path: '/products' },
    { id: 3, label: 'Categories', path: '/products', dropdown: true },
    { id: 4, label: 'About', path: '/about' },
    { id: 5, label: 'Contact', path: '/contact' },
];

// Footer Links
export const FOOTER_LINKS = {
    company: [
        { label: 'About Us', path: '/about' },
        { label: 'Careers', path: '/careers' },
        { label: 'Press', path: '/press' },
        { label: 'Blog', path: '/blog' },
    ],
    customer: [
        { label: 'Help Center', path: '/help' },
        { label: 'Contact Us', path: '/contact' },
        { label: 'Shipping Info', path: '/shipping' },
        { label: 'Returns', path: '/returns' },
    ],
    legal: [
        { label: 'Privacy Policy', path: '/privacy' },
        { label: 'Terms of Service', path: '/terms' },
        { label: 'Cookie Policy', path: '/cookies' },
        { label: 'Sitemap', path: '/sitemap' },
    ],
};

// Payment Methods
export const PAYMENT_METHODS = [
    { id: 'credit-card', label: 'Credit/Debit Card', icon: 'FaCreditCard' },
    { id: 'paypal', label: 'PayPal', icon: 'FaPaypal' },
    { id: 'apple-pay', label: 'Apple Pay', icon: 'FaApple' },
    { id: 'google-pay', label: 'Google Pay', icon: 'FaGoogle' },
];

// Delivery Options
export const DELIVERY_OPTIONS = [
    { id: 'standard', label: 'Standard Delivery (5-7 days)', price: 5.99 },
    { id: 'express', label: 'Express Delivery (2-3 days)', price: 12.99 },
    { id: 'next-day', label: 'Next Day Delivery', price: 19.99 },
    { id: 'pickup', label: 'Store Pickup (Free)', price: 0 },
];

// Order Status
export const ORDER_STATUS = {
    PENDING: 'pending',
    PROCESSING: 'processing',
    SHIPPED: 'shipped',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled',
};

// Toast/Notification Types
export const NOTIFICATION_TYPES = {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info',
};

// Local Storage Keys
export const STORAGE_KEYS = {
    CART: 'recomm_cart',
    WISHLIST: 'recomm_wishlist',
    USER: 'recomm_user',
    TOKEN: 'recomm_token',
    RECENT_PRODUCTS: 'recomm_recent_products',
};

// API Endpoints (Mock)
export const API_ENDPOINTS = {
    LOGIN: '/api/auth/login',
    SIGNUP: '/api/auth/signup',
    LOGOUT: '/api/auth/logout',
    PRODUCTS: '/api/products',
    PRODUCT_DETAIL: '/api/products/:id',
    CART: '/api/cart',
    WISHLIST: '/api/wishlist',
    ORDERS: '/api/orders',
    PROFILE: '/api/profile',
};

// Regex Patterns
export const REGEX_PATTERNS = {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PHONE: /^[\d\s\-\+\(\)]+$/,
    ZIP_CODE: /^\d{5}(-\d{4})?$/,
    CREDIT_CARD: /^\d{16}$/,
    CVV: /^\d{3,4}$/,
};

// Maximum Values
export const MAX_VALUES = {
    CART_QUANTITY: 99,
    REVIEW_LENGTH: 500,
    PROMO_CODE_LENGTH: 20,
};

export default {
    COLORS,
    CATEGORIES,
    SORT_OPTIONS,
    PRICE_RANGES,
    MENU_ITEMS,
    FOOTER_LINKS,
    PAYMENT_METHODS,
    DELIVERY_OPTIONS,
    ORDER_STATUS,
    NOTIFICATION_TYPES,
    STORAGE_KEYS,
    API_ENDPOINTS,
    REGEX_PATTERNS,
    MAX_VALUES,
};