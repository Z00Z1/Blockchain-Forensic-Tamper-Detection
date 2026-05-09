import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Layout from "./components/Layout";

import RegisterEvidence from "./pages/RegisterEvidence";
import VerifyEvidence from "./pages/VerifyEvidence";
import CaseViewer from "./pages/CaseViewer";
import TimelineViewer from "./pages/TimelineViewer";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import CreateCase from "./pages/CreateCase";
import Login from "./pages/Login";
import Home from "./pages/Home";
import ReportGenerator from "./pages/ReportGenerator";

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/register" element={<RegisterEvidence />} />
          <Route path="/verify" element={<VerifyEvidence />} />
          <Route path="/case" element={<CaseViewer />} />
          <Route path="/timeline" element={<TimelineViewer />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/create-case" element={<CreateCase />} />
          <Route path="/report" element={<ReportGenerator />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
