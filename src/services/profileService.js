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
};

export default ProfileService;
