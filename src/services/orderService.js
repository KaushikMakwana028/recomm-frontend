import { axiosInstance, call } from "../api/apiHelper";

const OrderService = {
  /**
   * Place a COD order using a saved address
   */
  placeOrder: async ({ addressId, notes, deliveryCharge = 0, deliveryType = "normal", distance = null }) => {
    return call(
      axiosInstance.post("/place_order", {
        address_id: addressId,
        payment_method: "cod",
        notes: notes || "",
        delivery_charge: deliveryCharge,
        delivery_type: deliveryType,
        distance: distance,
      }),
    );
  },

  /**
   * Paginated order list, optional status filter
   */
  getOrders: async ({ page = 1, status } = {}) => {
    const params = { page };
    if (status) params.status = status;
    return call(axiosInstance.get("/get_orders", { params }));
  },

  /**
   * Full details of a single order
   */
  getOrderDetails: async (orderId) => {
    return call(axiosInstance.get(`/get_order_details/${orderId}`));
  },

  /**
   * Cancel an order (only allowed while pending/confirmed)
   */
  cancelOrder: async (orderId, reason = "") => {
    return call(
      axiosInstance.post("/cancel_order", { order_id: orderId, reason }),
    );
  },
};

export default OrderService;
