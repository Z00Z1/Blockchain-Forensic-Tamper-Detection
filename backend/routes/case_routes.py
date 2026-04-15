from flask import Blueprint, request, jsonify
from services.database_service import (
    create_case,
    get_case,
    get_case_evidences,
    get_custody_logs
)
from utils.auth_utils import require_role
case_bp = Blueprint("case", __name__)


@case_bp.route("/createCase", methods=["POST"])
@require_role(["admin"])
def create_case_route():
    try:
        case_number = request.form.get("case_number")
        description = request.form.get("description")
        created_by = request.form.get("created_by")

        create_case(case_number, description, created_by)

        return jsonify({
            "status": "success",
            "case_number": case_number
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@case_bp.route("/getCase", methods=["GET"])
def get_case_route():
    case_number = request.args.get("case_number")
    case = get_case(case_number)
    return jsonify(case), 200


@case_bp.route("/caseEvidences", methods=["GET"])
def case_evidences():
    case_number = request.args.get("case_number")

    case = get_case(case_number)
    evidences = get_case_evidences(case_number)

    return jsonify({
        "case": case,
        "evidences": evidences
    }), 200


# 🔥 CASE TIMELINE (MOST IMPORTANT)
@case_bp.route("/caseTimeline", methods=["GET"])
def case_timeline():
    try:
        case_number = request.args.get("case_number")

        case = get_case(case_number)
        evidences = get_case_evidences(case_number)

        timeline = []

        for e in evidences:
            logs = get_custody_logs(e["evidence_id"])

            for log in logs:
                timeline.append({
                    "evidence_id": e["evidence_id"],
                    "action": log["action"],
                    "performed_by": log["performed_by"],
                    "timestamp": log["timestamp"]
                })

        timeline.sort(key=lambda x: x["timestamp"])

        return jsonify({
            "case_number": case_number,
            "timeline": timeline
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
