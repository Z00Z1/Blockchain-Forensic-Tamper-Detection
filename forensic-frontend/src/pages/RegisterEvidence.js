import React, { useState } from "react";
import axios from "axios";

function RegisterEvidence() {
  const [evidenceId, setEvidenceId] = useState("");
  const [caseId, setCaseId] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!evidenceId || !caseId || !file || !description) {
      setMessage("❌ Please fill all fields including description");
      return;
    }

    const formData = new FormData();
    formData.append("evidence_id", evidenceId);
    formData.append("case_id", caseId);
    formData.append("description", description); // ✅ FIX ADDED
    formData.append("file", file);

    try {
      const res = await axios.post(
        "http://127.0.0.1:5000/registerEvidence",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setMessage(
        "✅ " + (res.data.message || "Evidence registered successfully")
      );

      // optional reset
      setEvidenceId("");
      setCaseId("");
      setDescription("");
      setFile(null);

    } catch (err) {
      setMessage(
        "❌ " +
        (err.response?.data?.error ||
         err.response?.data?.message ||
         err.message)
      );
    }
  };

  return (
    <div style={{ maxWidth: "500px" }}>
      <h2>📁 Register Evidence</h2>

      <form onSubmit={handleSubmit}>

        {/* Evidence ID */}
        <input
          type="text"
          placeholder="Evidence ID"
          value={evidenceId}
          onChange={(e) => setEvidenceId(e.target.value)}
          style={{ width: "100%", padding: "8px" }}
        />
        <br /><br />

        {/* Case ID */}
        <input
          type="text"
          placeholder="Case ID"
          value={caseId}
          onChange={(e) => setCaseId(e.target.value)}
          style={{ width: "100%", padding: "8px" }}
        />
        <br /><br />

        {/* DESCRIPTION (NEW) */}
        <textarea
          placeholder="Evidence Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{
            width: "100%",
            padding: "8px",
            height: "80px"
          }}
        />
        <br /><br />

        {/* FILE */}
        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
        />
        <br /><br />

        <button type="submit">
          Upload Evidence
        </button>
      </form>

      {/* MESSAGE */}
      <p style={{ marginTop: "15px" }}>{message}</p>
    </div>
  );
}

export default RegisterEvidence;
