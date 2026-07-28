import { axiosInstance, call } from "../api/apiHelper";

const CategoryService = {
  getCategoryList: async () => {
    return call(axiosInstance.get("/get_category_list"));
  },

  getCategoryDetail: async (id) => {
    return call(axiosInstance.get(`/get_category_detail/${id}`));
  },

  getProductsByCategory: async (categoryId) => {
    return call(axiosInstance.get(`/get_products_by_category/${categoryId}`));
  },

  searchCategories: async ({ search, parentId, isActive, sortBy, page, limit } = {}) => {
    const params = {};
    if (search) params.search = search;
    if (parentId !== undefined) params.parent_id = parentId;
    if (isActive !== undefined) params.is_active = isActive ? 1 : 0;
    if (sortBy) params.sort_by = sortBy;
    if (page) params.page = page;
    if (limit) params.limit = limit;
    return call(axiosInstance.get("/search_categories", { params }));
  },
};

export default CategoryService;
