import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  FaMobileAlt,
  FaArrowRight,
  FaCheckCircle,
  FaRedo,
  FaTruck,
  FaLeaf,
  FaShieldAlt,
  FaExclamationCircle,
  FaChevronLeft,
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import logoDark from "../assets/recomm-logo-sidebar.png";

const NAVY = "#00204E";
const NAVY_DEEP = "#00152F";
const GREEN = "#34A129";
const GREEN_DEEP = "#278A1E";
const GREEN_LIGHT = "#8FD986";

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
    title: "Secure sign-in",
    sub: "OTP login, no passwords to remember",
  },
];

const OTP_LENGTH = 6;

const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loginSendOtp, verifyLoginOtp, isAuthenticated } = useAuth();

  // step: 'mobile' -> enter mobile, 'otp' -> enter OTP
  const [step, setStep] = useState("mobile");

  const [mobile, setMobile] = useState("");
  const [otpDigits, setOtpDigits] = useState(Array(OTP_LENGTH).fill(""));
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

  const otpRefs = useRef([]);
  const redirectTo = searchParams.get("redirect") || "/";
  const otp = otpDigits.join("");

  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectTo);
    }
  }, [isAuthenticated, navigate, redirectTo]);

  useEffect(() => {
    if (step === "otp") {
      setTimeout(() => otpRefs.current[0]?.focus(), 50);
    }
  }, [step]);

  const validateMobile = () => {
    const errs = {};
    if (!mobile.trim()) {
      errs.mobile = "Mobile number is required";
    } else if (!/^[0-9]{10}$/.test(mobile.trim())) {
      errs.mobile = "Enter a valid 10-digit mobile number";
    }
    return errs;
  };

  const validateOtp = (otpValue) => {
    const target = otpValue !== undefined ? otpValue : otp;
    const errs = {};
    if (!target.trim()) {
      errs.otp = "OTP is required";
    } else if (!/^[0-9]{6}$/.test(target.trim())) {
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
        setResendTimer(30);
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

  const handleVerifyOtp = async (e, otpValue) => {
    if (e) e.preventDefault();
    const finalOtp = otpValue !== undefined ? otpValue : otp;
    const validationErrors = validateOtp(finalOtp);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setServerError("");
    setLoading(true);
    try {
      const result = await verifyLoginOtp(mobile.trim(), finalOtp.trim());
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
    setOtpDigits(Array(OTP_LENGTH).fill(""));
    setLoading(true);
    try {
      const result = await loginSendOtp(mobile.trim());
      if (result.success) {
        setResendTimer(30);
        if (result.data?.dev_otp) setDevOtp(result.data.dev_otp);
        otpRefs.current[0]?.focus();
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
    setOtpDigits(Array(OTP_LENGTH).fill(""));
    setDevOtp("");
    setErrors({});
    setServerError("");
  };

  // ---- OTP box handlers ----
  const handleOtpChange = (index, value) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...otpDigits];
    next[index] = digit;
    setOtpDigits(next);
    if (errors.otp) setErrors((p) => ({ ...p, otp: "" }));
    setServerError("");

    if (digit && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }

    // auto-submit once all digits filled
    const joined = next.join("");
    if (joined.length === OTP_LENGTH && !next.includes("")) {
      setTimeout(() => handleVerifyOtp(null, joined), 120);
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = Array(OTP_LENGTH).fill("");
    pasted.split("").forEach((ch, i) => {
      next[i] = ch;
    });
    setOtpDigits(next);
    const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    otpRefs.current[focusIndex]?.focus();
    if (pasted.length === OTP_LENGTH) {
      setTimeout(() => handleVerifyOtp(null, pasted), 120);
    }
  };

  return (
    <div className="login-page">
      <style>{`
        * { box-sizing: border-box; }

        .login-page {
          min-height: 100vh;
          font-family: 'Poppins', sans-serif;
          background: #F5F8F5;
        }

        /* ================= Shared route-line signature (dashed path + truck marker) ================= */
        .route-signature { position: absolute; inset: 0; pointer-events: none; opacity: 0.5; }
        .route-signature path {
          fill: none; stroke: rgba(255,255,255,0.35); stroke-width: 2;
          stroke-dasharray: 6 10; stroke-linecap: round;
          animation: dashTravel 14s linear infinite;
        }
        @keyframes dashTravel { to { stroke-dashoffset: -160; } }

        /* ================= Layout shell ================= */
        .login-shell {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }
        @media (min-width: 992px) {
          .login-shell { flex-direction: row; }
        }

        /* ---------- Left branded panel (desktop) ---------- */
        .login-panel {
          display: none;
          position: relative;
          flex: 0 0 42%;
          background: linear-gradient(150deg, ${NAVY} 0%, ${NAVY_DEEP} 55%, ${GREEN_DEEP} 135%);
          color: #fff;
          padding: 3.25rem 3.25rem;
          flex-direction: column;
          justify-content: space-between;
          overflow: hidden;
        }
        @media (min-width: 992px) { .login-panel { display: flex; } }

        .login-panel::before, .login-panel::after {
          content: "";
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
        }
        .login-panel::before {
          width: 360px; height: 360px;
          background: radial-gradient(circle, rgba(52,161,41,0.30) 0%, rgba(52,161,41,0) 70%);
          top: -130px; right: -110px;
          animation: floatSlow 9s ease-in-out infinite;
        }
        .login-panel::after {
          width: 280px; height: 280px;
          background: radial-gradient(circle, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 70%);
          bottom: -90px; left: -70px;
          animation: floatSlow 11s ease-in-out infinite reverse;
        }
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-22px); }
        }

        .login-panel-logo { position: relative; z-index: 1; }
        .login-panel-logo img { height: 40px; width: auto; object-fit: contain; }

        .login-panel-copy { position: relative; z-index: 1; }
        .login-panel-title { font-size: 2.1rem; font-weight: 800; line-height: 1.28; margin: 0 0 0.85rem; letter-spacing: -0.01em; }
        .login-panel-title span { color: ${GREEN_LIGHT}; }
        .login-panel-sub { color: rgba(255,255,255,0.62); font-size: 0.95rem; line-height: 1.65; margin-bottom: 2.6rem; max-width: 370px; }

        .login-feature-row { display: flex; align-items: center; gap: 0.9rem; margin-bottom: 1.35rem; }
        .login-feature-icon {
          width: 42px; height: 42px; border-radius: 12px; flex-shrink: 0;
          background: rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center;
          color: ${GREEN_LIGHT};
        }
        .login-feature-title { font-weight: 700; font-size: 0.9rem; margin: 0 0 0.15rem; color: #fff; }
        .login-feature-sub { font-size: 0.78rem; color: rgba(255,255,255,0.55); margin: 0; }

        .login-panel-foot { position: relative; z-index: 1; font-size: 0.75rem; color: rgba(255,255,255,0.4); }

        /* ---------- Right form column ---------- */
        .login-form-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem 0.5rem 2.5rem;
        }
        @media (min-width: 576px) {
          .login-form-panel { padding: 2rem 1.25rem 2.5rem; }
        }
        .login-form-inner { width: 100%; max-width: 420px; }

        /* ---------- Mobile hero header (replaces empty top space) ---------- */
        .login-mobile-hero {
          position: relative;
          background: linear-gradient(135deg, ${NAVY} 0%, ${NAVY_DEEP} 55%, ${GREEN_DEEP} 145%);
          padding: 2.4rem 1.5rem 4.5rem;
          text-align: center;
          overflow: hidden;
        }
        .login-mobile-hero::before {
          content: "";
          position: absolute;
          width: 220px; height: 220px;
          background: radial-gradient(circle, rgba(52,161,41,0.35) 0%, rgba(52,161,41,0) 70%);
          top: -80px; right: -60px;
          border-radius: 50%;
        }
        .login-mobile-hero-logo { position: relative; z-index: 1; }
        .login-mobile-hero-logo img {
          height: 34px; width: auto; object-fit: contain;
          filter: brightness(0) invert(1);
        }
        .login-mobile-hero-title {
          position: relative; z-index: 1;
          color: #fff; font-weight: 800; font-size: 1.3rem; margin: 0.9rem 0 0.4rem;
          letter-spacing: -0.01em;
        }
        .login-mobile-hero-sub {
          position: relative; z-index: 1;
          color: rgba(255,255,255,0.62); font-size: 0.82rem; margin: 0;
          max-width: 280px; margin-inline: auto; line-height: 1.5;
        }
        @media (min-width: 992px) { .login-mobile-hero { display: none; } }

        .login-form-body {
          padding: 0 0.5rem 2rem;
          margin-top: -3.25rem;
          position: relative;
          z-index: 2;
        }
        @media (min-width: 576px) {
          .login-form-body { padding: 0 1.1rem 2rem; }
        }
        @media (min-width: 992px) {
          .login-form-body { margin-top: 0; padding: 0; }
        }

        /* ---------- Card ---------- */
        .login-card {
          background: #fff;
          border-radius: 22px;
          box-shadow: 0 20px 45px rgba(0,32,78,0.14), 0 2px 8px rgba(0,32,78,0.06);
          overflow: hidden;
          animation: cardRise 0.5s ease both;
        }
        @keyframes cardRise {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .login-card-head { padding: 1.5rem 1rem 1.1rem; text-align: center; }
        .login-card-title { color: ${NAVY}; font-weight: 800; font-size: 1.4rem; margin: 0 0 0.35rem; letter-spacing: -0.01em; }
        .login-card-sub { color: #64748b; font-size: 0.86rem; margin: 0; line-height: 1.5; }
        .login-card-body { padding: 0.4rem 1rem 2rem; }
        @media (min-width: 576px) {
          .login-card-head { padding: 1.75rem 1.75rem 1.1rem; }
          .login-card-body { padding: 0.4rem 1.75rem 2rem; }
        }

        .login-back-row {
          display: flex; align-items: center; gap: 0.4rem;
          color: #94a3b8; font-size: 0.78rem; font-weight: 600;
          background: none; border: none; padding: 0; cursor: pointer;
          margin-bottom: 0.6rem;
        }
        .login-back-row:hover { color: ${GREEN_DEEP}; }

        .login-alert {
          display: flex; align-items: flex-start; gap: 0.6rem;
          border-radius: 12px; padding: 0.75rem 0.9rem;
          font-size: 0.83rem; margin-bottom: 1.15rem;
          animation: alertSlide 0.25s ease both;
        }
        @keyframes alertSlide { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        .login-alert-error { background: #fef2f2; color: #b91c1c; }
        .login-alert-dev {
          background: linear-gradient(135deg, #f0faf0 0%, #e8f5e9 100%);
          border-left: 3px solid ${GREEN};
          color: ${NAVY};
          flex-direction: column;
          align-items: flex-start;
        }
        .login-alert-dev-title { display: flex; align-items: center; gap: 0.4rem; font-weight: 700; margin-bottom: 0.2rem; }
        .login-alert-dev small { color: #64748b; }

        .login-field-label { display: block; font-weight: 700; color: ${NAVY}; font-size: 0.8rem; margin-bottom: 0.55rem; }

        .login-input-shell {
          display: flex; align-items: center; gap: 0.65rem;
          background: #f8fafc; border: 1.5px solid #eef2f6; border-radius: 13px;
          padding: 0 1.05rem; transition: all 0.18s ease;
        }
        .login-input-shell.is-focused { border-color: ${GREEN}; box-shadow: 0 0 0 4px rgba(52,161,41,0.12); background: #fff; }
        .login-input-shell.has-error { border-color: #ef4444; }
        .login-input-shell svg { color: #94a3b8; flex-shrink: 0; transition: color 0.18s ease; }
        .login-input-shell.is-focused svg { color: ${GREEN}; }
        .login-input-shell input {
          flex: 1; border: none; outline: none; background: transparent;
          padding: 1rem 0; font-size: 1rem; color: ${NAVY};
          font-family: 'Poppins', sans-serif; min-width: 0;
        }
        .login-input-shell input::placeholder { color: #b0bac5; font-size: 0.9rem; }

        .login-field-error {
          display: flex; align-items: center; gap: 0.35rem;
          color: #ef4444; font-size: 0.78rem; margin-top: 0.55rem;
        }

        .login-submit-btn {
          width: 100%;
          background: linear-gradient(135deg, ${GREEN} 0%, ${GREEN_DEEP} 100%);
          color: #fff; border: none;
          border-radius: 13px; padding: 1.02rem; font-weight: 700; font-size: 0.96rem;
          display: flex; align-items: center; justify-content: center; gap: 0.55rem;
          cursor: pointer; transition: filter 0.18s ease, transform 0.15s ease, box-shadow 0.18s ease;
          margin-top: 1.5rem; margin-bottom: 1.35rem;
          box-shadow: 0 8px 20px rgba(52,161,41,0.28);
        }
        .login-submit-btn:hover:not(:disabled) { filter: brightness(1.06); transform: translateY(-1px); box-shadow: 0 10px 24px rgba(52,161,41,0.34); }
        .login-submit-btn:active:not(:disabled) { transform: translateY(0); }
        .login-submit-btn:disabled { opacity: 0.7; cursor: not-allowed; box-shadow: none; }

        .login-spinner {
          width: 16px; height: 16px; border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.4); border-top-color: #fff;
          animation: loginSpin 0.7s linear infinite;
        }
        @keyframes loginSpin { to { transform: rotate(360deg); } }

        .login-footnote { text-align: center; color: #64748b; font-size: 0.85rem; margin: 0; }
        .login-footnote a { color: ${GREEN_DEEP}; font-weight: 700; text-decoration: none; }
        .login-footnote a:hover { text-decoration: underline; }

        /* ---------- OTP boxes ---------- */
        .otp-row { display: flex; gap: 0.5rem; justify-content: space-between; animation: alertSlide 0.3s ease both; }
        .otp-box {
          width: 15%; aspect-ratio: 1; max-width: 54px;
          text-align: center; font-size: 1.3rem; font-weight: 800; color: ${NAVY};
          background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 13px;
          outline: none; transition: all 0.15s ease; font-family: 'Poppins', sans-serif;
        }
        .otp-box:focus { border-color: ${GREEN}; box-shadow: 0 0 0 4px rgba(52,161,41,0.14); background: #fff; transform: translateY(-1px); }
        .otp-box.has-error { border-color: #ef4444; }

        .otp-actions-row {
          display: flex; align-items: center; justify-content: space-between;
          margin-top: 1rem;
        }
        .otp-link-btn {
          background: none; border: none; padding: 0; cursor: pointer;
          color: ${GREEN_DEEP}; font-weight: 700; font-size: 0.82rem;
          display: inline-flex; align-items: center; gap: 0.35rem;
        }
        .otp-link-btn:hover:not(:disabled) { text-decoration: underline; }
        .otp-link-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .login-guest-link {
          display: block; text-align: center; margin-top: 1.5rem;
          color: #64748b; text-decoration: none; font-size: 0.85rem; font-weight: 500;
        }
        .login-guest-link:hover { color: ${GREEN_DEEP}; }

        /* focus visibility for a11y — inputs already show their own focus ring above, so this only covers buttons/links */
        button:focus-visible, a:focus-visible {
          outline: 2px solid ${GREEN}; outline-offset: 2px;
        }
      `}</style>

      <div className="login-shell">
        {/* Desktop branded panel */}
        <div className="login-panel">
          <svg className="route-signature" viewBox="0 0 400 700">
            <path d="M -20 560 C 100 500, 140 420, 90 340 S 40 180, 180 120 S 340 60, 380 -10" />
          </svg>

          <div className="login-panel-logo">
            <img
              src={logoDark}
              alt="Recomm Logo"
              style={{ filter: "brightness(0) invert(1)" }}
              onError={(e) => {
                e.target.style.filter = "none";
              }}
            />
          </div>

          <div className="login-panel-copy">
            <h2 className="login-panel-title">
              Fresh food, delivered <span>fast &amp; fresh</span>.
            </h2>
            <p className="login-panel-sub">
              Sign in with just your mobile number — no passwords to remember,
              no forms to fill. We'll text you a one-time code.
            </p>

            {PANEL_FEATURES.map(({ Icon, title, sub }) => (
              <div key={title} className="login-feature-row">
                <span className="login-feature-icon">
                  <Icon size={17} />
                </span>
                <div>
                  <p className="login-feature-title">{title}</p>
                  <p className="login-feature-sub">{sub}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="login-panel-foot">
            © {new Date().getFullYear()} Recomm-Frontend. All rights reserved.
          </div>
        </div>

        {/* Mobile hero (replaces the old blank top space) */}
        <div className="login-mobile-hero">
          <svg className="route-signature" viewBox="0 0 400 220">
            <path d="M -20 40 C 80 10, 140 70, 220 40 S 340 10, 420 50" />
          </svg>
          <div className="login-mobile-hero-logo">
            <img src={logoDark} alt="Recomm Logo" />
          </div>
          <h1 className="login-mobile-hero-title">Welcome back</h1>
          <p className="login-mobile-hero-sub">
            Premium food &amp; beverages delivered fresh to your door
          </p>
        </div>

        {/* Right / main form column */}
        <div className="login-form-panel">
          <div className="login-form-inner">
            {/* Card overlaps the mobile hero via negative margin; on desktop it sits centered with no overlap */}
            <div className="login-form-body">
              <LoginCard
                step={step}
                mobile={mobile}
                otpDigits={otpDigits}
                devOtp={devOtp}
                errors={errors}
                loading={loading}
                serverError={serverError}
                focusedField={focusedField}
                setFocusedField={setFocusedField}
                setMobile={setMobile}
                setErrors={setErrors}
                setServerError={setServerError}
                handleSendOtp={handleSendOtp}
                handleVerifyOtp={handleVerifyOtp}
                handleResendOtp={handleResendOtp}
                handleEditMobile={handleEditMobile}
                handleOtpChange={handleOtpChange}
                handleOtpKeyDown={handleOtpKeyDown}
                handleOtpPaste={handleOtpPaste}
                otpRefs={otpRefs}
                resendTimer={resendTimer}
                redirectTo={redirectTo}
              />
              <Link to="/products" className="login-guest-link">
                Continue browsing as guest →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------------------------------------------------------------- */
/* Card content extracted so mobile + desktop share one implementation */
/* ---------------------------------------------------------------- */
const LoginCard = ({
  step,
  mobile,
  otpDigits,
  devOtp,
  errors,
  loading,
  serverError,
  focusedField,
  setFocusedField,
  setMobile,
  setErrors,
  setServerError,
  handleSendOtp,
  handleVerifyOtp,
  handleResendOtp,
  handleEditMobile,
  handleOtpChange,
  handleOtpKeyDown,
  handleOtpPaste,
  otpRefs,
  resendTimer,
  redirectTo,
}) => {
  return (
    <div className="login-card">
      <div className="login-card-head">
        <h3 className="login-card-title">
          {step === "mobile" ? "Sign in" : "Verify your number"}
        </h3>
        <p className="login-card-sub">
          {step === "mobile"
            ? "Enter your mobile number to continue"
            : `We sent a 6-digit code to +91 ${mobile}`}
        </p>
      </div>

      <div className="login-card-body">
        {step === "otp" && (
          <button
            type="button"
            className="login-back-row"
            onClick={handleEditMobile}
          >
            <FaChevronLeft size={10} />
            Change number
          </button>
        )}

        {serverError && (
          <div className="login-alert login-alert-error">
            <FaExclamationCircle style={{ marginTop: 2, flexShrink: 0 }} />
            <span>{serverError}</span>
          </div>
        )}

        {devOtp && step === "otp" && (
          <div className="login-alert login-alert-dev">
            <div className="login-alert-dev-title">
              <FaCheckCircle color={GREEN} />
              Dev Mode OTP
            </div>
            <small>
              Your OTP is: <strong>{devOtp}</strong>
            </small>
          </div>
        )}

        {/* STEP 1: Mobile Number */}
        {step === "mobile" && (
          <form onSubmit={handleSendOtp} noValidate>
            <label htmlFor="mobile" className="login-field-label">
              Mobile Number
            </label>
            <div
              className={`login-input-shell ${focusedField === "mobile" ? "is-focused" : ""} ${errors.mobile ? "has-error" : ""}`}
            >
              <FaMobileAlt size={15} />
              <input
                type="tel"
                id="mobile"
                name="mobile"
                placeholder="Enter your 10-digit mobile number"
                value={mobile}
                maxLength={10}
                onChange={(e) => {
                  setMobile(e.target.value.replace(/\D/g, ""));
                  if (errors.mobile) setErrors((p) => ({ ...p, mobile: "" }));
                  setServerError("");
                }}
                onFocus={() => setFocusedField("mobile")}
                onBlur={() => setFocusedField(null)}
                autoComplete="tel"
                autoFocus
              />
            </div>
            {errors.mobile && (
              <div className="login-field-error">
                <FaExclamationCircle size={11} />
                {errors.mobile}
              </div>
            )}

            <button
              type="submit"
              className="login-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="login-spinner" />
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
            <label className="login-field-label">Enter OTP</label>
            <div className="otp-row" onPaste={handleOtpPaste}>
              {otpDigits.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => (otpRefs.current[i] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  className={`otp-box ${errors.otp ? "has-error" : ""}`}
                  value={digit}
                  onChange={(e) => handleOtpChange(i, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  aria-label={`OTP digit ${i + 1}`}
                />
              ))}
            </div>
            {errors.otp && (
              <div className="login-field-error">
                <FaExclamationCircle size={11} />
                {errors.otp}
              </div>
            )}

            <div className="otp-actions-row">
              <span style={{ fontSize: "0.78rem", color: "#94a3b8" }}>
                Didn't get a code?
              </span>
              <button
                type="button"
                className="otp-link-btn"
                onClick={handleResendOtp}
                disabled={loading || resendTimer > 0}
              >
                <FaRedo size={11} />
                {resendTimer > 0 ? `Resend OTP (${resendTimer}s)` : "Resend OTP"}
              </button>
            </div>

            <button
              type="submit"
              className="login-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="login-spinner" />
                  Verifying...
                </>
              ) : (
                <>
                  Verify &amp; Sign In
                  <FaArrowRight size={13} />
                </>
              )}
            </button>
          </form>
        )}

        <p className="login-footnote">
          Don't have an account? <Link to={`/signup?redirect=${encodeURIComponent(redirectTo)}`}>Create Account</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
