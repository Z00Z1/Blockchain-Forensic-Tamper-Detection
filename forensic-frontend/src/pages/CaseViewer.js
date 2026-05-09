import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  FaFolder, FaSearch, FaSpinner, FaTimesCircle,
  FaUser, FaCalendarAlt, FaHashtag, FaFileAlt,
  FaLink, FaChevronRight, FaExclamationTriangle
} from "react-icons/fa";

const injectStyles = () => {
  if (document.getElementById("cv-styles")) return;
  const s = document.createElement("style");
  s.id = "cv-styles";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
    @keyframes fadeSlideIn { from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)} }
    @keyframes spin { to{transform:rotate(360deg)} }
    .cv-input:focus { border-color:#3b82f6!important;box-shadow:0 0 0 3px rgba(59,130,246,0.15)!important;outline:none; }
    .cv-btn:hover:not(:disabled) { filter:brightness(1.12);transform:translateY(-1px); }
    .cv-row:hover { background:rgba(30,64,175,0.09)!important;cursor:pointer; }
    .cv-row:hover .cv-row-arrow { opacity:1!important; }
  `;
  document.head.appendChild(s);
};

export default function CaseViewer() {
  useEffect(() => { injectStyles(); }, []);

  const [caseNumber, setCaseNumber] = useState("");
  const [caseData, setCaseData] = useState(null);
  const [evidences, setEvidences] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const fetchCase = async (e) => {
    e.preventDefault();
    if (!caseNumber) { setError("Please enter a case number."); return; }
    setLoading(true); setError(""); setCaseData(null); setEvidences([]);
    try {
      const res = await axios.get(
        `http://127.0.0.1:5000/caseEvidences?case_number=${caseNumber}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      setCaseData(res.data.case);
      setEvidences(res.data.evidences);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || "Failed to fetch case.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      {/* HEADER */}
      <div style={s.pageHeader}>
        <div style={s.headerLeft}>
          <div style={s.iconWrap}><FaFolder size={22} color="#3b82f6" /></div>
          <div>
            <h1 style={s.pageTitle}>Case Viewer</h1>
            <p style={s.pageSubtitle}>Look up cases and their associated evidence</p>
          </div>
        </div>
      </div>

      {/* SEARCH */}
      <div style={s.card}>
        <form onSubmit={fetchCase} style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <label style={s.label}>
              <FaHashtag size={11} style={{ marginRight: 6, color: "#60a5fa" }} />
              Case Number
            </label>
            <div style={{ position: "relative" }}>
              <FaSearch size={13} color="#475569" style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
              <input
                className="cv-input"
                style={{ ...s.input, paddingLeft: 36 }}
                type="text"
                placeholder="Enter case number to search…"
                value={caseNumber}
                onChange={(e) => setCaseNumber(e.target.value)}
              />
            </div>
          </div>
          <button type="submit" className="cv-btn" style={s.searchBtn} disabled={loading}>
            {loading
              ? <FaSpinner style={{ animation: "spin 0.8s linear infinite" }} />
              : <><FaSearch style={{ marginRight: 8 }} />Search</>
            }
          </button>
        </form>
      </div>

      {/* ERROR */}
      {error && (
        <div style={s.errorBox}>
          <FaTimesCircle style={{ marginRight: 10, flexShrink: 0 }} />
          {error}
        </div>
      )}

      {/* CASE INFO */}
      {caseData && (
        <div style={{ ...s.card, marginTop: 20 }}>
          <div style={s.cardHeader}>
            <FaFolder size={15} color="#60a5fa" />
            <span style={s.cardTitle}>Case Details</span>
            <span style={s.caseNumberBadge}>#{caseData.case_number}</span>
          </div>

          <div style={s.detailsGrid}>
            <DetailItem icon={<FaHashtag size={13} />} label="Case Number" value={caseData.case_number} />
            <DetailItem icon={<FaUser size={13} />} label="Created By" value={caseData.created_by} />
            <DetailItem
              icon={<FaCalendarAlt size={13} />}
              label="Created At"
              value={caseData.created_at ? new Date(caseData.created_at).toLocaleString() : "N/A"}
            />
            <DetailItem icon={<FaFileAlt size={13} />} label="Total Evidence" value={`${evidences.length} item(s)`} />
          </div>

          <div style={s.descriptionBox}>
            <p style={s.descriptionLabel}>Description</p>
            <p style={s.descriptionText}>{caseData.description || "No description provided."}</p>
          </div>
        </div>
      )}

      {/* EVIDENCE TABLE */}
      {evidences.length > 0 && (
        <div style={{ ...s.card, marginTop: 20 }}>
          <div style={s.cardHeader}>
            <FaFileAlt size={15} color="#60a5fa" />
            <span style={s.cardTitle}>Evidence List</span>
            <span style={s.countBadge}>{evidences.length}</span>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={s.table}>
              <thead>
                <tr>
                  {["#", "Evidence ID", "Description", "File Hash", "CID", ""].map((h) => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {evidences.map((ev, idx) => (
                  <tr
                    key={ev.evidence_id}
                    className="cv-row"
                    style={s.tr}
                    onClick={() => navigate(`/timeline?evidence_id=${ev.evidence_id}`)}
                  >
                    <td style={{ ...s.td, color: "#475569", width: 40 }}>{idx + 1}</td>
                    <td style={s.td}>
                      <span style={s.evidenceBadge}>{ev.evidence_id}</span>
                    </td>
                    <td style={{ ...s.td, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {ev.description || "—"}
                    </td>
                    <td style={{ ...s.td, fontFamily: "monospace", color: "#60a5fa", fontSize: 12 }}>
                      {ev.file_hash ? ev.file_hash.substring(0, 14) + "…" : "N/A"}
                    </td>
                    <td style={{ ...s.td, fontFamily: "monospace", color: "#818cf8", fontSize: 12 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <FaLink size={10} />
                        {ev.cid ? ev.cid.substring(0, 14) + "…" : "N/A"}
                      </span>
                    </td>
                    <td style={s.td}>
                      <FaChevronRight className="cv-row-arrow" size={12} color="#3b82f6" style={{ opacity: 0, transition: "opacity 0.15s" }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={s.tableNote}>Click any row to view its timeline</p>
        </div>
      )}

      {/* EMPTY */}
      {caseData && evidences.length === 0 && (
        <div style={s.emptyBox}>
          <FaExclamationTriangle size={28} color="#f59e0b" />
          <p style={{ margin: "12px 0 0", color: "#94a3b8" }}>No evidence found for this case.</p>
        </div>
      )}
    </div>
  );
}

function DetailItem({ icon, label, value }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#475569", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em" }}>
        <span style={{ color: "#60a5fa" }}>{icon}</span>{label}
      </span>
      <span style={{ fontSize: 14, color: "#e2e8f0", fontWeight: 500 }}>{value}</span>
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
  card: { background: "#0d1b2e", border: "1px solid #1e293b", borderRadius: 14, padding: "24px", boxShadow: "0 4px 24px rgba(0,0,0,0.3)" },
  label: { display: "flex", alignItems: "center", fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.07em" },
  input: {
    width: "100%", background: "#071020", border: "1px solid #1e293b", borderRadius: 9,
    padding: "11px 14px", color: "#f1f5f9", fontSize: 14,
    transition: "border-color 0.2s, box-shadow 0.2s", boxSizing: "border-box", fontFamily: "'DM Sans',sans-serif",
  },
  searchBtn: {
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: "11px 24px", background: "linear-gradient(135deg,#1d4ed8,#2563eb)",
    color: "white", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14,
    cursor: "pointer", transition: "filter 0.2s, transform 0.15s", fontFamily: "'Syne',sans-serif",
    whiteSpace: "nowrap", height: 44,
  },
  errorBox: {
    display: "flex", alignItems: "center", background: "#450a0a",
    border: "1px solid #dc2626", color: "#fca5a5", borderRadius: 10,
    padding: "12px 16px", fontSize: 14, marginTop: 16,
  },
  cardHeader: { display: "flex", alignItems: "center", gap: 10, marginBottom: 20 },
  cardTitle: { fontSize: 15, fontFamily: "'Syne',sans-serif", fontWeight: 700, color: "#e2e8f0", flex: 1 },
  caseNumberBadge: {
    background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)",
    color: "#60a5fa", padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700,
  },
  countBadge: {
    background: "#0f2040", border: "1px solid #1e3a5f",
    color: "#7dd3fc", padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700,
  },
  detailsGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 20, marginBottom: 20 },
  descriptionBox: { background: "#071020", border: "1px solid #1e293b", borderRadius: 9, padding: "14px" },
  descriptionLabel: { margin: "0 0 6px", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em" },
  descriptionText: { margin: 0, fontSize: 14, color: "#94a3b8", lineHeight: 1.7 },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", padding: "10px 14px", fontSize: 11, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em", borderBottom: "1px solid #1e293b", whiteSpace: "nowrap" },
  tr: { transition: "background 0.15s" },
  td: { padding: "13px 14px", fontSize: 14, color: "#e2e8f0", borderBottom: "1px solid #0f1f35", whiteSpace: "nowrap" },
  evidenceBadge: { background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", color: "#a5b4fc", padding: "2px 9px", borderRadius: 6, fontSize: 12, fontWeight: 700 },
  tableNote: { margin: "12px 0 0", fontSize: 12, color: "#334155", textAlign: "right" },
  emptyBox: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px", background: "#0d1b2e", border: "1px solid #1e293b", borderRadius: 14, marginTop: 20 },
};
