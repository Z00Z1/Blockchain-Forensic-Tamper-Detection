import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FaClock, FaSearch, FaSpinner, FaTimesCircle,
  FaHashtag, FaCheckCircle, FaExclamationTriangle,
  FaUpload, FaQuestion, FaUser, FaCalendarAlt
} from "react-icons/fa";

const injectStyles = () => {
  if (document.getElementById("tv-styles")) return;
  const s = document.createElement("style");
  s.id = "tv-styles";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
    @keyframes fadeSlideIn { from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)} }
    @keyframes fadeIn { from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:translateX(0)} }
    @keyframes spin { to{transform:rotate(360deg)} }
    .tv-input:focus { border-color:#3b82f6!important;box-shadow:0 0 0 3px rgba(59,130,246,0.15)!important;outline:none; }
    .tv-btn:hover:not(:disabled) { filter:brightness(1.12);transform:translateY(-1px); }
  `;
  document.head.appendChild(s);
};

const ACTION_CONFIG = {
  REGISTERED:           { color: "#3b82f6", bg: "rgba(59,130,246,0.12)",  border: "rgba(59,130,246,0.3)",  icon: <FaUpload size={13} />,             label: "Registered" },
  VERIFIED:             { color: "#22c55e", bg: "rgba(34,197,94,0.1)",     border: "rgba(34,197,94,0.3)",   icon: <FaCheckCircle size={13} />,         label: "Verified" },
  FAILED_VERIFICATION:  { color: "#ef4444", bg: "rgba(239,68,68,0.1)",     border: "rgba(239,68,68,0.3)",   icon: <FaExclamationTriangle size={13} />, label: "Failed Verification" },
};

const getAction = (action) => ACTION_CONFIG[action] || { color: "#64748b", bg: "rgba(100,116,139,0.1)", border: "rgba(100,116,139,0.3)", icon: <FaQuestion size={13} />, label: action };

export default function TimelineViewer() {
  useEffect(() => { injectStyles(); }, []);

  const [caseNumber, setCaseNumber] = useState("");
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [caseInfo, setCaseInfo] = useState(null);

  const fetchTimeline = async (e) => {
    e.preventDefault();
    if (!caseNumber) { setError("Please enter a case number."); return; }
    setLoading(true); setError(""); setTimeline([]); setCaseInfo(null);
    try {
      const res = await axios.get(
        `http://127.0.0.1:5000/caseTimeline?case_number=${caseNumber}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      setTimeline(res.data.timeline);
      setCaseInfo({ case_number: res.data.case_number });
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || "Failed to fetch timeline.");
    } finally {
      setLoading(false);
    }
  };

  // Stats
  const registered  = timeline.filter(t => t.action === "REGISTERED").length;
  const verified    = timeline.filter(t => t.action === "VERIFIED").length;
  const failed      = timeline.filter(t => t.action === "FAILED_VERIFICATION").length;

  return (
    <div style={s.page}>
      {/* HEADER */}
      <div style={s.pageHeader}>
        <div style={s.headerLeft}>
          <div style={s.iconWrap}><FaClock size={22} color="#3b82f6" /></div>
          <div>
            <h1 style={s.pageTitle}>Timeline Viewer</h1>
            <p style={s.pageSubtitle}>Trace the full chain of custody for any case</p>
          </div>
        </div>
      </div>

      {/* SEARCH */}
      <div style={s.card}>
        <form onSubmit={fetchTimeline} style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <label style={s.label}>
              <FaHashtag size={11} style={{ marginRight: 6, color: "#60a5fa" }} />
              Case Number
            </label>
            <div style={{ position: "relative" }}>
              <FaSearch size={13} color="#475569" style={{ position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
              <input
                className="tv-input"
                style={{ ...s.input, paddingLeft: 36 }}
                type="text"
                placeholder="Enter case number…"
                value={caseNumber}
                onChange={(e) => setCaseNumber(e.target.value)}
              />
            </div>
          </div>
          <button type="submit" className="tv-btn" style={s.searchBtn} disabled={loading}>
            {loading
              ? <FaSpinner style={{ animation: "spin 0.8s linear infinite" }} />
              : <><FaSearch style={{ marginRight: 8 }} />Load Timeline</>
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

      {/* STATS ROW */}
      {caseInfo && (
        <div style={s.statsRow}>
          <StatCard label="Total Events" value={timeline.length} color="#60a5fa" />
          <StatCard label="Registered" value={registered} color="#3b82f6" />
          <StatCard label="Verified" value={verified} color="#22c55e" />
          <StatCard label="Failed" value={failed} color="#ef4444" />
        </div>
      )}

      {/* TIMELINE */}
      {timeline.length > 0 && (
        <div style={s.card}>
          <div style={s.cardHeader}>
            <FaClock size={15} color="#60a5fa" />
            <span style={s.cardTitle}>Case #{caseInfo?.case_number} — Chain of Custody</span>
          </div>

          <div style={{ position: "relative" }}>
            {/* vertical line */}
            <div style={s.vertLine} />

            {timeline.map((item, index) => {
              const cfg = getAction(item.action);
              return (
                <div
                  key={index}
                  style={{ ...s.timelineItem, animationDelay: `${index * 0.05}s` }}
                >
                  {/* DOT */}
                  <div style={{ ...s.dot, background: cfg.color, boxShadow: `0 0 10px ${cfg.color}55` }}>
                    <span style={{ color: "white" }}>{cfg.icon}</span>
                  </div>

                  {/* CARD */}
                  <div style={{ ...s.eventCard, borderColor: cfg.border, background: cfg.bg }}>
                    <div style={s.eventTop}>
                      <span style={{ ...s.actionBadge, color: cfg.color, background: "rgba(0,0,0,0.3)", border: `1px solid ${cfg.border}` }}>
                        {cfg.label}
                      </span>
                      <span style={s.evidenceTag}>Evidence #{item.evidence_id}</span>
                    </div>
                    <div style={s.eventMeta}>
                      <span style={s.metaItem}>
                        <FaUser size={10} style={{ marginRight: 5, color: "#60a5fa" }} />
                        {item.performed_by || "Unknown"}
                      </span>
                      <span style={s.metaItem}>
                        <FaCalendarAlt size={10} style={{ marginRight: 5, color: "#60a5fa" }} />
                        {item.timestamp ? new Date(item.timestamp).toLocaleString() : "N/A"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* EMPTY */}
      {caseInfo && timeline.length === 0 && (
        <div style={s.emptyBox}>
          <FaClock size={28} color="#334155" />
          <p style={{ margin: "12px 0 0", color: "#64748b" }}>No timeline events found for this case.</p>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div style={{ ...s.statCard, borderColor: `${color}33` }}>
      <p style={{ margin: 0, fontSize: 28, fontWeight: 800, color, fontFamily: "'Syne',sans-serif" }}>{value}</p>
      <p style={{ margin: "4px 0 0", fontSize: 12, color: "#64748b", fontWeight: 600 }}>{label}</p>
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
  card: { background: "#0d1b2e", border: "1px solid #1e293b", borderRadius: 14, padding: "24px", boxShadow: "0 4px 24px rgba(0,0,0,0.3)", marginTop: 20 },
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
  statsRow: { display: "flex", gap: 14, marginTop: 20, flexWrap: "wrap" },
  statCard: {
    flex: 1, minWidth: 100, background: "#0d1b2e", border: "1px solid",
    borderRadius: 12, padding: "16px 20px", boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
  },
  cardHeader: { display: "flex", alignItems: "center", gap: 10, marginBottom: 24 },
  cardTitle: { fontSize: 15, fontFamily: "'Syne',sans-serif", fontWeight: 700, color: "#e2e8f0" },
  vertLine: {
    position: "absolute", left: 19, top: 0, bottom: 0, width: 2,
    background: "linear-gradient(to bottom, #1e3a5f, #1e293b)",
  },
  timelineItem: {
    display: "flex", alignItems: "flex-start", gap: 20, marginBottom: 16,
    animation: "fadeIn 0.35s ease both",
  },
  dot: {
    width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 1, border: "3px solid #0d1b2e",
  },
  eventCard: {
    flex: 1, borderRadius: 10, border: "1px solid", padding: "12px 16px",
    transition: "transform 0.15s",
  },
  eventTop: { display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" },
  actionBadge: { fontSize: 12, fontWeight: 700, padding: "3px 10px", borderRadius: 20, textTransform: "uppercase", letterSpacing: "0.05em" },
  evidenceTag: { fontSize: 12, color: "#64748b", fontWeight: 500 },
  eventMeta: { display: "flex", gap: 20, flexWrap: "wrap" },
  metaItem: { display: "flex", alignItems: "center", fontSize: 12, color: "#94a3b8" },
  emptyBox: {
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", padding: "48px", background: "#0d1b2e",
    border: "1px solid #1e293b", borderRadius: 14, marginTop: 20,
  },
};
