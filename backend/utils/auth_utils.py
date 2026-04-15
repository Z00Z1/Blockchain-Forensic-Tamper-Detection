from flask import request, jsonify
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


def require_role(required_roles):
    def decorator(func):
        def wrapper(*args, **kwargs):
            username = request.headers.get("X-User") or request.headers.get("x-user")

            if not username:
                return jsonify({"error": "Missing X-User header"}), 401

            role = get_user_role(username)

            if not role:
                return jsonify({"error": "User not found"}), 404

            if role not in required_roles:
                return jsonify({
                    "error": f"Access denied for role: {role}"
                }), 403

            return func(*args, **kwargs)

        wrapper.__name__ = func.__name__
        return wrapper
    return decorator
