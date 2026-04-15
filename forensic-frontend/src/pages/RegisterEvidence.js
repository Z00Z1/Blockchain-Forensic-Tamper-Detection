import React, { useState } from "react";
import axios from "axios";

function RegisterEvidence() {
  const [evidenceId, setEvidenceId] = useState("");
  const [caseId, setCaseId] = useState("");
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("evidence_id", evidenceId);
    formData.append("case_id", caseId);
    formData.append("file", file);

    try {
      const res = await axios.post(
        "http://127.0.0.1:5000/registerEvidence",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            "X-User": "Ali",
          },
        }
      );

      setMessage(
        "✅ " + (res.data.message || "Operation successful")
      );

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
    <div>
      <h2>📁 Register Evidence</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Evidence ID"
          value={evidenceId}
          onChange={(e) => setEvidenceId(e.target.value)}
        />
        <br /><br />

        <input
          type="text"
          placeholder="Case ID"
          value={caseId}
          onChange={(e) => setCaseId(e.target.value)}
        />
        <br /><br />

        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
        />
        <br /><br />

        <button type="submit">Upload</button>
      </form>

      <p>{message}</p>
    </div>
  );
}

export default RegisterEvidence;
