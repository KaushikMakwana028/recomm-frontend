import React, { createContext, useContext, useState, useEffect } from "react";
import WishlistService from "../services/wishlistService";
import ProductService from "../services/productService";
import { useAuth } from "./AuthContext";
import { useToast } from "./ToastContext";

const WishlistContext = createContext();
const GUEST_WISHLIST_KEY = "guest_wishlist";

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context)
    throw new Error("useWishlist must be used within a WishlistProvider");
  return context;
};

const readGuestWishlist = () => {
  try {
    return JSON.parse(localStorage.getItem(GUEST_WISHLIST_KEY)) || [];
  } catch {
    return [];
  }
};

const writeGuestWishlist = (items) => {
  localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(items));
};

// Normalize a get_wishlist API row -> shape Wishlist.jsx expects
const mapApiItem = (row) => ({
  id: row.product_id,
  name: row.product_name,
  price: row.sale_price ?? row.price,
  image: row.image_url,
  category: row.category_name,
  quantity: row.quantity,
});

export const WishlistProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const healGuestWishlist = async (items) => {
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
        writeGuestWishlist(healed);
        return healed;
      }
    } catch (e) {
      console.error("Failed to heal guest wishlist:", e);
    }
    return items;
  };

  useEffect(() => {
    if (isAuthenticated) {
      syncGuestWishlistThenLoad();
    } else {
      const guestItems = readGuestWishlist();
      healGuestWishlist(guestItems).then((healedItems) => {
        setWishlistItems(healedItems);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const loadServerWishlist = async () => {
    setLoading(true);
    const result = await WishlistService.getWishlist();
    if (result.success) {
      setWishlistItems((result.data?.items || []).map(mapApiItem));
    }
    setLoading(false);
  };

  const syncGuestWishlistThenLoad = async () => {
    const guestItems = readGuestWishlist();
    if (guestItems.length > 0) {
      setLoading(true);
      await Promise.all(
        guestItems.map((item) => WishlistService.addToWishlistApi(item.id, item.quantity)),
      );
      writeGuestWishlist([]);
    }
    await loadServerWishlist();
  };

  const addToWishlist = async (product, quantity = 1) => {
    if (isAuthenticated) {
      const result = await WishlistService.addToWishlistApi(product.id, quantity);
      if (result.success) {
        await loadServerWishlist();
        showToast(`Saved "${product.name}" to Wishlist!`, "success");
      }
      return result;
    }

    const guestItems = readGuestWishlist();
    if (guestItems.some((i) => i.id === product.id)) return { success: true };

    const updated = [
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
    writeGuestWishlist(updated);
    setWishlistItems(updated);
    showToast(`Saved "${product.name}" to Wishlist!`, "success");
    return { success: true };
  };

  const removeFromWishlist = async (productId) => {
    const item = wishlistItems.find(i => i.id === productId);
    const productName = item ? item.name : "Product";

    if (isAuthenticated) {
      const result = await WishlistService.removeFromWishlistApi(productId);
      if (result.success) {
        await loadServerWishlist();
        showToast(`Removed "${productName}" from Wishlist.`, "info");
      }
      return result;
    }

    const updated = readGuestWishlist().filter((i) => i.id !== productId);
    writeGuestWishlist(updated);
    setWishlistItems(updated);
    showToast(`Removed "${productName}" from Wishlist.`, "info");
    return { success: true };
  };

  const isInWishlist = (productId) =>
    wishlistItems.some((item) => String(item.id) === String(productId));

  const toggleWishlist = (product) => {
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  const clearWishlist = async () => {
    if (isAuthenticated) {
      const result = await WishlistService.clearWishlistApi();
      if (result.success) setWishlistItems([]);
      return result;
    }

    writeGuestWishlist([]);
    setWishlistItems([]);
    return { success: true };
  };

  // Move all wishlist items into cart in one shot (logged-in only, uses real backend endpoint)
  const moveAllToCart = async () => {
    if (isAuthenticated) {
      const result = await WishlistService.addAllWishlistToCartApi();
      if (result.success) setWishlistItems([]);
      return result;
    }
    // Guests: caller (Wishlist.jsx) handles moving items via cart context + clearWishlist
    return {
      success: false,
      error: "Login required to move all items to cart.",
    };
  };

  const value = {
    wishlistItems,
    wishlistCount: wishlistItems.length,
    loading,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    toggleWishlist,
    clearWishlist,
    moveAllToCart,
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};
