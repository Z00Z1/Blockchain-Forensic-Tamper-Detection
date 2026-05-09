from flask import request, jsonify
from functools import wraps
from utils.jwt_utils import verify_token
from services.database_service import get_connection


def require_role(roles):
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):

            auth_header = request.headers.get("Authorization", "")

            if not auth_header:
                return jsonify({"error": "Missing Authorization header"}), 401

            parts = auth_header.split(" ")
            if len(parts) != 2 or parts[0].lower() != "bearer":
                return jsonify({"error": "Invalid token format — expected: Bearer <token>"}), 401

            token = parts[1]

            if not token or token == "null" or token == "undefined":
                return jsonify({"error": "No token provided — please log in again"}), 401

            decoded = verify_token(token)

            if not decoded:
                return jsonify({"error": "Token is invalid or expired — please log in again"}), 401

            user_role = decoded.get("role", "")
            if user_role not in roles:
                return jsonify({
                    "error": f"Access denied. Required: {roles}, your role: {user_role}"
                }), 403

            request.user = decoded
            return f(*args, **kwargs)

        return wrapper
    return decorator
