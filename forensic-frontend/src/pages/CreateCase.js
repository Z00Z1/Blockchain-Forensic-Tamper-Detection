import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaFolder, FaHashtag, FaAlignLeft, FaCheckCircle, FaTimesCircle, FaSpinner, FaPlus } from "react-icons/fa";

const injectStyles = () => {
  if (document.getElementById("cc-styles")) return;
  const s = document.createElement("style");
  s.id = "cc-styles";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
    @keyframes fadeSlideIn { from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)} }
    @keyframes spin { to{transform:rotate(360deg)} }
    .cc-input:focus { border-color:#3b82f6!important;box-shadow:0 0 0 3px rgba(59,130,246,0.15)!important;outline:none; }
    .cc-btn:hover:not(:disabled) { filter:brightness(1.12);transform:translateY(-1px); }
    .cc-btn:disabled { opacity:0.6;cursor:not-allowed; }
  `;
  document.head.appendChild(s);
};

export default function CreateCase() {
  useEffect(() => { injectStyles(); }, []);

  const [caseNumber, setCaseNumber] = useState("");
  const [description, setDescription] = useState("");
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!caseNumber || !description) {
      showToast("error", "Please fill in all fields.");
      return;
    }
    setLoading(true);
    const formData = new FormData();
    formData.append("case_number", caseNumber);
    formData.append("description", description);
    formData.append("created_by", user);
    try {
      await axios.post("http://127.0.0.1:5000/createCase", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showToast("success", `Case #${caseNumber} created successfully.`);
      setCaseNumber("");
      setDescription("");
    } catch (err) {
      showToast("error", err.response?.data?.error || "Failed to create case.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      {/* TOAST */}
      {toast && (
        <div style={{ ...s.toast, ...(toast.type === "success" ? s.toastSuccess : s.toastError) }}>
          {toast.type === "success"
            ? <FaCheckCircle style={{ marginRight: 8, flexShrink: 0 }} />
            : <FaTimesCircle style={{ marginRight: 8, flexShrink: 0 }} />}
          {toast.msg}
        </div>
      )}

      {/* PAGE HEADER */}
      <div style={s.pageHeader}>
        <div style={s.headerLeft}>
          <div style={s.iconWrap}><FaFolder size={22} color="#3b82f6" /></div>
          <div>
            <h1 style={s.pageTitle}>Create Case</h1>
            <p style={s.pageSubtitle}>Register a new forensic investigation case</p>
          </div>
        </div>
      </div>

      {/* CARD */}
      <div style={s.card}>
        <form onSubmit={handleSubmit}>
          {/* Case Number */}
          <div style={s.fieldGroup}>
            <label style={s.label}>
              <FaHashtag size={11} style={{ marginRight: 6, color: "#60a5fa" }} />
              Case Number
            </label>
            <input
              className="cc-input"
              style={s.input}
              type="text"
              placeholder="e.g. CASE-2025-001"
              value={caseNumber}
              onChange={(e) => setCaseNumber(e.target.value)}
              required
            />
          </div>

          {/* Description */}
          <div style={s.fieldGroup}>
            <label style={s.label}>
              <FaAlignLeft size={11} style={{ marginRight: 6, color: "#60a5fa" }} />
              Case Description
            </label>
            <textarea
              className="cc-input"
              style={s.textarea}
              placeholder="Provide a detailed description of the case, including relevant context and objectives..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          {/* Created By (read-only) */}
          <div style={s.infoBanner}>
            <span style={s.infoLabel}>Assigned Investigator:</span>
            <span style={s.infoValue}>{user || "Unknown"}</span>
          </div>

          <button type="submit" className="cc-btn" style={s.submitBtn} disabled={loading}>
            {loading
              ? <><FaSpinner style={{ animation: "spin 0.8s linear infinite", marginRight: 8 }} />Creating…</>
              : <><FaPlus style={{ marginRight: 8 }} />Create Case</>
            }
          </button>
        </form>
      </div>

      {/* TIPS */}
      <div style={s.tipsCard}>
        <p style={s.tipsTitle}>📌 Guidelines</p>
        <ul style={s.tipsList}>
          <li>Use a consistent case numbering format (e.g. CASE-YYYY-NNN).</li>
          <li>Descriptions should be clear and factual for legal traceability.</li>
          <li>Each case number must be unique across the system.</li>
        </ul>
      </div>
    </div>
  );
}

