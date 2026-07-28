import { axiosInstance, call } from "../api/apiHelper";

const AuthService = {
  /* ===========================================================
     AUTHENTICATION
  =========================================================== */

  // Send Login OTP
  loginSendOtp: async (mobile) => {
    return call(
      axiosInstance.post("/login_send_otp", {
        mobile,
      }),
    );
  },

  // Verify Login OTP
  verifyLoginOtp: async (mobile, otp) => {
    const result = await call(
      axiosInstance.post("/verify_login_otp", {
        mobile,
        otp,
      }),
    );

    if (result.success) {
      localStorage.setItem("token", result.data.token);
      localStorage.setItem("user", JSON.stringify(result.data.user));
    }

    return result;
  },

  // Send Register OTP
  registerSendOtp: async ({ name, mobile, email }) => {
    return call(
      axiosInstance.post("/register_send_otp", {
        name,
        mobile,
        email,
      }),
    );
  },

  // Verify Register OTP
  verifyRegisterOtp: async (mobile, otp) => {
    const result = await call(
      axiosInstance.post("/verify_register_otp", {
        mobile,
        otp,
      }),
    );

    if (result.success) {
      localStorage.setItem("token", result.data.token);
      localStorage.setItem("user", JSON.stringify(result.data.user));
    }

    return result;
  },

  // Google Login
  googleLogin: async ({ googleToken, email, name, mobile }) => {
    const result = await call(
      axiosInstance.post("/google_login", {
        google_token: googleToken,
        email,
        name,
        mobile,
      }),
    );

    if (result.success) {
      localStorage.setItem("token", result.data.token);
      localStorage.setItem("user", JSON.stringify(result.data.user));
    }

    return result;
  },

  // Guest Login
  guestLogin: async () => {
    const result = await call(axiosInstance.post("/guest_login"));

    if (result.success) {
      localStorage.setItem("token", result.data.token);
      localStorage.setItem("user", JSON.stringify(result.data.user));
    }

    return result;
  },

  // Check Token
  testToken: async () => {
    return call(axiosInstance.get("/test_token"));
  },

  // Logout
  logout: async () => {
    const result = await call(axiosInstance.post("/logout"));

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    return result;
  },

  /* ===========================================================
     HOME
  =========================================================== */

  getHomeData: async ({ search, categoryId } = {}) => {
    const params = {};

    if (search) params.search = search;
    if (categoryId) params.category_id = categoryId;

    return call(
      axiosInstance.get("/home", {
        params,
      }),
    );
  },
};

export default AuthService;
