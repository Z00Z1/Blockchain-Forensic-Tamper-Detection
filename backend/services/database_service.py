import mysql.connector
from dotenv import load_dotenv
import os
from time import time

load_dotenv()

# =========================================
# CONNECTION
# =========================================
def get_connection():
    return mysql.connector.connect(
        host=os.getenv("MYSQL_HOST"),
        user=os.getenv("MYSQL_USER"),
        password=os.getenv("MYSQL_PASSWORD"),
        database=os.getenv("MYSQL_DATABASE")
    )


# =========================================
# EVIDENCE
# =========================================
def save_evidence(
    evidence_id,
    case_id,
    description,
    cid,
    file_hash,
    version,
    wallet
):
    conn = get_connection()
    cursor = conn.cursor()

    try:
        timestamp = int(time())

        query = """
        INSERT INTO evidences
        (evidence_id, case_id, description, cid, file_hash, version, registrant_wallet, timestamp)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
        """

        cursor.execute(query, (
            evidence_id,
            case_id,
            description,
            cid,
            file_hash,
            version,
            wallet,
            timestamp
        ))

        conn.commit()

    except Exception as e:
        conn.rollback()
        print(f"[DB ERROR] {e}")
        raise e

    finally:
        cursor.close()
        conn.close()


def get_evidence_by_id(evidence_id):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute(
            "SELECT * FROM evidences WHERE evidence_id=%s",
            (evidence_id,)
        )
        return cursor.fetchone()

    finally:
        cursor.close()
        conn.close()


# =========================================
# CASE MANAGEMENT
# =========================================
def create_case(case_number, description, created_by):
    conn = get_connection()
    cursor = conn.cursor()

    try:
        query = """
        INSERT INTO cases (case_number, description, created_by)
        VALUES (%s, %s, %s)
        """
        cursor.execute(query, (case_number, description, created_by))
        conn.commit()

    except Exception as e:
        conn.rollback()
        raise e

    finally:
        cursor.close()
        conn.close()


def get_case(case_number):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        query = "SELECT * FROM cases WHERE case_number = %s"
        cursor.execute(query, (case_number,))
        return cursor.fetchone()

    finally:
        cursor.close()
        conn.close()


def get_case_evidences(case_number):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        query = "SELECT * FROM evidences WHERE case_id = %s"
        cursor.execute(query, (case_number,))
        return cursor.fetchall()

    finally:
        cursor.close()
        conn.close()


# =========================================
# 🔥 CHAIN OF CUSTODY
# =========================================
def log_custody(evidence_id, action, user, notes=""):
    conn = get_connection()
    cursor = conn.cursor()

    try:
        query = """
        INSERT INTO custody_logs
        (evidence_id, action, performed_by, notes)
        VALUES (%s, %s, %s, %s)
        """

        cursor.execute((query), (evidence_id, action, user, notes))
        conn.commit()

    except Exception as e:
        conn.rollback()
        print("[CUSTODY LOG ERROR]", e)

    finally:
        cursor.close()
        conn.close()


def get_custody_logs(evidence_id):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        query = """
        SELECT evidence_id, action, performed_by, notes, timestamp
        FROM custody_logs
        WHERE evidence_id = %s
        ORDER BY timestamp ASC
        """

        cursor.execute(query, (evidence_id,))
        rows = cursor.fetchall()

        return [
            {
                "evidence_id": r["evidence_id"],
                "action": r["action"],
                "performed_by": r["performed_by"],
                "notes": r["notes"],
                "timestamp": str(r["timestamp"])
            }
            for r in rows
        ]

    finally:
        cursor.close()
        conn.close()


# =========================================
# 🔐 INVESTIGATORS (AUTH SUPPORT)
# =========================================
def get_investigator_by_email(email):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute(
            "SELECT * FROM investigators WHERE email = %s",
            (email,)
        )
        return cursor.fetchone()

    finally:
        cursor.close()
        conn.close()


def get_investigator_by_name(name):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute(
            "SELECT * FROM investigators WHERE name = %s",
            (name,)
        )
        return cursor.fetchone()

    finally:
        cursor.close()
        conn.close()