const s = {
  page: {
    fontFamily: "'DM Sans', sans-serif",
    minHeight: "100%",
    color: "#e2e8f0",
    animation: "fadeSlideIn 0.4s ease",
    maxWidth: 700,
  },
  toast: {
    position: "fixed", top: 20, right: 24, zIndex: 9999,
    display: "flex", alignItems: "center",
    padding: "12px 18px", borderRadius: 10, fontSize: 14, fontWeight: 500,
    maxWidth: 380, boxShadow: "0 8px 30px rgba(0,0,0,0.4)",
    animation: "fadeSlideIn 0.3s ease",
  },
  toastSuccess: { background: "#052e16", border: "1px solid #16a34a", color: "#86efac" },
  toastError:   { background: "#450a0a", border: "1px solid #dc2626", color: "#fca5a5" },
  pageHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 12 },
  headerLeft: { display: "flex", alignItems: "center", gap: 14 },
  iconWrap: {
    width: 48, height: 48, borderRadius: 12,
    background: "linear-gradient(135deg,#0c1e3d,#1a3a6e)",
    border: "1px solid #1e3a5f",
    display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 0 18px rgba(59,130,246,0.2)",
  },
  pageTitle: { margin: 0, fontSize: 26, fontFamily: "'Syne',sans-serif", fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.02em" },
  pageSubtitle: { margin: "3px 0 0", fontSize: 13, color: "#64748b" },
  card: {
    background: "#0d1b2e", border: "1px solid #1e293b", borderRadius: 14,
    padding: "28px", boxShadow: "0 4px 24px rgba(0,0,0,0.3)", marginBottom: 20,
  },
  fieldGroup: { marginBottom: 20 },
  label: {
    display: "flex", alignItems: "center",
    fontSize: 11, fontWeight: 700, color: "#94a3b8",
    marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.07em",
  },
  input: {
    width: "100%", background: "#071020", border: "1px solid #1e293b",
    borderRadius: 9, padding: "11px 14px", color: "#f1f5f9", fontSize: 14,
    transition: "border-color 0.2s, box-shadow 0.2s", boxSizing: "border-box",
    fontFamily: "'DM Sans',sans-serif",
  },
  textarea: {
    width: "100%", background: "#071020", border: "1px solid #1e293b",
    borderRadius: 9, padding: "11px 14px", color: "#f1f5f9", fontSize: 14,
    transition: "border-color 0.2s, box-shadow 0.2s", boxSizing: "border-box",
    fontFamily: "'DM Sans',sans-serif", height: 120, resize: "vertical",
  },
  infoBanner: {
    background: "rgba(59,130,246,0.07)", border: "1px solid rgba(59,130,246,0.18)",
    borderRadius: 9, padding: "11px 14px", display: "flex", alignItems: "center",
    gap: 10, marginBottom: 24,
  },
  infoLabel: { fontSize: 12, color: "#64748b", fontWeight: 600 },
  infoValue: { fontSize: 14, color: "#93c5fd", fontWeight: 600 },
  submitBtn: {
    display: "flex", alignItems: "center", justifyContent: "center",
    width: "100%", padding: "13px",
    background: "linear-gradient(135deg,#1d4ed8,#2563eb)",
    color: "white", border: "none", borderRadius: 10,
    fontWeight: 700, fontSize: 15, cursor: "pointer",
    transition: "filter 0.2s, transform 0.15s",
    fontFamily: "'Syne',sans-serif",
  },
  tipsCard: {
    background: "rgba(59,130,246,0.04)", border: "1px solid rgba(59,130,246,0.14)",
    borderRadius: 12, padding: "16px 20px",
  },
  tipsTitle: { margin: "0 0 10px", fontSize: 13, fontWeight: 700, color: "#60a5fa" },
  tipsList: { margin: 0, paddingLeft: 18, color: "#64748b", fontSize: 13, lineHeight: 1.9 },
};
