from flask import Blueprint, request, jsonify
from services.database_service import get_connection
from utils.auth_utils import require_role
import bcrypt

investigator_bp = Blueprint("investigator", __name__)


# =========================================================
# CREATE INVESTIGATOR (WITH PASSWORD + ROLE)
# =========================================================
@investigator_bp.route("/createInvestigator", methods=["POST"])
#@require_role(["admin"])
def create_investigator():
    try:
        name = request.form.get("name")
        email = request.form.get("email")
        wallet = request.form.get("wallet")
        role = request.form.get("role", "investigator")  # default role
        password = request.form.get("password")

        # 🔴 Validation
        if not name or not email or not password:
            return jsonify({"error": "Missing required fields"}), 400

        # 🔐 Hash password
        hashed_password = bcrypt.hashpw(
            password.encode("utf-8"),
            bcrypt.gensalt()
        )

        conn = get_connection()
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO investigators 
            (name, email, wallet_address, role, password)
            VALUES (%s, %s, %s, %s, %s)
        """, (
            name,
            email,
            wallet,
            role,
            hashed_password.decode("utf-8")
        ))

        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({
            "status": "created",
            "user": name,
            "role": role
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# =========================================================
# GET INVESTIGATORS (HIDE PASSWORD)
# =========================================================
@investigator_bp.route("/getInvestigators", methods=["GET"])
def get_investigators():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT id, name, email, wallet_address, role, created_at
        FROM investigators
    """)

    data = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify(data), 200
