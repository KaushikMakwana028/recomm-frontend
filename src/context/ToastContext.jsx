import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import {
  FaCheckCircle,
  FaExclamationCircle,
  FaInfoCircle,
  FaExclamationTriangle,
  FaTimes,
} from "react-icons/fa";
const ToastContext = createContext();

const TOAST_STYLES = `
:root {
  --success: #059669;
  --success-light: #10b981;
  --success-rgb: 16, 185, 129;

  --error: #e11d48;
  --error-light: #fb7185;
  --error-rgb: 251, 113, 133;

  --warning: #d97706;
  --warning-light: #fbbf24;
  --warning-rgb: 251, 191, 36;

  --info: #2563eb;
  --info-light: #38bdf8;
  --info-rgb: 56, 189, 248;

  --glass-text: #0f172a;
  --glass-text-muted: #475569;
  --glass-radius: 20px;
}

/* ---------- Toast stack ---------- */
.toast-container {
  position: fixed;
  top: 22px;
  right: 22px;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  max-width: 380px;
  pointer-events: none;
}

.toast-item {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 13px;
  padding: 16px 40px 22px 16px;
  border-radius: var(--glass-radius);
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.75), rgba(255, 255, 255, 0.4));
  border: 1px solid rgba(255, 255, 255, 0.55);
  -webkit-backdrop-filter: blur(22px) saturate(180%);
  backdrop-filter: blur(22px) saturate(180%);
  box-shadow:
    0 12px 40px -10px rgba(15, 23, 42, 0.22),
    0 2px 10px rgba(15, 23, 42, 0.07),
    inset 0 1px 0 rgba(255, 255, 255, 0.75);
  overflow: hidden;
  pointer-events: auto;
  animation: toast-in 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.toast-item--closing {
  animation: toast-out 0.22s ease-in forwards;
}

@keyframes toast-in {
  from { opacity: 0; transform: translateY(-10px) scale(0.94); filter: blur(6px); }
  to { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
}

@keyframes toast-out {
  to { opacity: 0; transform: translateY(6px) scale(0.95); filter: blur(4px); }
}

/* soft ambient wash behind the icon, tinted per type */
.toast-item::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: radial-gradient(80px 60px at 0% 0%, rgba(var(--tone-rgb), 0.16), transparent 70%);
  pointer-events: none;
}

.toast-success { --tone-rgb: var(--success-rgb); }
.toast-error   { --tone-rgb: var(--error-rgb); }
.toast-warning { --tone-rgb: var(--warning-rgb); }
.toast-info    { --tone-rgb: var(--info-rgb); }

.toast-icon-wrap {
  position: relative;
  z-index: 1;
  flex-shrink: 0;
  width: 34px;
  height: 34px;
}

.toast-icon-wrap::before {
  content: "";
  position: absolute;
  inset: -9px;
  border-radius: 50%;
  background: rgb(var(--tone-rgb));
  filter: blur(13px);
  opacity: 0.45;
}

.toast-icon-badge {
  position: relative;
  z-index: 1;
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: rgba(var(--tone-rgb), 0.18);
  border: 1px solid rgba(var(--tone-rgb), 0.4);
  color: rgb(var(--tone-rgb));
}

.toast-success .toast-icon-badge { color: var(--success); }
.toast-error   .toast-icon-badge { color: var(--error); }
.toast-warning .toast-icon-badge { color: var(--warning); }
.toast-info    .toast-icon-badge { color: var(--info); }

.toast-body { position: relative; z-index: 1; flex: 1; min-width: 0; }

.toast-title {
  margin: 0 0 2px;
  font-size: 13.5px;
  font-weight: 650;
  color: var(--glass-text);
  letter-spacing: -0.01em;
}

.toast-message {
  margin: 0;
  font-size: 13px;
  line-height: 1.45;
  color: var(--glass-text-muted);
  word-break: break-word;
}

.toast-close {
  position: absolute;
  z-index: 1;
  top: 10px;
  right: 10px;
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.35);
  color: var(--glass-text-muted);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, transform 0.15s ease;
}

.toast-close:hover {
  background: rgba(255, 255, 255, 0.6);
  color: var(--glass-text);
  transform: scale(1.06);
}

.toast-progress-track {
  position: absolute;
  z-index: 1;
  left: 14px;
  right: 14px;
  bottom: 10px;
  height: 4px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.35);
  overflow: hidden;
}

.toast-progress {
  display: block;
  height: 100%;
  width: 100%;
  border-radius: 999px;
  transform-origin: left;
  background: linear-gradient(90deg, rgb(var(--tone-rgb)), rgba(var(--tone-rgb), 0.7));
  box-shadow: 0 0 8px rgba(var(--tone-rgb), 0.6);
  animation-name: toast-progress-shrink;
  animation-timing-function: linear;
  animation-fill-mode: forwards;
}

@keyframes toast-progress-shrink {
  from { transform: scaleX(1); }
  to { transform: scaleX(0); }
}

/* ---------- Big alert modal ---------- */
.big-alert-overlay {
  position: fixed;
  inset: 0;
  z-index: 2100;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(10, 14, 22, 0.5);
  -webkit-backdrop-filter: blur(8px) saturate(140%);
  backdrop-filter: blur(8px) saturate(140%);
  animation: overlay-in 0.25s ease both;
}

.big-alert-overlay--closing { animation: overlay-out 0.2s ease forwards; }

@keyframes overlay-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes overlay-out { to { opacity: 0; } }

.big-alert-box {
  position: relative;
  width: 100%;
  max-width: 380px;
  padding: 40px 32px 30px;
  border-radius: 26px;
  background: linear-gradient(165deg, rgba(255, 255, 255, 0.85), rgba(255, 255, 255, 0.55));
  border: 1px solid rgba(255, 255, 255, 0.65);
  -webkit-backdrop-filter: blur(30px) saturate(200%);
  backdrop-filter: blur(30px) saturate(200%);
  box-shadow:
    0 30px 80px -18px rgba(15, 23, 42, 0.45),
    0 0 0 1px rgba(255, 255, 255, 0.4) inset,
    0 40px 90px -20px rgba(var(--tone-rgb), 0.25);
  text-align: center;
  overflow: hidden;
  animation: box-in 0.4s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.big-alert-box--closing { animation: box-out 0.2s ease-in forwards; }

.big-alert-box--success { --tone-rgb: var(--success-rgb); }
.big-alert-box--error   { --tone-rgb: var(--error-rgb); }
.big-alert-box--warning { --tone-rgb: var(--warning-rgb); }
.big-alert-box--info    { --tone-rgb: var(--info-rgb); }

.big-alert-box::before {
  content: "";
  position: absolute;
  inset: 0;
  background: radial-gradient(160px 110px at 50% -10%, rgba(var(--tone-rgb), 0.3), transparent 70%);
  pointer-events: none;
}

@keyframes box-in {
  from { opacity: 0; transform: translateY(14px) scale(0.92); filter: blur(6px); }
  to { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
}

@keyframes box-out {
  to { opacity: 0; transform: translateY(8px) scale(0.95); filter: blur(4px); }
}

.big-alert-dismiss {
  position: absolute;
  z-index: 1;
  top: 16px;
  right: 16px;
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.35);
  color: var(--glass-text-muted);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, transform 0.15s ease;
}

.big-alert-dismiss:hover {
  background: rgba(255, 255, 255, 0.65);
  color: var(--glass-text);
  transform: scale(1.06);
}

.big-alert-icon-wrapper {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.big-alert-icon-wrapper::before {
  content: "";
  position: absolute;
  width: 90px;
  height: 90px;
  border-radius: 50%;
  background: rgb(var(--tone-rgb));
  filter: blur(22px);
  opacity: 0.4;
}

.big-alert-icon-badge {
  position: relative;
  display: grid;
  place-items: center;
  width: 68px;
  height: 68px;
  border-radius: 50%;
  background: rgba(var(--tone-rgb), 0.18);
  border: 1px solid rgba(var(--tone-rgb), 0.4);
  animation: icon-pop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s both;
}

.big-alert-box--success .big-alert-icon-badge { color: var(--success); }
.big-alert-box--error   .big-alert-icon-badge { color: var(--error); }
.big-alert-box--warning .big-alert-icon-badge { color: var(--warning); }
.big-alert-box--info    .big-alert-icon-badge { color: var(--info); }

@keyframes icon-pop {
  from { opacity: 0; transform: scale(0.6); }
  to { opacity: 1; transform: scale(1); }
}

.big-alert-title {
  position: relative;
  z-index: 1;
  margin: 0 0 8px;
  font-size: 19px;
  font-weight: 700;
  color: var(--glass-text);
  letter-spacing: -0.01em;
}

.big-alert-message {
  position: relative;
  z-index: 1;
  margin: 0 0 28px;
  font-size: 14px;
  line-height: 1.55;
  color: var(--glass-text-muted);
}

.big-alert-button {
  position: relative;
  z-index: 1;
  width: 100%;
  padding: 13px;
  border: none;
  border-radius: 14px;
  color: #fff;
  font-size: 14.5px;
  font-weight: 700;
  letter-spacing: 0.01em;
  cursor: pointer;
  overflow: hidden;
  background: linear-gradient(135deg, var(--success-light), var(--success));
  box-shadow: 0 10px 24px -6px rgba(var(--success-rgb), 0.55);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.big-alert-box--error .big-alert-button {
  background: linear-gradient(135deg, var(--error-light), var(--error));
  box-shadow: 0 10px 24px -6px rgba(var(--error-rgb), 0.55);
}
.big-alert-box--warning .big-alert-button {
  background: linear-gradient(135deg, var(--warning-light), var(--warning));
  box-shadow: 0 10px 24px -6px rgba(var(--warning-rgb), 0.55);
}
.big-alert-box--info .big-alert-button {
  background: linear-gradient(135deg, var(--info-light), var(--info));
  box-shadow: 0 10px 24px -6px rgba(var(--info-rgb), 0.55);
}

.big-alert-button:hover { transform: translateY(-1px); }
.big-alert-button:active { transform: translateY(0); }

.checkmark {
  position: relative;
  width: 40px;
  height: 40px;
  stroke-width: 3;
  stroke: var(--success);
  stroke-miterlimit: 10;
}

.checkmark-circle {
  stroke-dasharray: 166;
  stroke-dashoffset: 166;
  stroke-width: 3;
  stroke: var(--success);
  fill: none;
  animation: checkmark-stroke 0.5s cubic-bezier(0.65, 0, 0.45, 1) 0.1s forwards;
}

.checkmark-check {
  transform-origin: 50% 50%;
  stroke-dasharray: 48;
  stroke-dashoffset: 48;
  animation: checkmark-stroke 0.3s cubic-bezier(0.65, 0, 0.45, 1) 0.55s forwards;
}

@keyframes checkmark-stroke { 100% { stroke-dashoffset: 0; } }

/* ---------- Responsive ---------- */
@media (max-width: 480px) {
  .toast-container { top: 12px; right: 12px; left: 12px; max-width: none; }
  .big-alert-box { padding: 32px 24px 26px; }
}

/* ---------- Reduced motion ---------- */
@media (prefers-reduced-motion: reduce) {
  .toast-item,
  .toast-item--closing,
  .big-alert-overlay,
  .big-alert-box,
  .big-alert-icon-badge,
  .checkmark-circle,
  .checkmark-check {
    animation-duration: 0.01ms !important;
  }
}
`;

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within a ToastProvider");
  return context;
};

