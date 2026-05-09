import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  FaEnvelope, FaLock, FaSignInAlt, FaSpinner,
  FaShieldAlt, FaEye, FaEyeSlash, FaKey
} from "react-icons/fa";

const injectStyles = () => {
  if (document.getElementById("login-page-styles")) return;
  const s = document.createElement("style");
  s.id = "login-page-styles";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(24px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes scanline {
      0%   { transform: translateY(-100%); }
      100% { transform: translateY(400%); }
    }
    .lp-input-wrap input:focus {
      border-color: #3b82f6 !important;
      box-shadow: 0 0 0 3px rgba(59,130,246,0.18) !important;
      outline: none;
    }
    .lp-submit:hover:not(:disabled) {
      filter: brightness(1.1);
      transform: translateY(-2px);
      box-shadow: 0 8px 28px rgba(37,99,235,0.45) !important;
    }
    .lp-submit:disabled { opacity: 0.65; cursor: not-allowed; }
    .lp-eye:hover { color: #93c5fd !important; }
  `;
  document.head.appendChild(s);
};

export default function Login() {
  useEffect(() => { injectStyles(); }, []);

  const navigate  = useNavigate();
  const [mode, setMode] = useState("login"); // "login" | "change"

  /* login fields */
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);

  /* change-password fields */
  const [newPw,     setNewPw]     = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showNewPw, setShowNewPw] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState("");

  /* ── NORMAL LOGIN ── */
  const handleLogin = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    setLoading(true);
    try {
      const res = await axios.post("http://127.0.0.1:5000/login", { email, password });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role",  res.data.role);
      localStorage.setItem("user",  res.data.user);

      if (res.data.must_change_password) {
        // Force password change before entering the system
        setMode("change");
        setSuccess("");
        setError("");
      } else {
        setSuccess("Login successful! Redirecting…");
        setTimeout(() => {
          navigate(res.data.role === "admin" ? "/admin" : "/dashboard");
        }, 700);
      }
    } catch (err) {
      setError(err.response?.data?.error || "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  /* ── CHANGE PASSWORD (first login) ── */
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");

    if (newPw.length < 6) return setError("Password must be at least 6 characters.");
    if (newPw !== confirmPw) return setError("Passwords do not match.");

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://127.0.0.1:5000/changePassword",
        { current_password: password, new_password: newPw },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess("Password changed! Redirecting…");
      const role = localStorage.getItem("role");
      setTimeout(() => {
        navigate(role === "admin" ? "/admin" : "/dashboard");
      }, 900);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to change password.");
    } finally {
      setLoading(false);
    }
  };

  /* ── RENDER: CHANGE PASSWORD SCREEN ── */
  if (mode === "change") {
    return (
      <div style={s.page}>
        <div style={s.gridBg} />
        <div style={s.scanline} />
        <div style={s.card}>
          <div style={s.logoWrap}>
            <div style={s.logoIcon}><FaKey size={24} color="#60a5fa" /></div>
            <div>
              <p style={s.logoLabel}>DIGITAL FORENSIC SYSTEM</p>
              <h1 style={s.logoTitle}>Set New Password</h1>
            </div>
          </div>
          <div style={s.divider} />
          <h2 style={s.heading}>Change Your Password</h2>
          <p style={s.subheading}>
            Your account was given a temporary password. Please set a new one to continue.
          </p>

          {error   && <div style={s.errorBox}>{error}</div>}
          {success && <div style={s.successBox}>{success}</div>}

          <form onSubmit={handleChangePassword} style={s.form}>
            <PwField label="New Password" show={showNewPw} onToggle={() => setShowNewPw(v => !v)}
              value={newPw} onChange={e => setNewPw(e.target.value)}
              placeholder="At least 6 characters" required />

            <PwField label="Confirm New Password" show={false} onToggle={() => {}}
              value={confirmPw} onChange={e => setConfirmPw(e.target.value)}
              placeholder="Repeat your password" required hideToggle />

            <button type="submit" className="lp-submit" style={s.submitBtn} disabled={loading}>
              {loading
                ? <FaSpinner style={{ animation: "spin 0.8s linear infinite", marginRight: 8 }} />
                : <FaKey style={{ marginRight: 8 }} />
              }
              {loading ? "Saving…" : "Set Password & Enter"}
            </button>
          </form>
          <p style={s.footer}>🔒 Authorised access only · Digital Forensic System</p>
        </div>
      </div>
    );
  }

  /* ── RENDER: NORMAL LOGIN ── */
  return (
    <div style={s.page}>
      <div style={s.gridBg} />
      <div style={s.scanline} />
      <div style={s.card}>

        <div style={s.logoWrap}>
          <div style={s.logoIcon}><FaShieldAlt size={26} color="#60a5fa" /></div>
          <div>
            <p style={s.logoLabel}>DIGITAL FORENSIC SYSTEM</p>
            <h1 style={s.logoTitle}>FORENA Portal</h1>
          </div>
        </div>

        <div style={s.divider} />

        <h2 style={s.heading}>Sign In</h2>
        <p style={s.subheading}>Enter your credentials to access the system.</p>

        {error   && <div style={s.errorBox}>{error}</div>}
        {success && <div style={s.successBox}>{success}</div>}

        <form onSubmit={handleLogin} style={s.form}>

          {/* Email */}
          <div style={{ marginBottom: 16 }}>
            <label style={s.label}>
              <span style={s.labelIcon}><FaEnvelope size={12} /></span>
              Email Address
            </label>
            <div className="lp-input-wrap">
              <input style={s.input} type="email" placeholder="your@email.com"
                value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
          </div>

          {/* Password */}
          <PwField label="Password" show={showPw} onToggle={() => setShowPw(v => !v)}
            value={password} onChange={e => setPassword(e.target.value)}
            placeholder="••••••••" required />

          <button type="submit" className="lp-submit" style={{ ...s.submitBtn, marginTop: 8 }} disabled={loading}>
            {loading
              ? <FaSpinner style={{ animation: "spin 0.8s linear infinite", marginRight: 8 }} />
              : <FaSignInAlt style={{ marginRight: 8 }} />
            }
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p style={s.footer}>🔒 Authorised access only · Digital Forensic System</p>
      </div>
    </div>
  );
}

/* ── Reusable password field ── */
function PwField({ label, show, onToggle, hideToggle, ...inputProps }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={s.label}>
        <span style={s.labelIcon}><FaLock size={12} /></span>
        {label}
      </label>
      <div className="lp-input-wrap" style={{ position: "relative" }}>
        <input style={s.input} type={show ? "text" : "password"} {...inputProps} />
        {!hideToggle && (
          <button type="button" className="lp-eye" style={s.eyeBtn} onClick={onToggle} tabIndex={-1}>
            {show ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
          </button>
        )}
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
    background: "#020617", fontFamily: "'DM Sans', sans-serif",
    position: "relative", overflow: "hidden", padding: 20,
  },
  gridBg: {
    position: "absolute", inset: 0,
    backgroundImage:
      "linear-gradient(rgba(30,64,175,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(30,64,175,0.07) 1px, transparent 1px)",
    backgroundSize: "40px 40px", zIndex: 0,
  },
  scanline: {
    position: "absolute", left: 0, right: 0, height: "20%",
    background: "linear-gradient(transparent, rgba(59,130,246,0.03), transparent)",
    animation: "scanline 6s linear infinite", zIndex: 0, pointerEvents: "none",
  },
  card: {
    position: "relative", zIndex: 1, width: "100%", maxWidth: 420,
    background: "rgba(10,18,35,0.95)", border: "1px solid #1e293b",
    borderRadius: 18, padding: "36px 32px 28px",
    boxShadow: "0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(59,130,246,0.06)",
    animation: "fadeUp 0.5s cubic-bezier(0.22,1,0.36,1)", backdropFilter: "blur(12px)",
  },
  logoWrap: { display: "flex", alignItems: "center", gap: 14, marginBottom: 20 },
  logoIcon: {
    width: 52, height: 52,
    background: "linear-gradient(135deg, #0c1e3d, #1a3a6e)",
    border: "1px solid #1e3a5f", borderRadius: 14,
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0, boxShadow: "0 0 18px rgba(59,130,246,0.2)",
  },
  logoLabel: { margin: 0, fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", color: "#475569", textTransform: "uppercase" },
  logoTitle: { margin: "3px 0 0", fontSize: 20, fontFamily: "'Syne', sans-serif", fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.02em" },
  divider: { height: 1, background: "#1e293b", marginBottom: 22 },
  heading: { margin: "0 0 4px", fontSize: 22, fontFamily: "'Syne', sans-serif", fontWeight: 700, color: "#f1f5f9" },
  subheading: { margin: "0 0 20px", fontSize: 13, color: "#64748b" },
  errorBox: {
    background: "rgba(127,29,29,0.4)", border: "1px solid #7f1d1d",
    color: "#fca5a5", borderRadius: 9, padding: "10px 14px", fontSize: 13, marginBottom: 16,
  },
  successBox: {
    background: "rgba(5,46,22,0.5)", border: "1px solid #166534",
    color: "#86efac", borderRadius: 9, padding: "10px 14px", fontSize: 13, marginBottom: 16,
  },
  form: { display: "flex", flexDirection: "column" },
  label: {
    display: "flex", alignItems: "center", fontSize: 11, fontWeight: 700,
    color: "#94a3b8", marginBottom: 7, textTransform: "uppercase", letterSpacing: "0.07em",
  },
  labelIcon: { marginRight: 6, color: "#60a5fa" },
  input: {
    width: "100%", background: "#071020", border: "1px solid #1e293b",
    borderRadius: 9, padding: "11px 14px", color: "#f1f5f9", fontSize: 14,
    transition: "border-color 0.2s, box-shadow 0.2s", boxSizing: "border-box",
    fontFamily: "'DM Sans', sans-serif",
  },
  eyeBtn: {
    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
    background: "none", border: "none", color: "#475569", cursor: "pointer",
    padding: 0, display: "flex", alignItems: "center", transition: "color 0.15s",
  },
  submitBtn: {
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: "13px",
    background: "linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%)",
    color: "white", border: "none", borderRadius: 10,
    fontWeight: 700, fontSize: 15, cursor: "pointer",
    transition: "filter 0.2s, transform 0.2s, box-shadow 0.2s",
    fontFamily: "'Syne', sans-serif", letterSpacing: "0.01em",
    boxShadow: "0 4px 18px rgba(37,99,235,0.3)",
  },
  footer: { textAlign: "center", fontSize: 11, color: "#334155", marginTop: 20, letterSpacing: "0.04em" },
};
