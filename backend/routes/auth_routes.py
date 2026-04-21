from flask import Blueprint, request, jsonify
from services.database_service import get_investigator_by_email
from utils.jwt_utils import generate_token
import bcrypt

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/login", methods=["POST"])
def login():
    try:
        data = request.get_json()

        if not data:
            return jsonify({"error": "Missing JSON body"}), 400

        email = data.get("email")
        password = data.get("password")

        if not email or not password:
            return jsonify({"error": "Missing email or password"}), 400

        # 🔍 Get user
        user = get_investigator_by_email(email)

        if not user:
            return jsonify({"error": "User not found"}), 404

        stored_password = user.get("password")

        if not stored_password:
            return jsonify({"error": "Password not set in DB"}), 400

        # 🔐 FIXED bcrypt check (safe)
        password_match = bcrypt.checkpw(
            password.encode("utf-8"),
            stored_password.encode("utf-8")
        )

        if not password_match:
            return jsonify({"error": "Invalid credentials"}), 401

        # 🔑 Generate JWT
        token = generate_token(user)

        return jsonify({
            "token": token,
            "user": user["name"],
            "role": user["role"]
        }), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
