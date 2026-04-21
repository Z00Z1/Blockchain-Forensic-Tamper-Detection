from flask import request, jsonify
from functools import wraps
from utils.jwt_utils import verify_token
from services.database_service import get_connection



def get_user_role(username):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute(
        "SELECT role FROM investigators WHERE name = %s",
        (username,)
    )

    user = cursor.fetchone()

    cursor.close()
    conn.close()

    if not user:
        return None

    return user["role"]


def require_role(roles):
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):

            auth_header = request.headers.get("Authorization")

            if not auth_header:
                return jsonify({"error": "Missing token"}), 401

            try:
                token = auth_header.split(" ")[1]
            except:
                return jsonify({"error": "Invalid token format"}), 401

            decoded = verify_token(token)

            if not decoded:
                return jsonify({"error": "Invalid or expired token"}), 401

            if decoded["role"] not in roles:
                return jsonify({"error": "Unauthorized"}), 403

            request.user = decoded

            return f(*args, **kwargs)

        return wrapper
    return decorator
