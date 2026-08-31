import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import {
  CheckCircle2,
  AlertCircle,
  Info,
  TriangleAlert,
  X,
} from "lucide-react";

/* ============================================================
   SIGNAL — a toast & alert system built around one idea:
   a live "signal rail" on each card (colour + a breathing dot)
   paired with a running mono countdown, like a status light on
   a piece of hardware rather than a generic glass card.
   ============================================================ */

const ToastContext = createContext();

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500;600&display=swap');

:root {
  --canvas: #eceff3;
  --card: #ffffff;
  --hairline: #e1e5eb;
  --ink: #12141a;
  --ink-muted: #6b7280;
  --ink-faint: #9aa1ad;

  --success: #187a52;
  --success-bright: #34d399;
  --error: #b8283a;
  --error-bright: #fb6a6a;
  --warning: #a9670c;
  --warning-bright: #f2a93b;
  --info: #2a52c9;
  --info-bright: #5b8def;

  --radius: 14px;
  --font-display: "Space Grotesk", sans-serif;
  --font-body: "Inter", sans-serif;
  --font-mono: "JetBrains Mono", monospace;
}

.sig-canvas {
  font-family: var(--font-body);
  background: var(--canvas);
  color: var(--ink);
}

/* ---------------- Toast stack ---------------- */
.sig-toast-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 2000;
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
  max-width: 360px;
  pointer-events: none;
}

.sig-toast {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px 14px 18px;
  background: var(--card);
  border: 1px solid var(--hairline);
  border-radius: var(--radius);
  box-shadow: 0 8px 24px -8px rgba(18, 20, 26, 0.18), 0 1px 2px rgba(18, 20, 26, 0.06);
  overflow: hidden;
  pointer-events: auto;
  animation: sig-in 0.32s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.sig-toast--closing { animation: sig-out 0.18s ease-in forwards; }

@keyframes sig-in {
  from { opacity: 0; transform: translateX(18px); }
  to   { opacity: 1; transform: translateX(0); }
}
@keyframes sig-out {
  to { opacity: 0; transform: translateX(10px) scale(0.97); }
}

/* the signal rail: solid colour bar + breathing dot at its head */
.sig-rail {
  position: absolute;
  left: 0;
  top: 10px;
  bottom: 10px;
  width: 3px;
  border-radius: 3px;
  background: var(--tone);
}

.sig-dot {
  position: absolute;
  left: -2.5px;
  top: -3px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--tone);
  box-shadow: 0 0 0 0 var(--tone);
  animation: sig-pulse 1.8s ease-out infinite;
}

@keyframes sig-pulse {
  0%   { box-shadow: 0 0 0 0 color-mix(in srgb, var(--tone) 55%, transparent); }
  70%  { box-shadow: 0 0 0 7px transparent; }
  100% { box-shadow: 0 0 0 0 transparent; }
}

.sig-toast--success { --tone: var(--success); }
.sig-toast--error   { --tone: var(--error); }
.sig-toast--warning { --tone: var(--warning); }
.sig-toast--info    { --tone: var(--info); }

.sig-icon {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  border-radius: 9px;
  background: color-mix(in srgb, var(--tone) 13%, white);
  color: var(--tone);
  margin-left: 4px;
}

.sig-body { flex: 1; min-width: 0; padding-top: 1px; }

.sig-title {
  margin: 0 0 2px;
  font-family: var(--font-display);
  font-size: 13.5px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--ink);
}

.sig-message {
  margin: 0;
  font-size: 13px;
  line-height: 1.45;
  color: var(--ink-muted);
  word-break: break-word;
}

.sig-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  margin-left: 4px;
  margin-top: 1px;
}

.sig-countdown {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 500;
  color: var(--ink-faint);
  min-width: 30px;
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.sig-close {
  display: grid;
  place-items: center;
  width: 20px;
  height: 20px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--ink-faint);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}
