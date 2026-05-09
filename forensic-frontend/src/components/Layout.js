import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FaHome, FaChartBar, FaFolder, FaSearch, FaClock, FaUserShield, FaSignOutAlt, FaBars, FaTimes, FaUserCircle, FaFileAlt } from "react-icons/fa";

const injectLayoutStyles = () => {
  if (document.getElementById("layout-forena-styles")) return;
  const s = document.createElement("style");
  s.id = "layout-forena-styles";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
    @keyframes logo-glow-pulse {
      0%, 100% { text-shadow: 0 0 10px rgba(96,165,250,0.6), 0 0 30px rgba(96,165,250,0.25), 0 0 60px rgba(96,165,250,0.1); }
      50%       { text-shadow: 0 0 20px rgba(96,165,250,0.95), 0 0 50px rgba(96,165,250,0.45), 0 0 90px rgba(167,139,250,0.2); }
    }
    @keyframes icon-glow {
      0%, 100% { filter: drop-shadow(0 0 5px rgba(96,165,250,0.55)); }
      50%       { filter: drop-shadow(0 0 12px rgba(96,165,250,0.95)); }
    }
    .forena-logo-text {
      font-family: 'Syne', sans-serif; font-weight: 800; font-size: 20px;
      letter-spacing: 0.1em; color: #f1f5f9;
      animation: logo-glow-pulse 3s ease-in-out infinite;
    }
    .forena-shield-icon { animation: icon-glow 3s ease-in-out infinite; }
    .forena-nav-item {
      display: flex; align-items: center; padding: 11px 14px; margin-bottom: 4px;
      text-decoration: none; color: #64748b; border-radius: 10px;
      font-size: 14px; font-weight: 500; position: relative;
      transition: background 0.2s, color 0.2s; overflow: hidden;
    }
    .forena-nav-item:hover { background: rgba(30,64,175,0.12); color: #e2e8f0; }
    .forena-nav-item.active {
      background: linear-gradient(90deg, #1e40af 0%, #1d4ed8 100%); color: #fff;
      box-shadow: 0 2px 12px rgba(30,64,175,0.4), 0 0 20px rgba(59,130,246,0.12);
    }
    .forena-logout-btn:hover { background: rgba(239,68,68,0.2) !important; border-color: rgba(239,68,68,0.45) !important; }
    .forena-menu-btn:hover { background: #1e3a5f !important; border-color: #3b82f6 !important; color: #60a5fa !important; }
  `;
  document.head.appendChild(s);
};

function Layout({ children }) {
  useEffect(() => { injectLayoutStyles(); }, []);
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef(null);

  const token = localStorage.getItem("token");
  let user = null;
  try { if (token) user = JSON.parse(atob(token.split(".")[1])); } catch {}

  const isLoginPage = location.pathname === "/login";
  const handleLogout = () => { localStorage.removeItem("token"); setDrawerOpen(false); navigate("/"); };
  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    const handleClickOutside = (e) => { if (drawerRef.current && !drawerRef.current.contains(e.target)) setDrawerOpen(false); };
    if (drawerOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [drawerOpen]);

  useEffect(() => { setDrawerOpen(false); }, [location.pathname]);

  const rc = user?.role === "admin"
    ? { bg: "#4c1d95", border: "#7c3aed", text: "#c4b5fd" }
    : user?.role === "investigator"
    ? { bg: "#0c2a4a", border: "#0369a1", text: "#7dd3fc" }
    : { bg: "#1e293b", border: "#334155", text: "#94a3b8" };

  return (
    <div style={st.root}>
      {/* TOPBAR */}
      <header style={st.topbar}>
        <div style={st.topbarLeft}>
          <button className="forena-menu-btn" style={st.menuBtn} onClick={() => setDrawerOpen((v) => !v)}>
            {drawerOpen ? <FaTimes size={16} /> : <FaBars size={16} />}
          </button>
          <Link to="/" style={st.logoWrap}>
            <div style={st.logoIconWrap}>
              <svg className="forena-shield-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L3 6v6c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V6L12 2z" fill="url(#sg)" />
                <path d="M9 12l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <defs>
                  <linearGradient id="sg" x1="3" y1="2" x2="21" y2="23" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#3b82f6"/>
                    <stop offset="100%" stopColor="#7c3aed"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <span className="forena-logo-text">FORENA</span>
            <span style={st.logoSub}>Digital Forensic System</span>
          </Link>
        </div>
        <div style={st.topbarRight}>
          {user && !isLoginPage ? (
            <>
              <span style={st.userName}>👤 {user.name}</span>
              <span style={{ ...st.roleBadge, background: rc.bg, border: `1px solid ${rc.border}`, color: rc.text }}>{user.role}</span>
              <button onClick={handleLogout} style={st.logoutBtn}>
                <FaSignOutAlt style={{ marginRight: 6 }} /> Logout
              </button>
            </>
          ) : (
            <button onClick={() => navigate("/login")} style={st.loginBtn}>Sign In</button>
          )}
        </div>
      </header>

      {/* OVERLAY */}
      <div style={{ ...st.overlay, opacity: drawerOpen ? 1 : 0, pointerEvents: drawerOpen ? "all" : "none" }} onClick={() => setDrawerOpen(false)} />

      {/* DRAWER */}
      <aside ref={drawerRef} style={{ ...st.drawer, transform: drawerOpen ? "translateX(0)" : "translateX(-100%)" }}>
        <div style={st.drawerGlow} />
        <div style={st.profileSection}>
          <div style={st.avatarWrap}>
            <FaUserCircle size={56} color="#334155" />
            <span style={st.onlineDot} />
          </div>
          {user ? (
            <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <p style={st.profileName}>{user.name}</p>
              <span style={{ ...st.profileRole, background: rc.bg, border: `1px solid ${rc.border}`, color: rc.text }}>{user.role}</span>
            </div>
          ) : <p style={st.profileName}>Guest</p>}
        </div>
        <div style={st.divider} />
        <nav style={st.nav}>
          <p style={st.navSection}>Navigation</p>
          <NavItem to="/" icon={<FaHome />} label="Home" active={isActive("/")} />
          {!isLoginPage && user && <NavItem to="/dashboard" icon={<FaChartBar />} label="Dashboard" active={isActive("/dashboard")} />}
          {user?.role === "investigator" && <>
            <NavItem to="/register" icon={<FaFolder />} label="Register Evidence" active={isActive("/register")} />
            <NavItem to="/verify" icon={<FaSearch />} label="Verify Evidence" active={isActive("/verify")} />
            <NavItem to="/case" icon={<FaFolder />} label="Cases" active={isActive("/case")} />
            <NavItem to="/timeline" icon={<FaClock />} label="Timeline" active={isActive("/timeline")} />
            <NavItem to="/report" icon={<FaFileAlt />} label="Generate Report" active={isActive("/report")} />
          </>}
          {user?.role === "admin" && <>
            <NavItem to="/create-case" icon={<FaFolder />} label="Create Case" active={isActive("/create-case")} />
            <NavItem to="/admin" icon={<FaUserShield />} label="Admin Panel" active={isActive("/admin")} />
            <NavItem to="/report" icon={<FaFileAlt />} label="Generate Report" active={isActive("/report")} />
          </>}
        </nav>
        {user && !isLoginPage && (
          <>
            <div style={{ height: 1, background: "linear-gradient(90deg, transparent, #1e293b, transparent)", margin: "auto 20px 0" }} />
            <button onClick={handleLogout} className="forena-logout-btn" style={st.drawerLogout}>
              <FaSignOutAlt style={{ marginRight: 8 }} /> Sign Out
            </button>
          </>
        )}
        <p style={st.drawerBrand}>FORENA · v1.0</p>
      </aside>

      <main style={st.main}>{children}</main>
    </div>
  );
}

function NavItem({ to, icon, label, active }) {
  return (
    <Link to={to} className={`forena-nav-item${active ? " active" : ""}`}>
      <span style={{ width: 20, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 14 }}>{icon}</span>
      <span style={{ marginLeft: 12, flex: 1 }}>{label}</span>
      {active && <span style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", width: 3, height: "60%", background: "#60a5fa", borderRadius: "2px 0 0 2px", boxShadow: "0 0 8px rgba(96,165,250,0.8)" }} />}
    </Link>
  );
}

const st = {
  root: { display: "flex", flexDirection: "column", height: "100vh", background: "#0f172a", color: "#f1f5f9", fontFamily: "'DM Sans', sans-serif", overflow: "hidden" },
  topbar: { height: 60, background: "#020617", borderBottom: "1px solid #0f1f35", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", flexShrink: 0, zIndex: 200, position: "relative", boxShadow: "0 1px 24px rgba(0,0,0,0.5)" },
  topbarLeft: { display: "flex", alignItems: "center", gap: 14 },
  menuBtn: { background: "#0d1b2e", border: "1px solid #1e293b", color: "#64748b", width: 34, height: 34, borderRadius: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s", flexShrink: 0 },
  logoWrap: { display: "flex", alignItems: "center", gap: 10, textDecoration: "none" },
  logoIconWrap: { width: 34, height: 34, background: "linear-gradient(135deg, #0c1e3d, #1a3a6e)", border: "1px solid #1e3a5f", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  logoSub: { fontSize: 10, color: "#334155", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600 },
  topbarRight: { display: "flex", alignItems: "center", gap: 12 },
  userName: { fontSize: 13, color: "#94a3b8", fontWeight: 500 },
  roleBadge: { fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 20, letterSpacing: "0.07em", textTransform: "uppercase" },
  logoutBtn: { display: "flex", alignItems: "center", background: "rgba(127,29,29,0.3)", color: "#f87171", border: "1px solid rgba(153,27,27,0.5)", padding: "6px 14px", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, transition: "background 0.2s" },
  loginBtn: { background: "linear-gradient(135deg, #1d4ed8, #2563eb)", color: "white", border: "none", padding: "7px 18px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 13, fontFamily: "'Syne', sans-serif", boxShadow: "0 0 16px rgba(37,99,235,0.3)" },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 299, transition: "opacity 0.3s ease", backdropFilter: "blur(3px)" },
  drawer: { position: "fixed", top: 0, left: 0, width: 272, height: "100vh", background: "#020617", borderRight: "1px solid #0f1f35", zIndex: 300, display: "flex", flexDirection: "column", transition: "transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)", overflowY: "auto", padding: "20px 0", boxShadow: "4px 0 40px rgba(0,0,0,0.7)" },
  drawerGlow: { position: "absolute", top: 0, left: 0, right: 0, height: 180, background: "radial-gradient(ellipse at 50% 0%, rgba(37,99,235,0.1) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 },
  profileSection: { display: "flex", flexDirection: "column", alignItems: "center", padding: "24px 20px 20px", gap: 12, position: "relative", zIndex: 1 },
  avatarWrap: { position: "relative", width: 64, height: 64, display: "flex", alignItems: "center", justifyContent: "center", background: "#0d1b2e", borderRadius: "50%", border: "2px solid #1e293b" },
  onlineDot: { position: "absolute", bottom: 3, right: 3, width: 10, height: 10, background: "#22c55e", borderRadius: "50%", border: "2px solid #020617", boxShadow: "0 0 6px rgba(34,197,94,0.6)" },
  profileName: { margin: 0, fontSize: 15, fontFamily: "'Syne', sans-serif", fontWeight: 700, color: "#f1f5f9" },
  profileRole: { fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20, textTransform: "uppercase", letterSpacing: "0.08em" },
  divider: { height: 1, background: "linear-gradient(90deg, transparent, #1e293b, transparent)", margin: "0 0 14px" },
  nav: { padding: "0 12px", flex: 1, position: "relative", zIndex: 1 },
  navSection: { fontSize: 9, fontWeight: 700, color: "#334155", letterSpacing: "0.12em", padding: "0 8px", marginBottom: 8, marginTop: 4, textTransform: "uppercase" },
  drawerLogout: { display: "flex", alignItems: "center", justifyContent: "center", margin: "14px 20px 0", padding: "10px", background: "rgba(127,29,29,0.15)", color: "#f87171", border: "1px solid rgba(153,27,27,0.3)", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 600, transition: "background 0.2s", position: "relative", zIndex: 1 },
  drawerBrand: { textAlign: "center", fontSize: 10, color: "#1e293b", letterSpacing: "0.1em", margin: "12px 0 0", fontFamily: "'Syne', sans-serif", fontWeight: 700 },
  main: { flex: 1, overflowY: "auto", padding: "30px", background: "#0f172a" },
};

export default Layout;
