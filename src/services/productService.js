import { axiosInstance, call } from "../api/apiHelper";

const ProductService = {
  getProductList: async ({ search = "" } = {}) => {
    const params = {
      search,
    };

    return call(
      axiosInstance.get("/get_product_list", {
        params,
      }),
    );
  },

  getProductDetail: async (id) => {
    return call(axiosInstance.get(`/get_product_detail/${id}`));
  },

  getProductById: async (id) => {
    return call(axiosInstance.get(`/get_product_detail/${id}`));
  },

  getFeaturedProducts: async (limit = 6) => {
    // Since get_featured_products is a 404, we can fetch from the /home endpoint which returns featured products.
    const res = await call(
      axiosInstance.get("/home", {
        params: { search: "", category_id: "" },
      }),
    );
    if (res.success && res.data && res.data.products) {
      return {
        success: true,
        data: res.data.products.slice(0, limit),
        error: null,
      };
    }
    return res;
  },

  getRelatedProducts: async (productId, limit = 4) => {
    // Fallback: get all products and return those that don't match the current ID
    const res = await ProductService.getProductList();
    if (res.success && Array.isArray(res.data)) {
      const filtered = res.data.filter((p) => String(p.id) !== String(productId));
      return {
        success: true,
        data: filtered.slice(0, limit),
        error: null,
      };
    }
    return res;
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
