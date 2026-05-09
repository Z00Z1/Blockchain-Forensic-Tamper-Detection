import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaShieldAlt, FaFolder, FaLink, FaSearch,
  FaClock, FaChartBar, FaArrowRight, FaLock,
  FaCheckCircle, FaFingerprint
} from "react-icons/fa";

const injectStyles = () => {
  if (document.getElementById("home-forena-styles")) return;
  const s = document.createElement("style");
  s.id = "home-forena-styles";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(20px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes pulse-glow {
      0%, 100% { opacity: 0.6; }
      50%       { opacity: 1; }
    }
    @keyframes scanline {
      0%   { transform: translateY(-100%); }
      100% { transform: translateY(600%); }
    }
    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50%       { transform: translateY(-8px); }
    }
    @keyframes shimmer {
      0%   { background-position: -200% center; }
      100% { background-position: 200% center; }
    }
    .forena-feature-card {
      background: #0a1628;
      border: 1px solid #1e293b;
      border-radius: 16px;
      padding: 28px 24px;
      transition: border-color 0.3s, transform 0.3s, box-shadow 0.3s;
      position: relative;
      overflow: hidden;
    }
    .forena-feature-card:hover {
      border-color: rgba(59,130,246,0.45);
      transform: translateY(-5px);
      box-shadow: 0 20px 60px rgba(0,0,0,0.4), 0 0 35px rgba(59,130,246,0.14);
    }
    .forena-stat-card {
      background: rgba(10,22,40,0.8);
      border: 1px solid #1e293b;
      border-radius: 12px;
      padding: 18px 20px;
      transition: border-color 0.3s, box-shadow 0.3s;
    }
    .forena-stat-card:hover {
      border-color: rgba(59,130,246,0.35);
      box-shadow: 0 0 20px rgba(59,130,246,0.1);
    }
    .forena-cta-btn {
      display: inline-flex; align-items: center; gap: 10px;
      padding: 14px 28px;
      background: linear-gradient(135deg, #1d4ed8, #2563eb);
      color: white; border: none; border-radius: 10px;
      font-family: 'Syne', sans-serif; font-weight: 700; font-size: 15px;
      cursor: pointer; transition: filter 0.2s, transform 0.2s, box-shadow 0.2s;
      box-shadow: 0 4px 20px rgba(37,99,235,0.4), 0 0 40px rgba(37,99,235,0.15);
    }
    .forena-cta-btn:hover {
      filter: brightness(1.12); transform: translateY(-2px);
      box-shadow: 0 8px 30px rgba(37,99,235,0.55), 0 0 60px rgba(37,99,235,0.22);
    }
    .forena-outline-btn {
      display: inline-flex; align-items: center; gap: 10px;
      padding: 13px 26px; background: transparent; color: #94a3b8;
      border: 1px solid #334155; border-radius: 10px;
      font-family: 'Syne', sans-serif; font-weight: 600; font-size: 15px;
      cursor: pointer; transition: border-color 0.2s, color 0.2s, background 0.2s;
    }
    .forena-outline-btn:hover {
      border-color: #60a5fa; color: #60a5fa; background: rgba(59,130,246,0.07);
    }
    .forena-badge {
      display: inline-flex; align-items: center; gap: 6px;
      background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.25);
      color: #60a5fa; padding: 5px 14px; border-radius: 20px;
      font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
    }
    .forena-glow-text {
      background: linear-gradient(135deg, #f1f5f9 20%, #60a5fa 60%, #a78bfa 100%);
      background-size: 200% auto;
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text; animation: shimmer 4s linear infinite;
    }
    .forena-icon-wrap {
      width: 48px; height: 48px; border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 16px; transition: box-shadow 0.3s;
    }
    .forena-feature-card:hover .forena-icon-wrap { box-shadow: 0 0 22px rgba(59,130,246,0.4); }
    .forena-step {
      text-align: center; padding: 28px 20px;
      background: #0a1628; border: 1px solid #1e293b; border-radius: 16px;
      transition: border-color 0.3s, box-shadow 0.3s;
    }
    .forena-step:hover {
      border-color: rgba(59,130,246,0.3);
      box-shadow: 0 0 30px rgba(59,130,246,0.08);
    }
  `;
  document.head.appendChild(s);
};

const features = [
  { icon: <FaLink size={20} color="#60a5fa" />, iconBg: "rgba(59,130,246,0.12)", title: "Blockchain Integrity", desc: "Every piece of evidence is cryptographically anchored to an immutable blockchain ledger — any tampering is detected instantly.", tag: "Core", tagColor: "#3b82f6" },
  { icon: <FaFolder size={20} color="#a78bfa" />, iconBg: "rgba(124,58,237,0.12)", title: "Case Management", desc: "Organize, track and manage forensic cases with structured workflows designed for investigative precision.", tag: "Workflow", tagColor: "#7c3aed" },
  { icon: <FaClock size={20} color="#34d399" />, iconBg: "rgba(52,211,153,0.1)", title: "Chain of Custody", desc: "Every action on every piece of evidence is logged in real time — full auditability from collection to courtroom.", tag: "Audit", tagColor: "#059669" },
  { icon: <FaSearch size={20} color="#fbbf24" />, iconBg: "rgba(251,191,36,0.1)", title: "Evidence Verification", desc: "Compare evidence hashes against blockchain records to instantly detect modification or compromise.", tag: "Verify", tagColor: "#d97706" },
  { icon: <FaLock size={20} color="#f472b6" />, iconBg: "rgba(244,114,182,0.1)", title: "Encrypted Storage", desc: "Evidence files are encrypted with military-grade Fernet encryption before being stored on IPFS.", tag: "Security", tagColor: "#db2777" },
  { icon: <FaChartBar size={20} color="#38bdf8" />, iconBg: "rgba(56,189,248,0.1)", title: "SOC Dashboard", desc: "Real-time analytics, verification statistics and activity feeds give your team full situational awareness.", tag: "Analytics", tagColor: "#0284c7" },
];

const stats = [
  { value: "SHA-256", label: "Hash Algorithm", icon: <FaFingerprint size={17} color="#60a5fa" /> },
  { value: "AES-256", label: "Encryption Standard", icon: <FaLock size={15} color="#a78bfa" /> },
  { value: "IPFS", label: "Decentralized Storage", icon: <FaLink size={15} color="#34d399" /> },
  { value: "100%", label: "Evidence Traceability", icon: <FaCheckCircle size={15} color="#fbbf24" /> },
];

const steps = [
  { n: "01", title: "Collect Evidence", desc: "Investigator uploads digital evidence through the secure Forena portal." },
  { n: "02", title: "Hash & Encrypt", desc: "SHA-256 fingerprint is calculated. The file is Fernet-encrypted before storage." },
  { n: "03", title: "Anchor to Blockchain", desc: "The hash and IPFS CID are written to an immutable smart contract on-chain." },
  { n: "04", title: "Verify Integrity", desc: "At any point, re-upload the file — Forena instantly confirms if it has been tampered with." },
];

export default function Home() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  useEffect(() => {
    injectStyles();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animId;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    const particles = Array.from({ length: 45 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      r: Math.random() * 1.6 + 0.3, vx: (Math.random() - 0.5) * 0.28,
      vy: (Math.random() - 0.5) * 0.28, alpha: Math.random() * 0.45 + 0.08,
    }));
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(96,165,250,${p.alpha})`; ctx.fill();
      });
      animId = requestAnimationFrame(draw);
    };
    draw();
    window.addEventListener("resize", resize);
    return () => { cancelAnimationFrame(animId); window.removeEventListener("resize", resize); };
  }, []);

  // Smart navigation: check token and route by role
  const handleEnterSystem = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    try {
      const decoded = JSON.parse(atob(token.split(".")[1]));
      if (decoded.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    } catch {
      // Invalid token — send to login
      navigate("/login");
    }
  };

  return (
    <div style={s.page}>
      {/* HERO */}
      <section style={s.hero}>
        <canvas ref={canvasRef} style={s.canvas} />
        <div style={s.gridBg} />
        <div style={s.orbBlue} />
        <div style={s.orbPurple} />
        <div style={s.scanline} />
        <div style={s.heroContent}>
          <div style={{ animation: "fadeUp 0.55s ease both" }}>
            <span className="forena-badge"><FaShieldAlt size={11} /> Forensic Intelligence Platform</span>
          </div>
          <div style={{ animation: "fadeUp 0.65s ease 0.1s both" }}>
            <h1 style={s.heroTitle}><span className="forena-glow-text">FORENA</span></h1>
            <p style={s.heroTagline}>Digital Forensic Evidence Registry &amp; Network Analysis</p>
          </div>
          <p style={{ ...s.heroDesc, animation: "fadeUp 0.65s ease 0.2s both" }}>
            A secure, blockchain-powered platform for managing digital evidence with unbreakable
            chain-of-custody tracking, cryptographic verification, and real-time forensic intelligence.
          </p>
          <div style={{ ...s.heroBtns, animation: "fadeUp 0.65s ease 0.3s both" }}>
            {/* Enter System button*/}
            <button className="forena-cta-btn" onClick={handleEnterSystem}>
              Enter System <FaArrowRight size={13} />
            </button>
          </div>
          <div style={{ ...s.statsRow, animation: "fadeUp 0.65s ease 0.4s both" }}>
            {stats.map((st) => (
              <div key={st.label} className="forena-stat-card">
                <div style={{ marginBottom: 8 }}>{st.icon}</div>
                <p style={s.statValue}>{st.value}</p>
                <p style={s.statLabel}>{st.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section style={s.section}>
        <div style={s.sectionHead}>
          <span className="forena-badge">Capabilities</span>
          <h2 style={s.sectionTitle}>Built for Forensic Precision</h2>
          <p style={s.sectionSub}>Every module of Forena is engineered to meet the exacting standards of modern digital forensic investigation.</p>
        </div>
        <div style={s.featureGrid}>
          {features.map((f) => (
            <div key={f.title} className="forena-feature-card">
              <div className="forena-icon-wrap" style={{ background: f.iconBg }}>{f.icon}</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <h3 style={s.featureTitle}>{f.title}</h3>
                <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 20, letterSpacing: "0.07em", textTransform: "uppercase", flexShrink: 0, color: f.tagColor, border: `1px solid ${f.tagColor}44`, background: `${f.tagColor}14` }}>{f.tag}</span>
              </div>
              <p style={s.featureDesc}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={s.howSection}>
        <div style={s.howGlow} />
        <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <div style={s.sectionHead}>
            <span className="forena-badge">Workflow</span>
            <h2 style={s.sectionTitle}>How Forena Works</h2>
            <p style={s.sectionSub}>A seamless pipeline from evidence collection to verified courtroom submission.</p>
          </div>
          <div style={s.stepsRow}>
            {steps.map((step) => (
              <div key={step.n} className="forena-step">
                <div style={s.stepNum}>{step.n}</div>
                <h4 style={s.stepTitle}>{step.title}</h4>
                <p style={s.stepDesc}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={s.ctaBanner}>
        <div style={s.ctaBannerGlow} />
        <div style={s.ctaInner}>
          <FaShieldAlt size={38} color="#3b82f6" style={{ animation: "float 3s ease-in-out infinite" }} />
          <h2 style={s.ctaTitle}>Secure Your Evidence Today</h2>
          <p style={s.ctaDesc}>Join Forena and ensure every digital artifact in your investigation is protected, traceable, and court-admissible.</p>
          <button className="forena-cta-btn" onClick={handleEnterSystem}>
            Access Dashboard <FaArrowRight size={13} />
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={s.footer}>
        <p style={s.footerText}>© 2024 Forena · Digital Forensic Evidence Registry & Network Analysis · All rights reserved</p>
        <p style={s.footerSub}>Authorized access only · Powered by Blockchain + IPFS</p>
      </footer>
    </div>
  );
}

const s = {
  page: { fontFamily: "'DM Sans', sans-serif", color: "#e2e8f0", background: "#0f172a", overflowX: "hidden" },
  hero: { position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", padding: "80px 24px" },
  canvas: { position: "absolute", inset: 0, width: "100%", height: "100%", zIndex: 0 },
  gridBg: { position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(30,64,175,0.055) 1px, transparent 1px),linear-gradient(90deg, rgba(30,64,175,0.055) 1px, transparent 1px)", backgroundSize: "50px 50px", zIndex: 0 },
  orbBlue: { position: "absolute", top: "10%", left: "8%", width: 520, height: 520, borderRadius: "50%", background: "radial-gradient(circle, rgba(37,99,235,0.16) 0%, transparent 70%)", zIndex: 0, animation: "pulse-glow 4s ease-in-out infinite" },
  orbPurple: { position: "absolute", bottom: "8%", right: "4%", width: 420, height: 420, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,0.13) 0%, transparent 70%)", zIndex: 0 },
  scanline: { position: "absolute", left: 0, right: 0, height: "14%", background: "linear-gradient(transparent, rgba(59,130,246,0.035), transparent)", animation: "scanline 7s linear infinite", zIndex: 0, pointerEvents: "none" },
  heroContent: { position: "relative", zIndex: 1, maxWidth: 800, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 26 },
  heroTitle: { fontFamily: "'Syne', sans-serif", fontSize: "clamp(66px, 11vw, 114px)", fontWeight: 800, margin: "8px 0 0", letterSpacing: "-0.03em", lineHeight: 1 },
  heroTagline: { fontFamily: "'Syne', sans-serif", fontSize: "clamp(11px, 1.6vw, 14px)", fontWeight: 600, color: "#475569", letterSpacing: "0.16em", textTransform: "uppercase", margin: "10px 0 0" },
  heroDesc: { fontSize: 17, lineHeight: 1.75, color: "#64748b", maxWidth: 580, margin: 0 },
  heroBtns: { display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center" },
  statsRow: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, width: "100%", marginTop: 10 },
  statValue: { fontFamily: "'Syne', sans-serif", fontSize: 17, fontWeight: 800, color: "#f1f5f9", margin: "0 0 4px" },
  statLabel: { fontSize: 10, color: "#475569", margin: 0, textTransform: "uppercase", letterSpacing: "0.06em" },
  section: { maxWidth: 1100, margin: "0 auto", padding: "90px 30px" },
  sectionHead: { textAlign: "center", marginBottom: 50, display: "flex", flexDirection: "column", alignItems: "center", gap: 14 },
  sectionTitle: { fontFamily: "'Syne', sans-serif", fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 800, color: "#f1f5f9", margin: 0, letterSpacing: "-0.02em" },
  sectionSub: { fontSize: 16, color: "#64748b", maxWidth: 520, lineHeight: 1.7, margin: 0 },
  featureGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 },
  featureTitle: { fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, color: "#f1f5f9", margin: 0 },
  featureDesc: { fontSize: 14, color: "#64748b", lineHeight: 1.7, margin: 0 },
  howSection: { position: "relative", background: "linear-gradient(180deg, #0f172a 0%, #060f1e 50%, #0f172a 100%)", padding: "90px 30px", overflow: "hidden" },
  howGlow: { position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 700, height: 350, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(37,99,235,0.09) 0%, transparent 70%)", pointerEvents: "none" },
  stepsRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 20 },
  stepNum: { fontFamily: "'Syne', sans-serif", fontSize: 52, fontWeight: 800, color: "transparent", WebkitTextStroke: "1px rgba(59,130,246,0.38)", marginBottom: 14, lineHeight: 1 },
  stepTitle: { fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, color: "#f1f5f9", margin: "0 0 10px" },
  stepDesc: { fontSize: 13, color: "#64748b", lineHeight: 1.65, margin: 0 },
  ctaBanner: { position: "relative", overflow: "hidden", background: "#060f1e", borderTop: "1px solid #1e293b", borderBottom: "1px solid #1e293b", padding: "90px 40px", textAlign: "center" },
  ctaBannerGlow: { position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 520, height: 320, borderRadius: "50%", background: "radial-gradient(ellipse, rgba(37,99,235,0.2) 0%, transparent 65%)", pointerEvents: "none", animation: "pulse-glow 3s ease-in-out infinite" },
  ctaInner: { position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 18 },
  ctaTitle: { fontFamily: "'Syne', sans-serif", fontSize: "clamp(24px, 4vw, 38px)", fontWeight: 800, color: "#f1f5f9", margin: 0, letterSpacing: "-0.02em" },
  ctaDesc: { fontSize: 16, color: "#64748b", maxWidth: 480, lineHeight: 1.7, margin: 0 },
  footer: { textAlign: "center", padding: "28px 20px", borderTop: "1px solid #0f1f35" },
  footerText: { fontSize: 13, color: "#334155", margin: "0 0 6px" },
  footerSub: { fontSize: 11, color: "#1e293b", margin: 0, letterSpacing: "0.05em", textTransform: "uppercase" },
};
