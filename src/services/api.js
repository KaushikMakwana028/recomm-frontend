// src/services/api.js

import AuthService from "./authService";
import CategoryService from "./categoryService";
import ProductService from "./productService";
import CartService from "./cartService";
import WishlistService from "./wishlistService";
import ProfileService from "./profileService";
import OrderService from "./orderService";

const API = {
  ...AuthService,
  ...CategoryService,
  ...ProductService,
  ...CartService,
  ...WishlistService,
  ...ProfileService,
  ...OrderService,
};

export default API;