.sig-close:hover { background: #f0f1f4; color: var(--ink); }
.sig-close:focus-visible { outline: 2px solid var(--tone); outline-offset: 1px; }

.sig-progress-track {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 2px;
  background: transparent;
}
.sig-progress {
  display: block;
  height: 100%;
  width: 100%;
  transform-origin: left;
  background: var(--tone);
  opacity: 0.55;
  animation-name: sig-shrink;
  animation-timing-function: linear;
  animation-fill-mode: forwards;
}
@keyframes sig-shrink { from { transform: scaleX(1); } to { transform: scaleX(0); } }

/* ---------------- Big alert ---------------- */
.sig-overlay {
  position: fixed;
  inset: 0;
  z-index: 2100;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(15, 17, 22, 0.45);
  animation: sig-overlay-in 0.2s ease both;
}
.sig-overlay--closing { animation: sig-overlay-out 0.15s ease forwards; }
@keyframes sig-overlay-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes sig-overlay-out { to { opacity: 0; } }

.sig-modal {
  position: relative;
  width: 100%;
  max-width: 360px;
  padding: 28px 26px 24px;
  background: var(--card);
  border-radius: 18px;
  border: 1px solid var(--hairline);
  box-shadow: 0 30px 70px -20px rgba(18, 20, 26, 0.4);
  overflow: hidden;
  animation: sig-modal-in 0.3s cubic-bezier(0.22, 1, 0.36, 1) both;
}
.sig-modal--closing { animation: sig-modal-out 0.16s ease-in forwards; }

@keyframes sig-modal-in {
  from { opacity: 0; transform: translateY(10px) scale(0.96); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes sig-modal-out {
  to { opacity: 0; transform: translateY(6px) scale(0.97); }
}

.sig-modal-rail {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--tone);
}

.sig-modal--success { --tone: var(--success); }
.sig-modal--error   { --tone: var(--error); }
.sig-modal--warning { --tone: var(--warning); }
.sig-modal--info    { --tone: var(--info); }

.sig-modal-dismiss {
  position: absolute;
  top: 16px;
  right: 16px;
  display: grid;
  place-items: center;
  width: 26px;
  height: 26px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--ink-faint);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}
.sig-modal-dismiss:hover { background: #f0f1f4; color: var(--ink); }
.sig-modal-dismiss:focus-visible { outline: 2px solid var(--tone); outline-offset: 1px; }

.sig-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-mono);
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--tone);
  margin-bottom: 14px;
}
.sig-eyebrow::before {
  content: "";
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--tone);
}

.sig-modal-icon {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  border-radius: 14px;
  background: color-mix(in srgb, var(--tone) 13%, white);
  color: var(--tone);
  margin-bottom: 16px;
}

.sig-modal-title {
  margin: 0 0 6px;
  font-family: var(--font-display);
  font-size: 18px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: var(--ink);
}

.sig-modal-message {
  margin: 0 0 22px;
  font-size: 13.5px;
  line-height: 1.55;
  color: var(--ink-muted);
}

.sig-modal-button {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 11px;
  background: var(--tone);
  color: #fff;
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: filter 0.15s ease, transform 0.15s ease;
}
.sig-modal-button:hover { filter: brightness(1.08); }
.sig-modal-button:active { transform: scale(0.99); }
.sig-modal-button:focus-visible { outline: 2px solid var(--tone); outline-offset: 2px; }

