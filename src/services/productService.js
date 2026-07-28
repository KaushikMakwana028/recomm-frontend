import { axiosInstance, call } from "../api/apiHelper";

const ProductService = {
  getProductList: async ({ search } = {}) => {
    const params = {};

    if (search) params.search = search;

    return call(
      axiosInstance.get("/get_product_list", {
        params,
      }),
    );
  },

  getProductDetail: async (id) => {
    return call(axiosInstance.get(`/get_product_detail/${id}`));
  },

  searchProducts: async ({ search, categoryId, brand, minPrice, maxPrice, inStock, vendorId, sortBy, page, limit } = {}) => {
    const params = {};
    if (search) params.search = search;
    if (categoryId) params.category_id = categoryId;
    if (brand) params.brand = brand;
    if (minPrice !== undefined) params.min_price = minPrice;
    if (maxPrice !== undefined) params.max_price = maxPrice;
    if (inStock !== undefined) params.in_stock = inStock ? 1 : 0;
    if (vendorId !== undefined) params.vendor_id = vendorId;
    if (sortBy) params.sort_by = sortBy;
    if (page) params.page = page;
    if (limit) params.limit = limit;
    return call(axiosInstance.get("/search_products", { params }));
  },
};

export default ProductService;
