import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

import RegisterEvidence from "./pages/RegisterEvidence";
import VerifyEvidence from "./pages/VerifyEvidence";
import CaseViewer from "./pages/CaseViewer";
import TimelineViewer from "./pages/TimelineViewer";
import Dashboard from "./pages/Dashboard"; // ✅ ADD THIS
import Login from "./pages/Login";

function App() {
  return (
    <Router>
      <div style={{ padding: "20px" }}>
        <h1>🔐 Digital Forensic System</h1>

        {/* NAVIGATION */}
        <div style={{ marginBottom: "20px" }}>
          <Link to="/login" style={{ marginRight: "10px" }}>Login</Link>
          <Link to="/" style={{ marginRight: "10px" }}>Register</Link>
          <Link to="/verify" style={{ marginRight: "10px" }}>Verify</Link>
          <Link to="/case" style={{ marginRight: "10px" }}>Case Viewer</Link>
          <Link to="/timeline" style={{ marginRight: "10px" }}>Timeline</Link>
          <Link to="/dashboard">Dashboard</Link> {/* ✅ ADD THIS */}
        </div>

        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<RegisterEvidence />} />
          <Route path="/verify" element={<VerifyEvidence />} />
          <Route path="/case" element={<CaseViewer />} />
          <Route path="/timeline" element={<TimelineViewer />} />
          <Route path="/dashboard" element={<Dashboard />} /> {/* ✅ ADD THIS */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
