import React, { createContext, useContext, useState, useCallback } from "react";
import OrderService from "../services/orderService";

const OrderContext = createContext();

export const useOrder = () => {
  const context = useContext(OrderContext);
  if (!context)
    throw new Error("useOrder must be used within an OrderProvider");
  return context;
};

export const OrderProvider = ({ children }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalOrders: 0,
  });

  const placeOrder = useCallback(
    async ({
      addressId,
      notes,
      deliveryCharge,
      deliveryType,
      distance,
      chosenTimeOption,
      customDeliveryTime,
    }) => {
      return await OrderService.placeOrder({
        addressId,
        notes,
        deliveryCharge,
        deliveryType,
        distance,
        chosenTimeOption,
        customDeliveryTime,
      });
    },
    [],
  );

  const fetchOrders = useCallback(async ({ page = 1, status } = {}) => {
    setLoading(true);
    const result = await OrderService.getOrders({ page, status });
    if (result.success) {
      setOrders(result.data?.orders || []);
      setPagination({
        currentPage: result.data?.current_page || 1,
        totalPages: result.data?.total_pages || 1,
        totalOrders: result.data?.total_orders || 0,
      });
    }
    setLoading(false);
    return result;
  }, []);

  const fetchOrderDetails = useCallback(async (orderId) => {
    return await OrderService.getOrderDetails(orderId);
  }, []);

  const cancelOrder = useCallback(async (orderId, reason) => {
    const result = await OrderService.cancelOrder(orderId, reason);
    if (result.success) {
      setOrders((prev) =>
        prev.map((o) =>
          o.order_id === orderId ? { ...o, status: "cancelled" } : o,
        ),
      );
    }
    return result;
  }, []);

  const value = {
    orders,
    loading,
    pagination,
    placeOrder,
    fetchOrders,
    fetchOrderDetails,
    cancelOrder,
  };

  return (
    <OrderContext.Provider value={value}>{children}</OrderContext.Provider>
  );
};
