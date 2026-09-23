import { axiosInstance, call } from "../api/apiHelper";

const ShoppingListService = {
  getShoppingLists: async () => {
    return call(axiosInstance.get("/shopping_lists"));
  },

  createShoppingList: async (name, productId = null, quantity = 1) => {
    const payload = { name };
    if (productId) {
      payload.product_id = productId;
      payload.quantity = quantity;
    }
    return call(axiosInstance.post("/create_shopping_list", payload));
  },

  renameShoppingList: async (listId, name) => {
    return call(
      axiosInstance.post("/rename_shopping_list", {
        list_id: listId,
        name,
      }),
    );
  },

  deleteShoppingList: async (listId) => {
    return call(
      axiosInstance.post("/delete_shopping_list", {
        list_id: listId,
      }),
    );
  },

  getShoppingListItems: async (listId) => {
    return call(
      axiosInstance.get("/shopping_list_items", {
        params: { list_id: listId },
      }),
    );
  },

  addToShoppingList: async (listId, productId, quantity = 1) => {
    return call(
      axiosInstance.post("/add_to_shopping_list", {
        list_id: listId,
        product_id: productId,
        quantity,
      }),
    );
  },

  removeFromShoppingList: async (listId, productId) => {
    return call(
      axiosInstance.post("/remove_from_shopping_list", {
        list_id: listId,
        product_id: productId,
      }),
    );
  },

  addAllToCart: async (listId) => {
    return call(
      axiosInstance.post("/shopping_list_add_all_to_cart", {
        list_id: listId,
      }),
    );
  },
};

export default ShoppingListService;
