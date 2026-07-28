import { axiosInstance, call } from "../api/apiHelper";

const CartService = {
  getCart: async () => {
    return call(axiosInstance.get("/get_cart"));
  },

  getCartSummary: async () => {
    return call(axiosInstance.get("/get_cart_summary"));
  },

  addToCartApi: async (productId, quantity = 1) => {
    return call(
      axiosInstance.post("/add_to_cart", {
        product_id: productId,
        quantity,
      }),
    );
  },

  updateCartQuantityApi: async (productId, quantity) => {
    return call(
      axiosInstance.post("/update_cart_quantity", {
        product_id: productId,
        quantity,
      }),
    );
  },

  removeFromCartApi: async (productId) => {
    return call(
      axiosInstance.post("/remove_from_cart", {
        product_id: productId,
      }),
    );
  },

  clearCartApi: async () => {
    return call(axiosInstance.post("/clear_cart"));
  },

  applyPromoCode: async (code) => {
    return call(
      axiosInstance.post("/apply_promo_code", {
        code,
      }),
    );
  },
};

export default CartService;
