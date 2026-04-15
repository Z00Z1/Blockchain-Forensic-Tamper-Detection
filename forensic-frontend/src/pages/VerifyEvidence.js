import React, { useState } from "react";
import axios from "axios";

function VerifyEvidence() {
  const [evidenceId, setEvidenceId] = useState("");
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);

  const handleVerify = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("evidence_id", evidenceId);
    formData.append("file", file);

    try {
      const res = await axios.post(
        "http://127.0.0.1:5000/verifyEvidence",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            "X-User": "Ali",
          },
        }
      );
      console.log(res.data);
      setResult({
          ...res.data,
          status: res.data.status?.toLowerCase()
        });

    } catch (err) {
      setResult({
        status: "error",
        message:
          err.response?.data?.error ||
          err.response?.data?.message ||
          err.message,
      });
    }
  };

  return (
    <div style={{ marginTop: "40px" }}>
      <h2>🔍 Verify Evidence</h2>

      <form onSubmit={handleVerify}>
        <input
          type="text"
          placeholder="Evidence ID"
          value={evidenceId}
          onChange={(e) => setEvidenceId(e.target.value)}
        />
        <br /><br />

        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
        />
        <br /><br />

        <button type="submit">Verify</button>
      </form>

      {/* RESULT DISPLAY */}
      {result && (
        <div style={{ marginTop: "20px" }}>
          <h3>Result:</h3>

          {result.status === "trusted" && (
            <p style={{ color: "green" }}>
              ✅ Trusted Evidence
            </p>
          )}

          {result.status === "mismatch" && (
            <p style={{ color: "orange" }}>
              ⚠️ Slight Mismatch Detected
            </p>
          )}

          {result.status === "compromised" && (
            <p style={{ color: "red" }}>
              ❌ Evidence Compromised
            </p>
          )}

          {result.status === "error" && (
            <p style={{ color: "red" }}>
              ❌ {result.message}
            </p>
          )}
        </div>
      )}
      <p>Blockchain Hash: {result.blockchain_hash}</p>
      <p>Hash Match: {result.hash_match ? "✔ Yes" : "❌ No"}</p>
    </div>
  );
}

export default VerifyEvidence;
