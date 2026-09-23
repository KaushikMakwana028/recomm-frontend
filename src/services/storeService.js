import { axiosInstance, call } from "../api/apiHelper";

const StoreService = {
  getNearbyStores: async ({ latitude, longitude, limit = 20 } = {}) => {
    const params = {};
    if (latitude !== undefined) params.latitude = latitude;
    if (longitude !== undefined) params.longitude = longitude;
    if (limit !== undefined) params.limit = limit;

    return call(
      axiosInstance.get("/get_nearby_stores", {
        params,
      }),
    );
  },

  getStoreDetail: async (storeId, { latitude, longitude } = {}) => {
    const params = {};
    if (latitude !== undefined) params.latitude = latitude;
    if (longitude !== undefined) params.longitude = longitude;

    return call(
      axiosInstance.get(`/get_store_detail/${storeId}`, {
        params,
      }),
    );
  },

  getStoreProducts: async (
    storeId,
    { categoryId, search, sortBy, page, limit } = {},
  ) => {
    const params = {};
    if (categoryId !== undefined && categoryId !== null && categoryId !== "") {
      params.category_id = categoryId;
    }
    if (search) params.search = search;
    if (sortBy) params.sort_by = sortBy;
    if (page !== undefined) params.page = page;
    if (limit !== undefined) params.limit = limit;

    return call(
      axiosInstance.get(`/get_store_products/${storeId}`, {
        params,
      }),
    );
  },

  saveStore: async (storeId) => {
    return call(
      axiosInstance.post("/save_store", {
        store_id: storeId,
      }),
    );
  },

  unsaveStore: async (storeId) => {
    return call(
      axiosInstance.post("/unsave_store", {
        store_id: storeId,
      }),
    );
  },

  getSavedStores: async () => {
    return call(axiosInstance.get("/get_saved_stores"));
  },

  isStoreSaved: async (storeId) => {
    return call(
      axiosInstance.get("/is_store_saved", {
        params: { store_id: storeId },
      }),
    );
  },
};

export default StoreService;
