import { axiosInstance, call } from "../api/apiHelper";

const LegalService = {
  /**
   * Fetch legal page by slug (e.g. terms_conditions, privacy_policy, refund_policy)
   * @param {string} slug
   * @returns {Promise<{success: boolean, data: any, error: string|null}>}
   */
  getLegalPage: async (slug) => {
    // Normalize slug (replace hyphens with underscores, e.g. terms-conditions -> terms_conditions)
    const normalizedSlug = String(slug || "")
      .trim()
      .toLowerCase()
      .replace(/-/g, "_");
    return call(axiosInstance.get(`/legal_page/${normalizedSlug}`));
  },
};

export default LegalService;