.sig-check {
  width: 26px;
  height: 26px;
  stroke-width: 3;
  stroke: currentColor;
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.sig-check-circle {
  stroke-dasharray: 76;
  stroke-dashoffset: 76;
  animation: sig-check-draw 0.4s ease 0.05s forwards;
}
.sig-check-mark {
  stroke-dasharray: 24;
  stroke-dashoffset: 24;
  animation: sig-check-draw 0.25s ease 0.4s forwards;
}
@keyframes sig-check-draw { to { stroke-dashoffset: 0; } }

@media (max-width: 480px) {
  .sig-toast-container { top: 10px; right: 10px; left: 10px; max-width: none; }
  .sig-modal { padding: 24px 20px 20px; }
}

@media (prefers-reduced-motion: reduce) {
  .sig-toast, .sig-toast--closing, .sig-overlay, .sig-overlay--closing,
  .sig-modal, .sig-modal--closing, .sig-dot, .sig-check-circle, .sig-check-mark {
    animation-duration: 0.01ms !important;
  }
}
`;

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
};

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: TriangleAlert,
  info: Info,
};

const LABELS = {
  success: "Success",
  error: "Error",
  warning: "Warning",
  info: "Info",
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [bigAlert, setBigAlert] = useState(null);
  const [bigAlertClosing, setBigAlertClosing] = useState(false);
  const [, tick] = useState(0);

  const timers = useRef({}); // { [id]: { timeoutId, remaining, startedAt } }

  // drive the mono countdown digits
  useEffect(() => {
    const iv = setInterval(() => tick((n) => n + 1), 100);
    return () => clearInterval(iv);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, closing: true } : t)),
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
      delete timers.current[id];
    }, 180);
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
    (message, type = "success", duration = 4000, title = null) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      setToasts((prev) => [
        ...prev,
        {
          id,
          message,
          type,
          title: title ?? LABELS[type],
          duration,
          paused: false,
          closing: false,
        },
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
    }, 160);
  }, []);

  useEffect(() => {
    if (!bigAlert) return;
    const onKeyDown = (e) => e.key === "Escape" && closeBigAlert();
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [bigAlert, closeBigAlert]);

  const remainingFor = (t) => {
    const timer = timers.current[t.id];
    if (!timer) return 0;
    const r = t.paused
      ? timer.remaining
      : timer.remaining - (Date.now() - timer.startedAt);
    return Math.max(r, 0);
  };

  const value = { showToast, closeToast, showBigAlert, closeBigAlert };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <style>{STYLES}</style>

      <div
        className="sig-toast-container"
        aria-live="polite"
        aria-atomic="false"
      >
        {toasts.map((t) => {
          const Icon = ICONS[t.type] || Info;
          const secs = (remainingFor(t) / 1000).toFixed(1);
          return (
            <div
              key={t.id}
              role="status"
              className={`sig-toast sig-toast--${t.type} ${t.closing ? "sig-toast--closing" : ""}`}
              onMouseEnter={() => pauseTimer(t.id)}
              onMouseLeave={() => resumeTimer(t.id)}
            >
              <span className="sig-rail">
                <span className="sig-dot" />
              </span>

              <span className="sig-icon">
                <Icon size={16} strokeWidth={2.25} />
              </span>

              <div className="sig-body">
                {t.title && <p className="sig-title">{t.title}</p>}
                <p className="sig-message">{t.message}</p>
              </div>

              <div className="sig-meta">
                <span className="sig-countdown">{secs}s</span>
                <button
                  className="sig-close"
                  onClick={() => closeToast(t.id)}
                  aria-label="Dismiss notification"
                >
                  <X size={12} strokeWidth={2.5} />
                </button>
              </div>

              <span className="sig-progress-track">
                <span
                  className="sig-progress"
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

      {bigAlert && (
        <div
          className={`sig-overlay ${bigAlertClosing ? "sig-overlay--closing" : ""}`}
          onMouseDown={(e) => e.target === e.currentTarget && closeBigAlert()}
        >
          <div
            className={`sig-modal sig-modal--${bigAlert.type} ${bigAlertClosing ? "sig-modal--closing" : ""}`}
            role="alertdialog"
            aria-modal="true"
          >
            <span className="sig-modal-rail" />

            <button
              className="sig-modal-dismiss"
              onClick={closeBigAlert}
              aria-label="Close dialog"
            >
              <X size={14} strokeWidth={2.5} />
            </button>

            <span className="sig-eyebrow">
              Status · {LABELS[bigAlert.type]}
            </span>

            <div className="sig-modal-icon">
              {bigAlert.type === "success" ? (
                <svg className="sig-check" viewBox="0 0 26 26">
                  <circle className="sig-check-circle" cx="13" cy="13" r="11" />
                  <path className="sig-check-mark" d="M7.5 13.5l3.5 3.5 8-8" />
                </svg>
              ) : (
                (() => {
                  const Icon = ICONS[bigAlert.type] || Info;
                  return <Icon size={26} strokeWidth={2.25} />;
                })()
              )}
            </div>

            <h3 className="sig-modal-title">{bigAlert.title}</h3>
            <p className="sig-modal-message">{bigAlert.message}</p>

            <button className="sig-modal-button" onClick={closeBigAlert}>
              {bigAlert.buttonText}
            </button>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
};

/* ---------------- Demo ---------------- */
const DemoPanel = () => {
  const { showToast, showBigAlert } = useToast();

  const btnBase = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "11px 16px",
    borderRadius: 11,
    border: "1px solid var(--hairline)",
    background: "#fff",
    fontFamily: "var(--font-body)",
    fontSize: 13.5,
    fontWeight: 600,
    cursor: "pointer",
    color: "var(--ink)",
  };

  const dot = (color) => ({
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: color,
    flexShrink: 0,
  });

  return (
    <div
      className="sig-canvas"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 40,
      }}
    >
      <div style={{ width: "100%", maxWidth: 460 }}>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--ink-faint)",
          }}
        >
          Component / Notifications
        </span>
        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 30,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            margin: "6px 0 6px",
          }}
        >
          Signal
        </h1>
        <p
          style={{
            color: "var(--ink-muted)",
            fontSize: 14,
            lineHeight: 1.55,
            margin: "0 0 28px",
          }}
        >
          Toasts and alerts that read as a status light on real hardware — a
          coloured rail, a breathing pulse, and a live countdown instead of a
          generic progress bar.
        </p>

        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
        >
          <button
            style={btnBase}
            onClick={() =>
              showToast(
                "Changes saved to your workspace.",
                "success",
                4000,
                "Saved",
              )
            }
          >
            <span style={dot("var(--success)")} /> Success
          </button>
          <button
            style={btnBase}
            onClick={() =>
              showToast(
                "Couldn't reach the server. Try again.",
                "error",
                4500,
                "Request failed",
              )
            }
          >
            <span style={dot("var(--error)")} /> Error
          </button>
          <button
            style={btnBase}
            onClick={() =>
              showToast(
                "Your session expires in 5 minutes.",
                "warning",
                5000,
                "Session ending",
              )
            }
          >
            <span style={dot("var(--warning)")} /> Warning
          </button>
          <button
            style={btnBase}
            onClick={() =>
              showToast(
                "A newer version of this page is available.",
                "info",
                4000,
                "Update available",
              )
            }
          >
            <span style={dot("var(--info)")} /> Info
          </button>
        </div>

        <button
          style={{
            ...btnBase,
            width: "100%",
            justifyContent: "center",
            marginTop: 10,
            background: "var(--ink)",
            color: "#fff",
            border: "none",
          }}
          onClick={() =>
            showBigAlert({
              title: "Payment confirmed",
              message:
                "Your subscription is active. A receipt has been sent to your email.",
              type: "success",
              buttonText: "Continue",
            })
          }
        >
          Open big alert
        </button>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <DemoPanel />
    </ToastProvider>
  );
}
