import React, { useState } from "react";
import axios from "axios";

function TimelineViewer() {
  const [caseNumber, setCaseNumber] = useState("");
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [caseInfo, setCaseInfo] = useState(null);

  const fetchTimeline = async (e) => {
    e.preventDefault();

    if (!caseNumber) {
      setError("Please enter a case number");
      return;
    }

    setLoading(true);
    setError("");
    setTimeline([]);
    setCaseInfo(null);

    try {
      const res = await axios.get(
        `http://127.0.0.1:5000/caseTimeline?case_number=${caseNumber}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setTimeline(res.data.timeline);
      setCaseInfo({ case_number: res.data.case_number });

    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Failed to fetch timeline"
      );
    }

    setLoading(false);
  };

  // 🎨 Color based on action
  const getColor = (action) => {
    switch (action) {
      case "REGISTERED":
        return "#3498db"; // blue
      case "VERIFIED":
        return "#2ecc71"; // green
      case "FAILED_VERIFICATION":
        return "#e74c3c"; // red
      default:
        return "#7f8c8d"; // gray
    }
  };

  return (
    <div style={{ maxWidth: "900px", marginTop: "40px" }}>
      <h2>⏱ Case Timeline Viewer</h2>

      {/* INPUT */}
      <form onSubmit={fetchTimeline}>
        <input
          type="text"
          placeholder="Enter Case Number"
          value={caseNumber}
          onChange={(e) => setCaseNumber(e.target.value)}
          style={{ width: "100%", padding: "10px" }}
        />

        <br /><br />

        <button type="submit" disabled={loading}>
          {loading ? "Loading Timeline..." : "Load Timeline"}
        </button>
      </form>

      {/* ERROR */}
      {error && (
        <p style={{ color: "red", marginTop: "20px" }}>
          ❌ {error}
        </p>
      )}

      {/* CASE INFO */}
      {caseInfo && (
        <h3 style={{ marginTop: "20px" }}>
          📁 Case #{caseInfo.case_number} Timeline
        </h3>
      )}

      {/* TIMELINE */}
      {timeline.length > 0 && (
        <div style={{ marginTop: "20px" }}>
          {timeline.map((item, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                alignItems: "flex-start",
                marginBottom: "15px",
              }}
            >
              {/* DOT */}
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  backgroundColor: getColor(item.action),
                  marginRight: "10px",
                  marginTop: "5px",
                }}
              />

              {/* CONTENT */}
              <div
                style={{
                  padding: "10px",
                  border: "1px solid #ccc",
                  borderRadius: "8px",
                  width: "100%",
                  backgroundColor: "#1e1e1e",
                }}
              >
                <p><strong>Action:</strong> {item.action}</p>
                <p><strong>Evidence ID:</strong> {item.evidence_id}</p>
                <p><strong>Performed By:</strong> {item.performed_by}</p>
                <p>
                  <strong>Time:</strong>{" "}
                  {item.timestamp
                    ? new Date(item.timestamp).toLocaleString()
                    : "N/A"}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* EMPTY STATE */}
      {caseInfo && timeline.length === 0 && (
        <p style={{ marginTop: "20px" }}>
          ⚠️ No timeline events found for this case
        </p>
      )}
    </div>
  );
}

export default TimelineViewer;
