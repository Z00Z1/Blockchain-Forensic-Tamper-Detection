import React, { useEffect, useState } from "react";
import axios from "axios";

function Dashboard() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        // 🔥 Since you don't have "getAllCases",
        // we simulate dashboard using known case IDs

        const caseNumbers = [1, 2, 3]; // ⚠️ adjust based on your DB

        const results = await Promise.all(
          caseNumbers.map(async (num) => {
            try {
              const res = await axios.get(
                `http://127.0.0.1:5000/caseEvidences?case_number=${num}`,
                {
                  headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                }
              );

              return {
                case_number: num,
                case: res.data.case,
                evidences: res.data.evidences,
              };
            } catch {
              return null;
            }
          })
        );

        setCases(results.filter(Boolean));
      } catch (err) {
        setError("Failed to load dashboard");
      }

      setLoading(false);
    };

    fetchDashboard();
  }, []);

  // 📊 stats
  const totalCases = cases.length;

  const totalEvidences = cases.reduce(
    (sum, c) => sum + (c.evidences?.length || 0),
    0
  );

  return (
    <div style={{ marginTop: "40px" }}>
      <h2>📊 Dashboard</h2>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && !error && (
        <>
          {/* STATS */}
          <div style={{ display: "flex", gap: "15px" }}>
            <div style={card}>
              <h3>Total Cases</h3>
              <p style={num}>{totalCases}</p>
            </div>

            <div style={card}>
              <h3>Total Evidences</h3>
              <p style={num}>{totalEvidences}</p>
            </div>
          </div>

          {/* CASE LIST */}
          <div style={{ marginTop: "30px" }}>
            <h3>Cases Overview</h3>

            <table border="1" cellPadding="10" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th>Case #</th>
                  <th>Description</th>
                  <th>Evidences</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {cases.map((c) => (
                  <tr key={c.case_number}>
                    <td>{c.case_number}</td>
                    <td>{c.case?.description}</td>
                    <td>{c.evidences.length}</td>
                    <td style={{ color: "lightgreen" }}>
                      Active
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

const card = {
  padding: "15px",
  border: "1px solid #ccc",
  borderRadius: "10px",
  minWidth: "150px",
  background: "#1e1e1e",
};

const num = {
  fontSize: "24px",
  fontWeight: "bold",
};

export default Dashboard;
