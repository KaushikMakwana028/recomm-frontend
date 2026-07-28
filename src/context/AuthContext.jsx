import React, { createContext, useContext, useState, useEffect } from "react";
import AuthService from "../services/authService";
import ProfileService from "../services/profileService";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

/**
 * Reads user/token directly from localStorage using the SAME keys
 * apiService.js writes to ("token" as a raw string, "user" as JSON).
 * This avoids key/format mismatches with a separate storage helper.
 */
const loadStoredAuth = () => {
  const token = localStorage.getItem("token");
  let user = null;
  try {
    const rawUser = localStorage.getItem("user");
    user = rawUser ? JSON.parse(rawUser) : null;
  } catch (e) {
    user = null;
  }
  return { token, user };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user and token from localStorage on mount
  useEffect(() => {
    const { user: savedUser, token: savedToken } = loadStoredAuth();
    if (savedUser && savedToken) {
      setUser(savedUser);
      setToken(savedToken);
    }
    setLoading(false);
  }, []);

  // ===== LOGIN =====
  const loginSendOtp = async (mobile) => {
    return await AuthService.loginSendOtp(mobile);
  };

  const verifyLoginOtp = async (mobile, otp) => {
    const response = await AuthService.verifyLoginOtp(mobile, otp);
    // apiService already persisted token/user to localStorage on success
    if (response.success) {
      setUser(response.data.user);
      setToken(response.data.token);
    }
    return response;
  };

  // ===== REGISTER =====
  const registerSendOtp = async (data) => {
    return await AuthService.registerSendOtp(data);
  };

  const verifyRegisterOtp = async (mobile, otp) => {
    const response = await AuthService.verifyRegisterOtp(mobile, otp);
    if (response.success) {
      setUser(response.data.user);
      setToken(response.data.token);
    }
    return response;
  };

  // ===== LOGOUT =====
  const logout = async () => {
    try {
      const response = await AuthService.logout(); // apiService already clears localStorage
      setUser(null);
      setToken(null);
      return response;
    } catch (error) {
      // Clear local state anyway - user intent is to log out
      setUser(null);
      setToken(null);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      return {
        success: false,
        error: "Logout failed, but you have been signed out locally.",
      };
    }
  };

  // ===== PROFILE =====

  /**
   * Fetch the latest profile from the server (get_profile uses the JWT
   * to identify the user - no id needs to be passed).
   * Useful to refresh fields not returned by login/register, like address
   * or profile_image_url.
   */
  const fetchProfile = async () => {
    const response = await ProfileService.getProfile();
    if (response.success) {
      setUser(response.data);
      localStorage.setItem("user", JSON.stringify(response.data));
    }
    return response;
  };

  /**
   * updates: { name, email, mobile, address, profileImageFile }
   * Matches API.updateProfile's real signature - single object, no userId.
   */
  const updateProfile = async (updates) => {
    try {
      const response = await ProfileService.updateProfile(updates);
      // apiService already writes the updated user to localStorage on success
      if (response.success) {
        setUser(response.data);
        return { success: true, data: response.data };
      }
      return { success: false, error: response.error };
    } catch (error) {
      return { success: false, error: "Profile update failed." };
    }
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user && !!token,

    loginSendOtp,
    verifyLoginOtp,

    registerSendOtp,
    verifyRegisterOtp,

    logout,
    fetchProfile,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
