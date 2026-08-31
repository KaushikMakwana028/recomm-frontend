import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  FaEnvelope,
  FaLock,
  FaUser,
  FaMobileAlt,
  FaArrowRight,
  FaCheckCircle,
  FaRedo,
  FaExclamationCircle,
  FaChevronLeft,
  FaTruck,
  FaLeaf,
  FaShieldAlt,
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import logoDark from "../assets/recomm-logo-sidebar.png";

const PANEL_FEATURES = [
  {
    Icon: FaTruck,
    title: "Fast delivery",
    sub: "Fresh to your door, every time",
  },
  {
    Icon: FaLeaf,
    title: "Quality checked",
    sub: "Only the best food & beverages",
  },
  {
    Icon: FaShieldAlt,
    title: "Secure sign-up",
    sub: "OTP verified, no passwords to remember",
  },
];

const Signup = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { registerSendOtp, verifyRegisterOtp, isAuthenticated } = useAuth();
  const redirectTo = searchParams.get("redirect") || "/";

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
  const [focusedField, setFocusedField] = useState(null);
  const [resendTimer, setResendTimer] = useState(30);

  useEffect(() => {
    let interval = null;
    if (step === "otp" && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, resendTimer]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectTo);
    }
  }, [isAuthenticated, navigate, redirectTo]);

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
        setResendTimer(30);
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
    if (resendTimer > 0) return;
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
        setResendTimer(30);
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
    <div className="signup-page">
      <style>{`
        * { box-sizing: border-box; }

        .signup-page {
          --navy: #00204E;
          --navy-deep: #00152F;
          --green: #34A129;
          --green-deep: #278A1E;
          --green-light: #8FD986;
          min-height: 100vh;
          font-family: 'Poppins', sans-serif;
          background: #F5F8F5;
        }

        /* ================= Shared route-line signature ================= */
        .signup-route { position: absolute; inset: 0; pointer-events: none; opacity: 0.5; }
        .signup-route path {
          fill: none; stroke: rgba(255,255,255,0.35); stroke-width: 2;
          stroke-dasharray: 6 10; stroke-linecap: round;
          animation: signupDash 14s linear infinite;
        }
        @keyframes signupDash { to { stroke-dashoffset: -160; } }

        /* ================= Layout shell ================= */
        .signup-shell {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }
        @media (min-width: 992px) {
          .signup-shell { flex-direction: row; }
        }

        /* ---------- Left branded panel (desktop) ---------- */
        .signup-panel {
          display: none;
          position: relative;
          flex: 0 0 42%;
          background: linear-gradient(150deg, var(--navy) 0%, var(--navy-deep) 55%, var(--green-deep) 135%);
          color: #fff;
          padding: 3.25rem 3.25rem;
          flex-direction: column;
          justify-content: space-between;
          overflow: hidden;
        }
        @media (min-width: 992px) { .signup-panel { display: flex; } }

        .signup-panel::before, .signup-panel::after {
          content: "";
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
        }
        .signup-panel::before {
          width: 360px; height: 360px;
          background: radial-gradient(circle, rgba(52,161,41,0.30) 0%, rgba(52,161,41,0) 70%);
          top: -130px; right: -110px;
          animation: signupFloat 9s ease-in-out infinite;
        }
        .signup-panel::after {
          width: 280px; height: 280px;
          background: radial-gradient(circle, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 70%);
          bottom: -90px; left: -70px;
          animation: signupFloat 11s ease-in-out infinite reverse;
        }
        @keyframes signupFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-22px); }
        }

        .signup-panel-logo { position: relative; z-index: 1; }
        .signup-panel-logo img { height: 40px; width: auto; object-fit: contain; }

        .signup-panel-copy { position: relative; z-index: 1; }
        .signup-panel-title { font-size: 2.1rem; font-weight: 800; line-height: 1.28; margin: 0 0 0.85rem; letter-spacing: -0.01em; }
        .signup-panel-title span { color: var(--green-light); }
        .signup-panel-sub { color: rgba(255,255,255,0.62); font-size: 0.95rem; line-height: 1.65; margin-bottom: 2.6rem; max-width: 370px; }

        .signup-feature-row { display: flex; align-items: center; gap: 0.9rem; margin-bottom: 1.35rem; }
        .signup-feature-icon {
          width: 42px; height: 42px; border-radius: 12px; flex-shrink: 0;
          background: rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center;
          color: var(--green-light);
        }
        .signup-feature-title { font-weight: 700; font-size: 0.9rem; margin: 0 0 0.15rem; color: #fff; }
        .signup-feature-sub { font-size: 0.78rem; color: rgba(255,255,255,0.55); margin: 0; }

        .signup-panel-foot { position: relative; z-index: 1; font-size: 0.75rem; color: rgba(255,255,255,0.4); }

        /* ---------- Right form column ---------- */
        .signup-form-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem 0.5rem 2.5rem;
        }
        @media (min-width: 576px) {
          .signup-form-panel { padding: 2rem 1.25rem 2.5rem; }
        }
        .signup-form-inner { width: 100%; max-width: 460px; }

        /* ---------- Mobile hero header ---------- */
        .signup-mobile-hero {
          position: relative;
          background: linear-gradient(135deg, var(--navy) 0%, var(--navy-deep) 55%, var(--green-deep) 145%);
          padding: 2.4rem 1.5rem 4.5rem;
          text-align: center;
          overflow: hidden;
        }
        .signup-mobile-hero::before {
          content: "";
          position: absolute;
          width: 220px; height: 220px;
          background: radial-gradient(circle, rgba(52,161,41,0.35) 0%, rgba(52,161,41,0) 70%);
          top: -80px; right: -60px;
          border-radius: 50%;
        }
        .signup-mobile-hero-logo { position: relative; z-index: 1; }
        .signup-mobile-hero-logo img {
          height: 34px; width: auto; object-fit: contain;
          filter: brightness(0) invert(1);
        }
        .signup-mobile-hero-title {
          position: relative; z-index: 1;
          color: #fff; font-weight: 800; font-size: 1.3rem; margin: 0.9rem 0 0.4rem;
          letter-spacing: -0.01em;
        }
        .signup-mobile-hero-sub {
          position: relative; z-index: 1;
          color: rgba(255,255,255,0.62); font-size: 0.82rem; margin: 0;
          max-width: 290px; margin-inline: auto; line-height: 1.5;
        }
        @media (min-width: 992px) { .signup-mobile-hero { display: none; } }

        .signup-form-body {
          padding: 0 0.5rem 2rem;
          margin-top: -3.25rem;
          position: relative;
          z-index: 2;
        }
        @media (min-width: 576px) {
          .signup-form-body { padding: 0 1.1rem 2rem; }
        }
        @media (min-width: 992px) {
          .signup-form-body { margin-top: 0; padding: 0; }
        }

        /* ---------- Card ---------- */
        .signup-card {
          background: #fff;
          border-radius: 22px;
          box-shadow: 0 20px 45px rgba(0,32,78,0.14), 0 2px 8px rgba(0,32,78,0.06);
          overflow: hidden;
          animation: signupCardRise 0.5s ease both;
        }
        @keyframes signupCardRise {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .signup-card-head { padding: 1.5rem 1rem 1.1rem; text-align: center; }
        .signup-card-title { color: var(--navy); font-weight: 800; font-size: 1.4rem; margin: 0 0 0.35rem; letter-spacing: -0.01em; }
        .signup-card-sub { color: #64748b; font-size: 0.86rem; margin: 0; line-height: 1.5; }
        .signup-card-body { padding: 0.4rem 1rem 2rem; }
        @media (min-width: 576px) {
          .signup-card-head { padding: 1.75rem 1.75rem 1.1rem; }
          .signup-card-body { padding: 0.4rem 1.75rem 2rem; }
        }

        .signup-back-row {
          display: flex; align-items: center; gap: 0.4rem;
          color: #94a3b8; font-size: 0.78rem; font-weight: 600;
          background: none; border: none; padding: 0; cursor: pointer;
          margin-bottom: 0.6rem;
        }
        .signup-back-row:hover { color: var(--green-deep); }

        .signup-alert {
          display: flex; align-items: flex-start; gap: 0.6rem;
          border-radius: 12px; padding: 0.75rem 0.9rem;
          font-size: 0.83rem; margin-bottom: 1.15rem;
          animation: signupAlertSlide 0.25s ease both;
        }
        @keyframes signupAlertSlide { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        .signup-alert-error { background: #fef2f2; color: #b91c1c; }
        .signup-alert-dev {
          background: linear-gradient(135deg, #f0faf0 0%, #e8f5e9 100%);
          border-left: 3px solid var(--green);
          color: var(--navy);
          flex-direction: column;
          align-items: flex-start;
        }
        .signup-alert-dev-title { display: flex; align-items: center; gap: 0.4rem; font-weight: 700; margin-bottom: 0.2rem; }
        .signup-alert-dev small { color: #64748b; }

        .signup-field-group { margin-bottom: 1.15rem; }
        .signup-field-label { display: block; font-weight: 700; color: var(--navy); font-size: 0.8rem; margin-bottom: 0.55rem; }

        .signup-input-shell {
          display: flex; align-items: center; gap: 0.65rem;
          background: #f8fafc; border: 1.5px solid #eef2f6; border-radius: 13px;
          padding: 0 1.05rem; transition: all 0.18s ease;
        }
        .signup-input-shell.is-focused { border-color: var(--green); box-shadow: 0 0 0 4px rgba(52,161,41,0.12); background: #fff; }
        .signup-input-shell.has-error { border-color: #ef4444; }
        .signup-input-shell svg { color: #94a3b8; flex-shrink: 0; transition: color 0.18s ease; }
        .signup-input-shell.is-focused svg { color: var(--green); }
        .signup-input-shell input {
          flex: 1; border: none; outline: none; background: transparent;
          padding: 1rem 0; font-size: 1rem; color: var(--navy);
          font-family: 'Poppins', sans-serif; min-width: 0;
        }
        .signup-input-shell input::placeholder { color: #b0bac5; font-size: 0.9rem; }

        .signup-field-error {
          display: flex; align-items: center; gap: 0.35rem;
          color: #ef4444; font-size: 0.78rem; margin-top: 0.55rem;
        }

        .signup-submit-btn {
          width: 100%;
          background: linear-gradient(135deg, var(--green) 0%, var(--green-deep) 100%);
          color: #fff; border: none;
          border-radius: 13px; padding: 1.02rem; font-weight: 700; font-size: 0.96rem;
          display: flex; align-items: center; justify-content: center; gap: 0.55rem;
          cursor: pointer; transition: filter 0.18s ease, transform 0.15s ease, box-shadow 0.18s ease;
          margin-top: 0.4rem; margin-bottom: 1.35rem;
          box-shadow: 0 8px 20px rgba(52,161,41,0.28);
        }
        .signup-submit-btn:hover:not(:disabled) { filter: brightness(1.06); transform: translateY(-1px); box-shadow: 0 10px 24px rgba(52,161,41,0.34); }
        .signup-submit-btn:active:not(:disabled) { transform: translateY(0); }
        .signup-submit-btn:disabled { opacity: 0.7; cursor: not-allowed; box-shadow: none; }

        .signup-spinner {
          width: 16px; height: 16px; border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.4); border-top-color: #fff;
          animation: signupSpin 0.7s linear infinite;
        }
        @keyframes signupSpin { to { transform: rotate(360deg); } }

        .signup-footnote { text-align: center; color: #64748b; font-size: 0.85rem; margin: 0; }
        .signup-footnote a { color: var(--green-deep); font-weight: 700; text-decoration: none; }
        .signup-footnote a:hover { text-decoration: underline; }

        .signup-otp-actions-row {
          display: flex; align-items: center; justify-content: space-between;
          margin-top: -0.4rem;
          margin-bottom: 1.3rem;
        }
        .signup-otp-link-btn {
          background: none; border: none; padding: 0; cursor: pointer;
          color: var(--green-deep); font-weight: 700; font-size: 0.82rem;
          display: inline-flex; align-items: center; gap: 0.35rem;
        }
        .signup-otp-link-btn:hover:not(:disabled) { text-decoration: underline; }
        .signup-otp-link-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        /* focus visibility for a11y — inputs already show their own focus ring above */
        button:focus-visible, a:focus-visible {
          outline: 2px solid var(--green); outline-offset: 2px;
        }
      `}</style>

      <div className="signup-shell">
        {/* Desktop branded panel */}
        <div className="signup-panel">
          <svg className="signup-route" viewBox="0 0 400 700">
            <path d="M -20 560 C 100 500, 140 420, 90 340 S 40 180, 180 120 S 340 60, 380 -10" />
          </svg>

          <div className="signup-panel-logo">
            <img
              src={logoDark}
              alt="Recomm Logo"
              style={{ filter: "brightness(0) invert(1)" }}
              onError={(e) => {
                e.target.style.filter = "none";
              }}
            />
          </div>

          <div className="signup-panel-copy">
            <h2 className="signup-panel-title">
              Join thousands of <span>happy customers</span>.
            </h2>
            <p className="signup-panel-sub">
              Create your account in seconds — just your name, mobile number,
              and email. We'll verify you with a one-time code, no password
              needed.
            </p>

            {PANEL_FEATURES.map(({ Icon, title, sub }) => (
              <div key={title} className="signup-feature-row">
                <span className="signup-feature-icon">
                  <Icon size={17} />
                </span>
                <div>
                  <p className="signup-feature-title">{title}</p>
                  <p className="signup-feature-sub">{sub}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="signup-panel-foot">
            © {new Date().getFullYear()} Recomm-Frontend. All rights reserved.
          </div>
        </div>

        {/* Mobile hero */}
        <div className="signup-mobile-hero">
          <svg className="signup-route" viewBox="0 0 400 220">
            <path d="M -20 40 C 80 10, 140 70, 220 40 S 340 10, 420 50" />
          </svg>
          <div className="signup-mobile-hero-logo">
            <img src={logoDark} alt="Recomm Logo" />
          </div>
          <h1 className="signup-mobile-hero-title">Create account</h1>
          <p className="signup-mobile-hero-sub">
            Join thousands of happy customers ordering fresh food & beverages
          </p>
        </div>

        {/* Form column */}
        <div className="signup-form-panel">
          <div className="signup-form-inner">
            <div className="signup-form-body">
              <div className="signup-card">
                <div className="signup-card-head">
                  <h3 className="signup-card-title">
                    {step === "details"
                      ? "Create account"
                      : "Verify your number"}
                  </h3>
                  <p className="signup-card-sub">
                    {step === "details"
                      ? "Start your delicious journey today"
                      : `We sent a 6-digit code to +91 ${formData.mobile}`}
                  </p>
                </div>

                <div className="signup-card-body">
                  {step === "otp" && (
                    <button
                      type="button"
                      className="signup-back-row"
                      onClick={handleEditDetails}
                    >
                      <FaChevronLeft size={10} />
                      Edit details
                    </button>
                  )}

                  {serverError && (
                    <div className="signup-alert signup-alert-error">
                      <FaExclamationCircle
                        style={{ marginTop: 2, flexShrink: 0 }}
                      />
                      <span>{serverError}</span>
                    </div>
                  )}

                  {devOtp && step === "otp" && (
                    <div className="signup-alert signup-alert-dev">
                      <div className="signup-alert-dev-title">
                        <FaCheckCircle color="#34A129" />
                        Dev Mode OTP
                      </div>
                      <small>
                        Your OTP is: <strong>{devOtp}</strong>
                      </small>
                    </div>
                  )}

                  {/* STEP 1: Name / Mobile / Email */}
                  {step === "details" && (
                    <form onSubmit={handleSendOtp} noValidate>
                      <div className="signup-field-group">
                        <label htmlFor="name" className="signup-field-label">
                          Full Name
                        </label>
                        <div
                          className={`signup-input-shell ${focusedField === "name" ? "is-focused" : ""} ${errors.name ? "has-error" : ""}`}
                        >
                          <FaUser size={15} />
                          <input
                            type="text"
                            id="name"
                            name="name"
                            placeholder="Enter your full name"
                            value={formData.name}
                            onChange={handleChange}
                            onFocus={() => setFocusedField("name")}
                            onBlur={() => setFocusedField(null)}
                            autoComplete="name"
                          />
                        </div>
                        {errors.name && (
                          <div className="signup-field-error">
                            <FaExclamationCircle size={11} />
                            {errors.name}
                          </div>
                        )}
                      </div>

                      <div className="signup-field-group">
                        <label htmlFor="mobile" className="signup-field-label">
                          Mobile Number
                        </label>
                        <div
                          className={`signup-input-shell ${focusedField === "mobile" ? "is-focused" : ""} ${errors.mobile ? "has-error" : ""}`}
                        >
                          <FaMobileAlt size={15} />
                          <input
                            type="tel"
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
                            onFocus={() => setFocusedField("mobile")}
                            onBlur={() => setFocusedField(null)}
                            autoComplete="tel"
                          />
                        </div>
                        {errors.mobile && (
                          <div className="signup-field-error">
                            <FaExclamationCircle size={11} />
                            {errors.mobile}
                          </div>
                        )}
                      </div>

                      <div className="signup-field-group">
                        <label htmlFor="email" className="signup-field-label">
                          Email Address
                        </label>
                        <div
                          className={`signup-input-shell ${focusedField === "email" ? "is-focused" : ""} ${errors.email ? "has-error" : ""}`}
                        >
                          <FaEnvelope size={15} />
                          <input
                            type="email"
                            id="email"
                            name="email"
                            placeholder="Enter your email"
                            value={formData.email}
                            onChange={handleChange}
                            onFocus={() => setFocusedField("email")}
                            onBlur={() => setFocusedField(null)}
                            autoComplete="email"
                          />
                        </div>
                        {errors.email && (
                          <div className="signup-field-error">
                            <FaExclamationCircle size={11} />
                            {errors.email}
                          </div>
                        )}
                      </div>

                      <button
                        type="submit"
                        className="signup-submit-btn"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <span className="signup-spinner" />
                            Sending OTP...
                          </>
                        ) : (
                          <>
                            Send OTP
                            <FaArrowRight size={13} />
                          </>
                        )}
                      </button>
                    </form>
                  )}

                  {/* STEP 2: OTP Verification */}
                  {step === "otp" && (
                    <form onSubmit={handleVerifyOtp} noValidate>
                      <div className="signup-field-group">
                        <label htmlFor="otp" className="signup-field-label">
                          Enter OTP
                        </label>
                        <div
                          className={`signup-input-shell ${focusedField === "otp" ? "is-focused" : ""} ${errors.otp ? "has-error" : ""}`}
                        >
                          <FaLock size={15} />
                          <input
                            type="text"
                            inputMode="numeric"
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
                            autoFocus
                          />
                        </div>
                        {errors.otp && (
                          <div className="signup-field-error">
                            <FaExclamationCircle size={11} />
                            {errors.otp}
                          </div>
                        )}
                      </div>

                      <div className="signup-otp-actions-row">
                        <span style={{ fontSize: "0.78rem", color: "#94a3b8" }}>
                          Didn't get a code?
                        </span>
                        <button
                          type="button"
                          className="signup-otp-link-btn"
                          onClick={handleResendOtp}
                          disabled={loading || resendTimer > 0}
                        >
                          <FaRedo size={11} />
                          {resendTimer > 0 ? `Resend OTP (${resendTimer}s)` : "Resend OTP"}
                        </button>
                      </div>

                      <button
                        type="submit"
                        className="signup-submit-btn"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <span className="signup-spinner" />
                            Verifying...
                          </>
                        ) : (
                          <>
                            Verify &amp; Create Account
                            <FaArrowRight size={13} />
                          </>
                        )}
                      </button>
                    </form>
                  )}

                  <p className="signup-footnote">
                    Already have an account? <Link to={`/login?redirect=${encodeURIComponent(redirectTo)}`}>Sign In</Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
