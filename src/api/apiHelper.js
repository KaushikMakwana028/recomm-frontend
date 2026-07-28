import axiosInstance from "./axiosInstance";

export const call = async (promise) => {
  try {
    const res = await promise;

    return {
      success: res.data.status === true,
      data: res.data.data,
      error: null,
    };
  } catch (err) {
    const res = err.response?.data;

    return {
      success: false,
      data: null,
      error: res?.message || "Network error. Please try again.",
    };
  }
};

export { axiosInstance };