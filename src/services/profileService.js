import { axiosInstance, call } from "../api/apiHelper";

const ProfileService = {
  getProfile: async () => {
    return call(axiosInstance.get("/get_profile"));
  },

  updateProfile: async (formData) => {
    return call(
      axiosInstance.post("/update_profile", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }),
    );
  },

  getAddresses: async () => {
    return call(axiosInstance.get("/get_addresses"));
  },

  saveAddress: async (address) => {
    return call(axiosInstance.post("/save_address", address));
  },

  updateAddress: async (addressId, updates) => {
    return call(
      axiosInstance.post("/update_address", {
        address_id: addressId,
        ...updates,
      }),
    );
  },

  deleteAddress: async (addressId) => {
    return call(
      axiosInstance.post("/delete_address", { address_id: addressId }),
    );
  },
};

export default ProfileService;
