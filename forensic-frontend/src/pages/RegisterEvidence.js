import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  FaUpload, FaHashtag, FaFolder, FaAlignLeft,
  FaCheckCircle, FaTimesCircle, FaSpinner,
  FaFile, FaTimes, FaLink, FaShieldAlt
} from "react-icons/fa";

const injectStyles = () => {
  if (document.getElementById("re-styles")) return;
  const s = document.createElement("style");
  s.id = "re-styles";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
    @keyframes fadeSlideIn { from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)} }
    @keyframes spin { to{transform:rotate(360deg)} }
    .re-input:focus { border-color:#3b82f6!important;box-shadow:0 0 0 3px rgba(59,130,246,0.15)!important;outline:none; }
    .re-btn:hover:not(:disabled) { filter:brightness(1.12);transform:translateY(-1px); }
    .re-btn:disabled { opacity:0.6;cursor:not-allowed; }
    .re-dropzone:hover { border-color:#3b82f6!important;background:rgba(59,130,246,0.06)!important; }
    .re-dropzone.drag-over { border-color:#60a5fa!important;background:rgba(59,130,246,0.1)!important; }
  `;
  document.head.appendChild(s);
};

export default function RegisterEvidence() {
  useEffect(() => { injectStyles(); }, []);

  const [evidenceId, setEvidenceId] = useState("");
  const [caseId, setCaseId] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // { cid, hash, tx }
  const [inlineError, setInlineError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef();

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const handleFile = (f) => {
    if (f) setFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!evidenceId || !caseId || !file || !description) {
      showToast("error", "Please fill in all fields including the file.");
      return;
    }
    setLoading(true);
    setResult(null);
    setInlineError("");
    const formData = new FormData();
    formData.append("evidence_id", evidenceId);
    formData.append("case_id", caseId);
    formData.append("description", description);
    formData.append("file", file);
    try {
      const res = await axios.post("http://127.0.0.1:5000/registerEvidence", formData, {
        headers: { "Content-Type": "multipart/form-data", Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      showToast("success", res.data.message || "Evidence registered successfully.");
      setResult({ cid: res.data.cid, hash: res.data.hash, tx: res.data.blockchain_tx });
      setEvidenceId(""); setCaseId(""); setDescription(""); setFile(null);
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || err.message;
      const status = err.response?.status;
      if (status === 409) {
        // Duplicate evidence ID — show prominent inline error
        setInlineError(msg);
      } else {
        showToast("error", msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      {/* TOAST */}
      {toast && (
        <div style={{ ...s.toast, ...(toast.type === "success" ? s.toastSuccess : s.toastError) }}>
          {toast.type === "success" ? <FaCheckCircle style={{ marginRight: 8, flexShrink: 0 }} /> : <FaTimesCircle style={{ marginRight: 8, flexShrink: 0 }} />}
          {toast.msg}
        </div>
      )}

      {/* HEADER */}
      <div style={s.pageHeader}>
        <div style={s.headerLeft}>
          <div style={s.iconWrap}><FaUpload size={20} color="#3b82f6" /></div>
          <div>
            <h1 style={s.pageTitle}>Register Evidence</h1>
            <p style={s.pageSubtitle}>Upload and secure digital evidence to the blockchain</p>
          </div>
        </div>
      </div>

      <div style={s.grid}>
        {/* FORM */}
        <div style={s.card}>
          <div style={s.cardHeader}>
            <FaShieldAlt size={15} color="#60a5fa" />
            <span style={s.cardTitle}>Evidence Details</span>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={s.row}>
              <Field label="Evidence ID" icon={<FaHashtag size={11} />}>
                <input className="re-input" style={s.input} type="text" placeholder="e.g. 1001" value={evidenceId} onChange={(e) => setEvidenceId(e.target.value)} required />
              </Field>
              <Field label="Case ID" icon={<FaFolder size={11} />}>
                <input className="re-input" style={s.input} type="text" placeholder="e.g. CASE-2025-001" value={caseId} onChange={(e) => setCaseId(e.target.value)} required />
              </Field>
            </div>

            <Field label="Description" icon={<FaAlignLeft size={11} />}>
              <textarea className="re-input" style={s.textarea} placeholder="Describe the evidence in detail…" value={description} onChange={(e) => setDescription(e.target.value)} required />
            </Field>

            {/* DROP ZONE */}
            <div style={s.fieldGroup}>
              <label style={s.label}><FaFile size={11} style={{ marginRight: 6, color: "#60a5fa" }} />Evidence File</label>
              <div
                className={`re-dropzone${dragOver ? " drag-over" : ""}`}
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
                    <p style={{ margin: 0, fontSize: 12, color: "#334155" }}>Any file type supported</p>
                  </div>
                )}
              </div>
              <input ref={fileInputRef} type="file" style={{ display: "none" }} onChange={(e) => handleFile(e.target.files[0])} />
            </div>

            {/* DUPLICATE EVIDENCE ERROR */}
            {inlineError && (
              <div style={s.dupError}>
                <FaTimesCircle size={16} style={{ flexShrink: 0 }} />
                <div>
                  <p style={{ margin: "0 0 2px", fontWeight: 700, fontSize: 13 }}>Duplicate Evidence ID</p>
                  <p style={{ margin: 0, fontSize: 12, opacity: 0.85 }}>{inlineError}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setInlineError("")}
                  style={{ background: "none", border: "none", color: "#fca5a5", cursor: "pointer", padding: 0, marginLeft: "auto", flexShrink: 0 }}
                >
                  <FaTimes size={13} />
                </button>
              </div>
            )}

            <button type="submit" className="re-btn" style={s.submitBtn} disabled={loading}>
              {loading
                ? <><FaSpinner style={{ animation: "spin 0.8s linear infinite", marginRight: 8 }} />Uploading & Securing…</>
                : <><FaUpload style={{ marginRight: 8 }} />Register Evidence</>
              }
            </button>
          </form>
        </div>

        {/* SIDE PANEL */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Result */}
          {result && (
            <div style={s.resultCard}>
              <div style={s.resultHeader}>
                <FaCheckCircle size={16} color="#22c55e" />
                <span style={{ ...s.cardTitle, color: "#4ade80" }}>Registered Successfully</span>
              </div>
              <ResultRow label="File Hash" value={result.hash} mono />
              <ResultRow label="IPFS CID" value={result.cid} mono />
              <ResultRow label="Blockchain TX" value={result.tx} mono />
            </div>
          )}

          {/* Info */}
          <div style={s.infoCard}>
            <p style={s.infoTitle}>🔐 How it works</p>
            <div style={s.stepList}>
              {[
                "File is hashed using SHA-256",
                "Hash and file are stored on IPFS (encrypted)",
                "Hash is recorded on the blockchain",
                "Custody log entry is created",
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
      <label style={{
        display: "flex", alignItems: "center",
        fontSize: 11, fontWeight: 700, color: "#94a3b8",
        marginBottom: 7, textTransform: "uppercase", letterSpacing: "0.07em",
      }}>
        <span style={{ marginRight: 6, color: "#60a5fa" }}>{icon}</span>{label}
      </label>
      {children}
    </div>
  );
}

function ResultRow({ label, value, mono }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <p style={{ margin: "0 0 4px", fontSize: 10, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em" }}>{label}</p>
      <p style={{ margin: 0, fontSize: 12, color: "#94a3b8", fontFamily: mono ? "monospace" : "inherit", wordBreak: "break-all", lineHeight: 1.5 }}>
        {value || "N/A"}
      </p>
    </div>
  );
}

const s = {
  page: { fontFamily: "'DM Sans',sans-serif", minHeight: "100%", color: "#e2e8f0", animation: "fadeSlideIn 0.4s ease" },
  toast: {
    position: "fixed", top: 20, right: 24, zIndex: 9999,
    display: "flex", alignItems: "center", padding: "12px 18px",
    borderRadius: 10, fontSize: 14, fontWeight: 500, maxWidth: 380,
    boxShadow: "0 8px 30px rgba(0,0,0,0.4)", animation: "fadeSlideIn 0.3s ease",
  },
  toastSuccess: { background: "#052e16", border: "1px solid #16a34a", color: "#86efac" },
  toastError:   { background: "#450a0a", border: "1px solid #dc2626", color: "#fca5a5" },
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
  fieldGroup: { marginBottom: 16 },
  label: { display: "flex", alignItems: "center", fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 7, textTransform: "uppercase", letterSpacing: "0.07em" },
  input: {
    width: "100%", background: "#071020", border: "1px solid #1e293b", borderRadius: 9,
    padding: "11px 14px", color: "#f1f5f9", fontSize: 14,
    transition: "border-color 0.2s, box-shadow 0.2s", boxSizing: "border-box", fontFamily: "'DM Sans',sans-serif",
  },
  textarea: {
    width: "100%", background: "#071020", border: "1px solid #1e293b", borderRadius: 9,
    padding: "11px 14px", color: "#f1f5f9", fontSize: 14,
    transition: "border-color 0.2s, box-shadow 0.2s", boxSizing: "border-box", fontFamily: "'DM Sans',sans-serif",
    height: 90, resize: "vertical",
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
    width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  submitBtn: {
    display: "flex", alignItems: "center", justifyContent: "center",
    width: "100%", marginTop: 8, padding: "13px",
    background: "linear-gradient(135deg,#1d4ed8,#2563eb)",
    color: "white", border: "none", borderRadius: 10,
    fontWeight: 700, fontSize: 15, cursor: "pointer",
    transition: "filter 0.2s, transform 0.15s", fontFamily: "'Syne',sans-serif",
  },
  dupError: {
    display: "flex", alignItems: "flex-start", gap: 12,
    background: "#450a0a", border: "1px solid #dc2626",
    color: "#fca5a5", borderRadius: 10, padding: "12px 14px",
    marginBottom: 12, animation: "fadeSlideIn 0.3s ease",
  },
  resultCard: {
    flex: 1, minWidth: 240, background: "#041a10", border: "1px solid #166534",
    borderRadius: 14, padding: "20px", boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
  },
  resultHeader: { display: "flex", alignItems: "center", gap: 10, marginBottom: 16 },
  infoCard: {
    flex: 1, minWidth: 240, background: "#0d1b2e", border: "1px solid #1e293b",
    borderRadius: 14, padding: "20px", boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
  },
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
