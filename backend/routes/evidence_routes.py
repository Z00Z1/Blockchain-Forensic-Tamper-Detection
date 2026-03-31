from flask import Blueprint, request, jsonify
import os
from datetime import datetime, timezone, timedelta
from utils.hash_utils import calculate_file_hash
from utils.encryption_utils import encrypt_file
from services.ipfs_service import upload_to_ipfs
from services.blockchain_service import register_evidence_blockchain
from services.database_service import save_evidence
from services.blockchain_service import get_latest_evidence
from services.database_service import get_evidence_by_id
from services.blockchain_service import get_all_versions

evidence_bp = Blueprint("evidence", __name__)

UPLOAD_FOLDER = "uploads"

@evidence_bp.route("/registerEvidence", methods=["POST"])
def register_evidence():

    evidence_id = request.form["evidence_id"]
    case_id = request.form["case_id"]
    description = request.form["description"]
    file = request.files["file"]

    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(file_path)

    file_hash = calculate_file_hash(file_path)

    encrypted_file = encrypt_file(file_path)

    cid = upload_to_ipfs(encrypted_file)

    tx_hash = register_evidence_blockchain(
        int(evidence_id),
        file_hash,
        cid
    )

    save_evidence(
        evidence_id,
        case_id,
        description,
        cid,
        file_hash,
        1,
        "wallet"
    )

    return jsonify({
        "status": "success",
        "cid": cid,
        "hash": file_hash,
        "blockchain_tx": tx_hash
    })
    
    
@evidence_bp.route("/verifyEvidence", methods=["POST"])
def verify_evidence():
    try:
        # -------------------------------
        # Input validation
        # -------------------------------
        evidence_id = request.form.get("evidence_id")
        file = request.files.get("file")

        if not evidence_id or not file:
            return jsonify({"error": "Missing evidence_id or file"}), 400

        evidence_id = int(evidence_id)

        # -------------------------------
        # Save file
        # -------------------------------
        file_path = os.path.join(UPLOAD_FOLDER, file.filename)
        file.save(file_path)

        # -------------------------------
        # Step 1 — Calculate hash
        # -------------------------------
        current_hash = calculate_file_hash(file_path).lower().strip()

        # -------------------------------
        # Step 2 — Get blockchain record
        # -------------------------------
        record = get_evidence_by_id(evidence_id)
        print("DEBUG get_latest_evidence:", record)  # 🔹 add this

        if not record:
            return jsonify({"error": "Evidence not found"}), 404

        blockchain_hash = record["file_hash"].lower().strip()

        blockchain_time = datetime.fromtimestamp(
            record["timestamp"], tz=timezone.utc
        )

        # -------------------------------
        # Step 3 — File metadata
        # -------------------------------
        file_modified_time = datetime.fromtimestamp(
            os.path.getmtime(file_path),
            tz=timezone.utc
        )

        # -------------------------------
        # Step 4 — Hash comparison
        # -------------------------------
        hash_match = (current_hash == blockchain_hash)

        # -------------------------------
        # Step 5 — Forensic scoring and status
        # -------------------------------
        if hash_match:
            # File content intact
            confidence = 100
            status = "Trusted"

            # Optional: timeline check
            file_time = datetime.fromtimestamp(
                os.path.getmtime(file_path),
                tz=timezone.utc
            )
            if file_time > blockchain_time:
                # Warn timeline is off
                confidence = 90  # still very high
                status = "Trusted (timeline slightly off)"
        else:
            # File content modified
            confidence = 0
            status = "Compromised"

        # -------------------------------
        # Response
        # -------------------------------
        return jsonify({
            "status": status,
            "confidence": confidence,
            "hash_match": hash_match,
            "blockchain": {
                "hash": blockchain_hash,
                "cid": record["cid"],
                "timestamp": str(blockchain_time),
                "registrant": record.get("registrant", record.get("registrant_wallet", "unknown")),
                "version": record["version"]
            }
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
        


@evidence_bp.route("/evidenceHistory", methods=["GET"])
def evidence_history():
    try:
        evidence_id = request.args.get("evidence_id")

        if not evidence_id:
            return jsonify({"error": "Missing evidence_id"}), 400

        evidence_id = int(evidence_id)

        versions = get_all_versions(evidence_id)

        if not versions:
            return jsonify({"error": "No history found"}), 404

        formatted = []

        for v in versions:
            formatted.append({
                "version": v["version"],
                "hash": v["file_hash"],
                "cid": v["cid"],
                "timestamp": str(datetime.fromtimestamp(
                    v["timestamp"], tz=timezone.utc
                )),
                "registrant": v["registrant"]
            })

        return jsonify({
            "evidence_id": evidence_id,
            "total_versions": len(formatted),
            "history": formatted
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
