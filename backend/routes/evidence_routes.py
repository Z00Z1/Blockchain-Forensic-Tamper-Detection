from flask import Blueprint, request, jsonify
import os
from utils.hash_utils import calculate_file_hash
from utils.encryption_utils import encrypt_file
from services.ipfs_service import upload_to_ipfs
from services.blockchain_service import register_evidence_blockchain, get_all_versions
from services.database_service import (
    save_evidence,
    get_evidence_by_id,
    evidence_exists_in_case,
    log_custody,
    get_custody_logs
)
from utils.auth_utils import require_role

evidence_bp = Blueprint("evidence", __name__)

UPLOAD_FOLDER = "uploads"


# =========================================================
# REGISTER EVIDENCE
# =========================================================
@evidence_bp.route("/registerEvidence", methods=["POST"])
@require_role(["investigator", "admin"])
def register_evidence():
    try:
        evidence_id = request.form.get("evidence_id")
        case_id = request.form.get("case_id")
        description = request.form.get("description")
        file = request.files.get("file")

        #GET USER FROM JWT
        user = request.user
        investigator_name = user.get("name", user.get("email", "Unknown"))
        investigator_wallet = user.get("wallet", "N/A")

        #FORMAT (NAME + WALLET)
        investigator = f"{investigator_name} ({investigator_wallet})"

        if not evidence_id or not case_id or not file:
            return jsonify({"error": "Missing required fields"}), 400

        evidence_id = int(evidence_id)

        # ── Check uniqueness: evidence_id must be unique within this case ──
        if evidence_exists_in_case(evidence_id, case_id):
            return jsonify({
                "error": f"Evidence ID {evidence_id} already exists in case '{case_id}'. "
                         "Each evidence ID must be unique within a case."
            }), 409

        file_path = os.path.join(UPLOAD_FOLDER, file.filename)
        file.save(file_path)

        file_hash = calculate_file_hash(file_path)

        encrypted_file = encrypt_file(file_path)
        cid = upload_to_ipfs(encrypted_file)

        tx_hash = register_evidence_blockchain(
            evidence_id,
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
            investigator_wallet  # keep wallet in DB
        )

        # custody log
        log_custody(
            evidence_id,
            "REGISTERED",
            investigator,
            f"Evidence added to case {case_id}"
        )

        return jsonify({
            "status": "success",
            "evidence_id": evidence_id,
            "cid": cid,
            "hash": file_hash,
            "blockchain_tx": tx_hash
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# =========================================================
# VERIFY EVIDENCE
# =========================================================
@evidence_bp.route("/verifyEvidence", methods=["POST"])
@require_role(["investigator", "admin"])
def verify_evidence():
    try:
        case_id = request.form.get("case_id")
        evidence_id = request.form.get("evidence_id")
        file = request.files.get("file")
        
        evidence = get_evidence_by_id(evidence_id)

        if not evidence:
            return jsonify({"error": "No evidence found"}), 404

        
        if str(evidence["case_id"]) != str(case_id):
            return jsonify({
                "error": "Evidence does not belong to this case"
            }), 400

        #GET USER FROM JWT
        user = request.user
        investigator_name = user.get("name", user.get("email", "Unknown"))
        investigator_wallet = user.get("wallet", "N/A")

        investigator = f"{investigator_name} ({investigator_wallet})"

        if not evidence_id or not file:
            return jsonify({"error": "Missing evidence_id or file"}), 400

        evidence_id = int(evidence_id)

        file_path = os.path.join(UPLOAD_FOLDER, file.filename)
        file.save(file_path)

        current_hash = calculate_file_hash(file_path).lower().strip()

        versions = get_all_versions(evidence_id)

        if not versions:
            return jsonify({"error": "No evidence found"}), 404

        latest = versions[-1]
        blockchain_hash = latest["file_hash"].lower().strip()

        if current_hash == blockchain_hash:
            status = "Trusted"
        else:
            status = "Compromised"

        action = "VERIFIED" if status == "Trusted" else "FAILED_VERIFICATION"

        #custody log
        log_custody(
            evidence_id,
            action,
            investigator,
            f"Verification result: {status}"
        )

        #timestamp for frontend
        logs = get_custody_logs(evidence_id)

        latest_timestamp = None
        if logs:
            latest_timestamp = logs[-1].get("timestamp")

        return jsonify({
            "status": status,
            "hash_match": current_hash == blockchain_hash,
            "blockchain_hash": blockchain_hash,
            "timestamp": str(latest_timestamp) if latest_timestamp else None
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# =========================================================
# CUSTODY HISTORY
# =========================================================
@evidence_bp.route("/custodyHistory", methods=["GET"])
def custody_history():
    try:
        evidence_id = request.args.get("evidence_id")

        if not evidence_id:
            return jsonify({"error": "Missing evidence_id"}), 400

        evidence_id = int(evidence_id)

        logs = get_custody_logs(evidence_id)

        return jsonify({
            "evidence_id": evidence_id,
            "total_actions": len(logs),
            "history": logs
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# =========================================================
# EVIDENCE TIMELINE
# =========================================================
@evidence_bp.route("/evidenceTimeline", methods=["GET"])
def evidence_timeline():
    try:
        evidence_id = request.args.get("evidence_id")

        if not evidence_id:
            return jsonify({"error": "Missing evidence_id"}), 400

        evidence_id = int(evidence_id)

        evidence = get_evidence_by_id(evidence_id)

        if not evidence:
            return jsonify({"error": "Evidence not found"}), 404

        custody = get_custody_logs(evidence_id)
        versions = get_all_versions(evidence_id)

        return jsonify({
            "evidence_id": evidence_id,
            "case_id": evidence["case_id"],
            "custody": custody,
            "blockchain": versions
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
