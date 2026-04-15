from flask import Blueprint, request, jsonify
from services.database_service import get_connection
from utils.auth_utils import require_role

investigator_bp = Blueprint("investigator", __name__)


# =========================================================
# CREATE INVESTIGATOR
# =========================================================
@investigator_bp.route("/createInvestigator", methods=["POST"])
@require_role(["admin"])
def create_investigator():
    try:
        name = request.form.get("name")
        email = request.form.get("email")
        wallet = request.form.get("wallet")

        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO investigators (name, email, wallet_address)
            VALUES (%s, %s, %s)
        """, (name, email, wallet))

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"status": "created"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# =========================================================
# GET INVESTIGATORS
# =========================================================
@investigator_bp.route("/getInvestigators", methods=["GET"])
def get_investigators():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT * FROM investigators")
    data = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify(data), 200
