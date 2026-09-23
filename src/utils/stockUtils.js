/**
 * Utility to classify and display product stock states in Recomm Customer App.
 * 
 * 4 States:
 * 1. available: Stock is above low stock threshold
 * 2. low_stock: Stock is greater than 0 but below threshold ("Only X left")
 * 3. out_of_stock: Stock is 0 or less ("Unavailable")
 * 4. temporarily_unavailable: Vendor paused product ("Temporarily Unavailable")
 */

export const STOCK_STATES = {
  AVAILABLE: 'available',
  LOW_STOCK: 'low_stock',
  OUT_OF_STOCK: 'out_of_stock',
  TEMPORARILY_UNAVAILABLE: 'temporarily_unavailable',
};

export const getStockInfo = (product) => {
  if (!product) {
    return {
      state: STOCK_STATES.OUT_OF_STOCK,
      badgeLabel: 'Unavailable',
      canAddToCart: false,
      buttonLabel: 'Unavailable',
      cartDisabledReason: 'Product unavailable',
      badgeBg: '#FEE2E2',
      badgeColor: '#DC2626',
      badgeBorder: '#FCA5A5',
    };
  }

  const isTemporarilyUnavailable =
    product.temporarily_unavailable === 1 ||
    product.temporarily_unavailable === true ||
    product.temporarily_unavailable === '1' ||
    product.stock_state === 'temporarily_unavailable';

  const stock = Number(product.stock ?? 0);
  const threshold = Number(product.low_stock_threshold || 5);

  if (isTemporarilyUnavailable) {
    return {
      state: STOCK_STATES.TEMPORARILY_UNAVAILABLE,
      badgeLabel: 'Temporarily Unavailable',
      canAddToCart: false,
      buttonLabel: 'Temporarily Unavailable',
      cartDisabledReason: 'The seller has temporarily paused sales for this product.',
      badgeBg: '#F3F4F6',
      badgeColor: '#4B5563',
      badgeBorder: '#D1D5DB',
      isPaused: true,
      stock,
    };
  }

  if (stock <= 0 || product.stock_state === 'out_of_stock') {
    return {
      state: STOCK_STATES.OUT_OF_STOCK,
      badgeLabel: 'Unavailable',
      canAddToCart: false,
      buttonLabel: 'Out of Stock',
      cartDisabledReason: 'This product is currently out of stock.',
      badgeBg: '#FEE2E2',
      badgeColor: '#DC2626',
      badgeBorder: '#FCA5A5',
      isOutOfStock: true,
      stock: 0,
    };
  }

  if (stock < threshold || product.stock_state === 'low_stock') {
    return {
      state: STOCK_STATES.LOW_STOCK,
      badgeLabel: `Only ${stock} left`,
      canAddToCart: true,
      buttonLabel: 'Add to Cart',
      cartDisabledReason: null,
      badgeBg: '#FEF3C7',
      badgeColor: '#B45309',
      badgeBorder: '#FCD34D',
      isLowStock: true,
      stock,
    };
  }

  return {
    state: STOCK_STATES.AVAILABLE,
    badgeLabel: 'In Stock',
    canAddToCart: true,
    buttonLabel: 'Add to Cart',
    cartDisabledReason: null,
    badgeBg: '#ECFDF5',
    badgeColor: '#059669',
    badgeBorder: '#A7F3D0',
    isAvailable: true,
    stock,
  };
};
