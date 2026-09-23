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
  id: Number(row.product_id ?? row.id),
  name: row.product_name ?? row.name ?? "Product",
  price: Number(row.sale_price ?? row.price ?? 0),
  image: row.image_url || row.image || "",
  image_url: row.image_url || row.image || "",
  category: row.category_name ?? row.category ?? "",
  quantity: Number(row.quantity || 1),
  vendor_id: Number(row.vendor_id || 0),
  vendor_name: row.vendor_name || "",
  store_name: row.store_name || "",
  store_photo_url: row.store_photo_url || null,
  store_address: row.store_address || "",
  distance_km: row.distance_km !== undefined && row.distance_km !== null ? Number(row.distance_km) : null,
  distance_text: row.distance_text || "",
  item_total: Number(row.item_total || 0),
});

export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [cartItems, setCartItems] = useState([]);
  const [storeGroups, setStoreGroups] = useState([]);
  const [isMultiStore, setIsMultiStore] = useState(false);
  const [storesCount, setStoresCount] = useState(0);
  const [cartSummary, setCartSummary] = useState(null);
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

  const buildGuestStoreGroups = (items) => {
    if (!items || items.length === 0) return [];
    const map = {};
    items.forEach((item) => {
      const vId = item.vendor_id || 0;
      const sName = item.store_name || (vId ? `Store #${vId}` : "Store");
      if (!map[vId]) {
        map[vId] = {
          vendor_id: vId,
          store_name: sName,
          items: [],
          items_count: 0,
          total_quantity: 0,
          subtotal: 0,
          delivery_charge: 50,
          discount: 0,
          store_total: 0,
        };
      }
      map[vId].items.push(item);
      map[vId].items_count += 1;
      map[vId].total_quantity += Number(item.quantity);
      map[vId].subtotal += item.price * item.quantity;
    });
    return Object.values(map).map((g) => ({
      ...g,
      subtotal: Math.round(g.subtotal * 100) / 100,
      store_total: Math.round((g.subtotal + g.delivery_charge - g.discount) * 100) / 100,
    }));
  };

  const updateGuestState = (items) => {
    writeGuestCart(items);
    setCartItems(items);
    const groups = buildGuestStoreGroups(items);
    setStoreGroups(groups);
    setIsMultiStore(groups.length > 1);
    setStoresCount(groups.length);
  };

  // Load cart whenever auth state changes
  useEffect(() => {
    if (isAuthenticated) {
      syncGuestCartThenLoad();
    } else {
      const guestItems = readGuestCart();
      healGuestCart(guestItems).then((healedItems) => {
        updateGuestState(healedItems);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const loadServerCart = async () => {
    setLoading(true);
    const result = await CartService.getCart();
    if (result.success) {
      const items = (result.data?.items || []).map(mapApiItem);
      setCartItems(items);
      const rawGroups = result.data?.store_groups || [];
      const normalizedGroups = rawGroups.map((g) => ({
        ...g,
        items: (g.items || []).map(mapApiItem),
      }));
      setStoreGroups(normalizedGroups);
      setIsMultiStore(Boolean(result.data?.is_multi_store));
      setStoresCount(Number(result.data?.stores_count || 0));
      setCartSummary(result.data?.summary || null);
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
          vendor_id: product.vendor_id || 0,
          store_name: product.store_name || "",
        },
      ];
    }
    updateGuestState(updated);
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
    updateGuestState(updated);
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
    updateGuestState(updated);
    showToast(`Removed "${productName}" from cart.`, "info");
    return { success: true };
  };

  const clearCart = async () => {
    if (isAuthenticated) {
      const result = await CartService.clearCartApi();
      if (result.success) {
        setCartItems([]);
        setStoreGroups([]);
        setIsMultiStore(false);
        setStoresCount(0);
        setCartSummary(null);
      }
      return result;
    }

    writeGuestCart([]);
    setCartItems([]);
    setStoreGroups([]);
    setIsMultiStore(false);
    setStoresCount(0);
    setCartSummary(null);
    return { success: true };
  };

  const cartTotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const [deliveryType, setDeliveryType] = useState("normal");

  const value = {
    cartItems,
    storeGroups,
    isMultiStore,
    storesCount,
    cartSummary,
    cartTotal,
    cartItemCount,
    loading,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    refreshCart: loadServerCart,
    deliveryType,
    setDeliveryType,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
