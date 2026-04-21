import React, { useState } from "react";
import axios from "axios";

function VerifyEvidence() {
  const [evidenceId, setEvidenceId] = useState("");
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleVerify = async (e) => {
    e.preventDefault();

    // ✅ Validation
    if (!evidenceId || !file) {
      setResult({
        status: "error",
        message: "Please provide Evidence ID and file",
      });
      return;
    }

    const formData = new FormData();
    formData.append("evidence_id", evidenceId);
    formData.append("file", file);

    setLoading(true);
    setResult(null);

    try {
      const res = await axios.post(
        "http://127.0.0.1:5000/verifyEvidence",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const rawStatus = res.data.status?.toLowerCase() || "";

      // ✅ Normalize status safely
      let normalizedStatus = "error";
      if (rawStatus.includes("trusted")) normalizedStatus = "trusted";
      else if (rawStatus.includes("mismatch")) normalizedStatus = "mismatch";
      else if (rawStatus.includes("compromised"))
        normalizedStatus = "compromised";

      setResult({
        ...res.data,
        status: normalizedStatus,
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

    setLoading(false);
  };

  return (
    <div style={{ marginTop: "40px", maxWidth: "500px" }}>
      <h2>🔍 Verify Evidence</h2>

      <form onSubmit={handleVerify}>
        <input
          type="text"
          placeholder="Evidence ID"
          value={evidenceId}
          onChange={(e) => setEvidenceId(e.target.value)}
          style={{ width: "100%", padding: "8px" }}
        />
        <br /><br />

        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
        />
        <br /><br />

        <button type="submit" disabled={loading}>
          {loading ? "Verifying..." : "Verify"}
        </button>
      </form>

      {/* ✅ RESULT DISPLAY */}
      {result && (
        <div
          style={{
            marginTop: "20px",
            padding: "15px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            backgroundColor: "#1e1e1e",
          }}
        >
          <h3>Result:</h3>

          {/* STATUS */}
          {result.status === "trusted" && (
            <p style={{ color: "lightgreen", fontWeight: "bold" }}>
              ✅ Trusted Evidence
            </p>
          )}

          {result.status === "mismatch" && (
            <p style={{ color: "orange", fontWeight: "bold" }}>
              ⚠️ Slight Mismatch Detected
            </p>
          )}

          {result.status === "compromised" && (
            <p style={{ color: "red", fontWeight: "bold" }}>
              ❌ Evidence Compromised
            </p>
          )}

          {result.status === "error" && (
            <p style={{ color: "red", fontWeight: "bold" }}>
              ❌ {result.message}
            </p>
          )}

          <hr />

          {/* DETAILS */}
          <p>
            <strong>Blockchain Hash:</strong>{" "}
            {result.blockchain_hash || "N/A"}
          </p>

          <p>
            <strong>Hash Match:</strong>{" "}
            {result.hash_match ? "✔ Yes" : "❌ No"}
          </p>

          <p>
            <strong>Timestamp:</strong>{" "}
            {result.timestamp || "N/A"}
          </p>

          {/* Optional if backend provides */}
          {result.confidence && (
            <p>
              <strong>Confidence:</strong> {result.confidence}%
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default VerifyEvidence;
