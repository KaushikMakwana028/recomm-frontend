import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaEnvelope,
  FaLock,
  FaUser,
  FaMobileAlt,
  FaArrowRight,
  FaCheckCircle,
  FaRedo,
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";

const Signup = () => {
  const navigate = useNavigate();
  const { registerSendOtp, verifyRegisterOtp, isAuthenticated } = useAuth();

  // step: 'details' -> name/mobile/email, 'otp' -> enter OTP
  const [step, setStep] = useState("details");

  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    email: "",
  });
  const [otp, setOtp] = useState("");
  const [devOtp, setDevOtp] = useState(""); // dev/testing convenience only

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    setServerError("");
  };

  const validateDetails = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = "Name is required";

    if (!formData.mobile.trim()) {
      errs.mobile = "Mobile number is required";
    } else if (!/^[0-9]{10}$/.test(formData.mobile.trim())) {
      errs.mobile = "Enter a valid 10-digit mobile number";
    }

    if (!formData.email.trim()) {
      errs.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = "Enter a valid email address";
    }

    return errs;
  };

  const validateOtp = () => {
    const errs = {};
    if (!otp.trim()) {
      errs.otp = "OTP is required";
    } else if (!/^[0-9]{6}$/.test(otp.trim())) {
      errs.otp = "Enter the 6-digit OTP";
    }
    return errs;
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    const validationErrors = validateDetails();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setServerError("");
    setLoading(true);
    try {
      const result = await registerSendOtp({
        name: formData.name.trim(),
        mobile: formData.mobile.trim(),
        email: formData.email.trim(),
      });

      if (result.success) {
        setStep("otp");
        if (result.data?.dev_otp) setDevOtp(result.data.dev_otp);
      } else {
        setServerError(result.error || "Failed to send OTP. Please try again.");
      }
    } catch (error) {
      console.log("Signup Error:", error);
      console.log("Response:", error.response);
      console.log("Data:", error.response?.data);

      setServerError(
        error.response?.data?.message ||
          error.message ||
          "An unexpected error occurred.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const validationErrors = validateOtp();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setServerError("");
    setLoading(true);
    try {
      const result = await verifyRegisterOtp(
        formData.mobile.trim(),
        otp.trim(),
      );
      if (result.success) {
        navigate("/");
      } else {
        setServerError(result.error || "Invalid OTP. Please try again.");
      }
    } catch (error) {
      setServerError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setServerError("");
    setOtp("");
    setLoading(true);
    try {
      const result = await registerSendOtp({
        name: formData.name.trim(),
        mobile: formData.mobile.trim(),
        email: formData.email.trim(),
      });
      if (result.success) {
        if (result.data?.dev_otp) setDevOtp(result.data.dev_otp);
      } else {
        setServerError(result.error || "Failed to resend OTP.");
      }
    } catch (error) {
      setServerError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditDetails = () => {
    setStep("details");
    setOtp("");
    setDevOtp("");
    setErrors({});
    setServerError("");
  };

  return (
    <div
      className="signup-page min-vh-100 d-flex align-items-center py-5"
      style={{
        background: "linear-gradient(135deg, #00204E 0%, #189031 100%)",
      }}
    >
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-9 col-lg-7">
            {/* Brand */}
            <div className="text-center mb-4">
              <Link to="/" className="text-decoration-none">
                <h2 className="fw-bold">
                  <span className="text-white">Recomm</span>
                  <span style={{ color: "#34A129" }}>Frontend</span>
                </h2>
              </Link>
              <p className="text-white-50">Join thousands of happy customers</p>
            </div>

            {/* Signup Card */}
            <div className="card border-0 shadow-lg">
              <div className="card-body p-4 p-md-5">
                <h3 className="text-brand-blue fw-bold text-center mb-2">
                  Create Account
                </h3>
                <p className="text-muted text-center mb-4">
                  {step === "details"
                    ? "Start your delicious journey today!"
                    : `Enter the OTP sent to ${formData.mobile}`}
                </p>

                {/* Server Error */}
                {serverError && (
                  <div className="alert alert-danger" role="alert">
                    {serverError}
                  </div>
                )}

                {/* Dev OTP banner - remove in production */}
                {devOtp && step === "otp" && (
                  <div
                    className="alert border-0 mb-3"
                    style={{
                      background:
                        "linear-gradient(135deg, #f0faf0 0%, #e8f5e9 100%)",
                      borderLeft: "4px solid #34A129",
                    }}
                  >
                    <div className="fw-bold text-brand-blue mb-1">
                      <FaCheckCircle className="text-brand-green me-2" />
                      Dev Mode OTP
                    </div>
                    <small className="text-muted">
                      Your OTP is: <strong>{devOtp}</strong>
                    </small>
                  </div>
                )}

                {/* STEP 1: Name / Mobile / Email */}
                {step === "details" && (
                  <form onSubmit={handleSendOtp} noValidate>
                    {/* Name Field */}
                    <div className="mb-3">
                      <label
                        htmlFor="name"
                        className="form-label fw-bold text-brand-blue"
                      >
                        Full Name
                      </label>
                      <div className="input-group">
                        <span className="input-group-text bg-light border-end-0">
                          <FaUser className="text-brand-green" />
                        </span>
                        <input
                          type="text"
                          className={`form-control border-start-0 ${errors.name ? "is-invalid" : ""}`}
                          id="name"
                          name="name"
                          placeholder="Enter your full name"
                          value={formData.name}
                          onChange={handleChange}
                        />
                        {errors.name && (
                          <div className="invalid-feedback">{errors.name}</div>
                        )}
                      </div>
                    </div>

                    {/* Mobile Field */}
                    <div className="mb-3">
                      <label
                        htmlFor="mobile"
                        className="form-label fw-bold text-brand-blue"
                      >
                        Mobile Number
                      </label>
                      <div className="input-group">
                        <span className="input-group-text bg-light border-end-0">
                          <FaMobileAlt className="text-brand-green" />
                        </span>
                        <input
                          type="tel"
                          className={`form-control border-start-0 ${errors.mobile ? "is-invalid" : ""}`}
                          id="mobile"
                          name="mobile"
                          placeholder="Enter your 10-digit mobile number"
                          value={formData.mobile}
                          maxLength={10}
                          onChange={(e) => {
                            const digits = e.target.value.replace(/\D/g, "");
                            setFormData((prev) => ({
                              ...prev,
                              mobile: digits,
                            }));
                            if (errors.mobile)
                              setErrors((p) => ({ ...p, mobile: "" }));
                            setServerError("");
                          }}
                        />
                        {errors.mobile && (
                          <div className="invalid-feedback">
                            {errors.mobile}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Email Field */}
                    <div className="mb-4">
                      <label
                        htmlFor="email"
                        className="form-label fw-bold text-brand-blue"
                      >
                        Email Address
                      </label>
                      <div className="input-group">
                        <span className="input-group-text bg-light border-end-0">
                          <FaEnvelope className="text-brand-green" />
                        </span>
                        <input
                          type="email"
                          className={`form-control border-start-0 ${errors.email ? "is-invalid" : ""}`}
                          id="email"
                          name="email"
                          placeholder="Enter your email"
                          value={formData.email}
                          onChange={handleChange}
                          autoComplete="email"
                        />
                        {errors.email && (
                          <div className="invalid-feedback">{errors.email}</div>
                        )}
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      className="btn btn-success w-100 btn-lg mb-3"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          Sending OTP...
                        </>
                      ) : (
                        <>
                          Send OTP <FaArrowRight className="ms-2" />
                        </>
                      )}
                    </button>
                  </form>
                )}

                {/* STEP 2: OTP Verification */}
                {step === "otp" && (
                  <form onSubmit={handleVerifyOtp} noValidate>
                    <div className="mb-2">
                      <label
                        htmlFor="otp"
                        className="form-label fw-bold text-brand-blue"
                      >
                        Enter OTP
                      </label>
                      <div className="input-group">
                        <span className="input-group-text bg-light border-end-0">
                          <FaLock className="text-brand-green" />
                        </span>
                        <input
                          type="text"
                          inputMode="numeric"
                          className={`form-control border-start-0 ${errors.otp ? "is-invalid" : ""}`}
                          id="otp"
                          name="otp"
                          placeholder="Enter 6-digit OTP"
                          value={otp}
                          maxLength={6}
                          onChange={(e) => {
                            setOtp(e.target.value.replace(/\D/g, ""));
                            if (errors.otp)
                              setErrors((p) => ({ ...p, otp: "" }));
                            setServerError("");
                          }}
                          autoComplete="one-time-code"
                        />
                        {errors.otp && (
                          <div className="invalid-feedback">{errors.otp}</div>
                        )}
                      </div>
                    </div>

                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <button
                        type="button"
                        className="btn btn-link p-0 text-brand-green text-decoration-none small fw-bold"
                        onClick={handleEditDetails}
                      >
                        Edit details
                      </button>
                      <button
                        type="button"
                        className="btn btn-link p-0 text-brand-green text-decoration-none small fw-bold d-inline-flex align-items-center gap-1"
                        onClick={handleResendOtp}
                        disabled={loading}
                      >
                        <FaRedo size={12} />
                        Resend OTP
                      </button>
                    </div>

                    <button
                      type="submit"
                      className="btn btn-success w-100 btn-lg mb-3"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          Verify & Create Account{" "}
                          <FaArrowRight className="ms-2" />
                        </>
                      )}
                    </button>
                  </form>
                )}

                {/* Login Link */}
                <p className="text-center text-muted mb-0">
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    className="text-brand-green text-decoration-none fw-bold"
                  >
                    Sign In
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
