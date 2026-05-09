import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  FaFileAlt, FaFolder, FaSearch, FaSpinner, FaDownload,
  FaPrint, FaShieldAlt, FaCheckCircle, FaTimesCircle,
  FaExclamationTriangle, FaUpload, FaUser, FaCalendarAlt,
  FaHashtag, FaLink, FaClock, FaChartBar, FaCircle
} from "react-icons/fa";

// ─── Inject styles ───────────────────────────────────────────────────────────
const injectStyles = () => {
  if (document.getElementById("rg-styles")) return;
  const s = document.createElement("style");
  s.id = "rg-styles";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
    @keyframes fadeSlideIn { from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)} }
    @keyframes spin { to{transform:rotate(360deg)} }
    @keyframes fadeIn { from{opacity:0}to{opacity:1} }
    .rg-input:focus { border-color:#3b82f6!important;box-shadow:0 0 0 3px rgba(59,130,246,0.15)!important;outline:none; }
    .rg-btn:hover:not(:disabled) { filter:brightness(1.12);transform:translateY(-1px); }
    .rg-btn:disabled { opacity:0.6;cursor:not-allowed; }
    .rg-select:focus { border-color:#3b82f6!important;outline:none; }

    /* ── Print styles ── */
    @media print {
      body * { visibility: hidden !important; }
      #forena-report-printable, #forena-report-printable * { visibility: visible !important; }
      #forena-report-printable {
        position: fixed !important; top: 0; left: 0;
        width: 100vw; padding: 40px 50px;
        background: white !important; color: #111 !important;
      }
      .rg-print-hide { display: none !important; }
      .rg-print-report {
        background: white !important;
        color: #111 !important;
        border: none !important;
        box-shadow: none !important;
      }
      .rg-print-report * {
        color: #111 !important;
        background: transparent !important;
        border-color: #ccc !important;
        box-shadow: none !important;
      }
      .rg-print-section-title { color: #1d4ed8 !important; border-bottom: 2px solid #1d4ed8 !important; }
      .rg-print-header-logo { color: #1d4ed8 !important; }
      .rg-timeline-dot { background: #1d4ed8 !important; }
    }
  `;
  document.head.appendChild(s);
};

const ACTION_CONFIG = {
  REGISTERED:          { color: "#3b82f6", bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.3)", icon: <FaUpload size={11} />, label: "Registered" },
  VERIFIED:            { color: "#22c55e", bg: "rgba(34,197,94,0.1)",    border: "rgba(34,197,94,0.3)",  icon: <FaCheckCircle size={11} />, label: "Verified" },
  FAILED_VERIFICATION: { color: "#ef4444", bg: "rgba(239,68,68,0.1)",    border: "rgba(239,68,68,0.3)",  icon: <FaTimesCircle size={11} />, label: "Failed Verification" },
};
const getAction = (a) => ACTION_CONFIG[a] || { color: "#64748b", bg: "rgba(100,116,139,0.1)", border: "rgba(100,116,139,0.3)", icon: <FaCircle size={11} />, label: a };

const API = "http://127.0.0.1:5000";
const token = () => localStorage.getItem("token");

export default function ReportGenerator() {
  useEffect(() => { injectStyles(); }, []);

  const [caseNumber, setCaseNumber]     = useState("");
  const [reportType, setReportType]     = useState("full");
  const [loading, setLoading]           = useState(false);
  const [generating, setGenerating]     = useState(false);
  const [error, setError]               = useState("");
  const [reportData, setReportData]     = useState(null);
  const printRef                        = useRef(null);

  // ── Fetch all data for a case ────────────────────────────────────────────
  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!caseNumber.trim()) { setError("Please enter a case number."); return; }
    setError(""); setReportData(null); setLoading(true);

    try {
      const [caseRes, timelineRes] = await Promise.all([
        axios.get(`${API}/caseEvidences?case_number=${caseNumber}`, { headers: { Authorization: `Bearer ${token()}` } }),
        axios.get(`${API}/caseTimeline?case_number=${caseNumber}`,  { headers: { Authorization: `Bearer ${token()}` } }),
      ]);

      const caseInfo  = caseRes.data.case;
      const evidences = caseRes.data.evidences || [];
      const timeline  = timelineRes.data.timeline || [];

      if (!caseInfo) { setError("Case not found."); setLoading(false); return; }

      // Per-evidence custody logs
      setGenerating(true);
      const custodyMap = {};
      await Promise.all(
        evidences.map(async (ev) => {
          try {
            const r = await axios.get(`${API}/custodyHistory?evidence_id=${ev.evidence_id}`, { headers: { Authorization: `Bearer ${token()}` } });
            custodyMap[ev.evidence_id] = r.data.history || [];
          } catch {
            custodyMap[ev.evidence_id] = [];
          }
        })
      );

      // Stats
      const registered  = timeline.filter(t => t.action === "REGISTERED").length;
      const verified    = timeline.filter(t => t.action === "VERIFIED").length;
      const failed      = timeline.filter(t => t.action === "FAILED_VERIFICATION").length;
      const integrityRate = (verified + failed) > 0 ? Math.round((verified / (verified + failed)) * 100) : 100;

      setReportData({ caseInfo, evidences, timeline, custodyMap, stats: { registered, verified, failed, integrityRate }, generatedAt: new Date() });
    } catch (err) {
      setError(err.response?.data?.error || "Failed to fetch case data.");
    } finally {
      setLoading(false);
      setGenerating(false);
    }
  };

  const handlePrint = () => window.print();

  const integrityColor = (r) => r >= 80 ? "#22c55e" : r >= 50 ? "#f59e0b" : "#ef4444";

  return (
    <div style={s.page}>

      {/* ── PAGE HEADER ── */}
      <div style={s.pageHeader} className="rg-print-hide">
        <div style={s.headerLeft}>
          <div style={s.iconWrap}><FaFileAlt size={20} color="#3b82f6" /></div>
          <div>
            <h1 style={s.pageTitle}>Report Generator</h1>
            <p style={s.pageSubtitle}>Generate forensic case reports with full events log</p>
          </div>
        </div>
      </div>

      {/* ── CONTROLS CARD ── */}
      <div style={s.card} className="rg-print-hide">
        <div style={s.cardHeader}>
          <FaChartBar size={15} color="#60a5fa" />
          <span style={s.cardTitle}>Report Configuration</span>
        </div>

        <form onSubmit={handleGenerate} style={s.controlsRow}>
          {/* Case Number */}
          <div style={{ flex: 2, minWidth: 180 }}>
            <label style={s.label}>
              <FaHashtag size={10} style={{ marginRight: 6, color: "#60a5fa" }} />Case Number
            </label>
            <div style={{ position: "relative" }}>
              <FaSearch size={12} color="#475569" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
              <input
                className="rg-input"
                style={{ ...s.input, paddingLeft: 34 }}
                placeholder="e.g. CASE-2025-001"
                value={caseNumber}
                onChange={e => setCaseNumber(e.target.value)}
              />
            </div>
          </div>

          {/* Report Type */}
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={s.label}>
              <FaFileAlt size={10} style={{ marginRight: 6, color: "#60a5fa" }} />Report Type
            </label>
            <select className="rg-select" style={s.select} value={reportType} onChange={e => setReportType(e.target.value)}>
              <option value="full">Full Report</option>
              <option value="summary">Summary Only</option>
              <option value="custody">Events Log</option>
              <option value="integrity">Integrity Report</option>
            </select>
          </div>

          {/* Generate Button */}
          <div style={{ alignSelf: "flex-end" }}>
            <button type="submit" className="rg-btn" style={s.generateBtn} disabled={loading || generating}>
              {loading || generating
                ? <><FaSpinner style={{ animation: "spin 0.8s linear infinite", marginRight: 8 }} />{generating ? "Building…" : "Fetching…"}</>
                : <><FaFileAlt style={{ marginRight: 8 }} />Generate Report</>
              }
            </button>
          </div>
        </form>

        {/* Report type descriptions */}
        <div style={s.typeHints}>
          {[
            { key: "full",      label: "Full Report",         desc: "Case details + all evidence + custody logs + blockchain data" },
            { key: "summary",   label: "Summary",             desc: "Case overview + evidence count + integrity statistics" },
            { key: "custody",   label: "Events Log",    desc: "Chronological log of all evidence actions" },
            { key: "integrity", label: "Integrity Report",    desc: "Verification results and hash comparison per evidence" },
          ].map(h => (
            <div key={h.key} style={{ ...s.typeHint, ...(reportType === h.key ? s.typeHintActive : {}) }}>
              <span style={s.typeHintLabel}>{h.label}</span>
              <span style={s.typeHintDesc}>{h.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── ERROR ── */}
      {error && (
        <div style={s.errorBox} className="rg-print-hide">
          <FaTimesCircle style={{ marginRight: 10, flexShrink: 0 }} />{error}
        </div>
      )}

      {/* ── REPORT OUTPUT ── */}
      {reportData && (
        <div style={s.reportWrap}>

          {/* Action bar */}
          <div style={s.actionBar} className="rg-print-hide">
            <div style={s.actionBarLeft}>
              <FaCheckCircle size={14} color="#22c55e" />
              <span style={{ fontSize: 14, color: "#4ade80", fontWeight: 600 }}>
                Report generated for Case #{reportData.caseInfo.case_number}
              </span>
              <span style={{ fontSize: 12, color: "#475569" }}>
                · {reportData.generatedAt.toLocaleString()}
              </span>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="rg-btn" style={s.printBtn} onClick={handlePrint}>
                <FaPrint style={{ marginRight: 8 }} />Print / Save PDF
              </button>
            </div>
          </div>

          {/* ╔══════════════════════════════╗
              ║   PRINTABLE REPORT CONTENT   ║
              ╚══════════════════════════════╝ */}
          <div id="forena-report-printable" ref={printRef} style={s.report} className="rg-print-report">

            {/* ── REPORT HEADER ── */}
            <div style={s.reportHeader}>
              <div style={s.reportHeaderLeft}>
                <div style={s.reportLogo}>
                  <FaShieldAlt size={28} color="#3b82f6" />
                  <span style={s.reportLogoText} className="rg-print-header-logo">FORENA</span>
                </div>
                <div>
                  <p style={s.reportSubBrand}>Digital Forensic Evidence Registry & Network Analysis</p>
                  <p style={s.reportDocType}>{
                    { full: "COMPREHENSIVE FORENSIC REPORT", summary: "CASE SUMMARY REPORT", custody: "EVENTS LOG REPORT", integrity: "EVIDENCE INTEGRITY REPORT" }[reportType]
                  }</p>
                </div>
              </div>
              <div style={s.reportHeaderRight}>
                <div style={s.reportMeta}>
                  <p style={s.reportMetaLabel}>Generated</p>
                  <p style={s.reportMetaValue}>{reportData.generatedAt.toLocaleString()}</p>
                </div>
                <div style={s.reportMeta}>
                  <p style={s.reportMetaLabel}>Case Number</p>
                  <p style={{ ...s.reportMetaValue, color: "#60a5fa" }}>#{reportData.caseInfo.case_number}</p>
                </div>
                <div style={s.reportMeta}>
                  <p style={s.reportMetaLabel}>Classification</p>
                  <p style={{ ...s.reportMetaValue, color: "#f87171" }}>CONFIDENTIAL</p>
                </div>
              </div>
            </div>

            <div style={s.reportDivider} />

            {/* ── SECTION: CASE OVERVIEW (all report types) ── */}
            <Section title="1. Case Overview" icon={<FaFolder size={14} />}>
              <div style={s.overviewGrid}>
                <MetaRow label="Case Number"    value={`#${reportData.caseInfo.case_number}`} />
                <MetaRow label="Description"    value={reportData.caseInfo.description || "N/A"} />
                <MetaRow label="Created By"     value={reportData.caseInfo.created_by || "N/A"} />
                <MetaRow label="Created At"     value={reportData.caseInfo.created_at ? new Date(reportData.caseInfo.created_at).toLocaleString() : "N/A"} />
                <MetaRow label="Total Evidence" value={`${reportData.evidences.length} item(s)`} />
                <MetaRow label="Total Events"   value={`${reportData.timeline.length} custody actions`} />
              </div>
            </Section>

            {/* ── SECTION: STATISTICS (full, summary, integrity) ── */}
            {["full", "summary", "integrity"].includes(reportType) && (
              <Section title="2. Statistical Overview" icon={<FaChartBar size={14} />}>
                <div style={s.statsGrid}>
                  <StatBox label="Evidence Items"  value={reportData.evidences.length}       color="#3b82f6" />
                  <StatBox label="Registered"       value={reportData.stats.registered}        color="#60a5fa" />
                  <StatBox label="Verified"         value={reportData.stats.verified}           color="#22c55e" />
                  <StatBox label="Failed Checks"    value={reportData.stats.failed}             color="#ef4444" />
                  <StatBox label="Integrity Rate"   value={`${reportData.stats.integrityRate}%`} color={integrityColor(reportData.stats.integrityRate)} large />
                </div>
                <div style={s.integrityBarWrap}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 12, color: "#64748b" }}>System Integrity Score</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: integrityColor(reportData.stats.integrityRate) }}>
                      {reportData.stats.integrityRate}%
                    </span>
                  </div>
                  <div style={s.integrityBarTrack}>
                    <div style={{ ...s.integrityBarFill, width: `${reportData.stats.integrityRate}%`, background: integrityColor(reportData.stats.integrityRate) }} />
                  </div>
                  <p style={{ fontSize: 11, color: "#475569", marginTop: 6 }}>
                    {reportData.stats.integrityRate >= 80
                      ? "✔ All evidence within acceptable integrity thresholds."
                      : reportData.stats.integrityRate >= 50
                      ? "⚠ Some evidence has failed verification. Review required."
                      : "✘ Critical: Majority of evidence has failed integrity checks."}
                  </p>
                </div>
              </Section>
            )}

            {/* ── SECTION: EVIDENCE INVENTORY (full, summary, integrity) ── */}
            {["full", "summary", "integrity"].includes(reportType) && reportData.evidences.length > 0 && (
              <Section title="3. Evidence Inventory" icon={<FaFileAlt size={14} />}>
                <table style={s.table}>
                  <thead>
                    <tr>
                      {["#", "Evidence ID", "Description", "File Hash", "IPFS CID", "Version", "Registrant"].map(h => (
                        <th key={h} style={s.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.evidences.map((ev, i) => (
                      <tr key={ev.evidence_id} style={i % 2 === 0 ? s.trEven : s.trOdd}>
                        <td style={s.td}>{i + 1}</td>
                        <td style={{ ...s.td, color: "#93c5fd", fontWeight: 700 }}>{ev.evidence_id}</td>
                        <td style={{ ...s.td, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.description || "—"}</td>
                        <td style={{ ...s.td, fontFamily: "monospace", fontSize: 11, color: "#60a5fa" }}>{ev.file_hash ? ev.file_hash.substring(0, 16) + "…" : "N/A"}</td>
                        <td style={{ ...s.td, fontFamily: "monospace", fontSize: 11, color: "#818cf8" }}>{ev.cid ? ev.cid.substring(0, 16) + "…" : "N/A"}</td>
                        <td style={{ ...s.td, textAlign: "center" }}>{ev.version || 1}</td>
                        <td style={{ ...s.td, fontSize: 12 }}>{ev.registrant_wallet ? ev.registrant_wallet.substring(0, 10) + "…" : "N/A"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Section>
            )}

            {/* ── SECTION: CHAIN OF CUSTODY TIMELINE (full, custody) ── */}
            {["full", "custody"].includes(reportType) && reportData.timeline.length > 0 && (
              <Section title="4. Events Log Timeline" icon={<FaClock size={14} />}>
                <p style={s.sectionNote}>
                  Chronological record of all actions performed on evidence within this case.
                  Total of <strong style={{ color: "#60a5fa" }}>{reportData.timeline.length}</strong> recorded events.
                </p>
                <div style={s.timelineWrap}>
                  {reportData.timeline.map((item, idx) => {
                    const cfg = getAction(item.action);
                    return (
                      <div key={idx} style={s.tlRow}>
                        <div style={{ ...s.tlDot, background: cfg.color }} className="rg-timeline-dot" />
                        <div style={{ ...s.tlCard, borderColor: cfg.border, background: cfg.bg }}>
                          <div style={s.tlTop}>
                            <span style={{ ...s.tlBadge, color: cfg.color, borderColor: cfg.border }}>
                              {cfg.icon} <span style={{ marginLeft: 5 }}>{cfg.label}</span>
                            </span>
                            <span style={s.tlEvidence}>Evidence #{item.evidence_id}</span>
                            <span style={s.tlTime}>
                              <FaCalendarAlt size={9} style={{ marginRight: 4 }} />
                              {item.timestamp ? new Date(item.timestamp).toLocaleString() : "N/A"}
                            </span>
                          </div>
                          <div style={s.tlBy}>
                            <FaUser size={9} style={{ marginRight: 5, color: "#475569" }} />
                            {item.performed_by || "Unknown"}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Section>
            )}

            {/* ── SECTION: PER-EVIDENCE CUSTODY DETAIL (full, custody) ── */}
            {["full", "custody"].includes(reportType) && reportData.evidences.length > 0 && (
              <Section title="5. Evidence Custody Detail" icon={<FaShieldAlt size={14} />}>
                {reportData.evidences.map((ev, i) => {
                  const logs = reportData.custodyMap[ev.evidence_id] || [];
                  return (
                    <div key={ev.evidence_id} style={s.evidenceBlock}>
                      <div style={s.evidenceBlockHeader}>
                        <span style={s.evidenceBlockId}>Evidence #{ev.evidence_id}</span>
                        <span style={s.evidenceBlockDesc}>{ev.description || "No description"}</span>
                        <span style={s.evidenceBlockCount}>{logs.length} action(s)</span>
                      </div>
                      {logs.length > 0 ? (
                        <table style={{ ...s.table, marginTop: 8 }}>
                          <thead>
                            <tr>
                              {["Action", "Performed By", "Notes", "Timestamp"].map(h => (
                                <th key={h} style={s.th}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {logs.map((log, li) => {
                              const cfg = getAction(log.action);
                              return (
                                <tr key={li} style={li % 2 === 0 ? s.trEven : s.trOdd}>
                                  <td style={s.td}>
                                    <span style={{ ...s.inlineBadge, color: cfg.color, borderColor: cfg.border, background: cfg.bg }}>
                                      {log.action}
                                    </span>
                                  </td>
                                  <td style={s.td}>{log.performed_by || "—"}</td>
                                  <td style={{ ...s.td, color: "#94a3b8" }}>{log.notes || "—"}</td>
                                  <td style={{ ...s.td, fontFamily: "monospace", fontSize: 11 }}>
                                    {log.timestamp ? new Date(log.timestamp).toLocaleString() : "N/A"}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      ) : (
                        <p style={{ fontSize: 12, color: "#475569", margin: "8px 0 0" }}>No custody logs found.</p>
                      )}
                    </div>
                  );
                })}
              </Section>
            )}

            {/* ── SECTION: INTEGRITY DETAIL (full, integrity) ── */}
            {["full", "integrity"].includes(reportType) && reportData.evidences.length > 0 && (
              <Section title="6. Integrity Analysis" icon={<FaShieldAlt size={14} />}>
                <p style={s.sectionNote}>
                  Per-evidence integrity status based on recorded verification actions.
                </p>
                <table style={s.table}>
                  <thead>
                    <tr>
                      {["Evidence ID", "Description", "File Hash (Registered)", "Verifications", "Failures", "Integrity Status"].map(h => (
                        <th key={h} style={s.th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.evidences.map((ev, i) => {
                      const logs    = reportData.custodyMap[ev.evidence_id] || [];
                      const vCount  = logs.filter(l => l.action === "VERIFIED").length;
                      const fCount  = logs.filter(l => l.action === "FAILED_VERIFICATION").length;
                      const intact  = fCount === 0;
                      return (
                        <tr key={ev.evidence_id} style={i % 2 === 0 ? s.trEven : s.trOdd}>
                          <td style={{ ...s.td, color: "#93c5fd", fontWeight: 700 }}>{ev.evidence_id}</td>
                          <td style={{ ...s.td, maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ev.description || "—"}</td>
                          <td style={{ ...s.td, fontFamily: "monospace", fontSize: 11, color: "#60a5fa" }}>{ev.file_hash ? ev.file_hash.substring(0, 20) + "…" : "N/A"}</td>
                          <td style={{ ...s.td, textAlign: "center", color: "#4ade80" }}>{vCount}</td>
                          <td style={{ ...s.td, textAlign: "center", color: fCount > 0 ? "#f87171" : "#4ade80" }}>{fCount}</td>
                          <td style={s.td}>
                            <span style={{
                              ...s.inlineBadge,
                              color: intact ? "#22c55e" : "#ef4444",
                              borderColor: intact ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)",
                              background: intact ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                              fontWeight: 700,
                            }}>
                              {intact ? "✔ Intact" : "✘ Compromised"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Section>
            )}

            {/* ── REPORT FOOTER ── */}
            <div style={s.reportFooter}>
              <div style={s.reportFooterLeft}>
                <FaShieldAlt size={14} color="#3b82f6" style={{ marginRight: 8 }} />
                <span>FORENA Digital Forensic Evidence Registry</span>
              </div>
              <div style={s.reportFooterRight}>
                <span>Generated: {reportData.generatedAt.toLocaleString()}</span>
                <span style={s.footerDot}>·</span>
                <span style={{ color: "#ef4444", fontWeight: 700 }}>CONFIDENTIAL</span>
                <span style={s.footerDot}>·</span>
                <span>Authorised Access Only</span>
              </div>
            </div>
          </div>

          {/* Print again button at bottom */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }} className="rg-print-hide">
            <button className="rg-btn" style={s.printBtn} onClick={handlePrint}>
              <FaPrint style={{ marginRight: 8 }} />Print / Save PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({ title, icon, children }) {
  return (
    <div style={s.section}>
      <div style={s.sectionTitleRow} className="rg-print-section-title">
        <span style={{ color: "#60a5fa", marginRight: 8 }}>{icon}</span>
        <span style={s.sectionTitle}>{title}</span>
      </div>
      <div style={s.sectionBody}>{children}</div>
    </div>
  );
}

function MetaRow({ label, value }) {
  return (
    <div style={s.metaRow}>
      <span style={s.metaLabel}>{label}</span>
      <span style={s.metaValue}>{value}</span>
    </div>
  );
}

function StatBox({ label, value, color, large }) {
  return (
    <div style={{ ...s.statBox, borderColor: `${color}33` }}>
      <p style={{ margin: 0, fontSize: large ? 32 : 26, fontWeight: 800, color, fontFamily: "'Syne',sans-serif", lineHeight: 1 }}>{value}</p>
      <p style={{ margin: "6px 0 0", fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</p>
    </div>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
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

  card: { background: "#0d1b2e", border: "1px solid #1e293b", borderRadius: 14, padding: "24px", boxShadow: "0 4px 24px rgba(0,0,0,0.3)", marginBottom: 20 },
  cardHeader: { display: "flex", alignItems: "center", gap: 10, marginBottom: 20 },
  cardTitle: { fontSize: 15, fontFamily: "'Syne',sans-serif", fontWeight: 700, color: "#e2e8f0" },

  controlsRow: { display: "flex", gap: 14, alignItems: "flex-end", flexWrap: "wrap" },
  label: { display: "flex", alignItems: "center", fontSize: 11, fontWeight: 700, color: "#94a3b8", marginBottom: 7, textTransform: "uppercase", letterSpacing: "0.07em" },
  input: {
    width: "100%", background: "#071020", border: "1px solid #1e293b", borderRadius: 9,
    padding: "11px 14px", color: "#f1f5f9", fontSize: 14,
    transition: "border-color 0.2s, box-shadow 0.2s", boxSizing: "border-box", fontFamily: "'DM Sans',sans-serif",
  },
  select: {
    width: "100%", background: "#071020", border: "1px solid #1e293b", borderRadius: 9,
    padding: "11px 14px", color: "#f1f5f9", fontSize: 14, cursor: "pointer",
    boxSizing: "border-box", fontFamily: "'DM Sans',sans-serif",
  },
  generateBtn: {
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: "11px 22px", background: "linear-gradient(135deg,#1d4ed8,#2563eb)",
    color: "white", border: "none", borderRadius: 9,
    fontWeight: 700, fontSize: 14, cursor: "pointer",
    transition: "filter 0.2s, transform 0.15s", fontFamily: "'Syne',sans-serif",
    whiteSpace: "nowrap", height: 44,
  },

  typeHints: { display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" },
  typeHint: { flex: 1, minWidth: 140, background: "#071020", border: "1px solid #1e293b", borderRadius: 8, padding: "10px 12px", transition: "border-color 0.2s" },
  typeHintActive: { borderColor: "#3b82f6", background: "rgba(59,130,246,0.06)" },
  typeHintLabel: { display: "block", fontSize: 12, fontWeight: 700, color: "#e2e8f0", marginBottom: 3 },
  typeHintDesc: { display: "block", fontSize: 11, color: "#475569", lineHeight: 1.5 },

  errorBox: {
    display: "flex", alignItems: "center", background: "#450a0a",
    border: "1px solid #dc2626", color: "#fca5a5", borderRadius: 10,
    padding: "12px 16px", fontSize: 14, marginBottom: 20,
  },

  // ── Report Wrapper ──
  reportWrap: { animation: "fadeIn 0.4s ease" },
  actionBar: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    background: "#052e16", border: "1px solid #166534",
    borderRadius: 10, padding: "12px 16px", marginBottom: 16, flexWrap: "wrap", gap: 10,
  },
  actionBarLeft: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" },
  printBtn: {
    display: "flex", alignItems: "center",
    padding: "9px 18px", background: "#0d1b2e",
    border: "1px solid #334155", color: "#94a3b8",
    borderRadius: 8, fontWeight: 600, fontSize: 13,
    cursor: "pointer", transition: "filter 0.2s, transform 0.15s", fontFamily: "'DM Sans',sans-serif",
  },

  // ── Report Document ──
  report: {
    background: "#0a1628", border: "1px solid #1e293b",
    borderRadius: 14, padding: "40px 44px",
    boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
  },

  // Report Header
  reportHeader: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 20, marginBottom: 28 },
  reportHeaderLeft: { display: "flex", alignItems: "flex-start", gap: 16 },
  reportLogo: { display: "flex", alignItems: "center", gap: 10 },
  reportLogoText: { fontFamily: "'Syne',sans-serif", fontSize: 28, fontWeight: 800, color: "#f1f5f9", letterSpacing: "0.08em" },
  reportSubBrand: { margin: "4px 0 0", fontSize: 11, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em" },
  reportDocType: { margin: "6px 0 0", fontSize: 13, fontWeight: 700, color: "#60a5fa", letterSpacing: "0.06em" },
  reportHeaderRight: { display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-end" },
  reportMeta: { textAlign: "right" },
  reportMetaLabel: { margin: 0, fontSize: 9, color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 },
  reportMetaValue: { margin: "2px 0 0", fontSize: 13, color: "#e2e8f0", fontWeight: 600 },
  reportDivider: { height: 1, background: "linear-gradient(90deg, #3b82f6, #7c3aed, transparent)", marginBottom: 32 },

  // Sections
  section: { marginBottom: 36 },
  sectionTitleRow: { display: "flex", alignItems: "center", borderBottom: "1px solid #1e293b", paddingBottom: 10, marginBottom: 18 },
  sectionTitle: { fontSize: 14, fontFamily: "'Syne',sans-serif", fontWeight: 700, color: "#f1f5f9", letterSpacing: "0.02em", textTransform: "uppercase" },
  sectionBody: {},
  sectionNote: { fontSize: 12, color: "#64748b", margin: "0 0 14px", lineHeight: 1.6 },

  // Overview grid
  overviewGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 },
  metaRow: { background: "#071020", border: "1px solid #1e293b", borderRadius: 8, padding: "10px 14px" },
  metaLabel: { display: "block", fontSize: 10, color: "#475569", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 },
  metaValue: { display: "block", fontSize: 14, color: "#e2e8f0", fontWeight: 500 },

  // Stats
  statsGrid: { display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 },
  statBox: { flex: 1, minWidth: 100, background: "#071020", border: "1px solid", borderRadius: 10, padding: "14px 16px" },
  integrityBarWrap: { background: "#071020", border: "1px solid #1e293b", borderRadius: 8, padding: "14px 16px" },
  integrityBarTrack: { height: 8, background: "#1e293b", borderRadius: 4, overflow: "hidden" },
  integrityBarFill: { height: "100%", borderRadius: 4, transition: "width 0.6s ease" },

  // Tables
  table: { width: "100%", borderCollapse: "collapse" },
  th: { textAlign: "left", padding: "9px 12px", fontSize: 10, fontWeight: 700, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em", borderBottom: "2px solid #1e293b", whiteSpace: "nowrap" },
  trEven: { background: "rgba(7,16,32,0.5)" },
  trOdd:  { background: "transparent" },
  td: { padding: "10px 12px", fontSize: 13, color: "#cbd5e1", borderBottom: "1px solid #0f1f35" },

  // Timeline
  timelineWrap: { position: "relative", paddingLeft: 20 },
  tlRow: { display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 10 },
  tlDot: { width: 10, height: 10, borderRadius: "50%", flexShrink: 0, marginTop: 8, boxShadow: "0 0 6px currentColor" },
  tlCard: { flex: 1, borderRadius: 8, border: "1px solid", padding: "10px 14px" },
  tlTop: { display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 5 },
  tlBadge: { display: "inline-flex", alignItems: "center", fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 20, border: "1px solid", textTransform: "uppercase", letterSpacing: "0.05em" },
  tlEvidence: { fontSize: 11, color: "#475569", fontWeight: 500 },
  tlTime: { display: "inline-flex", alignItems: "center", fontSize: 11, color: "#475569", fontFamily: "monospace", marginLeft: "auto" },
  tlBy: { display: "flex", alignItems: "center", fontSize: 12, color: "#64748b" },

  // Evidence blocks
  evidenceBlock: { background: "#071020", border: "1px solid #1e293b", borderRadius: 10, padding: "14px 16px", marginBottom: 14 },
  evidenceBlockHeader: { display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 4 },
  evidenceBlockId: { fontSize: 13, fontWeight: 700, color: "#93c5fd", fontFamily: "'Syne',sans-serif" },
  evidenceBlockDesc: { fontSize: 12, color: "#64748b", flex: 1 },
  evidenceBlockCount: { fontSize: 11, color: "#475569", background: "#0d1b2e", border: "1px solid #1e293b", borderRadius: 20, padding: "2px 9px" },

  inlineBadge: { display: "inline-flex", alignItems: "center", fontSize: 11, padding: "2px 8px", borderRadius: 6, border: "1px solid", fontWeight: 600 },

  // Report Footer
  reportFooter: { borderTop: "1px solid #1e293b", paddingTop: 20, marginTop: 36, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 },
  reportFooterLeft: { display: "flex", alignItems: "center", fontSize: 12, color: "#334155" },
  reportFooterRight: { display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "#334155" },
  footerDot: { color: "#1e293b" },
};
