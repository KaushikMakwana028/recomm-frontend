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
};

export default CategoryService;
