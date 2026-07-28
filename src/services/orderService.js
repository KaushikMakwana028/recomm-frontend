import { call } from "../api/apiHelper";

const OrderService = {
  /* ===========================================================
     ORDERS
  =========================================================== */

  // Submit Order
  submitOrder: async (orderData) => {
    // Replace with your actual API when available
    return call(
      Promise.resolve({
        data: {
          status: true,
          data: orderData,
        },
      })
    );
  },

  // Get Orders
  getOrders: async () => {
    // Replace with your actual API when available
    return call(
      Promise.resolve({
        data: {
          status: true,
          data: [],
        },
      })
    );
  },
};

export default OrderService;