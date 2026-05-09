import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import {
  FaShieldAlt, FaFolder, FaFileAlt, FaCheckCircle,
  FaExclamationTriangle, FaSync, FaClock, FaUser,
  FaChartBar, FaBell, FaCircle
} from "react-icons/fa";

/* ── inject styles once ── */
const injectStyles = () => {
  if (document.getElementById("soc-dash-styles")) return;
  const s = document.createElement("style");
  s.id = "soc-dash-styles";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Syne:wght@600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
    @keyframes fadeUp   { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
    @keyframes spin     { to{transform:rotate(360deg)} }
    @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:0.4} }
    @keyframes scanline { 0%{transform:translateY(-100%)} 100%{transform:translateY(2000%)} }
    @keyframes countUp  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
    .soc-card { transition: border-color 0.2s, box-shadow 0.2s; }
    .soc-card:hover { border-color: #1e40af !important; box-shadow: 0 0 0 1px rgba(59,130,246,0.15) !important; }
    .soc-row:hover  { background: rgba(30,64,175,0.07) !important; }
    .soc-stat { animation: countUp 0.5s ease both; }
    .soc-spin { animation: spin 1s linear infinite; }
    .soc-pulse { animation: pulse 1.8s ease-in-out infinite; }
  `;
  document.head.appendChild(s);
};

const TOKEN = () => localStorage.getItem("token");
const API   = "http://127.0.0.1:5000";

/* ── colour helpers ── */
const ACTION_COLOR = {
  REGISTERED:         { bg: "rgba(59,130,246,0.12)",  text: "#60a5fa",  dot: "#3b82f6" },
  VERIFIED:           { bg: "rgba(34,197,94,0.12)",   text: "#4ade80",  dot: "#22c55e" },
  FAILED_VERIFICATION:{ bg: "rgba(239,68,68,0.12)",   text: "#f87171",  dot: "#ef4444" },
};
const actionStyle = (a) => ACTION_COLOR[a] || { bg:"rgba(100,116,139,0.12)", text:"#94a3b8", dot:"#64748b" };

/* ── custom tooltip for recharts ── */
const DarkTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:"#0d1b2e", border:"1px solid #1e3a5f", borderRadius:8, padding:"8px 14px", fontSize:13 }}>
      {label && <p style={{ color:"#64748b", margin:"0 0 4px", fontSize:11 }}>{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || "#60a5fa", margin:"2px 0", fontFamily:"'JetBrains Mono',monospace" }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  useEffect(() => { injectStyles(); }, []);

  const [cases,     setCases]     = useState([]);
  const [allLogs,   setAllLogs]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [lastSync,  setLastSync]  = useState(null);
  const [now,       setNow]       = useState(new Date());
  const [refreshing,setRefreshing]= useState(false);

  /* live clock */
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  /* ── FETCH ── */
  const fetchData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      /* 1. get all cases from real API */
      const casesRes = await axios.get(`${API}/getAllCases`, {
        headers: { Authorization: `Bearer ${TOKEN()}` }
      });
      const caseList = casesRes.data?.cases || [];

      /* 2. for each case fetch evidences + timeline in parallel */
      const enriched = await Promise.all(
        caseList.map(async (c) => {
          try {
            const [evRes, tlRes] = await Promise.all([
              axios.get(`${API}/caseEvidences?case_number=${c.case_number}`,
                { headers: { Authorization: `Bearer ${TOKEN()}` } }),
              axios.get(`${API}/caseTimeline?case_number=${c.case_number}`,
                { headers: { Authorization: `Bearer ${TOKEN()}` } }),
            ]);
            return {
              ...c,
              evidences: evRes.data?.evidences || [],
              timeline:  tlRes.data?.timeline  || [],
            };
          } catch {
            return { ...c, evidences: [], timeline: [] };
          }
        })
      );

      setCases(enriched);

      /* flatten all logs */
      const logs = enriched.flatMap(c =>
        c.timeline.map(t => ({ ...t, case_number: c.case_number }))
      ).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      setAllLogs(logs);
      setLastSync(new Date());
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const iv = setInterval(fetchData, 30000);
    return () => clearInterval(iv);
  }, [fetchData]);

  /* ── COMPUTED STATS ── */
  const totalCases      = cases.length;
  const totalEvidences  = cases.reduce((s, c) => s + c.evidences.length, 0);
  const totalVerified   = allLogs.filter(l => l.action === "VERIFIED").length;
  const totalCompromised= allLogs.filter(l => l.action === "FAILED_VERIFICATION").length;
  const totalRegistered = allLogs.filter(l => l.action === "REGISTERED").length;
  const integrityRate   = (totalVerified + totalCompromised) > 0
    ? Math.round((totalVerified / (totalVerified + totalCompromised)) * 100)
    : 100;

  /* ── CHART DATA ── */
  const pieData = [
    { name: "Verified",    value: totalVerified,    color: "#22c55e" },
    { name: "Compromised", value: totalCompromised,  color: "#ef4444" },
    { name: "Registered",  value: totalRegistered,   color: "#3b82f6" },
  ].filter(d => d.value > 0);

  const barData = cases.map(c => ({
    name:      `Case ${c.case_number}`,
    evidences: c.evidences.length,
    verified:  c.timeline.filter(t => t.action === "VERIFIED").length,
    failed:    c.timeline.filter(t => t.action === "FAILED_VERIFICATION").length,
  }));

  /* activity over time — group by date */
  const dateMap = {};
  allLogs.forEach(l => {
    const d = l.timestamp ? l.timestamp.slice(0, 10) : "Unknown";
    if (!dateMap[d]) dateMap[d] = { date: d, actions: 0, verified: 0, failed: 0 };
    dateMap[d].actions++;
    if (l.action === "VERIFIED")            dateMap[d].verified++;
    if (l.action === "FAILED_VERIFICATION") dateMap[d].failed++;
  });
  const areaData = Object.values(dateMap)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-14); /* last 14 days */

  const recentLogs = allLogs.slice(0, 10);

  /* ── LOADING ── */
  if (loading) {
    return (
      <div style={s.loadWrap}>
        <div style={s.loadInner}>
          <FaShieldAlt size={36} color="#3b82f6" className="soc-pulse" />
          <p style={s.loadText}>Initialising FORENA Dashboard…</p>
          <div style={s.loadBar}><div style={s.loadFill} /></div>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>

      {/* ── TOP BAR ── */}
      <div style={s.topBar}>
        <div style={s.topLeft}>
          <FaShieldAlt size={20} color="#3b82f6" />
          <span style={s.topTitle}>SOC Operations Dashboard</span>
          <span style={s.liveBadge}>
            <FaCircle size={7} color="#22c55e" className="soc-pulse" style={{ marginRight: 5 }} />
            LIVE
          </span>
        </div>
        <div style={s.topRight}>
          <FaClock size={12} color="#475569" style={{ marginRight: 6 }} />
          <span style={s.clock}>{now.toLocaleTimeString()}</span>
          <span style={s.clockDate}>{now.toLocaleDateString("en-GB", { weekday:"short", day:"2-digit", month:"short", year:"numeric" })}</span>
          <button
            style={s.refreshBtn}
            onClick={() => fetchData(true)}
            disabled={refreshing}
            title="Refresh now"
          >
            <FaSync size={12} className={refreshing ? "soc-spin" : ""} />
          </button>
        </div>
      </div>

      {lastSync && (
        <p style={s.syncNote}>
          Last synced {lastSync.toLocaleTimeString()} · auto-refresh every 30 s
        </p>
      )}

      {/* ── STAT CARDS ── */}
      <div style={s.statGrid}>
        <StatCard icon={<FaFolder />}            label="Total Cases"      value={totalCases}       color="#3b82f6" sub={`${totalEvidences} evidence items`} />
        <StatCard icon={<FaFileAlt />}           label="Evidence Items"   value={totalEvidences}   color="#8b5cf6" sub={`across ${totalCases} cases`} />
        <StatCard icon={<FaCheckCircle />}       label="Verified"         value={totalVerified}    color="#22c55e" sub="integrity confirmed" />
        <StatCard icon={<FaExclamationTriangle />} label="Compromised"    value={totalCompromised} color="#ef4444" sub="hash mismatch detected" />
        <StatCard icon={<FaShieldAlt />}         label="Integrity Rate"   value={`${integrityRate}%`} color={integrityRate >= 80 ? "#22c55e" : "#f59e0b"} sub="verified vs total checks" />
        <StatCard icon={<FaChartBar />}          label="Total Actions"    value={allLogs.length}   color="#06b6d4" sub="custody log entries" />
      </div>

      {/* ── CHARTS ROW 1 ── */}
      <div style={s.chartRow}>

        {/* Area — activity over time */}
        <div style={{ ...s.chartCard, flex: 2 }}>
          <ChartHeader title="Activity Over Time" sub="Daily custody log events" />
          {areaData.length === 0
            ? <EmptyChart />
            : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={areaData} margin={{ top: 8, right: 16, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gVerified" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gFailed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" tick={{ fill:"#475569", fontSize:11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill:"#475569", fontSize:11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip content={<DarkTooltip />} />
                  <Legend wrapperStyle={{ fontSize:12, color:"#64748b" }} />
                  <Area type="monotone" dataKey="verified" name="Verified"    stroke="#22c55e" fill="url(#gVerified)" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="failed"   name="Compromised" stroke="#ef4444" fill="url(#gFailed)"   strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )
          }
        </div>

        {/* Pie — verification breakdown */}
        <div style={{ ...s.chartCard, flex: 1 }}>
          <ChartHeader title="Action Breakdown" sub="All custody events" />
          {pieData.length === 0
            ? <EmptyChart />
            : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" cx="50%" cy="50%"
                    innerRadius={55} outerRadius={85} paddingAngle={3}>
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip content={<DarkTooltip />} />
                  <Legend wrapperStyle={{ fontSize:12, color:"#64748b" }} />
                </PieChart>
              </ResponsiveContainer>
            )
          }
        </div>
      </div>

      {/* ── CHARTS ROW 2 ── */}
      <div style={s.chartRow}>

        {/* Grouped bar — per case */}
        <div style={{ ...s.chartCard, flex: 2 }}>
          <ChartHeader title="Evidence & Verification per Case" sub="Grouped by case number" />
          {barData.length === 0
            ? <EmptyChart />
            : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={barData} margin={{ top: 8, right: 16, left: -20, bottom: 0 }} barSize={14}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="name" tick={{ fill:"#475569", fontSize:11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill:"#475569", fontSize:11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip content={<DarkTooltip />} />
                  <Legend wrapperStyle={{ fontSize:12, color:"#64748b" }} />
                  <Bar dataKey="evidences" name="Evidence"   fill="#3b82f6" radius={[3,3,0,0]} />
                  <Bar dataKey="verified"  name="Verified"   fill="#22c55e" radius={[3,3,0,0]} />
                  <Bar dataKey="failed"    name="Compromised" fill="#ef4444" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            )
          }
        </div>

        {/* Integrity gauge card */}
        <div style={{ ...s.chartCard, flex: 1, display:"flex", flexDirection:"column", justifyContent:"space-between" }}>
          <ChartHeader title="System Integrity" sub="Live integrity score" />
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", flex:1, gap:12 }}>
            <GaugeRing value={integrityRate} />
            <div style={{ textAlign:"center" }}>
              <p style={{ margin:0, color:"#64748b", fontSize:12 }}>Based on {totalVerified + totalCompromised} verification checks</p>
            </div>
          </div>
          <div style={s.integrityRows}>
            <div style={s.intRow}>
              <span style={{ color:"#22c55e" }}>● Verified</span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", color:"#4ade80" }}>{totalVerified}</span>
            </div>
            <div style={s.intRow}>
              <span style={{ color:"#ef4444" }}>● Compromised</span>
              <span style={{ fontFamily:"'JetBrains Mono',monospace", color:"#f87171" }}>{totalCompromised}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── BOTTOM ROW: cases table + recent activity ── */}
      <div style={s.chartRow}>

        {/* Cases table */}
        <div style={{ ...s.chartCard, flex: 1 }}>
          <ChartHeader title="Active Cases" sub={`${totalCases} case${totalCases !== 1 ? "s" : ""} in system`} />
          {cases.length === 0
            ? <EmptyChart label="No cases found" />
            : (
              <table style={s.table}>
                <thead>
                  <tr>
                    {["Case #", "Description", "Evidence", "Verified", "Integrity"].map(h => (
                      <th key={h} style={s.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cases.map((c, i) => {
                    const v = c.timeline.filter(t => t.action === "VERIFIED").length;
                    const f = c.timeline.filter(t => t.action === "FAILED_VERIFICATION").length;
                    const rate = (v + f) > 0 ? Math.round((v / (v + f)) * 100) : 100;
                    return (
                      <tr key={i} className="soc-row" style={s.tr}>
                        <td style={s.td}>
                          <span style={s.caseNum}>#{c.case_number}</span>
                        </td>
                        <td style={{ ...s.td, maxWidth:180, overflow:"hidden", textOverflow:"ellipsis" }}>
                          {c.description || "—"}
                        </td>
                        <td style={{ ...s.td, fontFamily:"'JetBrains Mono',monospace", color:"#7dd3fc" }}>
                          {c.evidences.length}
                        </td>
                        <td style={{ ...s.td, fontFamily:"'JetBrains Mono',monospace", color:"#4ade80" }}>
                          {v}
                        </td>
                        <td style={s.td}>
                          <IntegrityBar rate={rate} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )
          }
        </div>

        {/* Recent activity feed */}
        <div style={{ ...s.chartCard, flex: 1, maxWidth: 420 }}>
          <ChartHeader
            title="Recent Activity"
            sub="Latest custody log events"
            right={<FaBell size={13} color="#475569" />}
          />
          <div style={{ overflowY:"auto", maxHeight:320 }}>
            {recentLogs.length === 0
              ? <EmptyChart label="No activity yet" />
              : recentLogs.map((log, i) => {
                  const ac = actionStyle(log.action);
                  return (
                    <div key={i} style={s.logRow}>
                      <div style={{ ...s.logDot, background: ac.dot }} />
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
                          <span style={{ ...s.actionBadge, background: ac.bg, color: ac.text }}>
                            {log.action.replace("_", " ")}
                          </span>
                          <span style={s.logCase}>Case #{log.case_number}</span>
                        </div>
                        <p style={s.logUser}>
                          <FaUser size={10} style={{ marginRight:4 }} />
                          {log.performed_by || "Unknown"}
                        </p>
                        <p style={s.logTime}>
                          <FaClock size={10} style={{ marginRight:4 }} />
                          {log.timestamp ? new Date(log.timestamp).toLocaleString() : "N/A"}
                        </p>
                      </div>
                      <span style={s.logEvId}>#{log.evidence_id}</span>
                    </div>
                  );
                })
            }
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── SUB COMPONENTS ── */

function StatCard({ icon, label, value, color, sub }) {
  return (
    <div className="soc-card" style={s.statCard}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
        <div style={{ ...s.statIcon, background: `${color}18`, color }}>
          {React.cloneElement(icon, { size:16 })}
        </div>
        <FaCircle size={6} color={color} className="soc-pulse" />
      </div>
      <p className="soc-stat" style={{ ...s.statValue, color }}>{value}</p>
      <p style={s.statLabel}>{label}</p>
      <p style={s.statSub}>{sub}</p>
    </div>
  );
}

function ChartHeader({ title, sub, right }) {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
      <div>
        <p style={s.chartTitle}>{title}</p>
        <p style={s.chartSub}>{sub}</p>
      </div>
      {right}
    </div>
  );
}

function EmptyChart({ label = "No data yet" }) {
  return (
    <div style={s.emptyChart}>
      <FaChartBar size={28} color="#1e293b" />
      <p style={{ color:"#334155", marginTop:8, fontSize:13 }}>{label}</p>
    </div>
  );
}

function GaugeRing({ value }) {
  const r   = 54;
  const circ= 2 * Math.PI * r;
  const fill= circ - (circ * value) / 100;
  const color = value >= 80 ? "#22c55e" : value >= 50 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ position:"relative", width:130, height:130 }}>
      <svg width="130" height="130" style={{ transform:"rotate(-90deg)" }}>
        <circle cx="65" cy="65" r={r} fill="none" stroke="#1e293b" strokeWidth="10" />
        <circle cx="65" cy="65" r={r} fill="none" stroke={color} strokeWidth="10"
          strokeDasharray={circ} strokeDashoffset={fill}
          strokeLinecap="round"
          style={{ transition:"stroke-dashoffset 0.8s ease, stroke 0.4s" }}
        />
      </svg>
      <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
        <span style={{ fontSize:26, fontWeight:700, fontFamily:"'Syne',sans-serif", color }}>{value}%</span>
        <span style={{ fontSize:10, color:"#475569", letterSpacing:"0.05em" }}>INTEGRITY</span>
      </div>
    </div>
  );
}

function IntegrityBar({ rate }) {
  const color = rate >= 80 ? "#22c55e" : rate >= 50 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
      <div style={{ flex:1, height:4, background:"#1e293b", borderRadius:2, overflow:"hidden" }}>
        <div style={{ width:`${rate}%`, height:"100%", background:color, borderRadius:2, transition:"width 0.5s" }} />
      </div>
      <span style={{ fontSize:11, color, fontFamily:"'JetBrains Mono',monospace", minWidth:34 }}>{rate}%</span>
    </div>
  );
}

/* ── STYLES ── */
const s = {
  page: {
    fontFamily:"'DM Sans',sans-serif",
    color:"#e2e8f0",
    minHeight:"100%",
    animation:"fadeUp 0.4s ease",
  },

  /* loading */
  loadWrap: { display:"flex", alignItems:"center", justifyContent:"center", minHeight:"60vh" },
  loadInner:{ textAlign:"center" },
  loadText: { color:"#475569", fontSize:14, marginTop:16, marginBottom:12 },
  loadBar:  { width:200, height:2, background:"#1e293b", borderRadius:2, margin:"0 auto", overflow:"hidden" },
  loadFill: { height:"100%", width:"60%", background:"#3b82f6", borderRadius:2,
    animation:"scanline 1.5s ease-in-out infinite" },

  /* top bar */
  topBar: {
    display:"flex", alignItems:"center", justifyContent:"space-between",
    marginBottom:4, flexWrap:"wrap", gap:12,
  },
  topLeft: { display:"flex", alignItems:"center", gap:12 },
  topTitle:{ fontSize:20, fontFamily:"'Syne',sans-serif", fontWeight:800,
    color:"#f1f5f9", letterSpacing:"-0.01em" },
  liveBadge:{
    display:"flex", alignItems:"center",
    background:"rgba(34,197,94,0.1)", border:"1px solid rgba(34,197,94,0.25)",
    color:"#4ade80", fontSize:10, fontWeight:700, letterSpacing:"0.1em",
    padding:"3px 9px", borderRadius:20,
  },
  topRight: { display:"flex", alignItems:"center", gap:10 },
  clock:    { fontSize:16, fontFamily:"'JetBrains Mono',monospace", color:"#e2e8f0", fontWeight:500 },
  clockDate:{ fontSize:12, color:"#475569", marginLeft:4 },
  refreshBtn:{
    background:"#1e293b", border:"1px solid #334155", color:"#94a3b8",
    width:30, height:30, borderRadius:7, cursor:"pointer",
    display:"flex", alignItems:"center", justifyContent:"center",
  },
  syncNote: { fontSize:11, color:"#334155", margin:"0 0 20px", letterSpacing:"0.03em" },

  /* stat cards */
  statGrid: {
    display:"grid",
    gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",
    gap:14, marginBottom:20,
  },
  statCard: {
    background:"#0d1b2e", border:"1px solid #1e293b",
    borderRadius:12, padding:"18px 20px",
  },
  statIcon: { width:34, height:34, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center" },
  statValue:{ margin:"0 0 2px", fontSize:28, fontFamily:"'Syne',sans-serif", fontWeight:800, lineHeight:1 },
  statLabel:{ margin:0, fontSize:13, color:"#94a3b8", fontWeight:500 },
  statSub:  { margin:"4px 0 0", fontSize:11, color:"#334155" },

  /* chart layout */
  chartRow: { display:"flex", gap:16, marginBottom:16, flexWrap:"wrap" },
  chartCard:{
    background:"#0d1b2e", border:"1px solid #1e293b",
    borderRadius:12, padding:"20px 22px", flex:1, minWidth:280,
  },
  chartTitle:{ margin:0, fontSize:14, fontFamily:"'Syne',sans-serif", fontWeight:700, color:"#f1f5f9" },
  chartSub:  { margin:"2px 0 0", fontSize:11, color:"#475569" },
  emptyChart:{ display:"flex", flexDirection:"column", alignItems:"center",
    justifyContent:"center", height:180, color:"#334155" },

  /* cases table */
  table:{ width:"100%", borderCollapse:"collapse" },
  th:{
    textAlign:"left", padding:"8px 12px", fontSize:10, fontWeight:700,
    color:"#334155", textTransform:"uppercase", letterSpacing:"0.08em",
    borderBottom:"1px solid #1e293b",
  },
  tr:{ transition:"background 0.15s" },
  td:{ padding:"10px 12px", fontSize:13, color:"#cbd5e1", borderBottom:"1px solid #0d1b2e" },
  caseNum:{ fontFamily:"'JetBrains Mono',monospace", color:"#60a5fa", fontSize:12,
    background:"rgba(59,130,246,0.1)", padding:"2px 7px", borderRadius:4 },

  /* activity feed */
  logRow:{
    display:"flex", alignItems:"flex-start", gap:12,
    padding:"12px 0", borderBottom:"1px solid #0f1f35",
  },
  logDot:{ width:8, height:8, borderRadius:"50%", flexShrink:0, marginTop:5 },
  actionBadge:{
    fontSize:10, fontWeight:700, padding:"2px 7px",
    borderRadius:4, letterSpacing:"0.05em", textTransform:"uppercase",
  },
  logCase:{ fontSize:11, color:"#475569" },
  logUser:{ margin:0, fontSize:12, color:"#64748b", display:"flex", alignItems:"center" },
  logTime:{ margin:"2px 0 0", fontSize:11, color:"#334155", display:"flex", alignItems:"center",
    fontFamily:"'JetBrains Mono',monospace" },
  logEvId:{ fontSize:11, color:"#334155", fontFamily:"'JetBrains Mono',monospace",
    flexShrink:0, marginTop:2 },

  /* integrity panel */
  integrityRows:{ borderTop:"1px solid #1e293b", paddingTop:12 },
  intRow:{ display:"flex", justifyContent:"space-between", fontSize:13,
    padding:"4px 0", color:"#64748b" },
};
