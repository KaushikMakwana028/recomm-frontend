// Helper Utility Functions for Recomm-Frontend

import { STORAGE_KEYS } from "./constants";

/**
 * Format price to USD currency
 * @param {number} price - Price value
 * @returns {string} Formatted price string
 */
export const formatPrice = (price) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(price);
};  

/**
 * Calculate discount percentage
 * @param {number} originalPrice - Original price
 * @param {number} discountedPrice - Discounted price
 * @returns {number} Discount percentage
 */
export const calculateDiscount = (originalPrice, discountedPrice) => {
  return Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
};

/**
 * Format date to readable string
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date string
 */
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

/**
 * Generate unique ID
 * @returns {string} Unique ID
 */
export const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength = 100) => {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

/**
 * Get item from localStorage
 * @param {string} key - Storage key
 * @param {*} defaultValue - Default value if not found
 * @returns {*} Stored value or default
 */
export const getLocalStorage = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error("Error reading from localStorage:", error);
    return defaultValue;
  }
};

/**
 * Set item in localStorage
 * @param {string} key - Storage key
 * @param {*} value - Value to store
 */
export const setLocalStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error("Error writing to localStorage:", error);
  }
};

/**
 * Remove item from localStorage
 * @param {string} key - Storage key
 */
export const removeLocalStorage = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error("Error removing from localStorage:", error);
  }
};

/**
 * Calculate cart total
 * @param {Array} cartItems - Array of cart items
 * @returns {number} Total price
 */
export const calculateCartTotal = (cartItems) => {
  return cartItems.reduce((total, item) => {
    return total + item.price * item.quantity;
  }, 0);
};

/**
 * Calculate cart item count
 * @param {Array} cartItems - Array of cart items
 * @returns {number} Total item count
 */
export const calculateCartItemCount = (cartItems) => {
  return cartItems.reduce((count, item) => count + item.quantity, 0);
};

/**
 * Filter products by category
 * @param {Array} products - Array of products
 * @param {string} category - Category slug
 * @returns {Array} Filtered products
 */
export const filterByCategory = (products, category) => {
  if (!category || category === "all") return products;
  return products.filter((product) => product.category === category);
};

/**
 * Filter products by price range
 * @param {Array} products - Array of products
 * @param {number} min - Minimum price
 * @param {number} max - Maximum price
 * @returns {Array} Filtered products
 */
export const filterByPriceRange = (products, min, max) => {
  return products.filter(
    (product) => product.price >= min && product.price <= max,
  );
};

/**
 * Sort products
 * @param {Array} products - Array of products
 * @param {string} sortBy - Sort option
 * @returns {Array} Sorted products
 */
export const sortProducts = (products, sortBy) => {
  const sorted = [...products];

  switch (sortBy) {
    case "price-low-high":
      return sorted.sort((a, b) => a.price - b.price);
    case "price-high-low":
      return sorted.sort((a, b) => b.price - a.price);
    case "rating":
      return sorted.sort((a, b) => b.rating - a.rating);
    case "newest":
      return sorted.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      );
    case "popularity":
      return sorted.sort((a, b) => b.popularity - a.popularity);
    default:
      return sorted;
  }
};

/**
 * Search products
 * @param {Array} products - Array of products
 * @param {string} query - Search query
 * @returns {Array} Matching products
 */
export const searchProducts = (products, query) => {
  if (!query) return products;

  const lowerQuery = query.toLowerCase();
  return products.filter(
    (product) =>
      product.name.toLowerCase().includes(lowerQuery) ||
      product.description.toLowerCase().includes(lowerQuery) ||
      product.category.toLowerCase().includes(lowerQuery),
  );
};

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, delay = 300) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * Scroll to top of page
 */
export const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
};

/**
 * Check if user is authenticated
 * @returns {boolean} Authentication status
 */
export const isAuthenticated = () => {
  const token = getLocalStorage(STORAGE_KEYS.TOKEN);
  return !!token;
};

/**
 * Get current user
 * @returns {Object|null} User object or null
 */
export const getCurrentUser = () => {
  return getLocalStorage(STORAGE_KEYS.USER);
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Validation result
 */
export const isValidEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

/**
 * Generate star rating HTML
 * @param {number} rating - Rating value (0-5)
 * @returns {Array} Array of star objects
 */
export const generateStars = (rating) => {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  for (let i = 0; i < fullStars; i++) {
    stars.push({ type: "full", key: i });
  }

  if (hasHalfStar) {
    stars.push({ type: "half", key: fullStars });
  }

  const emptyStars = 5 - Math.ceil(rating);
  for (let i = 0; i < emptyStars; i++) {
    stars.push({ type: "empty", key: fullStars + (hasHalfStar ? 1 : 0) + i });
  }

  return stars;
};

/**
 * Get random items from array
 * @param {Array} array - Source array
 * @param {number} count - Number of items to get
 * @returns {Array} Random items
 */
export const getRandomItems = (array, count) => {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

/**
 * Get full image URL, falling back to a default if not found
 * @param {string} path - Image path
 * @returns {string} Full image URL
 */
export const getImageUrl = (path) => {
  const FALLBACK_IMG = "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400";
  if (!path) return FALLBACK_IMG;
  
  const trimmed = String(path).trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  
  // Prepend backend base URL (excluding the api part)
  const cleanPath = trimmed.startsWith("/") ? trimmed.slice(1) : trimmed;
  return `https://admin.recomm.in/${cleanPath}`;
};

export default {
  formatPrice,
  calculateDiscount,
  formatDate,
  generateId,
  truncateText,
  getLocalStorage,
  setLocalStorage,
  removeLocalStorage,
  calculateCartTotal,
  calculateCartItemCount,
  filterByCategory,
  filterByPriceRange,
  sortProducts,
  searchProducts,
  debounce,
  scrollToTop,
  isAuthenticated,
  getCurrentUser,
  isValidEmail,
  generateStars,
  getRandomItems,
  getImageUrl,
};

/**
 * Format status string to title case, removing underscores/hyphens
 * @param {string} status - Raw status string
 * @returns {string} Formatted status
 */
export const formatStatus = (status) => {
  if (!status) return "";
  return status
    .split(/[_-]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};
