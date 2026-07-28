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
};

export default ProductService;
