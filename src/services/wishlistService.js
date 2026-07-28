import { axiosInstance, call } from "../api/apiHelper";

const WishlistService = {
  getWishlist: async () => {
    return call(axiosInstance.get("/get_wishlist"));
  },

  addToWishlistApi: async (productId, quantity = 1) => {
    return call(
      axiosInstance.post("/add_to_wishlist", {
        product_id: productId,
        quantity,
      }),
    );
  },

  updateWishlistQuantityApi: async (productId, quantity) => {
    return call(
      axiosInstance.post("/update_wishlist_quantity", {
        product_id: productId,
        quantity,
      }),
    );
  },

  removeFromWishlistApi: async (productId) => {
    return call(
      axiosInstance.post("/remove_from_wishlist", {
        product_id: productId,
      }),
    );
  },

  clearWishlistApi: async () => {
    return call(axiosInstance.post("/clear_wishlist"));
  },

  addAllWishlistToCartApi: async () => {
    return call(axiosInstance.post("/add_all_to_cart"));
  },
};

export default WishlistService;
