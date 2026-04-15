import React from "react";
import RegisterEvidence from "./pages/RegisterEvidence";
import VerifyEvidence from "./pages/VerifyEvidence";

function App() {
  return (
    <div style={{ padding: "20px" }}>
      <h1>🔐 Digital Forensic System</h1>

      <RegisterEvidence />
      <VerifyEvidence />
    </div>
  );
}

export default App;
