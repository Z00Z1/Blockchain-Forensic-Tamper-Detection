import React, { useState } from "react";
import axios from "axios";

function CaseViewer() {
  const [caseNumber, setCaseNumber] = useState("");
  const [caseData, setCaseData] = useState(null);
  const [evidences, setEvidences] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchCase = async (e) => {
    e.preventDefault();

    if (!caseNumber) {
      setError("Please enter a case number");
      return;
    }

    setLoading(true);
    setError("");
    setCaseData(null);
    setEvidences([]);

    try {
      const res = await axios.get(
        `http://127.0.0.1:5000/caseEvidences?case_number=${caseNumber}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setCaseData(res.data.case);
      setEvidences(res.data.evidences);

    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Failed to fetch case"
      );
    }

    setLoading(false);
  };

  return (
    <div style={{ marginTop: "40px", maxWidth: "850px" }}>
      <h2>📁 Case Viewer</h2>

      {/* INPUT */}
      <form onSubmit={fetchCase}>
        <input
          type="text"
          placeholder="Enter Case Number"
          value={caseNumber}
          onChange={(e) => setCaseNumber(e.target.value)}
          style={{ width: "100%", padding: "8px" }}
        />
        <br /><br />

        <button type="submit" disabled={loading}>
          {loading ? "Loading..." : "View Case"}
        </button>
      </form>

      {/* ERROR */}
      {error && (
        <p style={{ color: "red", marginTop: "20px" }}>
          ❌ {error}
        </p>
      )}

      {/* CASE INFO */}
      {caseData && (
        <div
          style={{
            marginTop: "20px",
            padding: "15px",
            border: "1px solid #ccc",
            borderRadius: "8px",
            backgroundColor: "#1e1e1e",
          }}
        >
          <h3>📌 Case Details</h3>

          <p><strong>Case Number:</strong> {caseData.case_number}</p>
          <p><strong>Description:</strong> {caseData.description}</p>
          <p><strong>Created By:</strong> {caseData.created_by}</p>
          <p>
            <strong>Created At:</strong>{" "}
            {caseData.created_at
              ? new Date(caseData.created_at).toLocaleString()
              : "N/A"}
          </p>
        </div>
      )}

      {/* EVIDENCE TABLE */}
      {evidences.length > 0 && (
        <div style={{ marginTop: "20px" }}>
          <h3>📄 Evidence List</h3>

          <table
            border="1"
            cellPadding="10"
            style={{
              width: "100%",
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr>
                <th>Evidence ID</th>
                <th>Description</th>
                <th>Hash</th>
                <th>CID</th>
              </tr>
            </thead>

            <tbody>
              {evidences.map((ev) => (
                <tr
                  key={ev.evidence_id}
                  onClick={() =>
                    window.location.href = `/timeline/${ev.evidence_id}`
                  }
                  style={{ cursor: "pointer" }}
                >
                  <td>{ev.evidence_id}</td>
                  <td>{ev.description}</td>
                  <td>
                    {ev.file_hash
                      ? ev.file_hash.substring(0, 12) + "..."
                      : "N/A"}
                  </td>
                  <td>
                    {ev.cid ? ev.cid.substring(0, 12) + "..." : "N/A"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* EMPTY STATE */}
      {caseData && evidences.length === 0 && (
        <p style={{ marginTop: "20px" }}>
          ⚠️ No evidences found for this case
        </p>
      )}
    </div>
  );
}

export default CaseViewer;