const ICONS = {
  success: FaCheckCircle,
  error: FaExclamationCircle,
  warning: FaExclamationTriangle,
  info: FaInfoCircle,
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [bigAlert, setBigAlert] = useState(null);
  const [bigAlertClosing, setBigAlertClosing] = useState(false);

  // Per-toast timer bookkeeping so we can pause/resume on hover
  // without losing track of how much time is left.
  const timers = useRef({}); // { [id]: { timeoutId, remaining, startedAt } }

  const removeToast = useCallback((id) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, closing: true } : t)),
    );
    // Let the exit animation play before actually unmounting.
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      delete timers.current[id];
    }, 220);
  }, []);

  const startTimer = useCallback(
    (id, duration) => {
      timers.current[id] = {
        remaining: duration,
        startedAt: Date.now(),
        timeoutId: setTimeout(() => removeToast(id), duration),
      };
    },
    [removeToast],
  );

  const pauseTimer = useCallback((id) => {
    const timer = timers.current[id];
    if (!timer) return;
    clearTimeout(timer.timeoutId);
    timer.remaining -= Date.now() - timer.startedAt;
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, paused: true } : t)),
    );
  }, []);

  const resumeTimer = useCallback(
    (id) => {
      const timer = timers.current[id];
      if (!timer) return;
      timer.startedAt = Date.now();
      timer.timeoutId = setTimeout(
        () => removeToast(id),
        Math.max(timer.remaining, 0),
      );
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, paused: false } : t)),
      );
    },
    [removeToast],
  );

  const showToast = useCallback(
    (message, type = "success", duration = 3500, title = null) => {
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      setToasts((prev) => [
        ...prev,
        { id, message, type, title, duration, paused: false, closing: false },
      ]);
      startTimer(id, duration);
      return id;
    },
    [startTimer],
  );

  const closeToast = useCallback(
    (id) => {
      clearTimeout(timers.current[id]?.timeoutId);
      removeToast(id);
    },
    [removeToast],
  );

  const showBigAlert = useCallback(
    ({ title, message, type = "success", buttonText = "Okay", onConfirm }) => {
      setBigAlertClosing(false);
      setBigAlert({ title, message, type, buttonText, onConfirm });
    },
    [],
  );

  const closeBigAlert = useCallback(() => {
    setBigAlertClosing(true);
    setTimeout(() => {
      setBigAlert((current) => {
        if (current?.onConfirm) current.onConfirm();
        return null;
      });
      setBigAlertClosing(false);
    }, 200);
  }, []);

  // Close big alert on Escape for keyboard users.
  useEffect(() => {
    if (!bigAlert) return;
    const onKeyDown = (e) => e.key === "Escape" && closeBigAlert();
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [bigAlert, closeBigAlert]);

  const value = { showToast, closeToast, showBigAlert, closeBigAlert };

  return (
    <ToastContext.Provider value={value}>
      {children}

      <style>{TOAST_STYLES}</style>

      {/* Toast stack */}
      <div className="toast-container" aria-live="polite" aria-atomic="false">
        {toasts.map((t) => {
          const Icon = ICONS[t.type] || FaInfoCircle;
          return (
            <div
              key={t.id}
              role="status"
              className={`toast-item toast-${t.type} ${t.closing ? "toast-item--closing" : ""}`}
              onMouseEnter={() => pauseTimer(t.id)}
              onMouseLeave={() => resumeTimer(t.id)}
            >
              <span className="toast-icon-wrap">
                <span className="toast-icon-badge">
                  <Icon size={16} />
                </span>
              </span>

              <div className="toast-body">
                {t.title && <p className="toast-title">{t.title}</p>}
                <p className="toast-message">{t.message}</p>
              </div>

              <button
                className="toast-close"
                onClick={() => closeToast(t.id)}
                aria-label="Dismiss notification"
              >
                <FaTimes size={11} />
              </button>

              <span className="toast-progress-track">
                <span
                  className="toast-progress"
                  style={{
                    animationDuration: `${t.duration}ms`,
                    animationPlayState: t.paused ? "paused" : "running",
                  }}
                />
              </span>
            </div>
          );
        })}
      </div>

      {/* Big modal alert */}
      {bigAlert && (
        <div
          className={`big-alert-overlay ${bigAlertClosing ? "big-alert-overlay--closing" : ""}`}
          onMouseDown={(e) => e.target === e.currentTarget && closeBigAlert()}
        >
          <div
            className={`big-alert-box big-alert-box--${bigAlert.type} ${
              bigAlertClosing ? "big-alert-box--closing" : ""
            }`}
            role="alertdialog"
            aria-modal="true"
          >
            <button
              className="big-alert-dismiss"
              onClick={closeBigAlert}
              aria-label="Close dialog"
            >
              <FaTimes size={14} />
            </button>

            <div className="big-alert-icon-wrapper">
              {bigAlert.type === "success" ? (
                <svg className="checkmark" viewBox="0 0 52 52">
                  <circle className="checkmark-circle" cx="26" cy="26" r="25" />
                  <path
                    className="checkmark-check"
                    d="M14.1 27.2l7.1 7.2 16.7-16.8"
                  />
                </svg>
              ) : (
                (() => {
                  const Icon = ICONS[bigAlert.type] || FaInfoCircle;
                  return (
                    <span className="big-alert-icon-badge">
                      <Icon size={30} />
                    </span>
                  );
                })()
              )}
            </div>

            <h3 className="big-alert-title">{bigAlert.title}</h3>
            <p className="big-alert-message">{bigAlert.message}</p>

            <button className="big-alert-button" onClick={closeBigAlert}>
              {bigAlert.buttonText}
            </button>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
};
