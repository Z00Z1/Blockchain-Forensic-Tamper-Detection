from flask import Blueprint, request, jsonify
from services.database_service import get_connection
from utils.auth_utils import require_role
import bcrypt

investigator_bp = Blueprint("investigator", __name__)


# =========================================================
# CREATE INVESTIGATOR
# Admin provides a temporary password.
# Investigator must change it on first login.
# =========================================================
@investigator_bp.route("/createInvestigator", methods=["POST"])
@require_role(["admin"])
def create_investigator():
    try:
        name     = request.form.get("name", "").strip()
        email    = request.form.get("email", "").strip()
        wallet   = request.form.get("wallet", "").strip()
        role     = request.form.get("role", "investigator").strip()
        password = request.form.get("password", "").strip()

        if not name or not email or not password:
            return jsonify({"error": "Name, email and temporary password are required"}), 400

        hashed = bcrypt.hashpw(
            password.encode("utf-8"), bcrypt.gensalt()
        ).decode("utf-8")

        conn   = get_connection()
        cursor = conn.cursor(dictionary=True)

        # Check duplicate email
        cursor.execute("SELECT id FROM investigators WHERE email = %s", (email,))
        if cursor.fetchone():
            cursor.close()
            conn.close()
            return jsonify({"error": "An account with this email already exists"}), 400

        cursor.execute("""
            INSERT INTO investigators (name, email, wallet_address, role, password, must_change_password)
            VALUES (%s, %s, %s, %s, %s, 1)
        """, (name, email, wallet or None, role, hashed))

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"status": "created", "user": name, "role": role}), 200

    except Exception as e:
        print(f"[createInvestigator ERROR] {e}")
        return jsonify({"error": str(e)}), 500


# =========================================================
# CHANGE PASSWORD  (investigator changes temp password)
# Requires valid JWT — investigator must be logged in
# =========================================================
@investigator_bp.route("/changePassword", methods=["POST"])
@require_role(["admin", "investigator"])
def change_password():
    try:
        data = request.get_json(silent=True)
        if not data:
            return jsonify({"error": "Missing JSON body"}), 400

        current_password = data.get("current_password", "").strip()
        new_password     = data.get("new_password", "").strip()

        if not current_password or not new_password:
            return jsonify({"error": "current_password and new_password are required"}), 400

        if len(new_password) < 6:
            return jsonify({"error": "New password must be at least 6 characters"}), 400

        email = request.user.get("email")

        conn   = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT * FROM investigators WHERE email = %s", (email,))
        user = cursor.fetchone()

        if not user:
            cursor.close()
            conn.close()
            return jsonify({"error": "User not found"}), 404

        if not bcrypt.checkpw(current_password.encode("utf-8"), user["password"].encode("utf-8")):
            cursor.close()
            conn.close()
            return jsonify({"error": "Current password is incorrect"}), 401

        new_hashed = bcrypt.hashpw(
            new_password.encode("utf-8"), bcrypt.gensalt()
        ).decode("utf-8")

        cursor.execute("""
            UPDATE investigators
            SET password = %s, must_change_password = 0
            WHERE email = %s
        """, (new_hashed, email))

        conn.commit()
        cursor.close()
        conn.close()

        return jsonify({"status": "password_changed"}), 200

    except Exception as e:
        print(f"[changePassword ERROR] {e}")
        return jsonify({"error": str(e)}), 500


# =========================================================
# GET INVESTIGATORS  (no auth guard — original behavior)
# created_at serialized to string to avoid JSON crash
# =========================================================
@investigator_bp.route("/getInvestigators", methods=["GET"])
def get_investigators():
    try:
        conn   = get_connection()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT id, name, email, wallet_address, role, created_at, must_change_password
            FROM investigators
            ORDER BY created_at DESC
        """)
        rows = cursor.fetchall()
        cursor.close()
        conn.close()

        result = []
        for row in rows:
            result.append({
                "id":                   row["id"],
                "name":                 row["name"],
                "email":                row["email"],
                "wallet_address":       row["wallet_address"],
                "role":                 row["role"],
                # Serialize datetime → string so JSON doesn't crash
                "created_at":           str(row["created_at"]) if row["created_at"] else None,
                # True = still using temp password, False = changed it
                "must_change_password": bool(row["must_change_password"]),
            })

        return jsonify(result), 200

    except Exception as e:
        print(f"[getInvestigators ERROR] {e}")
        return jsonify({"error": str(e)}), 500


# =========================================================
# DELETE INVESTIGATOR
# =========================================================
@investigator_bp.route("/deleteInvestigator/<int:id>", methods=["DELETE"])
@require_role(["admin"])
def delete_investigator(id):
    try:
        conn   = get_connection()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM investigators WHERE id = %s", (id,))
        conn.commit()
        cursor.close()
        conn.close()
        return jsonify({"status": "deleted"}), 200

    except Exception as e:
        print(f"[deleteInvestigator ERROR] {e}")
        return jsonify({"error": str(e)}), 500
