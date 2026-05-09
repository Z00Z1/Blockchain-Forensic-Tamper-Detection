import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  FaUserPlus, FaTrashAlt, FaUsers, FaShieldAlt,
  FaEnvelope, FaWallet, FaUserTag, FaCheckCircle,
  FaTimesCircle, FaSearch, FaSpinner, FaLock, FaKey
} from "react-icons/fa";

const injectStyles = () => {
  if (document.getElementById("admin-dash-styles")) return;
  const s = document.createElement("style");
  s.id = "admin-dash-styles";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
    @keyframes fadeSlideIn {
      from { opacity:0; transform:translateY(14px); }
      to   { opacity:1; transform:translateY(0); }
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .ad-row:hover { background: rgba(30,64,175,0.08) !important; }
    .ad-del-btn:hover { background: rgba(239,68,68,0.18) !important; color: #f87171 !important; }
    .ad-submit:hover { filter: brightness(1.12); transform: translateY(-1px); }
    .ad-input:focus { border-color: #3b82f6 !important; box-shadow: 0 0 0 3px rgba(59,130,246,0.15) !important; outline: none; }
    .ad-select:focus { border-color: #3b82f6 !important; outline: none; }
  `;
  document.head.appendChild(s);
};

export default function AdminDashboard() {
  useEffect(() => { injectStyles(); }, []);

  const [investigators, setInvestigators] = useState([]);
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [wallet,   setWallet]   = useState("");
  const [role,     setRole]     = useState("investigator");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);

  const [toast,      setToast]      = useState(null);
  const [loading,    setLoading]    = useState(false);
  const [fetching,   setFetching]   = useState(true);
  const [search,     setSearch]     = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const token = localStorage.getItem("token");

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  /* ── FETCH INVESTIGATORS ── */
  const fetchInvestigators = async () => {
    setFetching(true);
    try {
      const res = await axios.get("http://127.0.0.1:5000/getInvestigators", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInvestigators(res.data);
    } catch (err) {
      showToast("error", err.response?.data?.error || "Failed to fetch investigators.");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => { fetchInvestigators(); }, []); // eslint-disable-line

  /* ── CREATE INVESTIGATOR ── */
  const handleCreate = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      showToast("error", "Temporary password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    const formData = new FormData();
    formData.append("name",     name);
    formData.append("email",    email);
    formData.append("wallet",   wallet);
    formData.append("role",     role);
    formData.append("password", password);   // temp password set by admin
    try {
      await axios.post("http://127.0.0.1:5000/createInvestigator", formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showToast("success", `Account created for ${name}. Share the temporary password with them.`);
      setName(""); setEmail(""); setWallet(""); setRole("investigator"); setPassword("");
      fetchInvestigators();
    } catch (err) {
      showToast("error", err.response?.data?.error || "Failed to create account.");
    } finally {
      setLoading(false);
    }
  };

  /* ── DELETE INVESTIGATOR ── */
  const handleDelete = async (id, invName) => {
    if (!window.confirm(`Remove ${invName} from the system?`)) return;
    setDeletingId(id);
    try {
      await axios.delete(`http://127.0.0.1:5000/deleteInvestigator/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showToast("success", `${invName} has been removed.`);
      fetchInvestigators();
    } catch (err) {
      showToast("error", err.response?.data?.error || "Delete failed.");
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = investigators.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={s.page}>

      {/* ── TOAST ── */}
      {toast && (
        <div style={{ ...s.toast, ...(toast.type === "success" ? s.toastSuccess : s.toastError) }}>
          {toast.type === "success"
            ? <FaCheckCircle style={{ marginRight: 8, flexShrink: 0 }} />
            : <FaTimesCircle style={{ marginRight: 8, flexShrink: 0 }} />}
          {toast.msg}
        </div>
      )}

      {/* ── PAGE HEADER ── */}
      <div style={s.pageHeader}>
        <div style={s.pageHeaderLeft}>
          <FaShieldAlt size={28} color="#3b82f6" />
          <div>
            <h1 style={s.pageTitle}>Admin Panel</h1>
            <p style={s.pageSubtitle}>Manage investigator accounts and system access</p>
          </div>
        </div>
        <div style={s.statsBadge}>
          <FaUsers size={14} style={{ marginRight: 6 }} />
          {investigators.length} Investigators
        </div>
      </div>

      <div style={s.grid}>

        {/* ── CREATE FORM ── */}
        <div style={s.card}>
          <div style={s.cardHeader}>
            <FaUserPlus size={16} color="#60a5fa" />
            <span style={s.cardTitle}>Register New Investigator</span>
          </div>

          <div style={s.cardNote}>
            <FaKey size={11} style={{ marginRight: 6 }} />
            Set a temporary password and share it with the investigator.
            They will be prompted to change it on first login.
          </div>

          <form onSubmit={handleCreate} style={s.form}>

            <Field label="Full Name" icon={<FaUserTag size={13} />}>
              <input className="ad-input" style={s.input}
                type="text" placeholder="e.g. Sarah Al-Rashidi"
                value={name} onChange={(e) => setName(e.target.value)} required />
            </Field>

            <Field label="Email Address" icon={<FaEnvelope size={13} />}>
              <input className="ad-input" style={s.input}
                type="email" placeholder="investigator@dfs.gov"
                value={email} onChange={(e) => setEmail(e.target.value)} required />
            </Field>

            <Field label="Wallet Address (optional)" icon={<FaWallet size={13} />}>
              <input className="ad-input" style={s.input}
                type="text" placeholder="0x..."
                value={wallet} onChange={(e) => setWallet(e.target.value)} />
            </Field>

            <Field label="Role" icon={<FaShieldAlt size={13} />}>
              <select className="ad-select" style={s.select}
                value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="investigator">Investigator</option>
                <option value="admin">Admin</option>
              </select>
            </Field>

            <Field label="Temporary Password" icon={<FaLock size={13} />}>
              <div style={{ position: "relative" }}>
                <input className="ad-input" style={s.input}
                  type={showPw ? "text" : "password"}
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  style={s.eyeBtn}>
                  {showPw ? "🙈" : "👁️"}
                </button>
              </div>
            </Field>

            <button type="submit" className="ad-submit" style={s.submitBtn} disabled={loading}>
              {loading
                ? <><FaSpinner style={{ animation: "spin 0.8s linear infinite", marginRight: 8 }} />Creating…</>
                : <><FaUserPlus style={{ marginRight: 8 }} />Create Account</>
              }
            </button>
          </form>
        </div>

        {/* ── INVESTIGATORS TABLE ── */}
        <div style={{ ...s.card, flex: 2, minWidth: 0 }}>
          <div style={{ ...s.cardHeader, marginBottom: 16 }}>
            <FaUsers size={16} color="#60a5fa" />
            <span style={s.cardTitle}>Investigators</span>
            <div style={s.searchWrap}>
              <FaSearch size={12} color="#64748b"
                style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
              <input className="ad-input" style={s.searchInput}
                placeholder="Search by name or email…"
                value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>

          {fetching ? (
            <div style={s.centerMsg}>
              <FaSpinner size={22} color="#3b82f6" style={{ animation: "spin 0.8s linear infinite" }} />
              <span style={{ marginLeft: 10, color: "#64748b" }}>Loading investigators…</span>
            </div>
          ) : filtered.length === 0 ? (
            <div style={s.centerMsg}>
              <FaUsers size={32} color="#1e293b" />
              <p style={{ color: "#475569", marginTop: 10 }}>No investigators found.</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={s.table}>
                <thead>
                  <tr>
                    {["#", "Name", "Email", "Role", "Password Status", "Action"].map((h) => (
                      <th key={h} style={s.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((inv, idx) => (
                    <tr key={inv.id} className="ad-row" style={s.tr}>
                      <td style={{ ...s.td, color: "#475569", width: 40 }}>{idx + 1}</td>
                      <td style={s.td}>
                        <div style={s.nameCell}>
                          <div style={s.avatar}>{inv.name[0].toUpperCase()}</div>
                          {inv.name}
                        </div>
                      </td>
                      <td style={{ ...s.td, color: "#94a3b8" }}>{inv.email}</td>
                      <td style={s.td}>
                        <span style={inv.role === "admin" ? s.roleAdmin : s.roleInv}>
                          {inv.role}
                        </span>
                      </td>
                      <td style={s.td}>
                        {inv.must_change_password
                          ? <span style={s.pwPending}>
                              <FaTimesCircle size={12} style={{ marginRight: 4 }} />
                              Temp Password
                            </span>
                          : <span style={s.pwSet}>
                              <FaCheckCircle size={12} style={{ marginRight: 4 }} />
                              Password Set
                            </span>
                        }
                      </td>
                      <td style={s.td}>
                        <button className="ad-del-btn" style={s.deleteBtn}
                          onClick={() => handleDelete(inv.id, inv.name)}
                          disabled={deletingId === inv.id}>
                          {deletingId === inv.id
                            ? <FaSpinner style={{ animation: "spin 0.8s linear infinite" }} />
                            : <FaTrashAlt size={13} />
                          }
                          <span style={{ marginLeft: 6 }}>Remove</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, icon, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={s.label}>
        <span style={{ marginRight: 6, color: "#60a5fa" }}>{icon}</span>
        {label}
      </label>
      {children}
    </div>
  );
}

const s = {
  page: {
    fontFamily: "'DM Sans', sans-serif",
    minHeight: "100%",
    color: "#e2e8f0",
    animation: "fadeSlideIn 0.4s ease",
    position: "relative",
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
  pageHeader: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    marginBottom: 28, flexWrap: "wrap", gap: 12,
  },
  pageHeaderLeft: { display: "flex", alignItems: "center", gap: 14 },
  pageTitle: {
    margin: 0, fontSize: 26, fontFamily: "'Syne', sans-serif",
    fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.02em",
  },
  pageSubtitle: { margin: "3px 0 0", fontSize: 13, color: "#64748b" },
  statsBadge: {
    display: "flex", alignItems: "center",
    background: "#0f2040", border: "1px solid #1e3a5f",
    color: "#60a5fa", padding: "7px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600,
  },
  grid: { display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" },
  card: {
    flex: 1, minWidth: 300,
    background: "#0d1b2e", border: "1px solid #1e293b",
    borderRadius: 14, padding: "24px", boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
  },
  cardHeader: { display: "flex", alignItems: "center", gap: 10, marginBottom: 8 },
  cardTitle: {
    fontSize: 15, fontFamily: "'Syne', sans-serif",
    fontWeight: 700, color: "#e2e8f0", flex: 1,
  },
  cardNote: {
    display: "flex", alignItems: "center",
    fontSize: 12, color: "#60a5fa",
    background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)",
    borderRadius: 8, padding: "8px 12px", marginBottom: 20,
  },
  form: { display: "flex", flexDirection: "column" },
  label: {
    display: "flex", alignItems: "center",
    fontSize: 12, fontWeight: 600, color: "#94a3b8",
    marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.06em",
  },
  input: {
    width: "100%", background: "#071020", border: "1px solid #1e293b",
    borderRadius: 8, padding: "10px 12px", color: "#f1f5f9",
    fontSize: 14, transition: "border-color 0.2s, box-shadow 0.2s", boxSizing: "border-box",
  },
  select: {
    width: "100%", background: "#071020", border: "1px solid #1e293b",
    borderRadius: 8, padding: "10px 12px", color: "#f1f5f9",
    fontSize: 14, cursor: "pointer", boxSizing: "border-box",
  },
  eyeBtn: {
    position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
    background: "none", border: "none", cursor: "pointer", fontSize: 14,
  },
  submitBtn: {
    display: "flex", alignItems: "center", justifyContent: "center",
    marginTop: 8, padding: "11px",
    background: "linear-gradient(135deg, #1d4ed8, #2563eb)",
    color: "white", border: "none", borderRadius: 9,
    fontWeight: 700, fontSize: 14, cursor: "pointer",
    transition: "filter 0.2s, transform 0.15s", fontFamily: "'Syne', sans-serif",
  },
  searchWrap: { position: "relative", marginLeft: "auto" },
  searchInput: {
    background: "#071020", border: "1px solid #1e293b",
    borderRadius: 8, padding: "7px 10px 7px 30px", color: "#f1f5f9",
    fontSize: 13, width: 200, boxSizing: "border-box",
  },
  table: { width: "100%", borderCollapse: "collapse" },
  th: {
    textAlign: "left", padding: "10px 14px", fontSize: 11, fontWeight: 700,
    color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em",
    borderBottom: "1px solid #1e293b", whiteSpace: "nowrap",
  },
  tr: { transition: "background 0.15s" },
  td: {
    padding: "13px 14px", fontSize: 14, color: "#e2e8f0",
    borderBottom: "1px solid #0f1f35", whiteSpace: "nowrap",
  },
  nameCell: { display: "flex", alignItems: "center", gap: 10 },
  avatar: {
    width: 30, height: 30, borderRadius: "50%",
    background: "linear-gradient(135deg, #1d4ed8, #7c3aed)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 13, fontWeight: 700, color: "white", flexShrink: 0,
  },
  roleAdmin: {
    background: "rgba(124,58,237,0.15)", color: "#c4b5fd",
    border: "1px solid rgba(124,58,237,0.3)", padding: "3px 9px",
    borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: "uppercase",
  },
  roleInv: {
    background: "rgba(14,165,233,0.12)", color: "#7dd3fc",
    border: "1px solid rgba(14,165,233,0.25)", padding: "3px 9px",
    borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: "uppercase",
  },
  pwSet: { display: "inline-flex", alignItems: "center", color: "#4ade80", fontSize: 12, fontWeight: 600 },
  pwPending: { display: "inline-flex", alignItems: "center", color: "#fbbf24", fontSize: 12, fontWeight: 600 },
  deleteBtn: {
    display: "inline-flex", alignItems: "center",
    background: "rgba(239,68,68,0.08)", color: "#f87171",
    border: "1px solid rgba(239,68,68,0.2)", padding: "6px 12px",
    borderRadius: 7, cursor: "pointer", fontSize: 13, transition: "background 0.2s, color 0.2s",
  },
  centerMsg: {
    display: "flex", alignItems: "center", justifyContent: "center",
    flexDirection: "column", padding: "50px 0", color: "#475569",
  },
};
