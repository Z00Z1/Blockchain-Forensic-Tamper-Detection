import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  FaSearch, FaHashtag, FaFolder, FaSpinner,
  FaCheckCircle, FaTimesCircle, FaFile, FaTimes,
  FaUpload, FaShieldAlt, FaLink, FaExclamationTriangle
} from "react-icons/fa";

const injectStyles = () => {
  if (document.getElementById("ve-styles")) return;
  const s = document.createElement("style");
  s.id = "ve-styles";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
    @keyframes fadeSlideIn { from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)} }
    @keyframes spin { to{transform:rotate(360deg)} }
    @keyframes pulse { 0%,100%{opacity:0.8;transform:scale(1)}50%{opacity:1;transform:scale(1.04)} }
    .ve-input:focus { border-color:#3b82f6!important;box-shadow:0 0 0 3px rgba(59,130,246,0.15)!important;outline:none; }
    .ve-btn:hover:not(:disabled) { filter:brightness(1.12);transform:translateY(-1px); }
    .ve-btn:disabled { opacity:0.6;cursor:not-allowed; }
    .ve-dropzone:hover { border-color:#3b82f6!important;background:rgba(59,130,246,0.06)!important; }
    .ve-dropzone.drag-over { border-color:#60a5fa!important;background:rgba(59,130,246,0.1)!important; }
  `;
  document.head.appendChild(s);
};

export default function VerifyEvidence() {
  useEffect(() => { injectStyles(); }, []);

  const [caseId, setCaseId] = useState("");
  const [evidenceId, setEvidenceId] = useState("");
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef();

  const handleFile = (f) => { if (f) setFile(f); };

  const handleDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!evidenceId || !caseId || !file) {
      setResult({ status: "error", message: "Please provide Case ID, Evidence ID, and file." });
      return;
    }
    const formData = new FormData();
    formData.append("evidence_id", evidenceId);
    formData.append("case_id", caseId);
    formData.append("file", file);
    setLoading(true);
    setResult(null);
    try {
      const res = await axios.post("http://127.0.0.1:5000/verifyEvidence", formData, {
        headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const rawStatus = res.data.status?.toLowerCase() || "";
      let normalizedStatus = "error";
      if (rawStatus.includes("trusted")) normalizedStatus = "trusted";
      else if (rawStatus.includes("mismatch")) normalizedStatus = "mismatch";
      else if (rawStatus.includes("compromised")) normalizedStatus = "compromised";
      setResult({ ...res.data, status: normalizedStatus });
    } catch (err) {
      setResult({ status: "error", message: err.response?.data?.error || err.response?.data?.message || err.message });
    } finally {
      setLoading(false);
    }
  };

  const statusConfig = {
    trusted:     { color: "#22c55e", bg: "#041a10", border: "#166534", icon: <FaCheckCircle size={28} color="#22c55e" />, label: "Trusted Evidence", desc: "The file matches the blockchain record. Evidence is intact." },
    mismatch:    { color: "#f59e0b", bg: "#1c1007", border: "#92400e", icon: <FaExclamationTriangle size={28} color="#f59e0b" />, label: "Hash Mismatch", desc: "The file hash does not match the blockchain record." },
    compromised: { color: "#ef4444", bg: "#1c0404", border: "#7f1d1d", icon: <FaTimesCircle size={28} color="#ef4444" />, label: "Evidence Compromised", desc: "The file has been tampered with or is not authentic." },
    error:       { color: "#94a3b8", bg: "#0d1b2e", border: "#1e293b", icon: <FaExclamationTriangle size={28} color="#94a3b8" />, label: "Error", desc: "" },
  };

  const cfg = result ? (statusConfig[result.status] || statusConfig.error) : null;

  return (
    <div style={s.page}>
      {/* HEADER */}
      <div style={s.pageHeader}>
        <div style={s.headerLeft}>
          <div style={s.iconWrap}><FaSearch size={20} color="#3b82f6" /></div>
          <div>
            <h1 style={s.pageTitle}>Verify Evidence</h1>
            <p style={s.pageSubtitle}>Validate digital evidence integrity against the blockchain</p>
          </div>
        </div>
      </div>

      <div style={s.grid}>
        {/* FORM */}
        <div style={s.card}>
          <div style={s.cardHeader}>
            <FaShieldAlt size={15} color="#60a5fa" />
            <span style={s.cardTitle}>Verification Input</span>
          </div>

          <form onSubmit={handleVerify}>
            <div style={s.row}>
              <Field label="Case ID" icon={<FaFolder size={11} />}>
                <input className="ve-input" style={s.input} type="text" placeholder="e.g. CASE-2025-001" value={caseId} onChange={(e) => setCaseId(e.target.value)} required />
              </Field>
              <Field label="Evidence ID" icon={<FaHashtag size={11} />}>
                <input className="ve-input" style={s.input} type="text" placeholder="e.g. 1001" value={evidenceId} onChange={(e) => setEvidenceId(e.target.value)} required />
              </Field>
            </div>

            {/* DROP ZONE */}
            <div style={{ marginBottom: 24 }}>
              <label style={s.label}><FaFile size={11} style={{ marginRight: 6, color: "#60a5fa" }} />Evidence File to Verify</label>
              <div
                className={`ve-dropzone${dragOver ? " drag-over" : ""}`}
                style={s.dropzone}
                onClick={() => fileInputRef.current.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
              >
                {file ? (
                  <div style={s.filePreview}>
                    <FaFile size={20} color="#3b82f6" />
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: 14, color: "#e2e8f0", fontWeight: 600 }}>{file.name}</p>
                      <p style={{ margin: "3px 0 0", fontSize: 12, color: "#64748b" }}>{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setFile(null); }}
                      style={s.removeFile}
                    >
                      <FaTimes size={12} />
                    </button>
                  </div>
                ) : (
                  <div style={s.dropPlaceholder}>
                    <FaUpload size={24} color="#334155" />
                    <p style={{ margin: "10px 0 4px", fontSize: 14, color: "#64748b", fontWeight: 600 }}>Drop file here or click to browse</p>
                    <p style={{ margin: 0, fontSize: 12, color: "#334155" }}>This will be hashed and compared against the blockchain</p>
                  </div>
                )}
              </div>
              <input ref={fileInputRef} type="file" style={{ display: "none" }} onChange={(e) => handleFile(e.target.files[0])} />
            </div>

            <button type="submit" className="ve-btn" style={s.submitBtn} disabled={loading}>
              {loading
                ? <><FaSpinner style={{ animation: "spin 0.8s linear infinite", marginRight: 8 }} />Verifying…</>
                : <><FaSearch style={{ marginRight: 8 }} />Verify Evidence</>
              }
            </button>
          </form>
        </div>

        {/* RESULT + INFO */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, flex: 1, minWidth: 260 }}>
          {/* RESULT */}
          {result && cfg && (
            <div style={{ ...s.resultCard, background: cfg.bg, borderColor: cfg.border }}>
              <div style={s.resultIconRow}>
                <div style={{ animation: "pulse 1.6s ease infinite" }}>{cfg.icon}</div>
                <div>
                  <p style={{ margin: 0, fontSize: 16, fontWeight: 800, color: cfg.color, fontFamily: "'Syne',sans-serif" }}>{cfg.label}</p>
                  <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>{cfg.desc || result.message}</p>
                </div>
              </div>

              {result.status !== "error" && (
                <>
                  <div style={s.resultDivider} />
                  <ResultRow
                    icon={<FaShieldAlt size={11} />}
                    label="Hash Match"
                    value={result.hash_match ? "✔ Confirmed" : "✘ Not Matched"}
                    valueColor={result.hash_match ? "#4ade80" : "#f87171"}
                  />
                  <ResultRow
                    icon={<FaLink size={11} />}
                    label="Blockchain Hash"
                    value={result.blockchain_hash || "N/A"}
                    mono
                  />
                  <ResultRow
                    icon={<FaFile size={11} />}
                    label="Verified At"
                    value={result.timestamp || "N/A"}
                  />
                </>
              )}
            </div>
          )}

          {/* HOW IT WORKS */}
          <div style={s.infoCard}>
            <p style={s.infoTitle}>🔍 Verification Process</p>
            <div style={s.stepList}>
              {[
                "Your file is hashed with SHA-256 locally",
                "Hash is compared to the blockchain record",
                "Match = Trusted · Mismatch = Compromised",
                "Result is logged to chain of custody",
              ].map((step, i) => (
                <div key={i} style={s.step}>
                  <span style={s.stepNum}>{i + 1}</span>
                  <span style={{ fontSize: 13, color: "#64748b" }}>{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, icon, children }) {
  return (
    <div style={{ marginBottom: 16, flex: 1 }}>
      <label style={{ display: "flex", alignItems: "center", fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 7, textTransform: "uppercase", letterSpacing: "0.07em" }}>
        <span style={{ marginRight: 6, color: "#60a5fa" }}>{icon}</span>{label}
      </label>
      {children}
    </div>
  );
}

function ResultRow({ icon, label, value, mono, valueColor }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
        <span style={{ color: "#475569" }}>{icon}</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</span>
      </div>
      <p style={{ margin: 0, fontSize: 12, color: valueColor || "#94a3b8", fontFamily: mono ? "monospace" : "inherit", wordBreak: "break-all", lineHeight: 1.5 }}>{value}</p>
    </div>
  );
}

const s = {
  page: { fontFamily: "'DM Sans',sans-serif", minHeight: "100%", color: "#e2e8f0", animation: "fadeSlideIn 0.4s ease" },
  pageHeader: { display: "flex", alignItems: "center", marginBottom: 28, gap: 12 },
  headerLeft: { display: "flex", alignItems: "center", gap: 14 },
  iconWrap: {
    width: 48, height: 48, borderRadius: 12,
    background: "linear-gradient(135deg,#0c1e3d,#1a3a6e)", border: "1px solid #1e3a5f",
    display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 0 18px rgba(59,130,246,0.2)",
  },
  pageTitle: { margin: 0, fontSize: 26, fontFamily: "'Syne',sans-serif", fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.02em" },
  pageSubtitle: { margin: "3px 0 0", fontSize: 13, color: "#64748b" },
  grid: { display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" },
  card: { flex: 2, minWidth: 300, background: "#0d1b2e", border: "1px solid #1e293b", borderRadius: 14, padding: "24px", boxShadow: "0 4px 24px rgba(0,0,0,0.3)" },
  cardHeader: { display: "flex", alignItems: "center", gap: 10, marginBottom: 20 },
  cardTitle: { fontSize: 15, fontFamily: "'Syne',sans-serif", fontWeight: 700, color: "#e2e8f0" },
  row: { display: "flex", gap: 14 },
  label: { display: "flex", alignItems: "center", fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 7, textTransform: "uppercase", letterSpacing: "0.07em" },
  input: {
    width: "100%", background: "#071020", border: "1px solid #1e293b", borderRadius: 9,
    padding: "11px 14px", color: "#f1f5f9", fontSize: 14,
    transition: "border-color 0.2s, box-shadow 0.2s", boxSizing: "border-box", fontFamily: "'DM Sans',sans-serif",
  },
  dropzone: {
    border: "1.5px dashed #1e293b", borderRadius: 10, padding: "24px",
    cursor: "pointer", transition: "border-color 0.2s, background 0.2s",
    background: "#071020", textAlign: "center",
  },
  dropPlaceholder: { display: "flex", flexDirection: "column", alignItems: "center", padding: "8px 0" },
  filePreview: { display: "flex", alignItems: "center", gap: 12, textAlign: "left" },
  removeFile: {
    background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
    color: "#f87171", borderRadius: 6, cursor: "pointer",
    width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  submitBtn: {
    display: "flex", alignItems: "center", justifyContent: "center",
    width: "100%", padding: "13px",
    background: "linear-gradient(135deg,#1d4ed8,#2563eb)",
    color: "white", border: "none", borderRadius: 10,
    fontWeight: 700, fontSize: 15, cursor: "pointer",
    transition: "filter 0.2s, transform 0.15s", fontFamily: "'Syne',sans-serif",
  },
  resultCard: { borderRadius: 14, border: "1px solid", padding: "20px", boxShadow: "0 4px 24px rgba(0,0,0,0.3)" },
  resultIconRow: { display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 8 },
  resultDivider: { height: 1, background: "rgba(255,255,255,0.07)", margin: "14px 0" },
  infoCard: { background: "#0d1b2e", border: "1px solid #1e293b", borderRadius: 14, padding: "20px", boxShadow: "0 4px 24px rgba(0,0,0,0.3)" },
  infoTitle: { margin: "0 0 14px", fontSize: 13, fontWeight: 700, color: "#60a5fa" },
  stepList: { display: "flex", flexDirection: "column", gap: 10 },
  step: { display: "flex", alignItems: "flex-start", gap: 10 },
  stepNum: {
    width: 22, height: 22, borderRadius: "50%", background: "rgba(59,130,246,0.15)",
    border: "1px solid rgba(59,130,246,0.3)", color: "#60a5fa",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 11, fontWeight: 800, flexShrink: 0,
  },
};
