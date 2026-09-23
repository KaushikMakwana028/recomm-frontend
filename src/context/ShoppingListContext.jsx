import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import ShoppingListService from "../services/shoppingListService";
import { useAuth } from "./AuthContext";
import { useCart } from "./CartContext";
import { useToast } from "./ToastContext";

const ShoppingListContext = createContext();

export const useShoppingList = () => {
  const context = useContext(ShoppingListContext);
  if (!context) {
    throw new Error("useShoppingList must be used within a ShoppingListProvider");
  }
  return context;
};

export const ShoppingListProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const { refreshCart } = useCart();
  const { showToast } = useToast();

  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(false);

  // Global modal state to open "Add to List" from anywhere
  const [modalProduct, setModalProduct] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchLists = useCallback(async () => {
    if (!isAuthenticated) {
      setLists([]);
      return;
    }

    setLoading(true);
    try {
      const res = await ShoppingListService.getShoppingLists();
      if (res.success && res.data?.lists) {
        setLists(res.data.lists);
      }
    } catch (err) {
      console.error("Error fetching shopping lists:", err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  const createList = async (name, productId = null, quantity = 1) => {
    if (!isAuthenticated) {
      showToast("Please log in to manage shopping lists.", "info");
      return null;
    }
    try {
      const res = await ShoppingListService.createShoppingList(name, productId, quantity);
      if (res.success && res.data) {
        showToast(`List "${name}" created successfully!`, "success");
        await fetchLists();
        return res.data;
      } else {
        showToast(res.error || "Failed to create shopping list", "error");
        return null;
      }
    } catch (err) {
      showToast("Error creating shopping list", "error");
      return null;
    }
  };

  const renameList = async (listId, newName) => {
    try {
      const res = await ShoppingListService.renameShoppingList(listId, newName);
      if (res.success) {
        showToast("Shopping list renamed successfully", "success");
        await fetchLists();
        return true;
      } else {
        showToast(res.error || "Failed to rename list", "error");
        return false;
      }
    } catch (err) {
      showToast("Error renaming shopping list", "error");
      return false;
    }
  };

  const deleteList = async (listId) => {
    try {
      const res = await ShoppingListService.deleteShoppingList(listId);
      if (res.success) {
        showToast("Shopping list deleted", "info");
        await fetchLists();
        return true;
      } else {
        showToast(res.error || "Failed to delete list", "error");
        return false;
      }
    } catch (err) {
      showToast("Error deleting shopping list", "error");
      return false;
    }
  };

  const addProductToList = async (listId, productId, quantity = 1) => {
    if (!isAuthenticated) {
      showToast("Please log in to manage shopping lists.", "info");
      return false;
    }
    try {
      const res = await ShoppingListService.addToShoppingList(listId, productId, quantity);
      if (res.success) {
        showToast(res.message || "Product added to shopping list", "success");
        await fetchLists();
        return true;
      } else {
        showToast(res.error || "Failed to add product to list", "error");
        return false;
      }
    } catch (err) {
      showToast("Error adding product to list", "error");
      return false;
    }
  };

  const removeProductFromList = async (listId, productId) => {
    try {
      const res = await ShoppingListService.removeFromShoppingList(listId, productId);
      if (res.success) {
        showToast("Product removed from shopping list", "info");
        await fetchLists();
        return true;
      } else {
        showToast(res.error || "Failed to remove product", "error");
        return false;
      }
    } catch (err) {
      showToast("Error removing product from list", "error");
      return false;
    }
  };

  const addAllToCart = async (listId) => {
    if (!isAuthenticated) {
      showToast("Please log in to add items to your cart.", "info");
      return false;
    }
    try {
      const res = await ShoppingListService.addAllToCart(listId);
      if (res.success) {
        showToast(res.message || "All items added to cart!", "success");
        if (refreshCart) {
          await refreshCart();
        }
        return true;
      } else {
        showToast(res.error || "Failed to add items to cart", "error");
        return false;
      }
    } catch (err) {
      showToast("Error adding items to cart", "error");
      return false;
    }
  };

  const openAddToListModal = (product) => {
    if (!isAuthenticated) {
      showToast("Please log in to save items to your shopping lists.", "info");
      return;
    }
    setModalProduct(product);
    setIsModalOpen(true);
  };

  const closeAddToListModal = () => {
    setIsModalOpen(false);
    setModalProduct(null);
  };

  return (
    <ShoppingListContext.Provider
      value={{
        lists,
        loading,
        fetchLists,
        createList,
        renameList,
        deleteList,
        addProductToList,
        removeProductFromList,
        addAllToCart,
        openAddToListModal,
        closeAddToListModal,
        isModalOpen,
        modalProduct,
      }}
    >
      {children}
    </ShoppingListContext.Provider>
  );
};

export default ShoppingListContext;
