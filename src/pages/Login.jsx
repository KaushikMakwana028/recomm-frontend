import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  FaMobileAlt,
  FaLock,
  FaArrowRight,
  FaCheckCircle,
  FaRedo,
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loginSendOtp, verifyLoginOtp, isAuthenticated } = useAuth();

  // step: 'mobile' -> enter mobile, 'otp' -> enter OTP
  const [step, setStep] = useState("mobile");

  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [devOtp, setDevOtp] = useState(""); // dev/testing convenience only

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [focusedField, setFocusedField] = useState(null);

  const redirectTo = searchParams.get("redirect") || "/";

  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectTo);
    }
  }, [isAuthenticated, navigate, redirectTo]);

  const validateMobile = () => {
    const errs = {};
    if (!mobile.trim()) {
      errs.mobile = "Mobile number is required";
    } else if (!/^[0-9]{10}$/.test(mobile.trim())) {
      errs.mobile = "Enter a valid 10-digit mobile number";
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
    const validationErrors = validateMobile();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setServerError("");
    setLoading(true);
    try {
      const result = await loginSendOtp(mobile.trim());
      if (result.success) {
        setStep("otp");
        if (result.data?.dev_otp) setDevOtp(result.data.dev_otp);
      } else {
        setServerError(result.error || "Failed to send OTP. Please try again.");
      }
    } catch (error) {
      setServerError("An unexpected error occurred. Please try again.");
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
      const result = await verifyLoginOtp(mobile.trim(), otp.trim());
      if (result.success) {
        navigate(redirectTo);
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
      const result = await loginSendOtp(mobile.trim());
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

  const handleEditMobile = () => {
    setStep("mobile");
    setOtp("");
    setDevOtp("");
    setErrors({});
    setServerError("");
  };

  return (
    <div className="login-page min-vh-100 d-flex align-items-center py-5 position-relative overflow-hidden">
      {/* Animated Background */}
      <div
        className="position-absolute w-100 h-100 top-0 start-0"
        style={{
          background: "linear-gradient(135deg, #00204E 0%, #189031 100%)",
          zIndex: 0,
        }}
      >
        <div
          className="position-absolute rounded-circle"
          style={{
            width: "400px",
            height: "400px",
            background: "rgba(52, 161, 41, 0.1)",
            top: "-100px",
            right: "-100px",
            animation: "float 6s ease-in-out infinite",
          }}
        />
        <div
          className="position-absolute rounded-circle"
          style={{
            width: "300px",
            height: "300px",
            background: "rgba(255, 255, 255, 0.05)",
            bottom: "-50px",
            left: "-50px",
            animation: "float 8s ease-in-out infinite",
          }}
        />
      </div>

      <div className="container position-relative" style={{ zIndex: 1 }}>
        <div className="row justify-content-center">
          <div className="col-md-10 col-lg-8 col-xl-6">
            {/* Brand Header */}
            <div className="text-center mb-4 fade-in">
              <Link to="/" className="text-decoration-none">
                <h1 className="fw-bold mb-2" style={{ fontSize: "2.5rem" }}>
                  <span className="text-white">Recomm</span>
                  <span style={{ color: "#34A129" }}>Frontend</span>
                </h1>
              </Link>
              <p className="text-white-50 mb-0">
                Premium food & beverages delivered fresh to your door
              </p>
            </div>

            {/* Login Card */}
            <div
              className="card border-0 shadow-lg slide-in-left"
              style={{ borderRadius: "20px", overflow: "hidden" }}
            >
              <div
                className="text-white text-center py-4"
                style={{
                  background:
                    "linear-gradient(135deg, #00204E 0%, #34A129 100%)",
                }}
              >
                <h3 className="fw-bold mb-1">Welcome Back!</h3>
                <p className="mb-0 opacity-75 small">
                  {step === "mobile"
                    ? "Sign in with your mobile number"
                    : `Enter the OTP sent to ${mobile}`}
                </p>
              </div>

              <div className="card-body p-4 p-md-5">
                {serverError && (
                  <div
                    className="alert alert-danger border-0 d-flex align-items-center mb-4 slide-in-right"
                    style={{ borderRadius: "12px" }}
                    role="alert"
                  >
                    <i className="fas fa-exclamation-circle me-2"></i>
                    <span>{serverError}</span>
                  </div>
                )}

                {/* Dev OTP banner - remove in production */}
                {devOtp && step === "otp" && (
                  <div
                    className="alert border-0 mb-4 slide-in-left"
                    style={{
                      background:
                        "linear-gradient(135deg, #f0faf0 0%, #e8f5e9 100%)",
                      borderRadius: "12px",
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

                {/* STEP 1: Mobile Number */}
                {step === "mobile" && (
                  <form onSubmit={handleSendOtp} noValidate>
                    <div className="mb-4">
                      <label
                        htmlFor="mobile"
                        className="form-label fw-bold text-brand-blue small"
                      >
                        Mobile Number
                      </label>
                      <div
                        className={`input-group ${errors.mobile ? "is-invalid" : ""}`}
                        style={{
                          borderRadius: "12px",
                          overflow: "hidden",
                          transition: "all 0.3s ease",
                          boxShadow:
                            focusedField === "mobile"
                              ? "0 0 0 4px rgba(52, 161, 41, 0.1)"
                              : "none",
                        }}
                      >
                        <span
                          className="input-group-text bg-light border-0"
                          style={{ paddingLeft: "1rem" }}
                        >
                          <FaMobileAlt
                            className={
                              focusedField === "mobile"
                                ? "text-brand-green"
                                : "text-muted"
                            }
                          />
                        </span>
                        <input
                          type="tel"
                          className={`form-control border-0 bg-light ${errors.mobile ? "is-invalid" : ""}`}
                          id="mobile"
                          name="mobile"
                          placeholder="Enter your 10-digit mobile number"
                          value={mobile}
                          maxLength={10}
                          onChange={(e) => {
                            setMobile(e.target.value.replace(/\D/g, ""));
                            if (errors.mobile)
                              setErrors((p) => ({ ...p, mobile: "" }));
                            setServerError("");
                          }}
                          onFocus={() => setFocusedField("mobile")}
                          onBlur={() => setFocusedField(null)}
                          autoComplete="tel"
                          style={{ paddingRight: "1rem" }}
                        />
                      </div>
                      {errors.mobile && (
                        <div className="invalid-feedback d-block mt-2">
                          {errors.mobile}
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      className="btn btn-success w-100 btn-lg mb-4 shadow-sm"
                      disabled={loading}
                      style={{
                        borderRadius: "12px",
                        height: "56px",
                        fontWeight: "600",
                      }}
                    >
                      {loading ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                            aria-hidden="true"
                          />
                          Sending OTP...
                        </>
                      ) : (
                        <>
                          Send OTP
                          <FaArrowRight className="ms-2" />
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
                        className="form-label fw-bold text-brand-blue small"
                      >
                        Enter OTP
                      </label>
                      <div
                        className={`input-group ${errors.otp ? "is-invalid" : ""}`}
                        style={{
                          borderRadius: "12px",
                          overflow: "hidden",
                          transition: "all 0.3s ease",
                          boxShadow:
                            focusedField === "otp"
                              ? "0 0 0 4px rgba(52, 161, 41, 0.1)"
                              : "none",
                        }}
                      >
                        <span
                          className="input-group-text bg-light border-0"
                          style={{ paddingLeft: "1rem" }}
                        >
                          <FaLock
                            className={
                              focusedField === "otp"
                                ? "text-brand-green"
                                : "text-muted"
                            }
                          />
                        </span>
                        <input
                          type="text"
                          inputMode="numeric"
                          className={`form-control border-0 bg-light ${errors.otp ? "is-invalid" : ""}`}
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
                          onFocus={() => setFocusedField("otp")}
                          onBlur={() => setFocusedField(null)}
                          autoComplete="one-time-code"
                        />
                      </div>
                      {errors.otp && (
                        <div className="invalid-feedback d-block mt-2">
                          {errors.otp}
                        </div>
                      )}
                    </div>

                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <button
                        type="button"
                        className="btn btn-link p-0 text-brand-green text-decoration-none small fw-bold"
                        onClick={handleEditMobile}
                      >
                        Change number
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
                      className="btn btn-success w-100 btn-lg mb-4 shadow-sm"
                      disabled={loading}
                      style={{
                        borderRadius: "12px",
                        height: "56px",
                        fontWeight: "600",
                      }}
                    >
                      {loading ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                            aria-hidden="true"
                          />
                          Verifying...
                        </>
                      ) : (
                        <>
                          Verify & Sign In
                          <FaArrowRight className="ms-2" />
                        </>
                      )}
                    </button>
                  </form>
                )}

                <p className="text-center text-muted mb-0">
                  Don't have an account?{" "}
                  <Link
                    to="/signup"
                    className="text-brand-green text-decoration-none fw-bold"
                  >
                    Create Account
                  </Link>
                </p>
              </div>
            </div>

            {/* Guest Checkout Link */}
            <div className="text-center mt-4">
              <Link
                to="/products"
                className="text-white text-decoration-none d-inline-flex align-items-center gap-2"
                style={{ opacity: 0.9 }}
              >
                <small>Continue browsing as guest</small>
                <FaArrowRight size={12} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-20px); }
                }

                .form-control:focus,
                .form-check-input:focus {
                    box-shadow: none !important;
                }

                .btn-success:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 20px rgba(52, 161, 41, 0.3) !important;
                }
            `}</style>
    </div>
  );
};

export default Login;
