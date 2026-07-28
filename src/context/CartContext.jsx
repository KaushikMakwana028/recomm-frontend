import React, { createContext, useContext, useState, useEffect } from "react";
import CartService from "../services/cartService";
import ProductService from "../services/productService";
import { useAuth } from "./AuthContext";
import { useToast } from "./ToastContext";

const CartContext = createContext();
const GUEST_CART_KEY = "guest_cart";

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
};

const readGuestCart = () => {
  try {
    return JSON.parse(localStorage.getItem(GUEST_CART_KEY)) || [];
  } catch {
    return [];
  }
};

const writeGuestCart = (items) => {
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
};

// Normalize a get_cart API row -> shape Cart.jsx expects
const mapApiItem = (row) => ({
  id: Number(row.product_id),
  name: row.product_name,
  price: Number(row.sale_price ?? row.price),
  image: row.image_url,
  category: row.category_name,
  quantity: Number(row.quantity),
});

export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const healGuestCart = async (items) => {
    if (!items || items.length === 0) return items;
    const needsHealing = items.some((item) => !item.image || !item.category);
    if (!needsHealing) return items;

    try {
      const result = await ProductService.getProductList();
      if (result.success && result.data) {
        const products = result.data;
        const healed = items.map((item) => {
          if (!item.image || !item.category) {
            const match = products.find((p) => String(p.id) === String(item.id));
            if (match) {
              return {
                ...item,
                image: item.image || match.image_url || match.image,
                category: item.category || match.category_name,
              };
            }
          }
          return item;
        });
        writeGuestCart(healed);
        return healed;
      }
    } catch (e) {
      console.error("Failed to heal guest cart:", e);
    }
    return items;
  };

  // Load cart whenever auth state changes
  useEffect(() => {
    if (isAuthenticated) {
      syncGuestCartThenLoad();
    } else {
      const guestItems = readGuestCart();
      healGuestCart(guestItems).then((healedItems) => {
        setCartItems(healedItems);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const loadServerCart = async () => {
    setLoading(true);
    const result = await CartService.getCart();
    if (result.success) {
      setCartItems((result.data?.items || []).map(mapApiItem));
    }
    setLoading(false);
  };

  // Push any guest-cart items into the server cart once, then clear guest cart
  const syncGuestCartThenLoad = async () => {
    const guestItems = readGuestCart();
    if (guestItems.length > 0) {
      setLoading(true);
      await Promise.all(
        guestItems.map((item) => CartService.addToCartApi(item.id, item.quantity)),
      );
      writeGuestCart([]);
    }
    await loadServerCart();
  };

  const addToCart = async (product, quantity = 1, silent = false) => {
    if (isAuthenticated) {
      const result = await CartService.addToCartApi(product.id, quantity);
      if (result.success) {
        await loadServerCart();
        if (!silent) showToast(`Added "${product.name}" to cart!`, "success");
      }
      return result;
    }

    const guestItems = readGuestCart();
    const existing = guestItems.find((i) => i.id === product.id);
    let updated;
    if (existing) {
      updated = guestItems.map((i) =>
        i.id === product.id ? { ...i, quantity: i.quantity + quantity } : i,
      );
    } else {
      updated = [
        ...guestItems,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image_url || product.image,
          category: product.category_name,
          quantity,
        },
      ];
    }
    writeGuestCart(updated);
    setCartItems(updated);
    if (!silent) showToast(`Added "${product.name}" to cart!`, "success");
    return { success: true };
  };

  const updateQuantity = async (productId, quantity) => {
    if (isAuthenticated) {
      const result = await CartService.updateCartQuantityApi(productId, quantity);
      if (result.success) await loadServerCart();
      return result;
    }

    const guestItems = readGuestCart();
    const updated =
      quantity <= 0
        ? guestItems.filter((i) => i.id !== productId)
        : guestItems.map((i) => (i.id === productId ? { ...i, quantity } : i));
    writeGuestCart(updated);
    setCartItems(updated);
    return { success: true };
  };

  const removeFromCart = async (productId) => {
    const item = cartItems.find(i => i.id === productId);
    const productName = item ? item.name : "Product";

    if (isAuthenticated) {
      const result = await CartService.removeFromCartApi(productId);
      if (result.success) {
        await loadServerCart();
        showToast(`Removed "${productName}" from cart.`, "info");
      }
      return result;
    }

    const updated = readGuestCart().filter((i) => i.id !== productId);
    writeGuestCart(updated);
    setCartItems(updated);
    showToast(`Removed "${productName}" from cart.`, "info");
    return { success: true };
  };

  const clearCart = async () => {
    if (isAuthenticated) {
      const result = await CartService.clearCartApi();
      if (result.success) setCartItems([]);
      return result;
    }

    writeGuestCart([]);
    setCartItems([]);
    return { success: true };
  };

  const cartTotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const value = {
    cartItems,
    cartTotal,
    cartItemCount,
    loading,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    refreshCart: loadServerCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
