from flask import Blueprint, request, jsonify
from services.database_service import get_investigator_by_email
from utils.jwt_utils import generate_token
import bcrypt

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/login", methods=["POST"])
def login():
    try:
        data = request.get_json(silent=True)

        if not data:
            return jsonify({"error": "Missing JSON body"}), 400

        email    = data.get("email", "").strip()
        password = data.get("password", "").strip()

        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400

        user = get_investigator_by_email(email)

        if not user:
            return jsonify({"error": "No account found with that email"}), 404

        stored_password = user.get("password")

        if not stored_password:
            return jsonify({"error": "Account has no password set — contact your admin"}), 400

        password_match = bcrypt.checkpw(
            password.encode("utf-8"),
            stored_password.encode("utf-8")
        )

        if not password_match:
            return jsonify({"error": "Incorrect password"}), 401

        token = generate_token(user)

        #Tell the frontend if the investigator must change their temp password
        must_change = bool(user.get("must_change_password", 0))

        return jsonify({
            "token":                token,
            "user":                 user["name"],
            "role":                 user["role"],
            "must_change_password": must_change,
        }), 200

    except Exception as e:
        print(f"[login ERROR] {e}")
        return jsonify({"error": str(e)}), 500
