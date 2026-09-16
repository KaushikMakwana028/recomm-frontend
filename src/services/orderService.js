import { axiosInstance, call } from "../api/apiHelper";

const OrderService = {
  /**
   * Calculate live delivery charge from server using coordinates
   */
  calculateDeliveryCharge: async ({ addressId, deliveryType = "normal" } = {}) => {
    return call(
      axiosInstance.post("/calculate_delivery_charge", {
        address_id: addressId,
        delivery_type: deliveryType,
      })
    );
  },

  /**
   * Place a COD order using a saved address
   */
  placeOrder: async ({
    addressId,
    notes,
    deliveryCharge = 0,
    deliveryType = "normal",
    distance = null,
    chosenTimeOption = "immediately",
    customDeliveryTime = null,
  }) => {
    return call(
      axiosInstance.post("/place_order", {
        address_id: addressId,
        payment_method: "cod",
        notes: notes || "",
        delivery_charge: deliveryCharge,
        delivery_type: deliveryType,
        distance: distance,
        chosen_time_option: chosenTimeOption,
        custom_delivery_time: customDeliveryTime,
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

  /**
   * Hide order from customer history (soft delete for customer only)
   */
  hideOrder: async (orderId) => {
    return call(
      axiosInstance.post("/hide_order", { order_id: orderId }),
    );
  },

  /**
   * Get invoice view URL (PDF)
   */
  getInvoiceUrl: (orderId, explicitUrl) => {
    if (explicitUrl) return explicitUrl;
    const base = axiosInstance.defaults?.baseURL || "https://admin.recomm.in/api/user";
    return `${base.replace(/\/+$/, "")}/order_invoice/${orderId}`;
  },

  /**
   * Get invoice direct download URL (PDF)
   */
  getInvoiceDownloadUrl: (orderId, explicitUrl) => {
    const url = OrderService.getInvoiceUrl(orderId, explicitUrl);
    return url.includes("?") ? `${url}&download=1` : `${url}?download=1`;
  },
};

export default OrderService;
